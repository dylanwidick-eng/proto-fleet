import type { ActivityTurn } from "@/protoFleet/features/agent/types";

/**
 * AGENT_TURNS_ACTIVITY — 5 canned turns for the thread activity feed,
 * verbatim from the prototype (proto-smart-cards.md §1.5). Every chat-history
 * thread renders this same feed (thread switching is visually stubbed).
 *
 * Card ids are distinct from AGENT_ITEMS, so their runtime state resolves to
 * pending (no status badge) and clicking them silently no-ops the detail
 * modal (faithful — open question Q1 in PORT_PLAN.md §7).
 */
export const AGENT_TURNS_ACTIVITY: ActivityTurn[] = [
  {
    bot: "RebootBot",
    botIcon: "reboot",
    card: {
      id: "turn-reboot-a7",
      cat: "Network",
      site: "Rack A7",
      action: "Reboot rack",
      title: "17 miners offline",
      sub: "No auto-reboot, last telemetry 03:48 UTC",
      viz: { type: "rack-grid", total: 25, affected: 17 },
    },
    taskList: { count: 5, time: "15 minutes ago" },
  },
  {
    bot: "CurtailBot",
    botIcon: "energy",
    card: {
      id: "turn-curtail-austin",
      cat: "Energy",
      site: "Austin",
      action: "View schedule",
      title: "Curtailment scheduled",
      sub: "ERCOT DR event 2:00 PM – 5:00 PM tomorrow",
      viz: { type: "callout", value: "MAY 6", sub: "tomorrow" },
    },
    taskList: { count: 3, time: "4 hours ago" },
  },
  {
    bot: "UpdateBot",
    botIcon: "settings",
    card: {
      id: "turn-fw-update-8",
      cat: "Firmware",
      site: "Container D2",
      action: "Standardize",
      title: "4 versions across 61 miners",
      sub: "Mix of v1.2.1, v1.3.0, v1.3.2, v1.4.0-beta",
      viz: { type: "pie", data: [15, 22, 18, 6], labels: ["v1.2.1", "v1.3.0", "v1.3.2", "v1.4.0-beta"] },
    },
    taskList: { count: 3, time: "2 hours ago" },
  },
  {
    bot: "RebootBot",
    botIcon: "reboot",
    card: {
      id: "turn-reboot-c5",
      cat: "Performance",
      site: "Rack 2A",
      action: "Run PSU test",
      title: "13 under hash target",
      sub: "All use same PSU batch, possibly degraded voltage",
      viz: { type: "rack-grid", total: 25, affected: 13 },
    },
    taskList: { count: 5, time: "15 minutes ago" },
  },
  {
    bot: "PoolBot",
    botIcon: "pool",
    card: {
      id: "turn-pool-rack-d",
      cat: "Pools",
      site: "Rack D",
      action: "Switch pool",
      title: "Elevated stale shares",
      sub: "Optimizing pool connections, testing alternate servers",
      viz: { type: "bar", data: [2, 3, 1, 4, 5, 3], labels: ["00", "02", "04", "06", "08", "10"] },
    },
    taskTree: [
      { state: "done", text: "Identified high stale share rate" },
      { state: "done", text: "Testing pool latency" },
      {
        state: "running",
        text: "Switching to lower-latency pool",
        subtext: "Redirecting miners to backup pool server",
      },
      { state: "pending", text: "2 more tasks" },
    ],
  },
];
