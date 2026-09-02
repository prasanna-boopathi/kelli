require("dotenv").config();

const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ==========================================
// CREATE RAZORPAY ORDER
// ==========================================

async function createPaymentOrder(amount, receipt) {

    const order = await razorpay.orders.create({

        amount: Number(amount),

        currency: "INR",

        receipt: receipt

    });

    return order;
}


// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================

function verifyPayment(
    orderId,
    paymentId,
    signature
) {

    const body =
        orderId + "|" + paymentId;

    const expectedSignature =
        crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body)
            .digest("hex");

    return expectedSignature === signature;
}


module.exports = {
    createPaymentOrder,
    verifyPayment
};