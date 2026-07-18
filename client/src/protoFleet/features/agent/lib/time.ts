/**
 * Time/label helpers ported verbatim from the prototype
 * (proto-automations.md §7.3, proto-action-modals.md §6.2).
 */

/** "just now" / "{n}m ago" / "{n}h ago" / "{n}d ago" — all Math.round, "" for falsy. */
export const formatRelTime = (ts: number | null | undefined, now: number = Date.now()): string => {
  if (!ts) return "";
  const sec = Math.round((now - ts) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  return `${Math.round(sec / 86400)}d ago`;
};

/** Run duration for outcome receipts: "42s" under a minute, else "2m 5s". */
export const elapsedStr = (elapsedMs: number): string => {
  const sec = Math.round(elapsedMs / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
};

/**
 * Strips a trailing ` (123)` count from a refine-chip label for the
 * "Cohort:" receipt line. Exact prototype regex — comma-formatted counts
 * like "All v4.1.x (3,989)" intentionally survive (faithful quirk).
 */
export const stripCountSuffix = (label: string): string => label.replace(/ \(\d+\)/, "");
