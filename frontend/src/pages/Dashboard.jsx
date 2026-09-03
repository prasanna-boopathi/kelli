import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { getAppointments, getDoctors } from '../lib/api';
import { 
  MessageSquare, 
  Calendar, 
  User, 
  Clock, 
  CalendarCheck, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  HeartPulse,
  Stethoscope,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

export default function Dashboard({ onNavigate, onStartChatWithPrompt }) {
  const { user, patient, token } = useAuth();

  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const patientName = patient?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Patient';

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      if (!token) return;
      setLoadingData(true);

      try {
        // 1. Load real appointments
        const apptData = await getAppointments(token);
        if (isMounted && apptData && Array.isArray(apptData.appointments)) {
          const activeAppts = apptData.appointments.filter(
            (a) => a.status === 'confirmed' || a.status === 'pending_payment'
          );
          if (activeAppts.length > 0) {
            setUpcomingAppointment(activeAppts[0]);
          }
        }

        // 2. Load real doctors
        const docData = await getDoctors(token);
        if (isMounted && docData && Array.isArray(docData.doctors)) {
          setDoctorsList(docData.doctors);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const samplePrompts = [
    "Can you check Dr. Kumar's available appointment slots for tomorrow?",
    "What appointment slots are open for today?",
    "I'd like to book an appointment with Dr. Priya for tomorrow at 10:00 AM.",
    "What services and doctor consultations does the clinic offer?"
  ];

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.includes('10:00')) return '10:00 AM';
    if (timeStr.includes('14:00')) return '2:00 PM';
    if (timeStr.includes('17:00')) return '5:00 PM';
    return timeStr;
  };

  return (
    <div className="dashboard-page-container">
      {/* Welcome Hero Banner */}
      <section className="dashboard-hero-card">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="text-primary" />
            <span>AI Healthcare Portal</span>
          </div>
          <h1 className="hero-title">Welcome back, {patientName}! 👋</h1>
          <p className="hero-description">
            Your clinic portal is live. Chat with <strong>Kelli</strong> to check real-time doctor availability, book appointments, make test consultation fee payments (₹500), or manage your schedule.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={() => onNavigate('chat')}
            >
              <MessageSquare size={17} />
              <span>Chat with Kelli AI</span>
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              className="btn-hero-secondary"
              onClick={() => onNavigate('appointments')}
            >
              <Calendar size={17} />
              <span>View Appointments</span>
            </button>
          </div>
        </div>

        {/* Live Upcoming Appointment or Status Card */}
        <div className="hero-stat-card">
          {upcomingAppointment ? (
            <div className="upcoming-appt-hero-box">
              <div className="stat-header">
                <CalendarCheck size={18} className="text-primary" />
                <span>Next Scheduled Consultation</span>
              </div>
              <h4 className="upcoming-doctor-name">
                {upcomingAppointment.doctor?.name || 'Clinic Doctor'}
              </h4>
              <p className="upcoming-doctor-spec">
                {upcomingAppointment.doctor?.specialization || 'Medical Consultation'}
              </p>
              <div className="upcoming-meta-row">
                <span className="meta-pill">
                  <Calendar size={12} /> {upcomingAppointment.appointment_date}
                </span>
                <span className="meta-pill">
                  <Clock size={12} /> {formatTime(upcomingAppointment.appointment_time)}
                </span>
              </div>
              <div className="upcoming-status-tag">
                <CheckCircle2 size={13} className="text-success" />
                <span>Status: {upcomingAppointment.status === 'confirmed' ? 'Confirmed' : 'Pending Payment'}</span>
              </div>
            </div>
          ) : (
            <div className="clinic-status-box">
              <div className="stat-header">
                <HeartPulse size={20} className="text-primary" />
                <span>Clinic Portal Status</span>
              </div>
              <div className="stat-status-row">
                <span className="status-indicator-dot" />
                <span className="status-label">Kelli AI Receptionist Online</span>
              </div>
              <div className="stat-details">
                <p><strong>Patient Email:</strong> {user?.email}</p>
                {patient?.phone && <p><strong>Phone:</strong> {patient.phone}</p>}
                <p><strong>Standard Slots:</strong> 10:00 AM • 2:00 PM • 5:00 PM</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Grid: Quick Access & Features */}
      <div className="dashboard-grid">
        {/* Quick Access Card 1: Chat with Kelli */}
        <div className="dashboard-feature-card" onClick={() => onNavigate('chat')}>
          <div className="feature-card-icon-wrap bg-primary-light text-primary">
            <MessageSquare size={22} />
          </div>
          <div className="feature-card-body">
            <h3 className="feature-card-title">Chat with Kelli</h3>
            <p className="feature-card-desc">
              Speak with Kelli to check real-time doctor availability, consult standard slots, and reserve your appointment slot with Razorpay payment.
            </p>
          </div>
          <div className="feature-card-footer text-primary">
            <span>Start Conversation</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Quick Access Card 2: My Appointments */}
        <div className="dashboard-feature-card" onClick={() => onNavigate('appointments')}>
          <div className="feature-card-icon-wrap bg-teal-light text-accent">
            <CalendarCheck size={22} />
          </div>
          <div className="feature-card-body">
            <h3 className="feature-card-title">My Appointments</h3>
            <p className="feature-card-desc">
              Review your scheduled consultations, pay consultation fees (₹500), reschedule time slots, or cancel bookings in real time.
            </p>
          </div>
          <div className="feature-card-footer text-accent">
            <span>Manage Schedule</span>
            <ArrowRight size={14} />
          </div>
        </div>

        {/* Quick Access Card 3: My Profile */}
        <div className="dashboard-feature-card" onClick={() => onNavigate('profile')}>
          <div className="feature-card-icon-wrap bg-purple-light text-purple">
            <User size={22} />
          </div>
          <div className="feature-card-body">
            <h3 className="feature-card-title">Patient Profile</h3>
            <p className="feature-card-desc">
              Keep your contact information up to date so Kelli and attending clinic doctors can identify and reach you.
            </p>
          </div>
          <div className="feature-card-footer text-purple">
            <span>Manage Profile</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Real Active Doctors Directory Section */}
      <section className="dashboard-prompts-section">
        <div className="section-header">
          <Stethoscope size={18} className="text-primary" />
          <h2>Clinic Doctors & Schedules</h2>
          <span className="section-subtitle">• Real database doctor directory</span>
        </div>

        <div className="doctors-directory-grid">
          {doctorsList.length > 0 ? (
            doctorsList.map((doc) => (
              <div key={doc.id} className="doctor-directory-card">
                <div className="doc-card-header">
                  <div className="doc-icon-wrap">
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <h4 className="doc-name">{doc.name}</h4>
                    <span className="doc-spec">{doc.specialization}</span>
                  </div>
                </div>
                <div className="doc-days-row">
                  <span className="days-label">Available Days:</span>
                  <div className="days-badges">
                    {Array.isArray(doc.available_days) && doc.available_days.map((d, i) => (
                      <span key={i} className="day-badge">{d.slice(0, 3)}</span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-book-with-doc"
                  onClick={() => onStartChatWithPrompt(`Can you check available appointment slots for ${doc.name} tomorrow?`)}
                >
                  <CalendarDays size={13} />
                  <span>Check Availability</span>
                </button>
              </div>
            ))
          ) : (
            <div className="text-muted p-3">
              {loadingData ? 'Loading doctors...' : 'Doctors directory loaded from clinic database.'}
            </div>
          )}
        </div>
      </section>

      {/* Quick Prompts Section */}
      <section className="dashboard-prompts-section">
        <div className="section-header">
          <Sparkles size={18} className="text-primary" />
          <h2>Popular Assistant Prompts</h2>
          <span className="section-subtitle">• Click any prompt to launch directly into chat</span>
        </div>
        <div className="dashboard-prompts-grid">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="dashboard-prompt-btn"
              onClick={() => onStartChatWithPrompt(prompt)}
            >
              <MessageSquare size={15} className="prompt-icon" />
              <span>"{prompt}"</span>
              <ArrowRight size={13} className="prompt-arrow" />
            </button>
          ))}
        </div>
      </section>

      {/* Bottom Info Grid */}
      <div className="dashboard-bottom-grid">
        {/* Clinic Hours */}
        <div className="dashboard-info-card">
          <div className="info-card-header">
            <Clock size={18} className="text-primary" />
            <h3>Clinic Hours & Consultation Windows</h3>
          </div>
          <div className="info-card-list">
            <div className="info-row">
              <span className="info-label">Monday – Friday</span>
              <span className="info-value">9:00 AM – 6:00 PM</span>
            </div>
            <div className="info-row">
              <span className="info-label">Saturday</span>
              <span className="info-value">10:00 AM – 4:00 PM</span>
            </div>
            <div className="info-row text-muted">
              <span className="info-label">Sunday</span>
              <span className="info-value">Closed (Emergency only)</span>
            </div>
          </div>
          <div className="slots-preview">
            <span className="slots-title">Standard Daily Slots:</span>
            <div className="slots-tags">
              <span className="tag">10:00 AM</span>
              <span className="tag">2:00 PM</span>
              <span className="tag">5:00 PM</span>
            </div>
          </div>
        </div>

        {/* Emergency Notice */}
        <div className="dashboard-info-card alert-card">
          <div className="info-card-header">
            <AlertCircle size={18} className="text-danger" />
            <h3 className="text-danger">Urgent Medical Notice</h3>
          </div>
          <p className="alert-body">
            Kelli AI is an assistant for receptionist and booking inquiries. If you or someone you know is experiencing acute chest pain, shortness of breath, severe trauma, or any life-threatening emergency, please call <strong>911</strong> or visit your nearest emergency room immediately.
          </p>
          <div className="alert-footer">
            <ShieldCheck size={14} />
            <span>Clinic Emergency Line: (555) 019-9911</span>
          </div>
        </div>
      </div>
    </div>
  );
}
