/**
 * API Service for Kelli Healthcare AI Receptionist & Patient Portal
 */

const SESSION_STORAGE_KEY = 'kelli_session_id';

/**
 * Generate a cryptographically secure or unique session ID
 */
export function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Get the current active session ID or create and store a new one
 */
export function getOrCreateSessionId() {
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Reset and return a brand new session ID
 */
export function resetSessionId() {
  const newSessionId = generateSessionId();
  sessionStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
  return newSessionId;
}

/**
 * Helper to make authenticated requests to the backend API
 * @param {string} endpoint - API route (e.g. '/api/me')
 * @param {object} options - Fetch options
 * @param {string|null} token - Supabase access token
 */
export async function apiFetch(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (networkError) {
    console.error(`[API Network Error] ${endpoint}:`, networkError);
    throw new Error('Unable to connect to the healthcare server. Please check your network connection.');
  }

  // Handle non-2xx status codes
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      console.error(`[API Error Response] ${endpoint}:`, errorJson);
      if (errorJson) {
        if (errorJson.details && errorJson.error) {
          errorMessage = `${errorJson.error}: ${errorJson.details}`;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        } else if (errorJson.details) {
          errorMessage = errorJson.details;
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      }
    } catch {
      // Non-JSON error payload
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  try {
    return await response.json();
  } catch (parseError) {
    console.error(`[API JSON Parse Error] ${endpoint}:`, parseError);
    throw new Error('Invalid response format received from server.');
  }
}

/**
 * Get the current authenticated patient's profile
 * @param {string} token - Supabase access token
 */
export async function getPatientProfile(token) {
  if (!token) {
    throw new Error('Authentication token is required to load patient profile.');
  }
  return await apiFetch('/api/me', { method: 'GET' }, token);
}

/**
 * Update the current authenticated patient's profile
 * @param {{name?: string, phone?: string}} updates - Profile updates
 * @param {string} token - Supabase access token
 */
export async function updatePatientProfile(updates, token) {
  if (!token) {
    throw new Error('Authentication token is required to update patient profile.');
  }
  return await apiFetch(
    '/api/me',
    {
      method: 'PATCH',
      body: JSON.stringify(updates),
    },
    token
  );
}

/**
 * Get all doctors and their specializations and available days
 */
export async function getDoctors(token = null) {
  return await apiFetch('/api/doctors', { method: 'GET' }, token);
}

/**
 * Get all appointments for the authenticated patient
 * @param {string} token - Supabase access token
 */
export async function getAppointments(token) {
  if (!token) {
    throw new Error('Authentication token is required to load appointments.');
  }
  return await apiFetch('/api/appointments', { method: 'GET' }, token);
}

/**
 * Cancel an appointment for the authenticated patient
 * @param {string} appointmentId
 * @param {string} token
 */
export async function cancelAppointmentApi(appointmentId, token) {
  if (!token) {
    throw new Error('Authentication token is required to cancel an appointment.');
  }
  return await apiFetch(`/api/appointments/${appointmentId}/cancel`, { method: 'PATCH' }, token);
}

/**
 * Reschedule an appointment for the authenticated patient
 * @param {string} appointmentId
 * @param {string} date - New date
 * @param {string} time - New time
 * @param {string} token
 */
export async function rescheduleAppointmentApi(appointmentId, date, time, token) {
  if (!token) {
    throw new Error('Authentication token is required to reschedule an appointment.');
  }
  return await apiFetch(
    `/api/appointments/${appointmentId}/reschedule`,
    {
      method: 'PATCH',
      body: JSON.stringify({ date, time }),
    },
    token
  );
}

/**
 * Create a Razorpay payment order for consultation fee
 * @param {string} [appointmentId]
 * @param {string} token
 */
export async function createPaymentOrderApi(appointmentId = null, token) {
  if (!token) {
    throw new Error('Authentication token is required to create a payment order.');
  }
  return await apiFetch(
    '/api/payment/create-order',
    {
      method: 'POST',
      body: JSON.stringify({ appointmentId }),
    },
    token
  );
}

/**
 * Verify Razorpay payment signature on backend
 * @param {object} payload - { orderId, paymentId, signature, appointmentId }
 * @param {string} token
 */
export async function verifyPaymentApi({ orderId, paymentId, signature, appointmentId }, token) {
  if (!token) {
    throw new Error('Authentication token is required to verify payment.');
  }
  return await apiFetch(
    '/api/payment/verify',
    {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        paymentId,
        signature,
        appointmentId,
      }),
    },
    token
  );
}

/**
 * Send a patient message to Kelli AI backend
 * @param {string} message - Patient message
 * @param {string} sessionId - Conversation session ID
 * @param {string} token - Supabase access token
 * @returns {Promise<{success?: boolean, reply: string}>}
 */
export async function sendChatMessage(message, sessionId, token) {
  if (!message || !message.trim()) {
    throw new Error('Message cannot be empty.');
  }

  if (!sessionId) {
    throw new Error('Session ID is required.');
  }

  if (!token) {
    throw new Error('You must be logged in to chat with Kelli AI.');
  }

  console.log('[Kelli Chat Request]', {
    endpoint: '/api/chat',
    sessionId,
    message: message.trim(),
  });

  const data = await apiFetch(
    '/api/chat',
    {
      method: 'POST',
      body: JSON.stringify({
        message: message.trim(),
        sessionId: sessionId,
      }),
    },
    token
  );

  console.log('[Kelli Chat Response Data]', data);

  // Validate that reply is a non-empty string
  if (!data || typeof data.reply !== 'string' || !data.reply.trim()) {
    console.error('[Kelli Chat Missing or Empty Reply]', data);
    throw new Error('Kelli did not return a valid response. Please try again.');
  }

  return data;
}
