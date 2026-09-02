import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

export default function ChatInput({ onSendMessage, disabled, placeholder }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || disabled) return;

    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="input-container">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Ask Kelli to check doctor availability, book appointments, or inquire..."}
          disabled={disabled}
          rows={1}
          className="chat-textarea"
          aria-label="Patient message input"
        />

        <div className="input-actions">
          <span className="input-hint">
            Press <kbd>Enter ↵</kbd> to send, <kbd>Shift + Enter</kbd> for new line
          </span>

          <button
            type="submit"
            className="btn-send"
            disabled={!input.trim() || disabled}
            aria-label="Send message"
          >
            {disabled ? (
              <Loader2 size={16} className="btn-spinner" />
            ) : (
              <>
                <span>Send</span>
                <Send size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
