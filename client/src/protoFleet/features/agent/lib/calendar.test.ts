import { describe, expect, it } from "vitest";
import {
  buildMonthGrid,
  dayCode,
  monthGridFirstOffset,
  monthGridStart,
  monthGridTotalCells,
} from "@/protoFleet/features/agent/lib/calendar";

describe("dayCode", () => {
  it("is Monday-indexed", () => {
    expect(dayCode(new Date(2026, 6, 13))).toBe("Mon"); // 2026-07-13
    expect(dayCode(new Date(2026, 6, 19))).toBe("Sun");
    expect(dayCode(new Date(2026, 6, 15))).toBe("Wed");
  });
});

describe("month grid math", () => {
  it("July 2026 (1st = Wednesday): offset 2, 35 cells, grid starts Mon Jun 29", () => {
    const anchor = new Date(2026, 6, 15);
    expect(monthGridFirstOffset(anchor)).toBe(2);
    expect(monthGridTotalCells(anchor)).toBe(35);
    const start = monthGridStart(anchor);
    expect([start.getFullYear(), start.getMonth(), start.getDate()]).toEqual([2026, 5, 29]);
    expect(dayCode(start)).toBe("Mon");
  });

  it("June 2026 (1st = Monday): offset 0, exactly 5 full weeks", () => {
    const anchor = new Date(2026, 5, 10);
    expect(monthGridFirstOffset(anchor)).toBe(0);
    expect(monthGridTotalCells(anchor)).toBe(35);
    expect(monthGridStart(anchor).getDate()).toBe(1);
  });

  it("February 2027 (28 days, 1st = Monday): the rare perfect 28-cell grid", () => {
    const anchor = new Date(2027, 1, 14);
    expect(monthGridFirstOffset(anchor)).toBe(0);
    expect(monthGridTotalCells(anchor)).toBe(28);
  });

  it("August 2026 (1st = Saturday): offset 5, 36 raw days → 42 cells", () => {
    const anchor = new Date(2026, 7, 1);
    expect(monthGridFirstOffset(anchor)).toBe(5);
    expect(monthGridTotalCells(anchor)).toBe(42);
  });
});

describe("buildMonthGrid", () => {
  it("pads a full grid with correct inMonth flags and consecutive dates", () => {
    const anchor = new Date(2026, 6, 15);
    const cells = buildMonthGrid(anchor, new Date(2026, 6, 17));
    expect(cells).toHaveLength(35);
    expect(cells[0].inMonth).toBe(false); // Jun 29
    expect(cells[1].inMonth).toBe(false); // Jun 30
    expect(cells[2].inMonth).toBe(true); // Jul 1
    expect(cells[32].inMonth).toBe(true); // Jul 31
    expect(cells[33].inMonth).toBe(false); // Aug 1
    for (let i = 1; i < cells.length; i++) {
      expect(cells[i].date.getTime() - cells[i - 1].date.getTime()).toBeGreaterThan(0);
    }
    expect(cells.filter((c) => c.isToday)).toHaveLength(1);
    expect(cells.find((c) => c.isToday)?.date.getDate()).toBe(17);
  });

  it("survives a US DST transition month without date drift (March 2026, spring forward Mar 8)", () => {
    const anchor = new Date(2026, 2, 15);
    const cells = buildMonthGrid(anchor, new Date(2026, 2, 15));
    // March 1 2026 is a Sunday → offset 6; 6+31=37 → 42 cells.
    expect(cells).toHaveLength(42);
    const dates = cells.map((c) => c.date.getDate());
    // Feb 23 … Mar 1 … Mar 31 … Apr 5 — every calendar date consecutive, none skipped/duplicated.
    expect(dates.slice(0, 7)).toEqual([23, 24, 25, 26, 27, 28, 1]);
    expect(dates.slice(-7)).toEqual([30, 31, 1, 2, 3, 4, 5]);
    const march = cells.filter((c) => c.inMonth);
    expect(march).toHaveLength(31);
    expect(march.map((c) => c.date.getDate())).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
    // Weekday codes stay Monday-aligned across the DST jump.
    expect(cells[0].dayCode).toBe("Mon");
    expect(cells[6].dayCode).toBe("Sun");
    expect(cells[13].dayCode).toBe("Sun"); // Mar 8, DST day itself
  });
});
