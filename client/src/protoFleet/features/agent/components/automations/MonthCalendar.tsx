import clsx from "clsx";
import { buildMonthGrid, DAY_NAMES } from "@/protoFleet/features/agent/lib/calendar";
import { paletteFor } from "@/protoFleet/features/agent/lib/palette";
import type { Workflow } from "@/protoFleet/features/agent/types";
import { pushToast, STATUSES } from "@/shared/features/toaster";

/** Max pills per cell before the "+N more" overflow button (prototype VISIBLE = 3). */
const VISIBLE_PILLS = 3;

/** Local-timezone "YYYY-MM-DD" for the overflow toast stub. */
const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Pill time keeps the prototype quirk (proto-automations.md §9): only a
 * LEADING zero is stripped ("09:00" → "9:00") and the 24h clock is kept
 * ("14:00" stays "14:00") even though the list view's whenText says "2:00 PM".
 * Preserved consciously — do not "fix" to 12-hour.
 */
const pillTime = (wf: Workflow): string => (wf.schedule?.startTime ?? "").replace(/^0/, "");

interface MonthCalendarProps {
  /** 1st of the displayed month. */
  anchor: Date;
  /** Workflows with `triggerType === "schedule"` and a truthy schedule. */
  schedules: Workflow[];
  /** Test hook; defaults to the real today. */
  today?: Date;
}

/**
 * Monday-start MONTH grid (proto-automations.md §2.4.5). NOTE: the
 * prototype's stale block comment says "weekly grid" — the implemented (and
 * ported) calendar is a month grid.
 *
 * Placement rule: a schedule workflow renders in a cell iff the cell's
 * weekday code is in `schedule.days` — on EVERY matching weekday, including
 * out-of-month padding cells and past dates (faithful; there is no
 * start/end-date concept). Pill + "+N more" clicks are toast stubs.
 */
const MonthCalendar = ({ anchor, schedules, today }: MonthCalendarProps) => {
  const cells = buildMonthGrid(anchor, today);

  return (
    <div className="overflow-hidden rounded-xl border border-border-5 bg-surface-base">
      <div className="grid grid-cols-7 border-b border-border-5 bg-surface-5">
        {DAY_NAMES.map((day, i) => (
          <div
            key={day}
            className={clsx(
              "px-2 py-2.5 text-center text-heading-50 tracking-wide text-text-primary-50 uppercase",
              i < 6 ? "border-r border-border-5" : null,
            )}
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const pills = schedules.filter((wf) => wf.schedule?.days.includes(cell.dayCode));
          const overflow = pills.length - VISIBLE_PILLS;
          const iso = isoDate(cell.date);
          return (
            <div
              key={iso}
              data-testid={`month-cell-${iso}`}
              data-in-month={cell.inMonth}
              className={clsx(
                "flex min-h-[124px] flex-col gap-1.5 overflow-hidden border-b border-border-5 p-2",
                (i + 1) % 7 === 0 ? null : "border-r",
                cell.inMonth ? "bg-surface-base" : "bg-surface-5",
              )}
            >
              <div className={clsx("text-emphasis-300", cell.inMonth ? "text-text-primary" : "text-text-primary-50")}>
                {cell.isToday ? (
                  <span
                    data-testid="month-today-dot"
                    className="-mt-1 -ml-1 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-core-primary-fill text-200 text-text-contrast"
                  >
                    {cell.date.getDate()}
                  </span>
                ) : (
                  cell.date.getDate()
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-[3px]">
                {pills.slice(0, VISIBLE_PILLS).map((wf) => {
                  const palette = paletteFor(wf.id);
                  return (
                    <button
                      key={wf.id}
                      type="button"
                      title={wf.name}
                      data-testid={`month-pill-${iso}-${wf.id}`}
                      className={clsx(
                        "flex items-center gap-1 overflow-hidden rounded-sm px-1.5 py-[3px] whitespace-nowrap hover:brightness-95",
                        palette.bg,
                        palette.text,
                        wf.paused ? "opacity-45" : null,
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        pushToast({
                          message: `Edit ${wf.name || wf.id} — detail surface coming next`,
                          status: STATUSES.success,
                        });
                      }}
                    >
                      <span className="text-200 font-semibold">{pillTime(wf)}</span>
                      <span className="truncate text-emphasis-200">{wf.name}</span>
                    </button>
                  );
                })}
                {overflow > 0 ? (
                  <button
                    type="button"
                    className="self-start text-emphasis-200 text-text-primary-50 hover:text-text-primary"
                    onClick={() =>
                      pushToast({ message: `See all automations on ${iso} — coming next`, status: STATUSES.success })
                    }
                  >
                    +{overflow} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthCalendar;
