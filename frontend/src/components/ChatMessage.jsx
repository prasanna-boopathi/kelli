import { useState } from 'react';
import { 
  Stethoscope, 
  User, 
  Copy, 
  Check, 
  CalendarCheck, 
  Calendar,
  Sparkles
} from 'lucide-react';

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if content implies appointment booking or slot check
  const isAppointmentSuccess = isAssistant && (
    message.content.toLowerCase().includes('successfully') ||
    message.content.toLowerCase().includes('confirmed') ||
    message.content.toLowerCase().includes('appointment booked')
  );

  const hasSlotList = isAssistant && (
    message.content.toLowerCase().includes('available slots') ||
    message.content.toLowerCase().includes('available:') ||
    message.content.toLowerCase().includes('10:00:00') ||
    message.content.toLowerCase().includes('14:00:00') ||
    message.content.toLowerCase().includes('17:00:00')
  );

  // Render markdown-like simple formatting (bold, newlines, bullet lists)
  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      // Check if bullet point
      const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const content = isBullet ? line.trim().substring(2) : line;

      // Parse bold segments (**bold**)
      const parts = content.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, partIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={lineIndex} className="chat-bullet-item">
            {formattedParts}
          </li>
        );
      }

      if (line.trim() === '') {
        return <div key={lineIndex} className="chat-line-break" />;
      }

      return (
        <p key={lineIndex} className="chat-text-line">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div className={`chat-message-row ${isAssistant ? 'assistant-row' : 'user-row'}`}>
      <div className="message-avatar">
        {isAssistant ? (
          <div className="avatar-kelli">
            <Stethoscope size={18} />
          </div>
        ) : (
          <div className="avatar-user">
            <User size={18} />
          </div>
        )}
      </div>

      <div className="message-content-container">
        <div className="message-meta">
          <span className="sender-name">
            {isAssistant ? 'Kelli (Clinic Reception)' : 'You (Patient)'}
          </span>
          {isAssistant && (
            <span className="ai-verified-tag">
              <Sparkles size={11} /> AI Receptionist
            </span>
          )}
          <span className="message-time">
            {message.timestamp || 'Just now'}
          </span>
        </div>

        {/* Special callout banner for appointment confirmations */}
        {isAppointmentSuccess && (
          <div className="special-callout success-callout">
            <CalendarCheck size={16} className="callout-icon" />
            <span>Appointment Record Processed</span>
          </div>
        )}

        {/* Special callout for available slots */}
        {hasSlotList && !isAppointmentSuccess && (
          <div className="special-callout info-callout">
            <Calendar size={16} className="callout-icon" />
            <span>Doctor Availability Checked</span>
          </div>
        )}

        <div className={`message-bubble ${isAssistant ? 'assistant-bubble' : 'user-bubble'}`}>
          <div className="message-body">
            {renderFormattedText(message.content)}
          </div>

          <div className="bubble-actions">
            <button 
              type="button" 
              className="btn-bubble-copy"
              onClick={handleCopy}
              title="Copy text"
              aria-label="Copy text"
            >
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
