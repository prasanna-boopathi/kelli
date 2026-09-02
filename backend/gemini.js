require("dotenv").config();

const readline = require("readline");
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

    // Find booked appointments
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

    // Clinic appointment slots
    const allSlots = [
        "10:00:00",
        "14:00:00",
        "17:00:00"
    ];

    // Already booked slots
    const bookedSlots = appointments.map(
        appointment => appointment.appointment_time
    );

    // Available slots
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
// BOOK APPOINTMENT
// ======================================================

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

    // ------------------------------------------
    // Find doctor
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
    // Check if slot is already booked
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
    // Find patient
    // ------------------------------------------

    let { data: patient, error: patientError } =
        await supabase
            .from("patients")
            .select("*")
            .eq("phone", phone)
            .maybeSingle();

    if (patientError) {
        throw new Error(patientError.message);
    }


    // ------------------------------------------
    // Create patient if necessary
    // ------------------------------------------

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


    // ------------------------------------------
    // Create appointment
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
        message: "Appointment booked successfully.",
        appointment: appointment
    };
}


// ======================================================
// EXECUTE TOOL
// ======================================================

async function executeTool(functionCall) {

    const args = functionCall.args;

    console.log("\nGemini requested:");
    console.log(functionCall.name);

    console.log("\nArguments:");
    console.log(args);


    // ------------------------------------------
    // CHECK AVAILABILITY
    // ------------------------------------------

    if (functionCall.name === "check_availability") {

        const actualDate =
            getDateFromText(args.date);

        console.log(
            "\nConverted date:",
            actualDate
        );

        return await checkAvailability(
            args.doctor_name,
            actualDate
        );
    }


    // ------------------------------------------
    // BOOK APPOINTMENT
    // ------------------------------------------

    if (functionCall.name === "book_appointment") {

        const actualDate =
            getDateFromText(args.date);

        return await bookAppointment(
            args.patient_name,
            args.phone,
            args.doctor_name,
            actualDate,
            args.time
        );
    }


    return {
        success: false,
        message: "Unknown function."
    };
}


// ======================================================
// GEMINI CHAT
// ======================================================

async function sendToGemini(history) {

    let response =
        await ai.models.generateContent({

            model: "gemini-3.6-flash",

            contents: history,

            config: {
                tools: tools
            }
        });


    // ==================================================
    // TOOL LOOP
    // ==================================================

    while (response.functionCalls?.length) {

        const functionCall =
            response.functionCalls[0];

        const result =
            await executeTool(functionCall);

        console.log("\nTool result:");
        console.log(result);


        // Add Gemini's response to history
        history.push(
            {
                role: "model",
                parts:
                    response
                        .candidates[0]
                        .content
                        .parts
            }
        );


        // Add tool result
        history.push(
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
        );


        // Ask Gemini to continue
        response =
            await ai.models.generateContent({

                model: "gemini-3.6-flash",

                contents: history,

                config: {
                    tools: tools
                }
            });
    }


    return response.text;
}


// ======================================================
// TERMINAL CHAT
// ======================================================

const rl =
    readline.createInterface({

        input: process.stdin,

        output: process.stdout
    });


const history = [];


function askUser() {

    rl.question("\nYou: ", async (message) => {

        if (
            message.toLowerCase() === "exit"
        ) {

            console.log("\nGoodbye! 👋");

            rl.close();

            return;
        }


        try {

            // Add user message
            history.push({

                role: "user",

                parts: [
                    {
                        text: message
                    }
                ]
            });


            // Send conversation to Gemini
            const answer =
                await sendToGemini(history);


            console.log("\nKelli:");
            console.log(answer);


        } catch (error) {

            console.error(
                "\nError:",
                error.message
            );

        }


        askUser();
    });
}


// ======================================================
// START KELLI
// ======================================================

console.log("================================");
console.log("        KELLI AI RECEPTIONIST");
console.log("================================");

console.log("\nType 'exit' to quit.");

askUser();