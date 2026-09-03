import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import { 
  getAppointments, 
  cancelAppointmentApi, 
  rescheduleAppointmentApi,
  createPaymentOrderApi,
  verifyPaymentApi
} from '../lib/api';
import { openRazorpayCheckout } from '../lib/razorpay';
import { 
  Calendar, 
  CalendarCheck, 
  Clock, 
  MessageSquare, 
  Plus, 
  Stethoscope,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CreditCard,
  Loader2,
  CalendarDays,
  X
} from 'lucide-react';

export default function Appointments({ onNavigate, onStartChatWithPrompt }) {
  const { token, user, patient } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Modals state
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00:00');
  const [rescheduling, setRescheduling] = useState(false);

  const [cancelModalAppt, setCancelModalAppt] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [payingApptId, setPayingApptId] = useState(null);

  // Fetch appointments helper for manual refreshes and action completions
  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getAppointments(token);
      if (data && data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError(err.message || 'Could not load your appointments from clinic database.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getAppointments(token);
        if (isMounted && data && data.appointments) {
          setAppointments(data.appointments);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load appointments:', err);
          setError(err.message || 'Could not load your appointments from clinic database.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Format time (e.g. 10:00:00 -> 10:00 AM)
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes('10:00')) return '10:00 AM';
    if (timeStr.includes('14:00')) return '2:00 PM';
    if (timeStr.includes('17:00')) return '5:00 PM';
    return timeStr;
  };

  // Format date (YYYY-MM-DD -> e.g. Sep 10, 2026)
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { 
        weekday: 'short',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  // Handle Razorpay Payment for a pending appointment
  const handlePayAppointment = async (appt) => {
    setError(null);
    setPayingApptId(appt.id);

    try {
      const orderData = await createPaymentOrderApi(appt.id, token);

      if (!orderData || !orderData.orderId) {
        throw new Error('Failed to create payment order for this appointment.');
      }

      await openRazorpayCheckout({
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        keyId: orderData.keyId,
        patientName: patient?.name || user?.user_metadata?.full_name || 'Patient',
        patientEmail: user?.email || '',
        patientPhone: patient?.phone || '',
        onSuccess: async (paymentResponse) => {
          try {
            const verifyResult = await verifyPaymentApi(
              {
                orderId: paymentResponse.orderId,
                paymentId: paymentResponse.paymentId,
                signature: paymentResponse.signature,
                appointmentId: appt.id,
              },
              token
            );

            if (verifyResult && verifyResult.success) {
              setActionSuccess(`Payment verified! Appointment with ${appt.doctor?.name || 'doctor'} is now confirmed.`);
              setTimeout(() => setActionSuccess(null), 5000);
              await fetchAppointments();
            }
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            setError(verifyErr.message || 'Payment signature verification failed.');
          } finally {
            setPayingApptId(null);
          }
        },
        onDismiss: () => {
          setPayingApptId(null);
        },
        onError: (err) => {
          setError(err.message || 'Razorpay payment could not be processed.');
          setPayingApptId(null);
        },
      });
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Could not initiate payment.');
      setPayingApptId(null);
    }
  };

  // Handle Cancel Appointment
  const handleConfirmCancel = async () => {
    if (!cancelModalAppt) return;
    setCancelling(true);
    setError(null);

    try {
      const res = await cancelAppointmentApi(cancelModalAppt.id, token);
      if (res && res.success) {
        setActionSuccess('Appointment cancelled successfully. The slot is now freed.');
        setTimeout(() => setActionSuccess(null), 4000);
        setCancelModalAppt(null);
        await fetchAppointments();
      }
    } catch (err) {
      console.error('Cancel appointment error:', err);
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  // Handle Reschedule Appointment
  const handleConfirmReschedule = async (e) => {
    e.preventDefault();
    if (!rescheduleModalAppt || !rescheduleDate || !rescheduleTime) return;
    setRescheduling(true);
    setError(null);

    try {
      const res = await rescheduleAppointmentApi(
        rescheduleModalAppt.id,
        rescheduleDate,
        rescheduleTime,
        token
      );
      if (res && res.success) {
        setActionSuccess(`Appointment rescheduled successfully to ${rescheduleDate} at ${formatTime(rescheduleTime)}.`);
        setTimeout(() => setActionSuccess(null), 4000);
        setRescheduleModalAppt(null);
        await fetchAppointments();
      }
    } catch (err) {
      console.error('Reschedule appointment error:', err);
      setError(err.message || 'Failed to reschedule appointment.');
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <div className="appointments-page-container">
      {/* Page Header */}
      <div className="appointments-header">
        <div className="header-text-group">
          <div className="badge-row">
            <span className="medical-badge">
              <CalendarCheck size={12} /> Live Clinic Schedule
            </span>
          </div>
          <h1 className="appointments-title">My Appointments</h1>
          <p className="appointments-subtitle">
            Manage your verified doctor consultations, payments, and clinic schedule in real time.
          </p>
        </div>

        <div className="header-actions-group">
          <button
            type="button"
            className="btn-refresh-data"
            onClick={fetchAppointments}
            disabled={loading}
            title="Refresh appointments"
          >
            <RotateCw size={15} className={loading ? 'btn-spinner' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-book-appointment"
            onClick={() => onNavigate('chat')}
          >
            <Plus size={16} />
            <span>Book with Kelli AI</span>
          </button>
        </div>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="alert-banner alert-success" role="status">
          <CheckCircle2 size={18} className="alert-icon" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="alert-banner alert-error" role="alert">
          <AlertCircle size={18} className="alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {/* Appointments List Container */}
      <div className="appointments-content-card">
        <div className="card-top-bar">
          <div className="top-bar-left">
            <Calendar size={18} className="text-primary" />
            <h3>Your Scheduled Consultations ({appointments.length})</h3>
          </div>
          <span className="status-pill-synced">Synced with Database</span>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="appointments-loading-state">
            <Loader2 size={32} className="btn-spinner text-primary" />
            <p>Loading your appointments from database...</p>
          </div>
        ) : appointments.length === 0 ? (
          /* Empty State */
          <div className="appointments-empty-state">
            <div className="empty-icon-wrap">
              <CalendarCheck size={38} className="text-primary" />
            </div>
            <h3>No appointments booked yet</h3>
            <p>
              Ask <strong>Kelli</strong> in chat to check doctor availability for today, tomorrow, or any custom date, and instantly book your consultation.
            </p>

            <div className="empty-action-prompts">
              <span className="prompts-label">Quick Booking Suggestions:</span>
              <div className="prompts-row">
                <button
                  type="button"
                  className="btn-prompt-chip"
                  onClick={() => onStartChatWithPrompt("Can you check Dr. Kumar's available appointment slots for tomorrow?")}
                >
                  <Stethoscope size={14} />
                  <span>Check Dr. Kumar slots</span>
                </button>
                <button
                  type="button"
                  className="btn-prompt-chip"
                  onClick={() => onStartChatWithPrompt("Can you check Dr. Priya's available slots?")}
                >
                  <CalendarDays size={14} />
                  <span>Check Dr. Priya (Dermatology)</span>
                </button>
                <button
                  type="button"
                  className="btn-prompt-chip"
                  onClick={() => onStartChatWithPrompt("What appointment times are open for today?")}
                >
                  <Clock size={14} />
                  <span>What slots are open today?</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn-hero-primary mt-4"
              onClick={() => onNavigate('chat')}
            >
              <MessageSquare size={16} />
              <span>Start Chat with Kelli</span>
            </button>
          </div>
        ) : (
          /* Actual Real Appointments Cards Grid */
          <div className="appointments-cards-list">
            {appointments.map((appt) => {
              const isConfirmed = appt.status === 'confirmed';
              const isPendingPayment = appt.status === 'pending_payment';
              const isCancelled = appt.status === 'cancelled';
              const isPaid = appt.payment_status === 'paid';

              return (
                <div 
                  key={appt.id} 
                  className={`appointment-item-card ${isCancelled ? 'card-cancelled' : ''}`}
                >
                  <div className="appt-card-left">
                    <div className="doctor-avatar-circle">
                      <Stethoscope size={22} />
                    </div>

                    <div className="appt-details">
                      <div className="doctor-title-row">
                        <h4 className="doctor-name">{appt.doctor?.name || 'Clinic Doctor'}</h4>
                        <span className="doctor-specialization">
                          {appt.doctor?.specialization || 'General Consultation'}
                        </span>
                      </div>

                      <div className="appt-schedule-row">
                        <div className="schedule-pill">
                          <Calendar size={14} className="text-primary" />
                          <span>{formatDate(appt.appointment_date)}</span>
                        </div>

                        <div className="schedule-pill">
                          <Clock size={14} className="text-accent" />
                          <span>{formatTime(appt.appointment_time)}</span>
                        </div>
                      </div>

                      {appt.razorpay_payment_id && (
                        <div className="payment-receipt-id">
                          <span>Razorpay Payment ID: <code>{appt.razorpay_payment_id}</code></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="appt-card-right">
                    <div className="badges-column">
                      {/* Appointment Status Badge */}
                      <span className={`status-badge status-${appt.status}`}>
                        {isConfirmed && <CheckCircle2 size={12} />}
                        {isPendingPayment && <Clock size={12} />}
                        {isCancelled && <XCircle size={12} />}
                        <span>
                          {isConfirmed ? 'Confirmed' : isPendingPayment ? 'Payment Pending' : 'Cancelled'}
                        </span>
                      </span>

                      {/* Payment Status Badge */}
                      <span className={`payment-badge payment-${appt.payment_status}`}>
                        <CreditCard size={12} />
                        <span>{isPaid ? 'Paid (₹500)' : isCancelled ? 'N/A' : 'Unpaid (₹500)'}</span>
                      </span>
                    </div>

                    {/* Actions Column */}
                    <div className="appt-actions-row">
                      {/* Pay Button if Pending Payment */}
                      {isPendingPayment && (
                        <button
                          type="button"
                          className="btn-appt-pay"
                          onClick={() => handlePayAppointment(appt)}
                          disabled={payingApptId === appt.id}
                        >
                          {payingApptId === appt.id ? (
                            <>
                              <Loader2 size={14} className="btn-spinner" />
                              <span>Opening Razorpay...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={14} />
                              <span>Pay ₹500</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Reschedule Button */}
                      {!isCancelled && (
                        <button
                          type="button"
                          className="btn-appt-action"
                          onClick={() => {
                            setRescheduleModalAppt(appt);
                            setRescheduleDate(appt.appointment_date);
                            setRescheduleTime(appt.appointment_time);
                          }}
                        >
                          <span>Reschedule</span>
                        </button>
                      )}

                      {/* Cancel Button */}
                      {!isCancelled && (
                        <button
                          type="button"
                          className="btn-appt-cancel"
                          onClick={() => setCancelModalAppt(appt)}
                        >
                          <span>Cancel</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModalAppt && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <CalendarCheck size={20} className="text-primary" />
                <h3>Reschedule Appointment</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setRescheduleModalAppt(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReschedule} className="modal-form">
              <p className="modal-subtext">
                Rescheduling consultation with <strong>{rescheduleModalAppt.doctor?.name}</strong>.
              </p>

              <div className="form-group">
                <label htmlFor="reschedule-date">Select New Date</label>
                <input
                  id="reschedule-date"
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="modal-date-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reschedule-time">Select Consultation Slot</label>
                <select
                  id="reschedule-time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="modal-select-input"
                >
                  <option value="10:00:00">10:00 AM (Morning Slot)</option>
                  <option value="14:00:00">2:00 PM (Afternoon Slot)</option>
                  <option value="17:00:00">5:00 PM (Evening Slot)</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-modal-secondary"
                  onClick={() => setRescheduleModalAppt(null)}
                  disabled={rescheduling}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-hero-primary"
                  disabled={rescheduling}
                >
                  {rescheduling ? (
                    <>
                      <Loader2 size={16} className="btn-spinner" />
                      <span>Rescheduling...</span>
                    </>
                  ) : (
                    <span>Confirm Reschedule</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalAppt && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title-wrap text-danger">
                <AlertCircle size={20} />
                <h3>Cancel Appointment</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setCancelModalAppt(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p>
                Are you sure you want to cancel your appointment with <strong>{cancelModalAppt.doctor?.name}</strong> on <strong>{formatDate(cancelModalAppt.appointment_date)}</strong> at <strong>{formatTime(cancelModalAppt.appointment_time)}</strong>?
              </p>
              <p className="modal-subtext text-muted mt-2">
                This will release the consultation time slot so other patients can book it.
              </p>
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setCancelModalAppt(null)}
                disabled={cancelling}
              >
                Keep Appointment
              </button>
              <button
                type="button"
                className="btn-modal-danger"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 size={16} className="btn-spinner" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Yes, Cancel Appointment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
