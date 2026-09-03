/**
 * Razorpay Test Checkout Integration Helper
 */

// Dynamically load the Razorpay checkout script if not already present
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

/**
 * Open Razorpay Checkout modal
 * @param {object} options
 * @param {string} options.orderId - Razorpay order ID
 * @param {number} options.amount - Amount in paise (e.g. 50000)
 * @param {string} options.currency - e.g. 'INR'
 * @param {string} options.keyId - Razorpay Key ID
 * @param {string} options.patientName - Patient full name
 * @param {string} options.patientEmail - Patient email
 * @param {string} options.patientPhone - Patient phone number
 * @param {function} options.onSuccess - Callback on payment success ({ razorpay_order_id, razorpay_payment_id, razorpay_signature })
 * @param {function} options.onDismiss - Callback on modal close
 * @param {function} options.onError - Callback on error
 */
export async function openRazorpayCheckout({
  orderId,
  amount = 50000,
  currency = 'INR',
  keyId,
  patientName = 'Patient',
  patientEmail = '',
  patientPhone = '',
  onSuccess,
  onDismiss,
  onError,
}) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    onError?.(new Error('Could not load Razorpay payment gateway. Please check your internet connection.'));
    return;
  }

  const razorpayKey = keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder';

  const checkoutOptions = {
    key: razorpayKey,
    amount: amount,
    currency: currency,
    name: 'Kelli AI Healthcare',
    description: 'Medical Consultation Booking (Test Mode)',
    order_id: orderId,
    prefill: {
      name: patientName,
      email: patientEmail,
      contact: patientPhone,
    },
    theme: {
      color: '#0284c7', // Healthcare Medical Blue
    },
    handler: function (response) {
      console.log('✅ Razorpay Test Payment Success Response:', response);
      if (
        response.razorpay_order_id &&
        response.razorpay_payment_id &&
        response.razorpay_signature
      ) {
        onSuccess?.({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
      } else {
        onError?.(new Error('Incomplete payment response from Razorpay.'));
      }
    },
    modal: {
      ondismiss: function () {
        console.log('Razorpay modal closed by user.');
        onDismiss?.();
      },
    },
  };

  try {
    const rzp = new window.Razorpay(checkoutOptions);
    rzp.on('payment.failed', function (response) {
      console.error('❌ Razorpay Payment Failed:', response.error);
      onError?.(new Error(response.error.description || 'Payment transaction failed.'));
    });
    rzp.open();
  } catch (err) {
    console.error('Error initializing Razorpay checkout:', err);
    onError?.(err);
  }
}
