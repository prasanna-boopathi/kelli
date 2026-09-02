require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { chatWithKelli } = require("./kelliAI");

const {
    saveMessage,
    getMessages
} = require("./messageService");

const { requireAuth } = require("./authMiddleware");

const {
    getOrCreatePatient,
    updatePatient
} = require("./patientService");

const {
    createPaymentOrder,
    verifyPayment
} = require("./paymentService");

const app = express();
app.use(cors({
    origin: "http://localhost:3000"
}));

app.use(express.json());


// ==========================================
// HOME / HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {

    res.json({
        message: "Kelli backend is running!"
    });

});


// ==========================================
// GET CURRENT AUTHENTICATED USER
// ==========================================

app.get(
    "/api/me",
    requireAuth,
    async (req, res) => {

        try {

            const userId = req.user.id;
            const email = req.user.email;

            const patient =
                await getOrCreatePatient({
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

            console.error(
                "Patient lookup error:",
                error
            );

            res.status(500).json({

                error:
                    "Could not load patient profile",

                details:
                    error.message

            });

        }

    }
);


// ==========================================
// UPDATE PATIENT PROFILE
// ==========================================

app.patch(
    "/api/me",
    requireAuth,
    async (req, res) => {

        try {

            const userId =
                req.user.id;

            const {
                name,
                phone
            } = req.body;

            const updates = {};

            if (name !== undefined) {
                updates.name = name;
            }

            if (phone !== undefined) {
                updates.phone = phone;
            }

            if (
                Object.keys(updates).length === 0
            ) {

                return res.status(400).json({

                    error:
                        "No profile information provided"

                });

            }

            const patient =
                await updatePatient(
                    userId,
                    updates
                );

            res.json({

                success: true,

                patient: patient

            });

        } catch (error) {

            console.error(
                "Profile update error:",
                error
            );

            res.status(500).json({

                error:
                    "Could not update patient profile",

                details:
                    error.message

            });

        }

    }
);


// ==========================================
// CHAT WITH KELLI
// ==========================================

app.post(
    "/api/chat",
    requireAuth,
    async (req, res) => {

        try {

            const {
                message,
                sessionId
            } = req.body;


            // ==========================================
            // AUTHENTICATED USER
            // ==========================================

            const userId =
                req.user.id;

            const userEmail =
                req.user.email;


            // ==========================================
            // CHECK MESSAGE
            // ==========================================

            if (!message) {

                return res.status(400).json({

                    error:
                        "Message is required"

                });

            }


            // ==========================================
            // CHECK SESSION
            // ==========================================

            if (!sessionId) {

                return res.status(400).json({

                    error:
                        "sessionId is required"

                });

            }


            console.log(
                "\n================================"
            );

            console.log(
                "Authenticated user:"
            );

            console.log(userEmail);

            console.log(
                "User ID:"
            );

            console.log(userId);

            console.log(
                "\nPatient:"
            );

            console.log(message);


            // ==========================================
            // SAVE PATIENT MESSAGE
            // ==========================================

            await saveMessage(
                sessionId,
                "user",
                message
            );


            // ==========================================
            // GET CONVERSATION HISTORY
            // ==========================================

            const messages =
                await getMessages(
                    sessionId
                );


            // ==========================================
            // CONVERT TO GEMINI FORMAT
            // ==========================================

            const history =
                messages.map((msg) => {

                    return {

                        role:
                            msg.role === "assistant"
                                ? "model"
                                : "user",

                        parts: [

                            {
                                text:
                                    msg.content
                            }

                        ]

                    };

                });


            // ==========================================
            // SEND TO KELLI
            // ==========================================

            const reply =
                await chatWithKelli(
                    history,
                    userId
                );


            console.log(
                "\nKelli:"
            );

            console.log(reply);


            // ==========================================
            // SAVE KELLI RESPONSE
            // ==========================================

            await saveMessage(
                sessionId,
                "assistant",
                reply
            );


            // ==========================================
            // SEND RESPONSE
            // ==========================================

            res.json({

                success: true,

                reply: reply

            });

        } catch (error) {

            console.error(
                "\nKelli error:"
            );

            console.error(error);


            res.status(500).json({

                error:
                    "Kelli AI failed",

                details:
                    error.message

            });

        }

    }
);


// ==========================================
// CREATE RAZORPAY PAYMENT ORDER
// ==========================================

app.post(
    "/api/payment/create-order",
    requireAuth,
    async (req, res) => {

        try {

            const {
                amount
            } = req.body;


            // ==========================================
            // CHECK AMOUNT
            // ==========================================

            if (
                amount === undefined ||
                amount === null ||
                Number(amount) <= 0
            ) {

                return res.status(400).json({

                    error:
                        "A valid payment amount is required"

                });

            }


            // ==========================================
            // CREATE ORDER
            // ==========================================

            const order =
                await createPaymentOrder(

                    Number(amount),

                    `kelli_${Date.now()}`

                );


            // ==========================================
            // RETURN ORDER INFORMATION
            // ==========================================

            res.json({

                success: true,

                orderId:
                    order.id,

                amount:
                    order.amount,

                currency:
                    order.currency,

                keyId:
                    process.env.RAZORPAY_KEY_ID

            });

        } catch (error) {

            console.error(
                "Razorpay order error:",
                error
            );


            res.status(500).json({

                error:
                    "Could not create payment order",

                details:
                    error.message

            });

        }

    }
);


// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================

app.post(
    "/api/payment/verify",
    requireAuth,
    async (req, res) => {

        try {

            const {
                orderId,
                paymentId,
                signature
            } = req.body;


            // ==========================================
            // CHECK PAYMENT DATA
            // ==========================================

            if (
                !orderId ||
                !paymentId ||
                !signature
            ) {

                return res.status(400).json({

                    error:
                        "Payment information is incomplete"

                });

            }


            // ==========================================
            // VERIFY SIGNATURE
            // ==========================================

            const isValid =
                verifyPayment(

                    orderId,

                    paymentId,

                    signature

                );


            // ==========================================
            // INVALID PAYMENT
            // ==========================================

            if (!isValid) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Payment verification failed"

                });

            }


            // ==========================================
            // PAYMENT VERIFIED
            // ==========================================

            console.log(
                "\n================================"
            );

            console.log(
                "Razorpay payment verified"
            );

            console.log(
                "User:",
                req.user.email
            );

            console.log(
                "Order:",
                orderId
            );

            console.log(
                "Payment:",
                paymentId
            );


            res.json({

                success: true,

                message:
                    "Payment verified successfully",

                orderId:
                    orderId,

                paymentId:
                    paymentId

            });

        } catch (error) {

            console.error(
                "Payment verification error:",
                error
            );


            res.status(500).json({

                error:
                    "Payment verification failed",

                details:
                    error.message

            });

        }

    }
);


// ==========================================
// START SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `Kelli backend running on http://localhost:${PORT}`
        );

    }
);