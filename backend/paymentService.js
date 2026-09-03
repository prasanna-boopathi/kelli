require("dotenv").config();

const Razorpay = require("razorpay");
const crypto = require("crypto");

// Centralized Consultation Fee (MVP single source of truth)
const CONSULTATION_FEE_INR = 500;
const CONSULTATION_FEE_PAISE = CONSULTATION_FEE_INR * 100; // 50000 paise

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder"
});

// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================
async function createPaymentOrder(amount = CONSULTATION_FEE_PAISE, receipt = `kelli_${Date.now()}`) {
    const order = await razorpay.orders.create({
        amount: Number(amount) || CONSULTATION_FEE_PAISE,
        currency: "INR",
        receipt: receipt
    });

    return order;
}

// ==========================================
// VERIFY RAZORPAY PAYMENT SIGNATURE (SERVER-SIDE)
// ==========================================
function verifyPayment(orderId, paymentId, signature) {
    if (!orderId || !paymentId || !signature) {
        return false;
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
        console.error("RAZORPAY_KEY_SECRET is not configured in backend environment.");
        return false;
    }

    const body = orderId + "|" + paymentId;

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    return expectedSignature === signature;
}

module.exports = {
    CONSULTATION_FEE_INR,
    CONSULTATION_FEE_PAISE,
    createPaymentOrder,
    verifyPayment
};