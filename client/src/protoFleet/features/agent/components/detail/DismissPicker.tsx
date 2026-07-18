/**
 * Dismiss-reason picker — an in-footer view swap inside AgentDetailModal
 * (proto-smart-cards.md §4.3). Selecting a chip commits immediately; "← Back"
 * returns to the actions row. Copy is verbatim.
 */
const DISMISS_REASONS = ["False positive", "Will handle manually", "Disagree", "Not actionable", "Other"] as const;

interface DismissPickerProps {
  onSelect: (reason: string) => void;
  onBack: () => void;
}

const DismissPicker = ({ onSelect, onBack }: DismissPickerProps) => (
  <div className="flex flex-col gap-3" data-testid="agent-detail-dismiss-picker">
    <div className="text-emphasis-300 text-text-primary">Why are you dismissing?</div>
    <div className="flex flex-wrap gap-2">
      {DISMISS_REASONS.map((reason) => (
        <button
          key={reason}
          type="button"
          onClick={() => onSelect(reason)}
          className="rounded-full border border-border-10 bg-surface-elevated-base px-3.5 py-2 text-emphasis-200 text-text-primary hover:bg-surface-5"
        >
          {reason}
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

export default DismissPicker;
