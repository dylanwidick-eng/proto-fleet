import type { AgentChatResponse } from "@/protoFleet/features/agent/types";

export interface AgentChatMatcher {
  keys: string[];
  cardId: string;
}

/**
 * Keyword → recommendation card, verbatim from the prototype
 * (proto-nav-chat.md §5.3). Order matters — the first matching matcher wins;
 * within a matcher, any key matches. Matching is case-insensitive substring
 * (`includes`), so "restarting" matches `restart` and "temperature" matches
 * `temp`.
 */
export const AGENT_CHAT_MATCHERS: AgentChatMatcher[] = [
  { keys: ["reboot", "offline", "restart"], cardId: "network-offline-17" },
  { keys: ["curtail", "price", "spike", "energy"], cardId: "energy-power-spike" },
  { keys: ["firmware", "update", "patch", "cve"], cardId: "fw-update" },
  { keys: ["hot", "temp", "overheat", "throttle"], cardId: "diag-hot-9" },
  { keys: ["pool", "stratum", "config"], cardId: "pools-need-pool" },
  { keys: ["fan", "rpm"], cardId: "inv-fans" },
  { keys: ["weather", "forecast", "pre-cool"], cardId: "weather-high-temp" },
  { keys: ["cabling", "unstable", "crc", "link"], cardId: "net-unstable-33" },
  { keys: ["hvac", "cooling", "aisle"], cardId: "perf-bldg-d" },
  { keys: ["rack", "hot rack"], cardId: "diag-racks-hot" },
  { keys: ["password", "credential", "security"], cardId: "sec-weak-pwd" },
  { keys: ["repair", "backlog", "ticket", "tech"], cardId: "ops-repair-backlog" },
  { keys: ["schedule", "pattern", "recurring"], cardId: "pattern-weekday-curtail" },
];

/** Exact no-match reply (proto-nav-chat.md §5.3). Do not reword. */
export const AGENT_CHAT_FALLBACK =
  "I'd need a bit more context to act on that. Try asking about overheating, offline miners, firmware updates, or scheduled curtailments — or pick one of the chips above the composer.";

/** First-match-wins canned response for a composer message. */
export const pickAgentChatResponse = (text: string): AgentChatResponse => {
  const t = text.toLowerCase();
  for (const matcher of AGENT_CHAT_MATCHERS) {
    if (matcher.keys.some((key) => t.includes(key))) return { cardId: matcher.cardId };
  }
  return { text: AGENT_CHAT_FALLBACK };
};
