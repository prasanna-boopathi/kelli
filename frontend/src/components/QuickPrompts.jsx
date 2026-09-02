import { Calendar, UserCheck, Clock, MessageSquarePlus } from 'lucide-react';

export default function QuickPrompts({ onSelectPrompt }) {
  const suggestions = [
    {
      icon: Calendar,
      label: "Check Dr. Smith's slots tomorrow",
      prompt: "Can you check Dr. Smith's availability for tomorrow?"
    },
    {
      icon: Clock,
      label: "What slots are available today?",
      prompt: "What appointment slots are open for today?"
    },
    {
      icon: UserCheck,
      label: "Book appointment for John Doe",
      prompt: "I'd like to book an appointment with Dr. Smith tomorrow at 10:00:00 for John Doe, phone 123-456-7890."
    },
    {
      icon: MessageSquarePlus,
      label: "Clinic booking instructions",
      prompt: "How does the appointment scheduling process work?"
    }
  ];

  return (
    <div className="quick-prompts-container">
      <div className="quick-prompts-header">
        <span>Suggested questions:</span>
      </div>
      <div className="quick-prompts-grid">
        {suggestions.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              type="button"
              className="quick-prompt-chip"
              onClick={() => onSelectPrompt(item.prompt)}
            >
              <Icon size={14} className="chip-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
