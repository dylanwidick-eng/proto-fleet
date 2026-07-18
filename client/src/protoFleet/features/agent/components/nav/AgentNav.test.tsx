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
import AgentNav from "@/protoFleet/features/agent/components/nav/AgentNav";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";

beforeEach(() => {
  window.localStorage.clear();
  useAgentStore.setState(useAgentStore.getInitialState(), true);
});

describe("AgentNav", () => {
  it("renders the 4 top rows and the 6 chat-history threads (disclosure open by default)", () => {
    render(<AgentNav />);

    for (const label of ["New chat", "Insights", "Automations", "Tasks"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText("Chat history")).toBeInTheDocument();
    for (const thread of [
      "Bitcoin mining diagnostic",
      "Reboot miners R01",
      "Update firmware version",
      "Track pool perf...",
      "Generate P&L report",
      "Monitor temperature fluctu...",
    ]) {
      expect(screen.getByText(thread)).toBeInTheDocument();
    }
  });

  it("highlights NO row on the default landing (active section is chat, which has no row)", () => {
    render(<AgentNav />);
    expect(document.querySelector("[aria-current]")).toBeNull();
  });

  it("section rows switch the active section and take the highlight; New chat never does", async () => {
    const user = userEvent.setup();
    render(<AgentNav />);

    await user.click(screen.getByRole("button", { name: "Tasks" }));
    expect(useAgentStore.getState().activeSection).toBe("tasks");
    expect(screen.getByRole("button", { name: "Tasks" })).toHaveAttribute("aria-current", "true");

    await user.click(screen.getByRole("button", { name: "New chat" }));
    expect(useAgentStore.getState().activeSection).toBe("chat");
    expect(screen.getByRole("button", { name: "New chat" })).not.toHaveAttribute("aria-current");
    expect(document.querySelector("[aria-current]")).toBeNull();
  });

  it("thread rows select the thread (section → chat) and highlight", async () => {
    const user = userEvent.setup();
    render(<AgentNav />);

    await user.click(screen.getByRole("button", { name: "Tasks" }));
    await user.click(screen.getByRole("button", { name: /Reboot miners R01/ }));

    expect(useAgentStore.getState().activeSection).toBe("chat");
    expect(useAgentStore.getState().activeThread).toBe("reboot-r01");
    expect(screen.getByRole("button", { name: /Reboot miners R01/ })).toHaveAttribute("aria-current", "true");
  });

  it("New chat clears the chat log and active thread", async () => {
    const user = userEvent.setup();
    useAgentStore.getState().selectThread("fw-update");
    useAgentStore.getState().sendMessage("hello");
    render(<AgentNav />);

    await user.click(screen.getByRole("button", { name: "New chat" }));

    expect(useAgentStore.getState().chatLog).toHaveLength(0);
    expect(useAgentStore.getState().activeThread).toBeNull();
    expect(useAgentStore.getState().activeSection).toBe("chat");
  });

  it("the Chat history header toggles the thread disclosure (session-only)", async () => {
    const user = userEvent.setup();
    render(<AgentNav />);

    await user.click(screen.getByText("Chat history"));
    expect(screen.queryByText("Bitcoin mining diagnostic")).not.toBeInTheDocument();

    await user.click(screen.getByText("Chat history"));
    expect(screen.getByText("Bitcoin mining diagnostic")).toBeInTheDocument();
  });

  it("collapse inverts icons/labels: expanded = labels only, collapsed = icons only + no history", async () => {
    const user = userEvent.setup();
    render(<AgentNav />);

    // Expanded: top-stack icons hidden, labels visible.
    expect(screen.queryByTestId("agent-nav-icon-tasks")).not.toBeInTheDocument();
    expect(screen.getByText("Tasks")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse navigation" }));
    expect(useAgentStore.getState().navCollapsed).toBe(true);

    // Collapsed: icons only, no labels/times, the whole history block gone.
    expect(screen.getByTestId("agent-nav-icon-tasks")).toBeInTheDocument();
    expect(screen.queryByText("Tasks")).not.toBeInTheDocument();
    expect(screen.queryByText("Chat history")).not.toBeInTheDocument();
    expect(screen.queryByText("Bitcoin mining diagnostic")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand navigation" }));
    expect(useAgentStore.getState().navCollapsed).toBe(false);
    expect(screen.getByText("Tasks")).toBeInTheDocument();
  });
});
