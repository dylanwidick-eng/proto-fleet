import type { PageInsightPage } from "@/protoFleet/features/agent/types";

/**
 * Per-page category allow-lists for the "Agent insights" banner modules
 * (proto-smart-cards.md §3.2). `null` = any category. The prototype's "home"
 * page maps to the dashboard here.
 *
 * Faithful quirks, preserved on purpose:
 * - miners lists `Hardware` and `Pool` (singular), which match NO seeded item
 *   ("Pools" is the seeded cat) — expect 4 matches initially
 *   (network-offline-17, diag-hot-9, fw-update, net-unstable-33).
 * - energy/reports are configured but DORMANT — no page mounts them.
 */
export const PAGE_INSIGHT_CATS: Record<PageInsightPage, string[] | null> = {
  dashboard: null,
  miners: ["Network", "Diagnostics", "Hardware", "Pool", "Software"],
  energy: ["Energy", "Weather"],
  reports: ["Pattern", "Energy"],
};

/** Max cards per module; AGENT_ITEMS order = priority order. */
export const PAGE_INSIGHT_MAX = 4;
