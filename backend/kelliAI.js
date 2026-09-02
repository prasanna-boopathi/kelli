require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const tools = require("./tools");
const supabase = require("./supabase");
const { getDateFromText } = require("./dateUtils");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ======================================================
// CHECK AVAILABILITY
// ======================================================

async function checkAvailability(doctorName, date) {

    const { data: doctor, error: doctorError } =
        await supabase
            .from("doctors")
            .select("*")
            .eq("name", doctorName)
            .maybeSingle();

    if (doctorError) {
        throw new Error(doctorError.message);
    }

    if (!doctor) {
        return {
            success: false,
            message: "Doctor not found."
        };
    }


    const { data: appointments, error: appointmentError } =
        await supabase
            .from("appointments")
            .select("appointment_time")
            .eq("doctor_id", doctor.id)
            .eq("appointment_date", date)
            .eq("status", "confirmed");

    if (appointmentError) {
        throw new Error(appointmentError.message);
    }


    const allSlots = [
        "10:00:00",
        "14:00:00",
        "17:00:00"
    ];


    const bookedSlots = appointments.map(
        appointment => appointment.appointment_time
    );


    const availableSlots = allSlots.filter(
        slot => !bookedSlots.includes(slot)
    );


    return {
        success: true,
        doctor: doctor.name,
        date: date,
        available_slots: availableSlots
    };
}



// ======================================================
// FIND PATIENT BY AUTH USER
// ======================================================

async function getPatientByUserId(userId) {

    const { data: patient, error } =
        await supabase
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
// BOOK APPOINTMENT
// ======================================================

async function bookAppointment(
    userId,
    patientName,
    phone,
    doctorName,
    date,
    time
) {

    // ------------------------------------------
    // SECURITY CHECK
    // ------------------------------------------

    if (!userId) {

        return {
            success: false,
            message:
                "You must be logged in before booking an appointment."
        };
    }


    // ------------------------------------------
    // FIND DOCTOR
    // ------------------------------------------

    const { data: doctor, error: doctorError } =
        await supabase
            .from("doctors")
            .select("*")
            .eq("name", doctorName)
            .maybeSingle();


    if (doctorError) {
        throw new Error(doctorError.message);
    }


    if (!doctor) {

        return {
            success: false,
            message: "Doctor not found."
        };
    }


    // ------------------------------------------
    // CHECK SLOT
    // ------------------------------------------

    const { data: existingAppointment, error: appointmentError } =
        await supabase
            .from("appointments")
            .select("id")
            .eq("doctor_id", doctor.id)
            .eq("appointment_date", date)
            .eq("appointment_time", time)
            .eq("status", "confirmed")
            .maybeSingle();


    if (appointmentError) {
        throw new Error(appointmentError.message);
    }


    if (existingAppointment) {

        return {
            success: false,
            message: "That time slot is already booked."
        };
    }


    // ------------------------------------------
    // FIND PATIENT USING AUTH USER ID
    // ------------------------------------------

    let patient =
        await getPatientByUserId(userId);


    // ------------------------------------------
    // CREATE PATIENT IF NECESSARY
    // ------------------------------------------

    if (!patient) {

        const { data: newPatient, error } =
            await supabase
                .from("patients")
                .insert({

                    user_id: userId,

                    name: patientName,

                    phone: phone

                })
                .select()
                .single();


        if (error) {
            throw new Error(error.message);
        }


        patient = newPatient;
    }


    // ------------------------------------------
    // UPDATE PATIENT DETAILS
    // ------------------------------------------

    else {

        const { data: updatedPatient, error } =
            await supabase
                .from("patients")
                .update({

                    name: patientName,

                    phone: phone

                })
                .eq("user_id", userId)
                .select()
                .single();


        if (error) {
            throw new Error(error.message);
        }


        patient = updatedPatient;
    }


    // ------------------------------------------
    // BOOK APPOINTMENT
    // ------------------------------------------

    const { data: appointment, error } =
        await supabase
            .from("appointments")
            .insert({

                patient_id: patient.id,

                doctor_id: doctor.id,

                appointment_date: date,

                appointment_time: time,

                status: "confirmed"

            })
            .select()
            .single();


    if (error) {
        throw new Error(error.message);
    }


    return {

        success: true,

        message:
            "Appointment booked successfully.",

        appointment: appointment

    };
}



// ======================================================
// CANCEL APPOINTMENT
// ======================================================

async function cancelAppointment(
    userId,
    date,
    time
) {

    if (!userId) {

        return {
            success: false,
            message:
                "You must be logged in to cancel an appointment."
        };
    }


    // ------------------------------------------
    // FIND PATIENT
    // ------------------------------------------

    const patient =
        await getPatientByUserId(userId);


    if (!patient) {

        return {
            success: false,
            message:
                "No patient profile was found for this account."
        };
    }


    // ------------------------------------------
    // FIND ONLY THIS USER'S APPOINTMENT
    // ------------------------------------------

    const { data: appointment, error } =
        await supabase
            .from("appointments")
            .select(`
                id,
                appointment_date,
                appointment_time,
                status,
                doctors(name)
            `)
            .eq("patient_id", patient.id)
            .eq("appointment_date", date)
            .eq("appointment_time", time)
            .eq("status", "confirmed")
            .maybeSingle();


    if (error) {
        throw new Error(error.message);
    }


    if (!appointment) {

        return {
            success: false,
            message:
                "I couldn't find your confirmed appointment for that date and time."
        };
    }


    // ------------------------------------------
    // CANCEL
    // ------------------------------------------

    const { error: updateError } =
        await supabase
            .from("appointments")
            .update({
                status: "cancelled"
            })
            .eq("id", appointment.id)
            .eq("patient_id", patient.id);


    if (updateError) {
        throw new Error(updateError.message);
    }


    return {

        success: true,

        message:
            "Your appointment has been cancelled successfully.",

        appointment: appointment

    };
}



// ======================================================
// RESCHEDULE APPOINTMENT
// ======================================================

async function rescheduleAppointment(
    userId,
    currentDate,
    currentTime,
    newDate,
    newTime
) {

    if (!userId) {

        return {
            success: false,
            message:
                "You must be logged in to reschedule an appointment."
        };
    }


    // ------------------------------------------
    // FIND PATIENT
    // ------------------------------------------

    const patient =
        await getPatientByUserId(userId);


    if (!patient) {

        return {
            success: false,
            message:
                "No patient profile was found for this account."
        };
    }


    // ------------------------------------------
    // CHECK NEW SLOT
    // ------------------------------------------

    const { data: doctorAppointment, error: findError } =
        await supabase
            .from("appointments")
            .select(`
                id,
                doctor_id,
                appointment_date,
                appointment_time,
                doctors(name)
            `)
            .eq("patient_id", patient.id)
            .eq("appointment_date", currentDate)
            .eq("appointment_time", currentTime)
            .eq("status", "confirmed")
            .maybeSingle();


    if (findError) {
        throw new Error(findError.message);
    }


    if (!doctorAppointment) {

        return {
            success: false,
            message:
                "I couldn't find your current appointment."
        };
    }


    // ------------------------------------------
    // CHECK WHETHER NEW SLOT IS TAKEN
    // ------------------------------------------

    const { data: slotTaken, error: slotError } =
        await supabase
            .from("appointments")
            .select("id")
            .eq("doctor_id", doctorAppointment.doctor_id)
            .eq("appointment_date", newDate)
            .eq("appointment_time", newTime)
            .eq("status", "confirmed")
            .maybeSingle();


    if (slotError) {
        throw new Error(slotError.message);
    }


    if (slotTaken) {

        return {
            success: false,
            message:
                "The new appointment slot is already booked."
        };
    }


    // ------------------------------------------
    // UPDATE APPOINTMENT
    // ------------------------------------------

    const { data: updatedAppointment, error: updateError } =
        await supabase
            .from("appointments")
            .update({

                appointment_date: newDate,

                appointment_time: newTime

            })
            .eq("id", doctorAppointment.id)
            .eq("patient_id", patient.id)
            .select()
            .single();


    if (updateError) {
        throw new Error(updateError.message);
    }


    return {

        success: true,

        message:
            "Your appointment has been rescheduled successfully.",

        appointment:
            updatedAppointment

    };
}



// ======================================================
// EXECUTE TOOL
// ======================================================

async function executeTool(
    functionCall,
    userId
) {

    const args = functionCall.args;


    // ==========================================
    // CHECK AVAILABILITY
    // ==========================================

    if (
        functionCall.name ===
        "check_availability"
    ) {

        const actualDate =
            getDateFromText(args.date);


        return await checkAvailability(

            args.doctor_name,

            actualDate

        );
    }



    // ==========================================
    // BOOK
    // ==========================================

    if (
        functionCall.name ===
        "book_appointment"
    ) {

        const actualDate =
            getDateFromText(args.date);


        return await bookAppointment(

            userId,

            args.patient_name,

            args.phone,

            args.doctor_name,

            actualDate,

            args.time

        );
    }



    // ==========================================
    // CANCEL
    // ==========================================

    if (
        functionCall.name ===
        "cancel_appointment"
    ) {

        const actualDate =
            getDateFromText(args.date);


        return await cancelAppointment(

            userId,

            actualDate,

            args.time

        );
    }



    // ==========================================
    // RESCHEDULE
    // ==========================================

    if (
        functionCall.name ===
        "reschedule_appointment"
    ) {

        const currentDate =
            getDateFromText(
                args.current_date
            );


        const newDate =
            getDateFromText(
                args.new_date
            );


        return await rescheduleAppointment(

            userId,

            currentDate,

            args.current_time,

            newDate,

            args.new_time

        );
    }



    // ==========================================
    // UNKNOWN TOOL
    // ==========================================

    return {

        success: false,

        message:
            "Unknown function."

    };
}



// ======================================================
// MAIN KELLI AI FUNCTION
// ======================================================

async function chatWithKelli(
    history,
    userId
) {

    let response =
        await ai.models.generateContent({

            model:
                "gemini-3.6-flash",

            contents:
                history,

            config: {

                tools:
                    tools

            }

        });


    // ==========================================
    // TOOL LOOP
    // ==========================================

    while (
        response.functionCalls?.length
    ) {

        const functionCall =
            response.functionCalls[0];


        const result =
            await executeTool(

                functionCall,

                userId

            );


        // --------------------------------------
        // PRESERVE GEMINI RESPONSE
        // --------------------------------------

        history.push({

            role:
                "model",

            parts:
                response
                    .candidates[0]
                    .content
                    .parts

        });


        // --------------------------------------
        // SEND TOOL RESULT TO GEMINI
        // --------------------------------------

        history.push({

            role:
                "user",

            parts: [

                {

                    functionResponse: {

                        name:
                            functionCall.name,

                        response:
                            result

                    }

                }

            ]

        });


        // --------------------------------------
        // ASK GEMINI TO CONTINUE
        // --------------------------------------

        response =
            await ai.models.generateContent({

                model:
                    "gemini-3.6-flash",

                contents:
                    history,

                config: {

                    tools:
                        tools

                }

            });

    }


    return response.text;
}



// ======================================================
// EXPORT
// ======================================================

module.exports = {

    chatWithKelli

};