import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

// Map-backed localStorage mock, installed BEFORE agentStore is imported so
// the persist middleware binds to it (same pattern as agentStore.test.ts).
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
import Composer from "@/protoFleet/features/agent/components/chat/Composer";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";

const chatLog = () => useAgentStore.getState().chatLog;

const getInput = () => screen.getByTestId<HTMLTextAreaElement>("agent-composer-input");

beforeEach(() => {
  window.localStorage.clear();
  useAgentStore.setState(useAgentStore.getInitialState(), true);
});

describe("Composer", () => {
  it("Send pushes the user turn + thinking placeholder and clears the textarea immediately", async () => {
    const user = userEvent.setup();
    render(<Composer />);

    await user.type(getInput(), "reboot rack 12");
    await user.click(screen.getByTestId("agent-composer-send"));

    expect(chatLog()).toHaveLength(2);
    expect(chatLog()[0]).toMatchObject({ role: "user", text: "reboot rack 12" });
    expect(chatLog()[1]).toMatchObject({ role: "agent", thinking: true });
    expect(getInput().value).toBe("");
  });

  it("empty/whitespace Send is a strict no-op and does NOT clear the input", async () => {
    const user = userEvent.setup();
    render(<Composer />);

    await user.click(screen.getByTestId("agent-composer-send"));
    expect(chatLog()).toHaveLength(0);

    await user.type(getInput(), "   ");
    await user.click(screen.getByTestId("agent-composer-send"));
    expect(chatLog()).toHaveLength(0);
    expect(getInput().value).toBe("   ");
  });

  it("Enter inserts a newline — there is no Enter-to-send", async () => {
    const user = userEvent.setup();
    render(<Composer />);

    await user.type(getInput(), "hello{Enter}world");

    expect(chatLog()).toHaveLength(0);
    expect(getInput().value).toBe("hello\nworld");
  });

  it("suggestion chips seed + focus the input; they never auto-send", async () => {
    const user = userEvent.setup();
    render(<Composer />);

    await user.click(screen.getByRole("button", { name: "Generate P&L report" }));

    expect(getInput().value).toBe("Generate P&L report");
    expect(getInput()).toHaveFocus();
    expect(chatLog()).toHaveLength(0);
  });

  it("renders the sparkle icon plus all six chips", () => {
    render(<Composer />);

    for (const chip of [
      "Forecast failing hardware",
      "Recommend repairs",
      "Help schedule downtime",
      "Tune for optimal energy spend",
      "Compare site performance",
      "Generate P&L report",
    ]) {
      expect(screen.getByRole("button", { name: chip })).toBeInTheDocument();
    }
  });

  it("consumes a pendingComposerSeed on mount: seeds + focuses, and clears the seed", () => {
    useAgentStore.getState().seedComposer("Reboot miners in Rack 12");
    render(<Composer />);

    expect(getInput().value).toBe("Reboot miners in Rack 12");
    expect(getInput()).toHaveFocus();
    expect(useAgentStore.getState().pendingComposerSeed).toBeNull();
    expect(chatLog()).toHaveLength(0); // seeded, not sent
  });
});
