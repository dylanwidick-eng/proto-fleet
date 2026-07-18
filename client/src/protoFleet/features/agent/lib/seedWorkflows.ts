import type { Workflow } from "@/protoFleet/features/agent/types";

const DAY_MS = 86400000;
const HOUR_MS = 3600000;

/**
 * The three seed automations (proto-automations.md §1.4), so the calendar
 * reads convincingly on first visit. Timestamps are relative to `now` so
 * demos always look fresh. Seeded only when the workflows map is empty —
 * which also means revoking all workflows re-seeds these on the next
 * Automations render (faithful prototype behavior, documented in the plan).
 */
export const createSeedWorkflows = (now: number = Date.now()): Workflow[] => [
  {
    id: "wf_seed_dr",
    name: "ERCOT DR curtailment",
    triggerType: "schedule",
    whenText: "Mon–Fri, 2:00–5:00 PM",
    schedule: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "14:00", endTime: "17:00" },
    thenText: "Curtail R03–R10 to 60 kW",
    scope: "all",
    sourceItemId: null,
    site: "all",
    cat: "Energy",
    createdAt: now - 7 * DAY_MS,
    lastFiredAt: now - DAY_MS,
    fireCount: 12,
    paused: false,
  },
  {
    id: "wf_seed_firmware",
    name: "Off-peak firmware updates",
    triggerType: "schedule",
    whenText: "Weekends, 2:00–6:00 AM",
    schedule: { days: ["Sat", "Sun"], startTime: "02:00", endTime: "06:00" },
    thenText: "Push pending firmware updates in batches of 25",
    scope: "all",
    sourceItemId: null,
    site: "all",
    cat: "Settings",
    createdAt: now - 14 * DAY_MS,
    lastFiredAt: now - 5 * DAY_MS,
    fireCount: 4,
    paused: false,
  },
  {
    id: "wf_seed_report",
    name: "Daily health report",
    triggerType: "schedule",
    whenText: "Daily at 9:00 AM",
    schedule: {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      startTime: "09:00",
      endTime: "09:30",
    },
    thenText: "Compile fleet health summary and post to Slack",
    scope: "all",
    sourceItemId: null,
    site: "all",
    cat: "Settings",
    createdAt: now - 21 * DAY_MS,
    lastFiredAt: now - HOUR_MS,
    fireCount: 21,
    paused: false,
  },
];
