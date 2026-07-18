import { describe, expect, it, vi } from "vitest";

// Map-backed localStorage mock installed BEFORE agentStore's persist
// middleware binds (same pattern as agentStore.test.ts).
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
import { installAgentDevReset } from "@/protoFleet/features/agent/store/devReset";

describe("installAgentDevReset", () => {
  it("installs window.__agentReset in dev builds (wired from the AgentPage module)", () => {
    delete window.__agentReset;
    installAgentDevReset();
    // vitest runs with import.meta.env.DEV === true, so the QA escape hatch
    // (PORT_PLAN.md risk #12) must be present.
    expect(window.__agentReset).toBeTypeOf("function");
  });
});
