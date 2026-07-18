import { describe, expect, it } from "vitest";
import { getAgentItem } from "@/protoFleet/features/agent/lib/agentItems";
import {
  AGENT_CHAT_FALLBACK,
  AGENT_CHAT_MATCHERS,
  pickAgentChatResponse,
} from "@/protoFleet/features/agent/lib/chatMatchers";
import { SUGGESTION_CHIPS } from "@/protoFleet/features/agent/lib/suggestionChips";

describe("AGENT_CHAT_MATCHERS", () => {
  it("has the 13 verbatim matchers, each pointing at a real agent item", () => {
    expect(AGENT_CHAT_MATCHERS).toHaveLength(13);
    for (const m of AGENT_CHAT_MATCHERS) {
      expect(getAgentItem(m.cardId), `cardId ${m.cardId}`).toBeDefined();
    }
  });
});

describe("pickAgentChatResponse", () => {
  it("matches case-insensitively on substrings", () => {
    expect(pickAgentChatResponse("Why is everything RESTARTING?")).toEqual({ cardId: "network-offline-17" });
    expect(pickAgentChatResponse("temperature looks bad")).toEqual({ cardId: "diag-hot-9" });
  });

  it("first matching matcher wins — 'reboot the pool' hits reboot, not pool", () => {
    expect(pickAgentChatResponse("reboot the pool miners")).toEqual({ cardId: "network-offline-17" });
  });

  it("returns the exact fallback sentence when nothing matches", () => {
    expect(pickAgentChatResponse("what's for lunch")).toEqual({
      text: "I'd need a bit more context to act on that. Try asking about overheating, offline miners, firmware updates, or scheduled curtailments — or pick one of the chips above the composer.",
    });
    expect(pickAgentChatResponse("what's for lunch")).toEqual({ text: AGENT_CHAT_FALLBACK });
  });

  it("routes each suggestion chip like the prototype — last two intentionally hit the fallback", () => {
    expect(pickAgentChatResponse(SUGGESTION_CHIPS[0])).toEqual({ cardId: "weather-high-temp" }); // "forecast"
    expect(pickAgentChatResponse("Recommend repairs")).toEqual({ cardId: "ops-repair-backlog" });
    expect(pickAgentChatResponse("Help schedule downtime")).toEqual({ cardId: "pattern-weekday-curtail" });
    expect(pickAgentChatResponse("Tune for optimal energy spend")).toEqual({ cardId: "energy-power-spike" });
    expect(pickAgentChatResponse("Compare site performance")).toEqual({ text: AGENT_CHAT_FALLBACK });
    expect(pickAgentChatResponse("Generate P&L report")).toEqual({ text: AGENT_CHAT_FALLBACK });
  });
});
