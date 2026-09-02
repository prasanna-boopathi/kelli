import { useAuth } from '../context/useAuth';
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
  HeartPulse
} from 'lucide-react';

export default function Dashboard({ onNavigate, onStartChatWithPrompt }) {
  const { user, patient } = useAuth();

  const patientName = patient?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Patient';

  const samplePrompts = [
    "Can you check Dr. Smith's available appointment slots for tomorrow?",
    "What appointment slots are open for today?",
    "I'd like to book an appointment with Dr. Kumar for tomorrow at 10:00 AM.",
    "What services and doctor consultations does the clinic offer?"
  ];

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
            Your patient portal is ready. Connect with <strong>Kelli</strong>, your AI clinic receptionist, to check doctor availability, book appointments, or update your profile.
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

        <div className="hero-stat-card">
          <div className="stat-header">
            <HeartPulse size={20} className="text-primary" />
            <span>Clinic Status</span>
          </div>
          <div className="stat-status-row">
            <span className="status-indicator-dot" />
            <span className="status-label">Kelli AI Receptionist Online</span>
          </div>
          <div className="stat-details">
            <p><strong>Patient Email:</strong> {user?.email}</p>
            {patient?.phone && <p><strong>Phone:</strong> {patient.phone}</p>}
            <p><strong>Standard Slots:</strong> 10 AM • 2 PM • 5 PM</p>
          </div>
        </div>
      </section>

      {/* Main Grid: Quick Access & Clinic Info */}
      <div className="dashboard-grid">
        {/* Quick Access Card 1: Chat with Kelli */}
        <div className="dashboard-feature-card" onClick={() => onNavigate('chat')}>
          <div className="feature-card-icon-wrap bg-primary-light text-primary">
            <MessageSquare size={22} />
          </div>
          <div className="feature-card-body">
            <h3 className="feature-card-title">Chat with Kelli</h3>
            <p className="feature-card-desc">
              Check real-time doctor availability, consult standard slots, and book appointments through natural conversation.
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
              Review your scheduled clinic consultations, doctor details, appointment dates, and booking status.
            </p>
          </div>
          <div className="feature-card-footer text-accent">
            <span>View Schedule</span>
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
              Keep your contact information up to date so the clinic medical staff and doctors can reach you.
            </p>
          </div>
          <div className="feature-card-footer text-purple">
            <span>Manage Profile</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

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
            <h3>Clinic Hours & Scheduling</h3>
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
              <span className="info-value">Closed (Urgent only)</span>
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
