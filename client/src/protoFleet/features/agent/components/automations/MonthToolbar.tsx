import { ChevronLeftIcon, ChevronRightIcon } from "@/protoFleet/features/agent/components/icons";

interface MonthToolbarProps {
  /** 1st of the displayed month. */
  anchor: Date;
  onShift: (delta: number) => void;
  onToday: () => void;
}

/** ‹ Today › month navigation above the calendar grid (proto-automations.md §2.4.4). */
const MonthToolbar = ({ anchor, onShift, onToday }: MonthToolbarProps) => (
  <div className="mb-3 flex items-center justify-between">
    <span className="text-heading-200 text-text-primary">
      {anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
    </span>
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous month"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-5 text-text-primary-70 hover:bg-surface-5"
        onClick={() => onShift(-1)}
      >
        <ChevronLeftIcon />
      </button>
      <button
        type="button"
        className="rounded-full border border-border-10 px-3 py-1.5 text-emphasis-300 text-text-primary hover:bg-surface-5"
        onClick={onToday}
      >
        Today
      </button>
      <button
        type="button"
        aria-label="Next month"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-5 text-text-primary-70 hover:bg-surface-5"
        onClick={() => onShift(1)}
      >
        <ChevronRightIcon />
      </button>
    </div>
  </div>
);

export default MonthToolbar;
