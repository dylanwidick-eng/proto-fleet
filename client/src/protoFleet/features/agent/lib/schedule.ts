import type { Weekday, WorkflowSchedule } from "@/protoFleet/features/agent/types";

const DAY_ORDER: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const fmtTime12h = (t: string | undefined): string => {
  if (!t) return "";
  const [hStr, m] = t.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

/**
 * Compact human-readable schedule summary, ported verbatim from the
 * prototype (proto-automations.md §7.1). Quirks are intentional and
 * spec-guarded: a single day renders `{Day}s` — yes, "Suns"/"Mons".
 *
 * All 7 days → "Daily"; exactly Mon–Fri → "Mon–Fri"; exactly Sat+Sun →
 * "Weekends"; otherwise a comma list. Times are 12-hour `h:mm AM/PM`
 * (minutes kept as-is). Both times → `{days}, {start}–{end}` (en dash);
 * start only → `{days} at {start}`; neither → the days label alone.
 */
export const humanizeSchedule = (s: WorkflowSchedule | null | undefined): string => {
  if (!s || !s.days || s.days.length === 0) return "";
  const sorted = DAY_ORDER.filter((d) => s.days.includes(d));
  let daysLabel: string;
  if (sorted.length === 7) daysLabel = "Daily";
  else if (sorted.join(",") === "Mon,Tue,Wed,Thu,Fri") daysLabel = "Mon–Fri";
  else if (sorted.join(",") === "Sat,Sun") daysLabel = "Weekends";
  else if (sorted.length === 1) daysLabel = `${sorted[0]}s`;
  else daysLabel = sorted.join(", ");
  const start = fmtTime12h(s.startTime);
  const end = fmtTime12h(s.endTime);
  if (start && end) return `${daysLabel}, ${start}–${end}`;
  if (start) return `${daysLabel} at ${start}`;
  return daysLabel;
};

const toMins = (t: string | undefined): number | null => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/**
 * True if `now` falls inside an active firing window for schedule `s`
 * (proto-automations.md §7.2). No startTime → never active; no endTime →
 * open-ended (active from start onward); otherwise `start <= now < end`.
 */
export const isScheduleActiveNow = (s: WorkflowSchedule | null | undefined, now: Date = new Date()): boolean => {
  if (!s || !s.days || s.days.length === 0) return false;
  const dayName = (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as Weekday[])[now.getDay()];
  if (!s.days.includes(dayName)) return false;
  const startMins = toMins(s.startTime);
  const endMins = toMins(s.endTime);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  if (startMins == null) return false;
  if (endMins == null) return nowMins >= startMins;
  return nowMins >= startMins && nowMins < endMins;
};
