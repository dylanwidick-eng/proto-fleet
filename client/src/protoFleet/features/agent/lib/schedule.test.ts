import { describe, expect, it } from "vitest";
import { humanizeSchedule, isScheduleActiveNow } from "@/protoFleet/features/agent/lib/schedule";

describe("humanizeSchedule", () => {
  it("returns '' for missing or empty schedules", () => {
    expect(humanizeSchedule(null)).toBe("");
    expect(humanizeSchedule(undefined)).toBe("");
    expect(humanizeSchedule({ days: [] })).toBe("");
  });

  it("labels all seven days as Daily", () => {
    expect(humanizeSchedule({ days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], startTime: "09:00" })).toBe(
      "Daily at 9:00 AM",
    );
  });

  it("labels exactly Mon–Fri with an en dash", () => {
    expect(
      humanizeSchedule({
        days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        startTime: "15:00",
        endTime: "18:00",
      }),
    ).toBe("Mon–Fri, 3:00 PM–6:00 PM");
  });

  it("labels exactly Sat+Sun as Weekends", () => {
    expect(humanizeSchedule({ days: ["Sat", "Sun"], startTime: "02:00", endTime: "06:00" })).toBe(
      "Weekends, 2:00 AM–6:00 AM",
    );
  });

  it("labels a single day with the quirky '{Day}s' plural — including Suns", () => {
    expect(humanizeSchedule({ days: ["Sun"], startTime: "04:00", endTime: "05:00" })).toBe("Suns, 4:00 AM–5:00 AM");
    expect(humanizeSchedule({ days: ["Mon"] })).toBe("Mons");
  });

  it("comma-lists other day combos in canonical Mon-first order", () => {
    expect(humanizeSchedule({ days: ["Fri", "Mon", "Wed"] })).toBe("Mon, Wed, Fri");
  });

  it("formats 12-hour edges: midnight and noon", () => {
    expect(humanizeSchedule({ days: ["Tue"], startTime: "00:00", endTime: "12:00" })).toBe("Tues, 12:00 AM–12:00 PM");
  });

  it("uses '{days} at {start}' when there is no end time", () => {
    expect(humanizeSchedule({ days: ["Wed"], startTime: "14:30" })).toBe("Weds at 2:30 PM");
  });
});

describe("isScheduleActiveNow", () => {
  // 2026-07-15 is a Wednesday.
  const wed3pm = new Date(2026, 6, 15, 15, 0);

  it("is false for missing schedules or non-matching days", () => {
    expect(isScheduleActiveNow(null, wed3pm)).toBe(false);
    expect(isScheduleActiveNow({ days: ["Sat", "Sun"], startTime: "14:00", endTime: "17:00" }, wed3pm)).toBe(false);
  });

  it("is true inside the window on a matching day", () => {
    expect(isScheduleActiveNow({ days: ["Wed"], startTime: "14:00", endTime: "17:00" }, wed3pm)).toBe(true);
  });

  it("treats the window as start-inclusive, end-exclusive", () => {
    const s = { days: ["Wed" as const], startTime: "15:00", endTime: "17:00" };
    expect(isScheduleActiveNow(s, new Date(2026, 6, 15, 15, 0))).toBe(true);
    expect(isScheduleActiveNow(s, new Date(2026, 6, 15, 17, 0))).toBe(false);
    expect(isScheduleActiveNow(s, new Date(2026, 6, 15, 14, 59))).toBe(false);
  });

  it("is open-ended when endTime is absent, never active without startTime", () => {
    expect(isScheduleActiveNow({ days: ["Wed"], startTime: "09:00" }, wed3pm)).toBe(true);
    expect(isScheduleActiveNow({ days: ["Wed"] }, wed3pm)).toBe(false);
  });
});
