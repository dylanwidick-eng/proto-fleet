import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAgentItem } from "@/protoFleet/features/agent/lib/agentItems";

// The runtime's built-in localStorage stub is non-functional under vitest
// (node's `--localstorage-file` webstorage). Install the repo's Map-backed
// mock BEFORE agentStore is imported so persist middleware binds to it
// (same pattern as FleetLayout.test.tsx).
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
import { ACCEPT_COMPLETE_MS, AGENT_STORE_KEY, useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { Workflow } from "@/protoFleet/features/agent/types";

const makeWorkflow = (overrides: Partial<Workflow> = {}): Workflow => ({
  id: "wf_test1",
  name: "Test automation",
  triggerType: "condition",
  whenText: "Something happens",
  schedule: null,
  thenText: "Do the thing",
  scope: "all",
  sourceItemId: null,
  site: "all",
  cat: "Settings",
  createdAt: Date.now(),
  lastFiredAt: null,
  fireCount: 0,
  paused: false,
  ...overrides,
});

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  useAgentStore.setState(useAgentStore.getInitialState(), true);
});

afterEach(() => {
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("card state machine", () => {
  it("accept flips pending → running → (4.5s) completed", () => {
    useAgentStore.getState().acceptItem("network-offline-17");
    expect(useAgentStore.getState().itemStates["network-offline-17"].state).toBe("running");
    expect(useAgentStore.getState().itemStates["network-offline-17"].acceptedAt).toBeTypeOf("number");

    vi.advanceTimersByTime(ACCEPT_COMPLETE_MS - 1);
    expect(useAgentStore.getState().itemStates["network-offline-17"].state).toBe("running");

    vi.advanceTimersByTime(1);
    const entry = useAgentStore.getState().itemStates["network-offline-17"];
    expect(entry.state).toBe("completed");
    expect(entry.completedAt).toBeTypeOf("number");
  });

  it("accept-timer guard: a dismiss inside the 4.5s window is NOT overwritten", () => {
    useAgentStore.getState().acceptItem("network-offline-17");
    useAgentStore.getState().dismissItem("network-offline-17", "Will handle manually");
    vi.advanceTimersByTime(ACCEPT_COMPLETE_MS + 1000);
    const entry = useAgentStore.getState().itemStates["network-offline-17"];
    expect(entry.state).toBe("dismissed");
    expect(entry.dismissReason).toBe("Will handle manually");
    expect(entry.completedAt).toBeUndefined();
  });

  it("snooze stores key + label and hides the item from visible surfaces", () => {
    useAgentStore.getState().snoozeItem("diag-hot-9", "tomorrow", "until tomorrow");
    const entry = useAgentStore.getState().itemStates["diag-hot-9"];
    expect(entry).toMatchObject({ state: "snoozed", snoozeKey: "tomorrow", snoozeLabel: "until tomorrow" });
  });

  it("unknown item ids are silent no-ops", () => {
    useAgentStore.getState().acceptItem("turn-reboot-a7");
    expect(useAgentStore.getState().itemStates["turn-reboot-a7"]).toBeUndefined();
  });
});

describe("automate + revoke round-trip", () => {
  it("automateItem links workflowId; revokeWorkflow resets the source item to pending", () => {
    const wf = makeWorkflow({ id: "wf_rt", sourceItemId: "diag-hot-9" });
    useAgentStore.getState().automateItem("diag-hot-9", wf);

    expect(useAgentStore.getState().workflows["wf_rt"]).toBeDefined();
    expect(useAgentStore.getState().itemStates["diag-hot-9"]).toMatchObject({
      state: "automated",
      workflowId: "wf_rt",
    });

    useAgentStore.getState().revokeWorkflow("wf_rt");
    expect(useAgentStore.getState().workflows["wf_rt"]).toBeUndefined();
    // Entry removed entirely → default pending → re-surfaces everywhere.
    expect(useAgentStore.getState().itemStates["diag-hot-9"]).toBeUndefined();
  });

  it("pause toggles without touching the source item", () => {
    const wf = makeWorkflow({ id: "wf_p", sourceItemId: "diag-hot-9" });
    useAgentStore.getState().automateItem("diag-hot-9", wf);
    useAgentStore.getState().toggleWorkflowPause("wf_p");
    expect(useAgentStore.getState().workflows["wf_p"].paused).toBe(true);
    expect(useAgentStore.getState().itemStates["diag-hot-9"].state).toBe("automated");
    useAgentStore.getState().toggleWorkflowPause("wf_p");
    expect(useAgentStore.getState().workflows["wf_p"].paused).toBe(false);
  });
});

describe("workflow seeding", () => {
  it("starts with the three seeds", () => {
    expect(Object.keys(useAgentStore.getState().workflows)).toEqual([
      "wf_seed_dr",
      "wf_seed_firmware",
      "wf_seed_report",
    ]);
  });

  it("re-seeds when the map goes empty (revoke-all), and only then", () => {
    const { revokeWorkflow, seedWorkflowsIfEmpty, saveWorkflow } = useAgentStore.getState();
    revokeWorkflow("wf_seed_dr");
    revokeWorkflow("wf_seed_firmware");
    seedWorkflowsIfEmpty();
    expect(Object.keys(useAgentStore.getState().workflows)).toEqual(["wf_seed_report"]);

    revokeWorkflow("wf_seed_report");
    expect(Object.keys(useAgentStore.getState().workflows)).toHaveLength(0);
    seedWorkflowsIfEmpty();
    expect(Object.keys(useAgentStore.getState().workflows)).toHaveLength(3);

    saveWorkflow(makeWorkflow({ id: "wf_mine" }));
    expect(Object.keys(useAgentStore.getState().workflows)).toContain("wf_mine");
  });
});

describe("chat log", () => {
  it("sendMessage is a strict no-op for whitespace", () => {
    expect(useAgentStore.getState().sendMessage("   \n  ")).toBeNull();
    expect(useAgentStore.getState().chatLog).toHaveLength(0);
  });

  it("sendMessage appends user turn + thinking placeholder; resolveThinking replaces in place", () => {
    const handle = useAgentStore.getState().sendMessage("reboot the offline miners");
    expect(handle).not.toBeNull();
    const log = useAgentStore.getState().chatLog;
    expect(log).toHaveLength(2);
    expect(log[0]).toMatchObject({ role: "user", text: "reboot the offline miners" });
    expect(log[1]).toMatchObject({ role: "agent", thinking: true });

    useAgentStore.getState().resolveThinking(handle!.turnId, handle!.epoch, { cardId: "network-offline-17" });
    const resolved = useAgentStore.getState().chatLog[1];
    expect(resolved.thinking).toBeUndefined();
    expect(resolved.cardId).toBe("network-offline-17");
    expect(useAgentStore.getState().chatLog).toHaveLength(2);
  });

  it("newChat bumps the epoch so stale resolveThinking calls are cancelled", () => {
    const handle = useAgentStore.getState().sendMessage("hello");
    useAgentStore.getState().newChat();
    expect(useAgentStore.getState().chatLog).toHaveLength(0);

    const second = useAgentStore.getState().sendMessage("firmware status");
    useAgentStore.getState().resolveThinking(handle!.turnId, handle!.epoch, { cardId: "fw-update" });
    expect(useAgentStore.getState().chatLog.some((t) => t.cardId === "fw-update")).toBe(false);

    useAgentStore.getState().resolveThinking(second!.turnId, second!.epoch, { cardId: "fw-update" });
    expect(useAgentStore.getState().chatLog[1].cardId).toBe("fw-update");
  });
});

describe("shell state", () => {
  it("section switch clears the thread; thread selection returns to chat", () => {
    useAgentStore.getState().selectThread("mining-diag");
    expect(useAgentStore.getState()).toMatchObject({ activeSection: "chat", activeThread: "mining-diag" });
    useAgentStore.getState().setActiveSection("tasks");
    expect(useAgentStore.getState()).toMatchObject({ activeSection: "tasks", activeThread: null });
  });

  it("openAgentDetail silently no-ops for ids not in AGENT_ITEMS", () => {
    useAgentStore.getState().openAgentDetail("turn-pool-rack-d");
    expect(useAgentStore.getState().detailItemId).toBeNull();
    useAgentStore.getState().openAgentDetail("fw-update");
    expect(useAgentStore.getState().detailItemId).toBe("fw-update");
    expect(getAgentItem("fw-update")).toBeDefined();
  });

  it("composer seed is consumed exactly once", () => {
    useAgentStore.getState().seedComposer("Forecast failing hardware");
    expect(useAgentStore.getState().consumeComposerSeed()).toBe("Forecast failing hardware");
    expect(useAgentStore.getState().consumeComposerSeed()).toBeNull();
  });

  it("recordActionRun accumulates persisted history; declinePromote is idempotent", () => {
    useAgentStore.getState().recordActionRun("reboot");
    useAgentStore.getState().recordActionRun("reboot");
    expect(useAgentStore.getState().actionHistory.reboot?.count).toBe(2);
    useAgentStore.getState().declinePromote("reboot");
    useAgentStore.getState().declinePromote("reboot");
    expect(useAgentStore.getState().promoteDeclined).toEqual(["reboot"]);
  });
});

describe("rehydrate", () => {
  it("re-arms the accept→complete timer for a persisted running item", async () => {
    // Accepted 1s before the reload — 3.5s of the 4.5s window remain.
    const acceptedAt = Date.now() - 1000;
    window.localStorage.setItem(
      AGENT_STORE_KEY,
      JSON.stringify({
        state: {
          itemStates: { "network-offline-17": { state: "running", acceptedAt } },
          workflows: {},
          actionHistory: {},
          navCollapsed: false,
        },
        version: 0,
      }),
    );

    await useAgentStore.persist.rehydrate();
    expect(useAgentStore.getState().itemStates["network-offline-17"].state).toBe("running");

    vi.advanceTimersByTime(ACCEPT_COMPLETE_MS - 1000 - 1);
    expect(useAgentStore.getState().itemStates["network-offline-17"].state).toBe("running");

    vi.advanceTimersByTime(1);
    const entry = useAgentStore.getState().itemStates["network-offline-17"];
    expect(entry.state).toBe("completed");
    expect(entry.completedAt).toBeTypeOf("number");
  });

  it("re-armed timer keeps the still-running guard (dismiss wins)", async () => {
    window.localStorage.setItem(
      AGENT_STORE_KEY,
      JSON.stringify({
        state: {
          itemStates: { "network-offline-17": { state: "running", acceptedAt: Date.now() } },
          workflows: {},
          actionHistory: {},
          navCollapsed: false,
        },
        version: 0,
      }),
    );

    await useAgentStore.persist.rehydrate();
    useAgentStore.getState().dismissItem("network-offline-17", "Will handle manually");
    vi.advanceTimersByTime(ACCEPT_COMPLETE_MS + 1000);
    expect(useAgentStore.getState().itemStates["network-offline-17"].state).toBe("dismissed");
  });
});

describe("persistence (partialize)", () => {
  it("writes ONLY itemStates/workflows/actionHistory/navCollapsed to the versioned key", () => {
    useAgentStore.getState().dismissItem("fw-update", "Other");
    useAgentStore.getState().setNavCollapsed(true);
    useAgentStore.getState().sendMessage("this must not persist");
    useAgentStore.getState().openAgentDetail("diag-hot-9");

    const raw = window.localStorage.getItem(AGENT_STORE_KEY);
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw!) as { state: Record<string, unknown> };
    expect(Object.keys(persisted.state).sort()).toEqual(["actionHistory", "itemStates", "navCollapsed", "workflows"]);
    expect(persisted.state.navCollapsed).toBe(true);
    expect((persisted.state.itemStates as Record<string, { state: string }>)["fw-update"].state).toBe("dismissed");
  });
});
