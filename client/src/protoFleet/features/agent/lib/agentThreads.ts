import type { AgentThread } from "@/protoFleet/features/agent/types";

/**
 * AGENT_THREADS — 6 mock chat-history rows (proto-nav-chat.md §2.1).
 * Labels are pre-truncated with literal "..." in the mock data.
 */
export const AGENT_THREADS: AgentThread[] = [
  { id: "mining-diag", label: "Bitcoin mining diagnostic", timeAgo: "1h" },
  { id: "reboot-r01", label: "Reboot miners R01", timeAgo: "yesterday" },
  { id: "fw-update", label: "Update firmware version", timeAgo: "2d" },
  { id: "pool-perf", label: "Track pool perf...", timeAgo: "4d" },
  { id: "pnl", label: "Generate P&L report", timeAgo: "1w" },
  { id: "temp-fluct", label: "Monitor temperature fluctu...", timeAgo: "2w" },
];
