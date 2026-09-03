const tools = [
    {
        functionDeclarations: [
            // ==========================================
            // CHECK AVAILABILITY
            // ==========================================
            {
                name: "check_availability",
                description:
                    "Check available appointment consultation slots for a doctor on a specific date (e.g., 'today', 'tomorrow', '2026-09-10').",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        doctor_name: {
                            type: "STRING",
                            description: "The doctor's name (e.g. 'Dr. Kumar', 'Dr. Priya', 'Dr. Arun')"
                        },
                        date: {
                            type: "STRING",
                            description: "The appointment date (e.g. 'today', 'tomorrow', or YYYY-MM-DD)"
                        }
                    },
                    required: [
                        "doctor_name",
                        "date"
                    ]
                }
            },

            // ==========================================
            // BOOK APPOINTMENT
            // ==========================================
            {
                name: "book_appointment",
                description:
                    "Book or reserve an appointment for the authenticated patient. Name and phone from the patient profile are automatically used if already on file.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        doctor_name: {
                            type: "STRING",
                            description: "The doctor's name"
                        },
                        date: {
                            type: "STRING",
                            description: "The appointment date (e.g. 'today', 'tomorrow', or YYYY-MM-DD)"
                        },
                        time: {
                            type: "STRING",
                            description: "The appointment time slot (e.g. '10:00:00', '14:00:00', '17:00:00')"
                        },
                        patient_name: {
                            type: "STRING",
                            description: "Full name of the patient (only ask if missing from patient profile)"
                        },
                        phone: {
                            type: "STRING",
                            description: "Patient phone number (only ask if missing from patient profile)"
                        }
                    },
                    required: [
                        "doctor_name",
                        "date",
                        "time"
                    ]
                }
            },

            // ==========================================
            // CANCEL APPOINTMENT
            // ==========================================
            {
                name: "cancel_appointment",
                description:
                    "Cancel an appointment belonging to the currently authenticated patient.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        date: {
                            type: "STRING",
                            description: "The date of the appointment to cancel (e.g. YYYY-MM-DD, today, tomorrow)"
                        },
                        time: {
                            type: "STRING",
                            description: "The time of the appointment to cancel (e.g. '10:00:00', '14:00:00', '17:00:00')"
                        }
                    },
                    required: [
                        "date",
                        "time"
                    ]
                }
            },

            // ==========================================
            // RESCHEDULE APPOINTMENT
            // ==========================================
            {
                name: "reschedule_appointment",
                description:
                    "Reschedule an existing appointment belonging to the currently authenticated patient to a new date and time.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        current_date: {
                            type: "STRING",
                            description: "The current date of the existing appointment"
                        },
                        current_time: {
                            type: "STRING",
                            description: "The current time of the existing appointment"
                        },
                        new_date: {
                            type: "STRING",
                            description: "The new target date for the appointment"
                        },
                        new_time: {
                            type: "STRING",
                            description: "The new target time slot (e.g. '10:00:00', '14:00:00', '17:00:00')"
                        }
                    },
                    required: [
                        "current_date",
                        "current_time",
                        "new_date",
                        "new_time"
                    ]
                }
            }
        ]
    }
];

module.exports = tools;