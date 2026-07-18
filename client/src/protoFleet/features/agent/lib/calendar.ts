import type { Weekday } from "@/protoFleet/features/agent/types";

/**
 * Monday-start MONTH-grid math for the Automations calendar
 * (proto-automations.md §2.4.5). NOTE: the prototype's stale comment says
 * "weekly grid" — the implemented (and ported) calendar is a month grid.
 *
 * The grid pads with trailing days of the previous month and leading days of
 * the next month so every row is full (4–6 rows). Cell dates are constructed
 * via day arithmetic in the Date constructor, so DST transitions can't drift
 * the calendar dates.
 */
export const DAY_NAMES: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Monday-indexed weekday code for a date (Mon=0 … Sun=6 → "Mon" … "Sun"). */
export const dayCode = (d: Date): Weekday => DAY_NAMES[(d.getDay() + 6) % 7];

/** Offset of the 1st of the anchor's month from Monday (0–6). */
export const monthGridFirstOffset = (anchor: Date): number => {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  return (first.getDay() + 6) % 7;
};

/** Total cells in the padded month grid — always a multiple of 7. */
export const monthGridTotalCells = (anchor: Date): number => {
  const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  return Math.ceil((monthGridFirstOffset(anchor) + daysInMonth) / 7) * 7;
};

/** Date of the grid's first cell (the Monday on or before the 1st). */
export const monthGridStart = (anchor: Date): Date =>
  new Date(anchor.getFullYear(), anchor.getMonth(), 1 - monthGridFirstOffset(anchor));

export interface MonthGridCell {
  date: Date;
  /** False for the previous/next-month padding cells. */
  inMonth: boolean;
  /** Midnight (calendar-date) equality with `today`, local timezone. */
  isToday: boolean;
  dayCode: Weekday;
}

const sameCalendarDate = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Full padded grid for the anchor's month. */
export const buildMonthGrid = (anchor: Date, today: Date = new Date()): MonthGridCell[] => {
  const firstOffset = monthGridFirstOffset(anchor);
  const totalCells = monthGridTotalCells(anchor);
  const cells: MonthGridCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(anchor.getFullYear(), anchor.getMonth(), 1 - firstOffset + i);
    cells.push({
      date,
      inMonth: date.getMonth() === anchor.getMonth(),
      isToday: sameCalendarDate(date, today),
      dayCode: dayCode(date),
    });
  }
  return cells;
};
