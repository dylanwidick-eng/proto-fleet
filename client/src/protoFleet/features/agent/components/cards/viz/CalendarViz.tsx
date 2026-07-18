/**
 * Callout viz (proto-smart-cards.md §2.3.1): only values matching the
 * calendar pattern ("MAY 6") render anything — a small month/day tile.
 * Every other callout (e.g. "+35%", "39°C", "47×") returns null, leaving the
 * viz pane intentionally EMPTY: the number already lives in the card title,
 * and the visual side is reserved for scannable shapes. 5 of the 14 seeded
 * items hit this branch — not a bug (PORT_PLAN.md §3.2).
 */
const CALENDAR_PATTERN = /^([A-Za-z]{3,9})\s+(\d{1,2})$/;

interface CalendarVizProps {
  value: string;
}

const CalendarViz = ({ value }: CalendarVizProps) => {
  const match = CALENDAR_PATTERN.exec(value);
  if (!match) return null;

  return (
    <div
      data-testid="calendar-viz"
      className="flex w-16 flex-col items-center justify-center rounded-lg bg-surface-elevated-base px-1 py-2 shadow-50"
    >
      <div className="text-emphasis-200 tracking-wide text-text-primary-50 uppercase">{match[1]}</div>
      <div className="text-heading-300 leading-none text-text-primary">{match[2]}</div>
    </div>
  );
};

export default CalendarViz;
