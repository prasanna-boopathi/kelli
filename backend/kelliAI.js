require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const tools = require("./tools");
const supabase = require("./supabase");
const { getDateFromText } = require("./dateUtils");
const { getDoctorAvailability, STANDARD_SLOTS } = require("./appointmentService");
const { CONSULTATION_FEE_INR } = require("./paymentService");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// ======================================================
// GET PATIENT BY AUTH USER ID
// ======================================================
async function getPatientByUserId(userId) {
    if (!userId) return null;

    const { data: patient, error } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return patient;
}

// ======================================================
// CHECK AVAILABILITY
// ======================================================
async function checkAvailability(doctorName, dateStr) {
    return await getDoctorAvailability(doctorName, dateStr);
}

// ======================================================
// BOOK APPOINTMENT
// ======================================================
async function bookAppointment(
    userId,
    patientName,
    phone,
    doctorName,
    dateStr,
    time
) {
    if (!userId) {
        return {
            success: false,
            message: "You must be logged in before booking an appointment."
        };
    }

    const actualDate = getDateFromText(dateStr);

    // 1. Find doctor
    const { data: doctor, error: doctorError } = await supabase
        .from("doctors")
        .select("*")
        .ilike("name", `%${doctorName.replace(/^dr\.?\s*/i, "")}%`)
        .maybeSingle();

    if (doctorError) {
        throw new Error(doctorError.message);
    }

    if (!doctor) {
        return {
            success: false,
            message: `Doctor "${doctorName}" was not found. Please choose from Dr. Kumar, Dr. Priya, or Dr. Arun.`
        };
    }

    // 2. Check doctor availability on that date
    const availability = await getDoctorAvailability(doctor.name, actualDate);
    if (!availability.success || !availability.available_slots.includes(time)) {
        return {
            success: false,
            message:
                availability.message ||
                `The ${time} slot on ${actualDate} is not available with ${doctor.name}. Available slots: ${availability.available_slots?.join(", ") || "None"}.`
        };
    }

    // 3. Find patient from authenticated user ID
    let patient = await getPatientByUserId(userId);

    // If patient record exists, update missing fields if provided
    if (patient) {
        const updates = {};
        if (patientName && !patient.name) updates.name = patientName;
        if (phone && !patient.phone) updates.phone = phone;

        if (Object.keys(updates).length > 0) {
            const { data: updatedPatient } = await supabase
                .from("patients")
                .update(updates)
                .eq("id", patient.id)
                .select()
                .single();
            if (updatedPatient) {
                patient = updatedPatient;
            }
        }
    } else {
        // Create patient record
        const { data: newPatient, error: createError } = await supabase
            .from("patients")
            .insert({
                user_id: userId,
                name: patientName || null,
                phone: phone || null
            })
            .select()
            .single();

        if (createError) {
            throw new Error(createError.message);
        }
        patient = newPatient;
    }

    // 4. Create appointment in pending_payment state (requiring Razorpay payment)
    const { data: appointment, error: apptError } = await supabase
        .from("appointments")
        .insert({
            patient_id: patient.id,
            doctor_id: doctor.id,
            appointment_date: actualDate,
            appointment_time: time,
            status: "pending_payment",
            payment_status: "pending"
        })
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

    if (apptError) {
        throw new Error(apptError.message);
    }

    return {
        success: true,
        message: `Appointment reserved for ${actualDate} at ${time} with ${doctor.name} (${doctor.specialization}). The consultation fee is ₹${CONSULTATION_FEE_INR}. Please complete the payment to confirm your booking.`,
        appointment: appointment,
        fee: CONSULTATION_FEE_INR,
        currency: "INR"
    };
}

// ======================================================
// CANCEL APPOINTMENT
// ======================================================
async function cancelAppointment(userId, dateStr, time) {
    if (!userId) {
        return {
            success: false,
            message: "You must be logged in to cancel an appointment."
        };
    }

    const patient = await getPatientByUserId(userId);
    if (!patient) {
        return {
            success: false,
            message: "No patient profile found for this account."
        };
    }

    const actualDate = getDateFromText(dateStr);

    const { data: appointment, error: findError } = await supabase
        .from("appointments")
        .select(`
            id,
            appointment_date,
            appointment_time,
            status,
            doctor:doctors(name)
        `)
        .eq("patient_id", patient.id)
        .eq("appointment_date", actualDate)
        .eq("appointment_time", time)
        .in("status", ["confirmed", "pending_payment"])
        .maybeSingle();

    if (findError) {
        throw new Error(findError.message);
    }

    if (!appointment) {
        return {
            success: false,
            message: `I couldn't find an active appointment for you on ${actualDate} at ${time}.`
        };
    }

    const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointment.id);

    if (updateError) {
        throw new Error(updateError.message);
    }

    return {
        success: true,
        message: `Your appointment with ${appointment.doctor?.name || "the doctor"} on ${actualDate} at ${time} has been cancelled. The slot is now freed.`,
        appointment: appointment
    };
}

// ======================================================
// RESCHEDULE APPOINTMENT
// ======================================================
async function rescheduleAppointment(
    userId,
    currentDateStr,
    currentTime,
    newDateStr,
    newTime
) {
    if (!userId) {
        return {
            success: false,
            message: "You must be logged in to reschedule an appointment."
        };
    }

    const patient = await getPatientByUserId(userId);
    if (!patient) {
        return {
            success: false,
            message: "No patient profile found for this account."
        };
    }

    const currentDate = getDateFromText(currentDateStr);
    const newDate = getDateFromText(newDateStr);

    // 1. Find existing appointment
    const { data: appointment, error: findError } = await supabase
        .from("appointments")
        .select(`
            id,
            doctor_id,
            appointment_date,
            appointment_time,
            status,
            doctor:doctors(name, specialization)
        `)
        .eq("patient_id", patient.id)
        .eq("appointment_date", currentDate)
        .eq("appointment_time", currentTime)
        .in("status", ["confirmed", "pending_payment"])
        .maybeSingle();

    if (findError) {
        throw new Error(findError.message);
    }

    if (!appointment) {
        return {
            success: false,
            message: `I couldn't find your current appointment on ${currentDate} at ${currentTime}.`
        };
    }

    // 2. Check if new slot is available
    const availability = await getDoctorAvailability(appointment.doctor_id, newDate);
    if (!availability.success || !availability.available_slots.includes(newTime)) {
        return {
            success: false,
            message: `The target slot (${newDate} at ${newTime}) is not available with ${appointment.doctor.name}. Available slots: ${availability.available_slots?.join(", ") || "None"}.`
        };
    }

    // 3. Update appointment
    const { data: updatedAppt, error: updateError } = await supabase
        .from("appointments")
        .update({
            appointment_date: newDate,
            appointment_time: newTime
        })
        .eq("id", appointment.id)
        .select()
        .single();

    if (updateError) {
        throw new Error(updateError.message);
    }

    return {
        success: true,
        message: `Your appointment with ${appointment.doctor.name} has been rescheduled from ${currentDate} ${currentTime} to ${newDate} at ${newTime}.`,
        appointment: updatedAppt
    };
}

// ======================================================
// EXECUTE FUNCTION CALL
// ======================================================
async function executeTool(functionCall, userId) {
    const args = functionCall.args;

    if (functionCall.name === "check_availability") {
        return await checkAvailability(args.doctor_name, args.date);
    }

    if (functionCall.name === "book_appointment") {
        return await bookAppointment(
            userId,
            args.patient_name,
            args.phone,
            args.doctor_name,
            args.date,
            args.time
        );
    }

    if (functionCall.name === "cancel_appointment") {
        return await cancelAppointment(userId, args.date, args.time);
    }

    if (functionCall.name === "reschedule_appointment") {
        return await rescheduleAppointment(
            userId,
            args.current_date,
            args.current_time,
            args.new_date,
            args.new_time
        );
    }

    return {
        success: false,
        message: `Unknown tool function: ${functionCall.name}`
    };
}

// ======================================================
// MAIN KELLI AI FUNCTION
// ======================================================
async function chatWithKelli(history, userId, patient = null) {
    // If patient was not passed, load it
    if (!patient && userId) {
        patient = await getPatientByUserId(userId);
    }

    const patientName = patient?.name || "Not provided";
    const patientPhone = patient?.phone || "Not provided";
    const patientEmail = patient?.email || "Not provided";

    const systemInstruction = `You are Kelli, a warm, professional AI medical clinic receptionist for Kelli AI Healthcare.

CLINIC DOCTORS & SPECIALTIES:
1. Dr. Kumar - General Physician (Available: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday)
2. Dr. Priya - Dermatologist (Available: Monday, Wednesday, Friday)
3. Dr. Arun - Dentist (Available: Tuesday, Thursday, Saturday)

CONSULTATION SLOTS:
Standard daily slots are 10:00:00 (10:00 AM), 14:00:00 (2:00 PM), and 17:00:00 (5:00 PM).
Consultation Fee: ₹${CONSULTATION_FEE_INR} per visit.

AUTHENTICATED PATIENT PROFILE:
• Name: ${patientName}
• Phone: ${patientPhone}
• Email: ${patientEmail}

IMPORTANT INSTRUCTIONS:
- You already have the authenticated patient's identity.
- ${patient?.name ? `Patient name is "${patient.name}". DO NOT ask the patient for their name.` : "Patient name is missing. Ask for their name when booking."}
- ${patient?.phone ? `Patient phone is "${patient.phone}". DO NOT ask the patient for their phone number.` : "Patient phone is missing. Ask for their phone number when booking."}
- When the patient asks for doctor availability, check the real schedule using \`check_availability\`.
- When the patient wants to book, call \`book_appointment\`. After booking, let them know their appointment has been reserved for ₹${CONSULTATION_FEE_INR} and that they can click "Proceed to Payment" to complete test payment and confirm.
- When the patient asks to cancel or reschedule, use \`cancel_appointment\` or \`reschedule_appointment\`.
- Keep responses friendly, clear, and concise.`;

    let response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: history,
        config: {
            systemInstruction: systemInstruction,
            tools: tools
        }
    });

    // Tool execution loop
    while (response.functionCalls?.length) {
        const functionCall = response.functionCalls[0];
        const result = await executeTool(functionCall, userId);

        // Record model's tool call turn
        history.push({
            role: "model",
            parts: response.candidates[0].content.parts
        });

        // Record user's function response turn
        history.push({
            role: "user",
            parts: [
                {
                    functionResponse: {
                        name: functionCall.name,
                        response: result
                    }
                }
            ]
        });

        // Continue generation
        response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: history,
            config: {
                systemInstruction: systemInstruction,
                tools: tools
            }
        });
    }

    return response.text;
}

module.exports = {
    chatWithKelli
};