const tools = [
    {
        functionDeclarations: [

            // ==========================================
            // CHECK AVAILABILITY
            // ==========================================

            {
                name: "check_availability",

                description:
                    "Check available appointment slots for a doctor on a specific date.",

                parameters: {
                    type: "OBJECT",

                    properties: {

                        doctor_name: {
                            type: "STRING",
                            description:
                                "The doctor's name"
                        },

                        date: {
                            type: "STRING",
                            description:
                                "The appointment date"
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
                    "Book an appointment for the currently authenticated patient after the doctor, date, time, name, and phone number are known.",

                parameters: {
                    type: "OBJECT",

                    properties: {

                        patient_name: {
                            type: "STRING",
                            description:
                                "Full name of the patient"
                        },

                        phone: {
                            type: "STRING",
                            description:
                                "Patient phone number"
                        },

                        doctor_name: {
                            type: "STRING",
                            description:
                                "The doctor's name"
                        },

                        date: {
                            type: "STRING",
                            description:
                                "The appointment date"
                        },

                        time: {
                            type: "STRING",
                            description:
                                "The appointment time"
                        }

                    },

                    required: [
                        "patient_name",
                        "phone",
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
                    "Cancel an appointment belonging to the currently authenticated patient. Never cancel another patient's appointment.",

                parameters: {
                    type: "OBJECT",

                    properties: {

                        date: {
                            type: "STRING",
                            description:
                                "The date of the appointment to cancel"
                        },

                        time: {
                            type: "STRING",
                            description:
                                "The time of the appointment to cancel"
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
                    "Reschedule an appointment belonging to the currently authenticated patient. Never modify another patient's appointment.",

                parameters: {
                    type: "OBJECT",

                    properties: {

                        current_date: {
                            type: "STRING",
                            description:
                                "The current date of the appointment"
                        },

                        current_time: {
                            type: "STRING",
                            description:
                                "The current time of the appointment"
                        },

                        new_date: {
                            type: "STRING",
                            description:
                                "The new appointment date"
                        },

                        new_time: {
                            type: "STRING",
                            description:
                                "The new appointment time"
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