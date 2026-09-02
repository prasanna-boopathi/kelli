import { 
  Clock, 
  Calendar, 
  UserCheck, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  CalendarCheck2, 
  HelpCircle, 
  X 
} from 'lucide-react';

export default function ClinicSidebar({ 
  isOpen, 
  onClose, 
  onSelectPrompt 
}) {
  const quickQuestions = [
    {
      title: "Check Dr. Availability",
      prompt: "Can you check Dr. Smith's available appointment slots for tomorrow?",
      icon: CalendarCheck2
    },
    {
      title: "Standard Slots Today",
      prompt: "What appointment times are open for today?",
      icon: Clock
    },
    {
      title: "Book an Appointment",
      prompt: "I'd like to book an appointment with Dr. Smith for tomorrow at 10:00 AM. My name is Alex Rivera, phone 555-0199.",
      icon: UserCheck
    },
    {
      title: "Clinic Services Info",
      prompt: "What medical services and consultation options does the clinic provide?",
      icon: HelpCircle
    }
  ];

  return (
    <aside className={`clinic-sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-title-group">
          <Calendar size={18} className="sidebar-title-icon" />
          <h2>Clinic Guide</h2>
        </div>
        <button 
          type="button" 
          className="sidebar-close-btn" 
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="sidebar-scrollable-content">
        {/* Clinic Hours & Status */}
        <section className="sidebar-card">
          <div className="card-header">
            <Clock size={16} className="card-icon text-primary" />
            <h3>Clinic Hours</h3>
          </div>
          <div className="schedule-list">
            <div className="schedule-row">
              <span className="day">Monday – Friday</span>
              <span className="time">9:00 AM – 6:00 PM</span>
            </div>
            <div className="schedule-row">
              <span className="day">Saturday</span>
              <span className="time">10:00 AM – 4:00 PM</span>
            </div>
            <div className="schedule-row text-muted">
              <span className="day">Sunday</span>
              <span className="time">Closed (Urgent only)</span>
            </div>
          </div>
        </section>

        {/* Standard Appointment Slots */}
        <section className="sidebar-card">
          <div className="card-header">
            <CalendarCheck2 size={16} className="card-icon text-accent" />
            <h3>Standard Slots</h3>
          </div>
          <p className="sidebar-note">Daily doctor consultation windows:</p>
          <div className="slots-grid">
            <div className="slot-badge">
              <span className="slot-time">10:00 AM</span>
              <span className="slot-tag">Morning</span>
            </div>
            <div className="slot-badge">
              <span className="slot-time">2:00 PM</span>
              <span className="slot-tag">Afternoon</span>
            </div>
            <div className="slot-badge">
              <span className="slot-time">5:00 PM</span>
              <span className="slot-tag">Evening</span>
            </div>
          </div>
        </section>

        {/* How Kelli Helps */}
        <section className="sidebar-card">
          <div className="card-header">
            <Sparkles size={16} className="card-icon text-warning" />
            <h3>How Kelli Helps</h3>
          </div>
          <ul className="kelli-features">
            <li>
              <CheckCircle2 size={14} className="feature-icon" />
              <span>Checks doctor calendar in real-time</span>
            </li>
            <li>
              <CheckCircle2 size={14} className="feature-icon" />
              <span>Confirms appointments into clinic system</span>
            </li>
            <li>
              <CheckCircle2 size={14} className="feature-icon" />
              <span>Handles natural dates ("today", "tomorrow")</span>
            </li>
          </ul>
        </section>

        {/* Clickable Quick Prompts */}
        <section className="sidebar-card">
          <div className="card-header">
            <HelpCircle size={16} className="card-icon text-info" />
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-action-list">
            {quickQuestions.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  type="button"
                  className="quick-action-item"
                  onClick={() => onSelectPrompt(item.prompt)}
                >
                  <Icon size={14} className="action-icon" />
                  <span className="action-title">{item.title}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Emergency Notice */}
        <section className="sidebar-card alert-emergency">
          <div className="emergency-header">
            <AlertCircle size={16} className="text-danger" />
            <h4>Emergency Notice</h4>
          </div>
          <p>
            If you are experiencing a life-threatening medical emergency, please call <strong>911</strong> or visit your nearest emergency room immediately.
          </p>
        </section>
      </div>
    </aside>
  );
}
