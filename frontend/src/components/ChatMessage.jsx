import { useState } from 'react';
import { 
  Stethoscope, 
  User, 
  Copy, 
  Check, 
  CalendarCheck, 
  Calendar,
  Sparkles,
  CreditCard,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function ChatMessage({ message, onProceedToPayment, isPaying }) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const textLower = (message.content || '').toLowerCase();

  // Check if content implies appointment booking or pending payment
  const isPendingPayment = isAssistant && (
    textLower.includes('reserved') ||
    textLower.includes('consultation fee') ||
    textLower.includes('proceed to payment') ||
    textLower.includes('complete the payment') ||
    textLower.includes('₹500') ||
    textLower.includes('500')
  );

  const isAppointmentSuccess = isAssistant && (
    textLower.includes('successfully') ||
    textLower.includes('confirmed') ||
    textLower.includes('appointment booked')
  );

  const hasSlotList = isAssistant && (
    textLower.includes('available slots') ||
    textLower.includes('available:') ||
    textLower.includes('10:00:00') ||
    textLower.includes('14:00:00') ||
    textLower.includes('17:00:00')
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

        {/* Special callout banner for appointment reservations requiring payment */}
        {isPendingPayment && !message.isPaid && (
          <div className="special-callout warning-callout">
            <Clock size={15} className="callout-icon" />
            <span>Slot Reserved • Payment Required (₹500)</span>
          </div>
        )}

        {/* Special callout banner for confirmed appointments */}
        {(isAppointmentSuccess || message.isPaid) && (
          <div className="special-callout success-callout">
            <CalendarCheck size={16} className="callout-icon" />
            <span>Appointment Record Confirmed</span>
          </div>
        )}

        {/* Special callout for available slots */}
        {hasSlotList && !isAppointmentSuccess && !isPendingPayment && (
          <div className="special-callout info-callout">
            <Calendar size={16} className="callout-icon" />
            <span>Doctor Availability Checked</span>
          </div>
        )}

        <div className={`message-bubble ${isAssistant ? 'assistant-bubble' : 'user-bubble'}`}>
          <div className="message-body">
            {renderFormattedText(message.content)}
          </div>

          {/* Interactive Razorpay Payment Card inside Chat */}
          {isPendingPayment && !message.isPaid && onProceedToPayment && (
            <div className="chat-payment-card">
              <div className="payment-card-info">
                <div className="fee-badge">
                  <CreditCard size={15} />
                  <span>Consultation Fee: <strong>₹500</strong></span>
                </div>
                <span className="test-mode-badge">Razorpay Test Mode</span>
              </div>
              <button
                type="button"
                className="btn-chat-pay"
                onClick={() => onProceedToPayment(message)}
                disabled={isPaying}
              >
                <CreditCard size={15} />
                <span>{isPaying ? 'Processing Payment...' : 'Proceed to Payment (₹500)'}</span>
              </button>
            </div>
          )}

          {message.isPaid && (
            <div className="chat-payment-verified-badge">
              <CheckCircle2 size={16} className="text-success" />
              <span>Payment of ₹500 Verified Successfully</span>
            </div>
          )}

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
