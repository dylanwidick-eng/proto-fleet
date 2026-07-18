import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The runtime's built-in localStorage stub is non-functional under vitest.
// Install the Map-backed mock BEFORE agentStore is imported so the persist
// middleware binds to it (same pattern as agentStore.test.ts).
vi.hoisted(() => {
  const storage = new Map<string, string>();
  const localStorageMock: Storage = {
    get length() {
      return storage.size;
    },
    clear: () => storage.clear(),
    getItem: (key) => storage.get(key) ?? null,
    key: (index) => Array.from(storage.keys())[index] ?? null,
    removeItem: (key) => {
      storage.delete(key);
    },
    setItem: (key, value) => {
      storage.set(key, value);
    },
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: localStorageMock });
});
import { AGENT_THINKING_MS, useAgentChat } from "@/protoFleet/features/agent/components/chat/useAgentChat";
import { AGENT_CHAT_FALLBACK } from "@/protoFleet/features/agent/lib/chatMatchers";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";

const chatLog = () => useAgentStore.getState().chatLog;

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  useAgentStore.setState(useAgentStore.getInitialState(), true);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("useAgentChat", () => {
  it("appends user + thinking turns, then replaces the thinking turn IN PLACE after exactly 700ms", () => {
    const { result } = renderHook(() => useAgentChat());

    let sent = false;
    act(() => {
      sent = result.current.send("please reboot rack 12");
    });
    expect(sent).toBe(true);
    expect(chatLog()).toHaveLength(2);
    expect(chatLog()[0]).toMatchObject({ role: "user", text: "please reboot rack 12" });
    expect(chatLog()[1]).toMatchObject({ role: "agent", thinking: true });
    const thinkingId = chatLog()[1].id;

    act(() => {
      vi.advanceTimersByTime(AGENT_THINKING_MS - 1);
    });
    expect(chatLog()[1].thinking).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    // Replaced in place: same index, same turn id, no appended turn.
    expect(chatLog()).toHaveLength(2);
    expect(chatLog()[1].id).toBe(thinkingId);
    expect(chatLog()[1].thinking).toBeUndefined();
    expect(chatLog()[1].cardId).toBe("network-offline-17");
  });

  it("unmatched input resolves to the exact fallback sentence", () => {
    const { result } = renderHook(() => useAgentChat());

    act(() => {
      result.current.send("Compare site performance");
    });
    act(() => {
      vi.advanceTimersByTime(AGENT_THINKING_MS);
    });
    expect(chatLog()[1].cardId).toBeUndefined();
    expect(chatLog()[1].text).toBe(AGENT_CHAT_FALLBACK);
  });

  it("epoch cancel guard: New chat during the 700ms beat drops the reply cleanly", () => {
    const { result } = renderHook(() => useAgentChat());

    act(() => {
      result.current.send("reboot the miners");
      useAgentStore.getState().newChat();
    });
    expect(chatLog()).toHaveLength(0);

    act(() => {
      vi.advanceTimersByTime(AGENT_THINKING_MS + 1000);
    });
    // No orphan reply lands after the log was cleared.
    expect(chatLog()).toHaveLength(0);
  });

  it("empty/whitespace input is a strict no-op", () => {
    const { result } = renderHook(() => useAgentChat());

    let sent = true;
    act(() => {
      sent = result.current.send("   \n  ");
    });
    expect(sent).toBe(false);
    expect(chatLog()).toHaveLength(0);
  });

  it("rapid multi-send: each send owns its own thinking turn and timer", () => {
    const { result } = renderHook(() => useAgentChat());

    act(() => {
      result.current.send("firmware update");
    });
    act(() => {
      vi.advanceTimersByTime(300);
      result.current.send("check the fan rpm");
    });
    expect(chatLog()).toHaveLength(4);
    expect(chatLog()[1].thinking).toBe(true);
    expect(chatLog()[3].thinking).toBe(true);

    act(() => {
      vi.advanceTimersByTime(400); // first send hits 700ms
    });
    expect(chatLog()[1].cardId).toBe("fw-update");
    expect(chatLog()[3].thinking).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300); // second send hits 700ms
    });
    expect(chatLog()[3].cardId).toBe("inv-fans");
  });

  it("the reply still lands if the hook unmounts during the beat (log survives in-session nav)", () => {
    const { result, unmount } = renderHook(() => useAgentChat());

    act(() => {
      result.current.send("reboot");
    });
    unmount();

    act(() => {
      vi.advanceTimersByTime(AGENT_THINKING_MS);
    });
    expect(chatLog()[1].cardId).toBe("network-offline-17");
  });
});
