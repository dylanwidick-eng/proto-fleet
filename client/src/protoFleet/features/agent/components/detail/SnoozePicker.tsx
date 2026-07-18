/**
 * Snooze-duration picker — an in-footer view swap inside AgentDetailModal
 * (proto-smart-cards.md §4.3). Chip copy and the stored key/label pairs are
 * verbatim (labels are lowercase "until …" in toasts/state text). Snooze
 * never expires in the prototype and that behavior is kept faithfully
 * (PORT_PLAN.md §7).
 */
const SNOOZE_OPTIONS = [
  { key: "1h", chip: "1 hour", label: "1 hour" },
  { key: "tomorrow", chip: "Until tomorrow", label: "until tomorrow" },
  { key: "monday", chip: "Until Monday", label: "until Monday" },
] as const;

interface SnoozePickerProps {
  onSelect: (key: string, label: string) => void;
  onBack: () => void;
}

const SnoozePicker = ({ onSelect, onBack }: SnoozePickerProps) => (
  <div className="flex flex-col gap-3" data-testid="agent-detail-snooze-picker">
    <div className="text-emphasis-300 text-text-primary">Snooze for how long?</div>
    <div className="flex flex-wrap gap-2">
      {SNOOZE_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onSelect(option.key, option.label)}
          className="rounded-full border border-border-10 bg-surface-elevated-base px-3.5 py-2 text-emphasis-200 text-text-primary hover:bg-surface-5"
        >
          {option.chip}
        </button>
      ))}
    </div>
    <button
      type="button"
      onClick={onBack}
      className="self-start py-1 text-200 text-text-primary-50 hover:text-text-primary"
    >
      ← Back
    </button>
  </div>
);

export default SnoozePicker;
