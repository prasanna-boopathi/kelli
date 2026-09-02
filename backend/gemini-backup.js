require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");
const tools = require("./tools");
const supabase = require("./supabase");
const { getDateFromText } = require("./dateUtils");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ==========================================
// CHECK APPOINTMENT AVAILABILITY
// ==========================================

async function checkAvailability(doctorName, date) {

    console.log("\nChecking availability...");
    console.log("Doctor:", doctorName);
    console.log("Date:", date);

    // Find doctor
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

    // Find already booked appointments
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

    // Available clinic slots
    const allSlots = [
        "10:00:00",
        "14:00:00",
        "17:00:00"
    ];

    // Already booked slots
    const bookedSlots = appointments.map(
        appointment => appointment.appointment_time
    );

    // Remove booked slots
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


// ==========================================
// BOOK APPOINTMENT
// ==========================================

async function bookAppointment(
    patientName,
    phone,
    doctorName,
    date,
    time
) {

    console.log("\nBooking appointment...");
    console.log("Patient:", patientName);
    console.log("Phone:", phone);
    console.log("Doctor:", doctorName);
    console.log("Date:", date);
    console.log("Time:", time);

    // --------------------------------------
    // 1. Find doctor
    // --------------------------------------

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


    // --------------------------------------
    // 2. Check if slot is already booked
    // --------------------------------------

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


    // --------------------------------------
    // 3. Find patient
    // --------------------------------------

    let { data: patient, error: patientError } =
        await supabase
            .from("patients")
            .select("*")
            .eq("phone", phone)
            .maybeSingle();

    if (patientError) {
        throw new Error(patientError.message);
    }


    // --------------------------------------
    // 4. Create patient if necessary
    // --------------------------------------

    if (!patient) {

        const { data: newPatient, error } =
            await supabase
                .from("patients")
                .insert({
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


    // --------------------------------------
    // 5. Create appointment
    // --------------------------------------

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


    // --------------------------------------
    // 6. Return booking result
    // --------------------------------------

    return {
        success: true,
        message: "Appointment booked successfully.",
        appointment: appointment
    };
}


// ==========================================
// TEST KELLI
// ==========================================

async function testAgent() {

    // --------------------------------------
    // 1. User request
    // --------------------------------------

    const userMessage =
        "I want to book an appointment with Dr. Kumar tomorrow.";


    // --------------------------------------
    // 2. Ask Gemini what action is needed
    // --------------------------------------

    const response = await ai.models.generateContent({

        model: "gemini-3.6-flash",

        contents: userMessage,

        config: {

            tools: tools,

            toolConfig: {
                functionCallingConfig: {
                    mode: "ANY"
                }
            }
        }
    });


    // --------------------------------------
    // 3. Get function call
    // --------------------------------------

    const functionCall =
        response.functionCalls?.[0];


    if (!functionCall) {

        console.log("Gemini did not call a function.");

        console.log(response.text);

        return;
    }


    console.log("\nGemini requested:");
    console.log(functionCall.name);

    console.log("\nArguments:");
    console.log(functionCall.args);


    // --------------------------------------
    // 4. Execute requested tool
    // --------------------------------------

    let result;


    if (functionCall.name === "check_availability") {

        const actualDate =
            getDateFromText(
                functionCall.args.date
            );

        console.log(
            "\nConverted date:",
            actualDate
        );

        result =
            await checkAvailability(
                functionCall.args.doctor_name,
                actualDate
            );
    }


    else if (functionCall.name === "book_appointment") {

        const actualDate =
            getDateFromText(
                functionCall.args.date
            );

        result =
            await bookAppointment(
                functionCall.args.patient_name,
                functionCall.args.phone,
                functionCall.args.doctor_name,
                actualDate,
                functionCall.args.time
            );
    }


    else {

        result = {
            success: false,
            message: "Unknown function."
        };
    }


    // --------------------------------------
    // 5. Show tool result
    // --------------------------------------

    console.log("\nTool result:");

    console.log(result);


    // --------------------------------------
    // 6. Send tool result back to Gemini
    // --------------------------------------

    const finalResponse =
        await ai.models.generateContent({

            model: "gemini-3.6-flash",

            contents: [

                {
                    role: "user",

                    parts: [
                        {
                            text: userMessage
                        }
                    ]
                },

                {
                    role: "model",

                    parts:
                        response
                            .candidates[0]
                            .content
                            .parts
                },

                {
                    role: "user",

                    parts: [
                        {
                            functionResponse: {
                                name: functionCall.name,
                                response: result
                            }
                        }
                    ]
                }
            ]
        });


    // --------------------------------------
    // 7. Final response
    // --------------------------------------

    console.log("\nKelli:");

    console.log(finalResponse.text);
}


// ==========================================
// START
// ==========================================

testAgent();