const supabase = require("./supabase");
const { getDateFromText } = require("./dateUtils");

// Standard daily appointment consultation slots
const STANDARD_SLOTS = [
    "10:00:00",
    "14:00:00",
    "17:00:00"
];

// Map JavaScript Date.getDay() (0=Sunday, 1=Monday...) to day names
const DAYS_OF_WEEK = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

// ==========================================
// GET ALL DOCTORS
// ==========================================
async function getDoctors() {
    const { data, error } = await supabase
        .from("doctors")
        .select("id, name, specialization, available_days")
        .order("name", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}

// ==========================================
// GET DOCTOR AVAILABILITY FOR A SPECIFIC DATE
// ==========================================
async function getDoctorAvailability(doctorNameOrId, dateStr) {
    const actualDate = getDateFromText(dateStr);

    // 1. Find doctor by ID or Name
    let doctorQuery = supabase.from("doctors").select("*");
    if (
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            doctorNameOrId
        )
    ) {
        doctorQuery = doctorQuery.eq("id", doctorNameOrId);
    } else {
        doctorQuery = doctorQuery.eq("name", doctorNameOrId);
    }

    const { data: doctor, error: doctorError } = await doctorQuery.maybeSingle();

    if (doctorError) {
        throw new Error(doctorError.message);
    }

    if (!doctor) {
        return {
            success: false,
            message: `Doctor "${doctorNameOrId}" was not found.`
        };
    }

    // 2. Check if doctor works on this day of the week
    const parsedDate = new Date(actualDate);
    // If invalid date format
    if (isNaN(parsedDate.getTime())) {
        return {
            success: false,
            message: `Invalid date format "${dateStr}". Please use YYYY-MM-DD or relative terms like "today" or "tomorrow".`
        };
    }

    const dayName = DAYS_OF_WEEK[parsedDate.getDay()];
    const isWorkingDay =
        Array.isArray(doctor.available_days) &&
        doctor.available_days.includes(dayName);

    if (!isWorkingDay) {
        return {
            success: true,
            doctor: doctor.name,
            specialization: doctor.specialization,
            date: actualDate,
            day: dayName,
            available_slots: [],
            message: `${doctor.name} is not scheduled to consult on ${dayName}s. Available days: ${doctor.available_days.join(", ")}.`
        };
    }

    // 3. Query existing booked appointments for this doctor on this date
    const { data: bookedAppointments, error: apptError } = await supabase
        .from("appointments")
        .select("appointment_time, status")
        .eq("doctor_id", doctor.id)
        .eq("appointment_date", actualDate)
        .in("status", ["confirmed", "pending_payment"]);

    if (apptError) {
        throw new Error(apptError.message);
    }

    const bookedTimes = (bookedAppointments || []).map(
        (a) => a.appointment_time
    );

    const availableSlots = STANDARD_SLOTS.filter(
        (slot) => !bookedTimes.includes(slot)
    );

    return {
        success: true,
        doctor: doctor.name,
        specialization: doctor.specialization,
        date: actualDate,
        day: dayName,
        available_slots: availableSlots,
        message:
            availableSlots.length > 0
                ? `${doctor.name} has ${availableSlots.length} slot(s) available on ${actualDate}.`
                : `${doctor.name} is fully booked on ${actualDate}.`
    };
}

// ==========================================
// GET PATIENT'S APPOINTMENTS
// ==========================================
async function getAppointmentsForPatient(patientId) {
    if (!patientId) {
        return [];
    }

    const { data, error } = await supabase
        .from("appointments")
        .select(`
            id,
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            payment_status,
            razorpay_order_id,
            razorpay_payment_id,
            doctor:doctors (
                id,
                name,
                specialization
            )
        `)
        .eq("patient_id", patientId)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}

// ==========================================
// CANCEL AN APPOINTMENT
// ==========================================
async function cancelAppointment(patientId, appointmentId) {
    if (!patientId || !appointmentId) {
        throw new Error("Patient ID and Appointment ID are required.");
    }

    // 1. Verify the appointment belongs to the patient
    const { data: existingAppt, error: findError } = await supabase
        .from("appointments")
        .select("id, status, appointment_date, appointment_time")
        .eq("id", appointmentId)
        .eq("patient_id", patientId)
        .maybeSingle();

    if (findError) {
        throw new Error(findError.message);
    }

    if (!existingAppt) {
        throw new Error("Appointment not found or you are not authorized to cancel it.");
    }

    if (existingAppt.status === "cancelled") {
        return {
            success: true,
            message: "Appointment was already cancelled.",
            appointment: existingAppt
        };
    }

    // 2. Update status to cancelled
    const { data: updatedAppt, error: updateError } = await supabase
        .from("appointments")
        .update({
            status: "cancelled"
        })
        .eq("id", appointmentId)
        .eq("patient_id", patientId)
        .select(`
            id,
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            payment_status,
            doctor:doctors (
                name,
                specialization
            )
        `)
        .single();

    if (updateError) {
        throw new Error(updateError.message);
    }

    return {
        success: true,
        message: "Appointment cancelled successfully.",
        appointment: updatedAppt
    };
}

// ==========================================
// RESCHEDULE AN APPOINTMENT
// ==========================================
async function rescheduleAppointment(patientId, appointmentId, newDateStr, newTime) {
    if (!patientId || !appointmentId || !newDateStr || !newTime) {
        throw new Error("Patient ID, Appointment ID, New Date, and New Time are required.");
    }

    const newDate = getDateFromText(newDateStr);

    // 1. Verify the existing appointment belongs to the patient
    const { data: existingAppt, error: findError } = await supabase
        .from("appointments")
        .select("id, doctor_id, status, appointment_date, appointment_time")
        .eq("id", appointmentId)
        .eq("patient_id", patientId)
        .maybeSingle();

    if (findError) {
        throw new Error(findError.message);
    }

    if (!existingAppt) {
        throw new Error("Appointment not found or you are not authorized to reschedule it.");
    }

    if (existingAppt.status === "cancelled") {
        throw new Error("Cannot reschedule a cancelled appointment. Please book a new appointment.");
    }

    // 2. Check if the target slot is already booked for that doctor
    const { data: conflictingAppt, error: conflictError } = await supabase
        .from("appointments")
        .select("id")
        .eq("doctor_id", existingAppt.doctor_id)
        .eq("appointment_date", newDate)
        .eq("appointment_time", newTime)
        .in("status", ["confirmed", "pending_payment"])
        .neq("id", appointmentId)
        .maybeSingle();

    if (conflictError) {
        throw new Error(conflictError.message);
    }

    if (conflictingAppt) {
        throw new Error("The requested time slot is already booked. Please select another slot.");
    }

    // 3. Update appointment date & time
    const { data: updatedAppt, error: updateError } = await supabase
        .from("appointments")
        .update({
            appointment_date: newDate,
            appointment_time: newTime
        })
        .eq("id", appointmentId)
        .eq("patient_id", patientId)
        .select(`
            id,
            patient_id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            payment_status,
            doctor:doctors (
                name,
                specialization
            )
        `)
        .single();

    if (updateError) {
        throw new Error(updateError.message);
    }

    return {
        success: true,
        message: "Appointment rescheduled successfully.",
        appointment: updatedAppt
    };
}

module.exports = {
    STANDARD_SLOTS,
    getDoctors,
    getDoctorAvailability,
    getAppointmentsForPatient,
    cancelAppointment,
    rescheduleAppointment
};
