import { useState } from 'react';
import { 
  Stethoscope, 
  RotateCcw, 
  PanelLeft, 
  PanelLeftClose, 
  Copy, 
  Check, 
  Activity
} from 'lucide-react';

export default function Header({ 
  sessionId, 
  onNewSession, 
  sidebarOpen, 
  setSidebarOpen,
  isTyping
}) {
  const [copied, setCopied] = useState(false);

  const handleCopySessionId = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="kelli-header">
      <div className="header-left">
        <button 
          type="button"
          className="icon-button sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Hide Clinic Guide" : "Show Clinic Guide"}
          aria-label="Toggle Clinic Guide"
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
        </button>

        <div className="brand-badge">
          <div className="brand-avatar">
            <Stethoscope size={22} className="brand-icon" />
            <span className="live-status-dot" title="Online" />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-title">Kelli AI</h1>
              <span className="medical-badge">
                <Activity size={12} className="pulse-icon" /> Clinic Reception
              </span>
            </div>
            <p className="brand-subtitle">
              {isTyping ? (
                <span className="status-text-typing">Kelli is typing...</span>
              ) : (
                'Online • Ready to assist with appointments & inquiries'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="header-right">
        {sessionId && (
          <div 
            className="session-pill" 
            onClick={handleCopySessionId}
            title={`Session ID: ${sessionId} (Click to copy)`}
            role="button"
            tabIndex={0}
          >
            <span className="session-label">Session:</span>
            <span className="session-id">{sessionId.substring(0, 8)}...</span>
            {copied ? (
              <Check size={14} className="session-icon text-success" />
            ) : (
              <Copy size={14} className="session-icon" />
            )}
          </div>
        )}

        <button 
          type="button" 
          className="btn-new-chat" 
          onClick={onNewSession}
          title="Start fresh conversation"
        >
          <RotateCcw size={15} />
          <span className="btn-text">New Patient Chat</span>
        </button>
      </div>
    </header>
  );
}
