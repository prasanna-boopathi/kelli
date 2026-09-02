import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/useAuth';
import ClinicSidebar from '../components/ClinicSidebar';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import QuickPrompts from '../components/QuickPrompts';
import { 
  getOrCreateSessionId, 
  resetSessionId, 
  sendChatMessage 
} from '../lib/api';
import { 
  Stethoscope, 
  AlertCircle, 
  Sparkles, 
  ShieldCheck, 
  RotateCw, 
  RotateCcw,
  Copy,
  Check,
  PanelLeft,
  PanelLeftClose
} from 'lucide-react';

const INITIAL_GREETING = {
  id: 'greeting',
  role: 'assistant',
  content: `Hello! 👋 I'm **Kelli**, your AI medical clinic receptionist.\n\nI can assist you with:\n* 🗓️ **Checking doctor availability** for any date\n* 📋 **Booking appointments** for consultation slots\n* ⏰ **Standard daily slots** (10:00 AM, 2:00 PM, and 5:00 PM)\n* 💬 **Answering clinic procedure and service inquiries**\n\nHow may I help you today?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

export default function ChatPage({ initialPrompt, onClearInitialPrompt }) {
  const { token } = useAuth();
  const [sessionId, setSessionId] = useState(() => getOrCreateSessionId());
  const [messages, setMessages] = useState([INITIAL_GREETING]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedSession, setCopiedSession] = useState(false);
  const messagesEndRef = useRef(null);
  const initialPromptProcessed = useRef(false);

  // Handle sending a message
  const handleSendMessage = useCallback(async (userText) => {
    if (!userText || !userText.trim() || loading) return;

    setError(null);
    setLastFailedMessage(null);
    const nowTimestamp = new Date().toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userText.trim(),
      timestamp: nowTimestamp
    };

    // Optimistically add patient message
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await sendChatMessage(userText, sessionId, token);
      
      // Strict validation: only add assistant message when reply is a valid non-empty string
      if (response && typeof response.reply === 'string' && response.reply.trim().length > 0) {
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply.trim(),
          timestamp: new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Kelli did not provide a valid reply. Please try again.');
      }
    } catch (err) {
      console.error('Kelli Chat Error:', err);
      setLastFailedMessage(userText.trim());
      setError(
        err.message || 'Unable to communicate with Kelli AI. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [loading, sessionId, token]);

  // Auto-scroll to bottom whenever messages or loading changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, error]);

  // Handle initial prompt passed from Dashboard or Appointments
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && !initialPromptProcessed.current) {
      initialPromptProcessed.current = true;
      handleSendMessage(initialPrompt.trim());
      if (onClearInitialPrompt) {
        const timeout = setTimeout(() => {
          onClearInitialPrompt();
          initialPromptProcessed.current = false;
        }, 50);
        return () => clearTimeout(timeout);
      }
    }
  }, [initialPrompt, handleSendMessage, onClearInitialPrompt]);

  // Handle starting a fresh session
  const handleNewSession = () => {
    const newId = resetSessionId();
    setSessionId(newId);
    setError(null);
    setLastFailedMessage(null);
    setMessages([
      {
        ...INITIAL_GREETING,
        id: `greeting-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleCopySession = () => {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    setCopiedSession(true);
    setTimeout(() => setCopiedSession(false), 2000);
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      handleSendMessage(lastFailedMessage);
    }
  };

  return (
    <div className="chat-page-layout">
      {/* Sub-header Controls for Chat */}
      <div className="chat-sub-header">
        <div className="sub-header-left">
          <button
            type="button"
            className="btn-toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse Clinic Guide" : "Open Clinic Guide"}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            <span className="toggle-label">{sidebarOpen ? 'Hide Guide' : 'Clinic Guide'}</span>
          </button>

          <div className="chat-status-pill">
            <span className="live-status-dot" />
            <span>Kelli Receptionist Ready</span>
          </div>
        </div>

        <div className="sub-header-right">
          {sessionId && (
            <div
              className="chat-session-pill"
              onClick={handleCopySession}
              title={`Session ID: ${sessionId} (Click to copy)`}
              role="button"
              tabIndex={0}
            >
              <span className="session-label">Session:</span>
              <span className="session-val">{sessionId.substring(0, 8)}...</span>
              {copiedSession ? (
                <Check size={13} className="text-success" />
              ) : (
                <Copy size={13} />
              )}
            </div>
          )}

          <button
            type="button"
            className="btn-chat-reset"
            onClick={handleNewSession}
            title="Start a new conversation"
          >
            <RotateCcw size={14} />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      <div className="chat-body-container">
        {/* Clinic Information Sidebar */}
        <ClinicSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectPrompt={handleSendMessage}
        />

        {/* Main Conversation Workspace */}
        <main className="chat-workspace">
          {/* Clinic Verification Banner */}
          <div className="clinic-guarantee-banner">
            <div className="banner-badge">
              <ShieldCheck size={14} className="text-primary" />
              <span>Verified Clinic System</span>
            </div>
            <span className="banner-divider">•</span>
            <span>Instant doctor schedule synchronization</span>
            <span className="banner-divider">•</span>
            <span>Secure patient appointment processing</span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="chat-error-banner" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <div className="error-text">
                <strong>Notice:</strong> {error}
              </div>
              <div className="error-actions">
                {lastFailedMessage && (
                  <button
                    type="button"
                    className="btn-retry"
                    onClick={handleRetry}
                  >
                    <RotateCw size={12} /> Retry
                  </button>
                )}
                <button
                  type="button"
                  className="btn-dismiss"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Messages Feed Area */}
          <div className="messages-scroll-area">
            <div className="messages-feed">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="chat-message-row assistant-row typing-indicator-row">
                  <div className="message-avatar">
                    <div className="avatar-kelli pulse-glow">
                      <Stethoscope size={18} />
                    </div>
                  </div>
                  <div className="message-content-container">
                    <div className="message-meta">
                      <span className="sender-name">Kelli (Clinic Reception)</span>
                      <span className="ai-verified-tag">
                        <Sparkles size={11} /> Processing
                      </span>
                    </div>
                    <div className="typing-bubble">
                      <div className="typing-dots">
                        <span className="dot" />
                        <span className="dot" />
                        <span className="dot" />
                      </div>
                      <span className="typing-label">Checking doctor schedule & responding...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Chat Bar */}
          <footer className="chat-footer-area">
            {messages.length <= 2 && (
              <QuickPrompts onSelectPrompt={handleSendMessage} />
            )}

            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={loading}
            />

            <div className="footer-disclaimer">
              <span>Kelli AI Healthcare Receptionist • Powered by Clinic Database Integration</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
