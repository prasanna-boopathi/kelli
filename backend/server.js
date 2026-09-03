require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { chatWithKelli } = require("./kelliAI");
const { saveMessage, getMessages } = require("./messageService");
const { requireAuth } = require("./authMiddleware");
const { getOrCreatePatient, updatePatient, getPatientByUserId } = require("./patientService");
const {
    createPaymentOrder,
    verifyPayment,
    CONSULTATION_FEE_PAISE
} = require("./paymentService");
const {
    getAppointmentsForPatient,
    cancelAppointment,
    rescheduleAppointment,
    getDoctors,
    getDoctorAvailability
} = require("./appointmentService");
const supabase = require("./supabase");

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// HOME / HEALTH CHECK
// ==========================================
app.get("/", (req, res) => {
    res.json({
        message: "Kelli AI Healthcare Assistant Backend is running!"
    });
});

// ==========================================
// GET CURRENT AUTHENTICATED USER & PATIENT
// ==========================================
app.get("/api/me", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const email = req.user.email;

        const patient = await getOrCreatePatient({
            userId: userId,
            email: email
        });

        res.json({
            authenticated: true,
            user: {
                id: userId,
                email: email
            },
            patient: patient
        });
    } catch (error) {
        console.error("Patient lookup error:", error);
        res.status(500).json({
            error: "Could not load patient profile",
            details: error.message
        });
    }
});

// ==========================================
// UPDATE PATIENT PROFILE
// ==========================================
app.patch("/api/me", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (phone !== undefined) updates.phone = phone;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                error: "No profile information provided"
            });
        }

        const patient = await updatePatient(userId, updates);

        res.json({
            success: true,
            patient: patient
        });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({
            error: "Could not update patient profile",
            details: error.message
        });
    }
});

// ==========================================
// GET DOCTORS DIRECTORY
// ==========================================
app.get("/api/doctors", async (req, res) => {
    try {
        const doctors = await getDoctors();
        res.json({
            success: true,
            doctors: doctors
        });
    } catch (error) {
        console.error("Error fetching doctors:", error);
        res.status(500).json({
            error: "Could not load doctors",
            details: error.message
        });
    }
});

// ==========================================
// CHECK DOCTOR AVAILABILITY
// ==========================================
app.get("/api/availability", async (req, res) => {
    try {
        const { doctor, date } = req.query;
        if (!doctor || !date) {
            return res.status(400).json({
                error: "Doctor name/ID and date are required query parameters."
            });
        }

        const availability = await getDoctorAvailability(doctor, date);
        res.json(availability);
    } catch (error) {
        console.error("Availability lookup error:", error);
        res.status(500).json({
            error: "Could not check availability",
            details: error.message
        });
    }
});

// ==========================================
// GET PATIENT'S APPOINTMENTS
// ==========================================
app.get("/api/appointments", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const patient = await getOrCreatePatient({
            userId: userId,
            email: req.user.email
        });

        const appointments = await getAppointmentsForPatient(patient.id);

        res.json({
            success: true,
            appointments: appointments
        });
    } catch (error) {
        console.error("Appointments lookup error:", error);
        res.status(500).json({
            error: "Could not load appointments",
            details: error.message
        });
    }
});

// ==========================================
// CANCEL APPOINTMENT
// ==========================================
const handleCancelAppointment = async (req, res) => {
    try {
        const userId = req.user.id;
        const appointmentId = req.params.id;

        const patient = await getPatientByUserId(userId);
        if (!patient) {
            return res.status(404).json({
                error: "Patient profile not found."
            });
        }

        const result = await cancelAppointment(patient.id, appointmentId);
        res.json(result);
    } catch (error) {
        console.error("Cancel appointment error:", error);
        res.status(400).json({
            error: "Could not cancel appointment",
            details: error.message
        });
    }
};

app.patch("/api/appointments/:id/cancel", requireAuth, handleCancelAppointment);
app.post("/api/appointments/:id/cancel", requireAuth, handleCancelAppointment);

// ==========================================
// RESCHEDULE APPOINTMENT
// ==========================================
const handleRescheduleAppointment = async (req, res) => {
    try {
        const userId = req.user.id;
        const appointmentId = req.params.id;
        const { date, time } = req.body;

        if (!date || !time) {
            return res.status(400).json({
                error: "New date and time are required."
            });
        }

        const patient = await getPatientByUserId(userId);
        if (!patient) {
            return res.status(404).json({
                error: "Patient profile not found."
            });
        }

        const result = await rescheduleAppointment(
            patient.id,
            appointmentId,
            date,
            time
        );
        res.json(result);
    } catch (error) {
        console.error("Reschedule appointment error:", error);
        res.status(400).json({
            error: "Could not reschedule appointment",
            details: error.message
        });
    }
};

app.patch("/api/appointments/:id/reschedule", requireAuth, handleRescheduleAppointment);
app.post("/api/appointments/:id/reschedule", requireAuth, handleRescheduleAppointment);

// ==========================================
// CHAT WITH KELLI
// ==========================================
app.post("/api/chat", requireAuth, async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.user.id;
        const userEmail = req.user.email;

        if (!message) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                error: "sessionId is required"
            });
        }

        // Ensure patient profile is ready and authoritative
        const patient = await getOrCreatePatient({
            userId: userId,
            email: userEmail
        });

        // 1. Save patient message
        await saveMessage(sessionId, "user", message);

        // 2. Get conversation history
        const messages = await getMessages(sessionId);

        // 3. Convert to Gemini format
        const history = messages.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }]
        }));

        // 4. Send to Kelli with patient identity
        const reply = await chatWithKelli(history, userId, patient);

        // 5. Save Kelli response
        await saveMessage(sessionId, "assistant", reply);

        res.json({
            success: true,
            reply: reply
        });
    } catch (error) {
        console.error("Kelli Chat Error:", error);
        res.status(500).json({
            error: "Kelli AI failed",
            details: error.message
        });
    }
});

// ==========================================
// CREATE RAZORPAY PAYMENT ORDER
// ==========================================
const handleCreatePaymentOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { appointmentId } = req.body;

        const patient = await getPatientByUserId(userId);
        if (!patient) {
            return res.status(404).json({
                error: "Patient profile not found."
            });
        }

        let receiptId = `kelli_${Date.now()}`;

        // If appointmentId is provided, verify it belongs to patient
        if (appointmentId) {
            const { data: appointment, error: apptErr } = await supabase
                .from("appointments")
                .select("id, patient_id, status")
                .eq("id", appointmentId)
                .eq("patient_id", patient.id)
                .maybeSingle();

            if (apptErr || !appointment) {
                return res.status(404).json({
                    error: "Appointment not found or unauthorized."
                });
            }

            receiptId = `appt_${appointment.id.substring(0, 8)}_${Date.now()}`;
        }

        // Create Razorpay order (50000 paise = ₹500)
        const order = await createPaymentOrder(
            CONSULTATION_FEE_PAISE,
            receiptId
        );

        // If appointment was specified, attach the order ID
        if (appointmentId) {
            await supabase
                .from("appointments")
                .update({ razorpay_order_id: order.id })
                .eq("id", appointmentId)
                .eq("patient_id", patient.id);
        }

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            appointmentId: appointmentId || null
        });
    } catch (error) {
        console.error("Razorpay order error:", error);
        res.status(500).json({
            error: "Could not create payment order",
            details: error.message
        });
    }
};

app.post("/api/payment/create-order", requireAuth, handleCreatePaymentOrder);
app.post("/api/payments/create-order", requireAuth, handleCreatePaymentOrder);

// ==========================================
// VERIFY RAZORPAY PAYMENT (SERVER-SIDE)
// ==========================================
const handleVerifyPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId, paymentId, signature, appointmentId } = req.body;

        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({
                error: "Incomplete payment verification payload (orderId, paymentId, signature are required)."
            });
        }

        // 1. Verify HMAC signature server-side
        const isValid = verifyPayment(orderId, paymentId, signature);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                error: "Payment verification signature mismatch."
            });
        }

        const patient = await getPatientByUserId(userId);
        if (!patient) {
            return res.status(404).json({
                error: "Patient profile not found."
            });
        }

        // 2. Find and update the appointment
        let targetAppointmentId = appointmentId;

        if (!targetAppointmentId) {
            // Find by razorpay_order_id or latest pending appointment
            const { data: matchedAppt } = await supabase
                .from("appointments")
                .select("id")
                .eq("patient_id", patient.id)
                .eq("razorpay_order_id", orderId)
                .maybeSingle();

            if (matchedAppt) {
                targetAppointmentId = matchedAppt.id;
            } else {
                const { data: latestPending } = await supabase
                    .from("appointments")
                    .select("id")
                    .eq("patient_id", patient.id)
                    .eq("status", "pending_payment")
                    .order("appointment_date", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (latestPending) {
                    targetAppointmentId = latestPending.id;
                }
            }
        }

        let updatedAppointment = null;
        if (targetAppointmentId) {
            const { data: confirmedAppt, error: updateErr } = await supabase
                .from("appointments")
                .update({
                    status: "confirmed",
                    payment_status: "paid",
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId
                })
                .eq("id", targetAppointmentId)
                .eq("patient_id", patient.id)
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
                        name,
                        specialization
                    )
                `)
                .single();

            if (!updateErr) {
                updatedAppointment = confirmedAppt;
            }
        }

        console.log(`\n✅ Payment verified successfully: Order=${orderId}, Payment=${paymentId}`);

        res.json({
            success: true,
            message: "Payment verified successfully and appointment confirmed.",
            orderId: orderId,
            paymentId: paymentId,
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error("Payment verification error:", error);
        res.status(500).json({
            error: "Payment verification failed",
            details: error.message
        });
    }
};

app.post("/api/payment/verify", requireAuth, handleVerifyPayment);
app.post("/api/payments/verify", requireAuth, handleVerifyPayment);

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Kelli backend running on http://localhost:${PORT}`);
});