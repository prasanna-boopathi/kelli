# KELLI AI: Generative AI-Powered Healthcare Receptionist

Kelli AI is a full-stack digital clinic receptionist platform that allows patients to book appointments using natural language. Powered by Google Gemini 3.6 Flash, it grounds AI responses in live database records to eliminate hallucinations and prevent double-booking.

## 🚀 Key Features
- **Conversational AI:** Multi-turn dialogue using Gemini 3.6 Flash.
- **Grounded Answers:** Server-side tool calling tied to live PostgreSQL records.
- **Availability Engine:** Parses natural time expressions (e.g., "after 5 PM") into 30-minute slots.
- **No Double-Booking:** Pre-booking re-check plus a PostgreSQL partial unique index.
- **Zero-Trust Payments:** Server-locked fees with Razorpay HMAC-SHA256 verification.
- **Verified Receipts:** Automated HTML email dispatch via Nodemailer.
- **Secure Auth:** Passwordless Google OAuth 2.0 via Supabase.

## 🛠️ Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **AI Engine:** Google Gemini 3.6 Flash
- **Database:** Supabase PostgreSQL 15 (Row-Level Security)
- **Payments:** Razorpay Standard Checkout
- **Testing:** Jest, Supertest (24/24 tests passed)

## 📊 Automated Testing Results
- **Auth:** 401 on every unauthenticated route.
- **Availability:** 12h/24h times, 30-min slots, filters.
- **Booking:** Zod validation, double-booking rejected.
- **Payment:** Tampered IDs and wrong secret fail.
