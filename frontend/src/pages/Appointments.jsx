import { 
  Calendar, 
  CalendarCheck, 
  Clock, 
  MessageSquare, 
  Plus, 
  Stethoscope,
  Info
} from 'lucide-react';

export default function Appointments({ onNavigate, onStartChatWithPrompt }) {
  return (
    <div className="appointments-page-container">
      {/* Page Header */}
      <div className="appointments-header">
        <div className="header-text-group">
          <div className="badge-row">
            <span className="medical-badge">
              <CalendarCheck size={12} /> Appointment Center
            </span>
          </div>
          <h1 className="appointments-title">My Appointments</h1>
          <p className="appointments-subtitle">
            View your confirmed consultations and manage upcoming clinic visits.
          </p>
        </div>

        <button
          type="button"
          className="btn-book-appointment"
          onClick={() => onNavigate('chat')}
        >
          <Plus size={16} />
          <span>Book with Kelli AI</span>
        </button>
      </div>

      {/* Backend Integration Readiness Notice */}
      <div className="appointment-integration-banner">
        <Info size={18} className="text-primary flex-shrink-0" />
        <div className="banner-text">
          <strong>Database Appointment Management:</strong> All consultations booked via your conversation with Kelli AI are recorded in the clinic database. Once a dedicated <code className="inline-code">GET /api/appointments</code> endpoint is connected on the server, live records will sync automatically here.
        </div>
      </div>

      {/* Structured UI Display Preview */}
      <div className="appointments-content-card">
        <div className="card-top-bar">
          <div className="top-bar-left">
            <Calendar size={18} className="text-primary" />
            <h3>Scheduled Appointments</h3>
          </div>
          <span className="status-pill-ready">UI Layout Ready</span>
        </div>

        {/* Empty State / Booking Guide */}
        <div className="appointments-empty-state">
          <div className="empty-icon-wrap">
            <CalendarCheck size={38} className="text-primary" />
          </div>
          <h3>Book your next doctor visit</h3>
          <p>
            You can check doctor availability for today, tomorrow, or any custom date, and instantly book morning (10:00 AM), afternoon (2:00 PM), or evening (5:00 PM) slots.
          </p>

          <div className="empty-action-prompts">
            <span className="prompts-label">Quick Booking Actions:</span>
            <div className="prompts-row">
              <button
                type="button"
                className="btn-prompt-chip"
                onClick={() => onStartChatWithPrompt("Can you check Dr. Smith's available appointment slots for tomorrow?")}
              >
                <Stethoscope size={14} />
                <span>Check Dr. Smith slots</span>
              </button>
              <button
                type="button"
                className="btn-prompt-chip"
                onClick={() => onStartChatWithPrompt("I'd like to book an appointment with Dr. Kumar for tomorrow at 10:00 AM.")}
              >
                <CalendarCheck size={14} />
                <span>Book Dr. Kumar (10 AM)</span>
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
            <span>Open Chat with Kelli</span>
          </button>
        </div>

        {/* Structured Schema Template Guide */}
        <div className="appointment-template-guide">
          <h4>Expected Record Fields</h4>
          <div className="template-grid">
            <div className="template-item">
              <span className="field-name">Doctor</span>
              <span className="field-desc">Attending medical specialist</span>
            </div>
            <div className="template-item">
              <span className="field-name">Specialization</span>
              <span className="field-desc">General Physician, Cardiology, etc.</span>
            </div>
            <div className="template-item">
              <span className="field-name">Date & Time</span>
              <span className="field-desc">Confirmed consultation slot</span>
            </div>
            <div className="template-item">
              <span className="field-name">Status</span>
              <span className="field-desc">Confirmed / Pending / Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
