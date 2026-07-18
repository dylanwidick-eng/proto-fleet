import { useCallback } from "react";
import { pickAgentChatResponse } from "@/protoFleet/features/agent/lib/chatMatchers";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";

/** User turn → agent reply delay (proto-nav-chat.md §5.2). */
export const AGENT_THINKING_MS = 700;

export interface UseAgentChatResult {
  /**
   * Send a composer message. Returns false on the empty/whitespace strict
   * no-op (checklist §11.1 — callers must NOT clear the input in that case).
   */
  send: (text: string) => boolean;
}

/**
 * Composer send flow: pushes the user turn + a thinking placeholder via the
 * store, then replaces the placeholder IN PLACE with the matched canned
 * response after exactly 700ms.
 *
 * The timer is deliberately NOT cleared on unmount: the chat log survives
 * in-session navigation away from /agent, so the reply must still land if
 * the user leaves during the beat. Cancellation is the epoch guard instead —
 * "New chat" bumps `chatEpoch`, and `resolveThinking` silently drops replies
 * whose epoch is stale or whose thinking turn is gone (proto-nav-chat.md
 * §5.2). Rapid multi-send is allowed; each send owns its own timer.
 */
export const useAgentChat = (): UseAgentChatResult => {
  const send = useCallback((text: string): boolean => {
    const pending = useAgentStore.getState().sendMessage(text);
    if (!pending) return false;
    const { turnId, epoch } = pending;
    setTimeout(() => {
      useAgentStore.getState().resolveThinking(turnId, epoch, pickAgentChatResponse(text));
    }, AGENT_THINKING_MS);
    return true;
  }, []);

  return { send };
};
