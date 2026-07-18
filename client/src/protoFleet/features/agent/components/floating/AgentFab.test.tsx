import { MemoryRouter } from "react-router-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Map-backed localStorage BEFORE agentStore import (persist middleware).
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
import AgentFloating from "@/protoFleet/features/agent/components/floating/AgentFloating";
import { AGENT_ITEMS } from "@/protoFleet/features/agent/lib/agentItems";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { AgentStateEntry } from "@/protoFleet/features/agent/types";

const renderFloating = (initialPath = "/dashboard") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AgentFloating />
    </MemoryRouter>,
  );

/** Leave `pendingCount` items pending; dismiss the rest. */
const leavePending = (pendingCount: number) => {
  const itemStates: Record<string, AgentStateEntry> = {};
  AGENT_ITEMS.slice(pendingCount).forEach((item) => {
    itemStates[item.id] = { state: "dismissed", dismissedAt: Date.now() };
  });
  act(() => {
    useAgentStore.setState({ itemStates });
  });
};

beforeEach(() => {
  window.localStorage.clear();
  useAgentStore.setState(useAgentStore.getInitialState(), true);
});

describe("AgentFloating — tile ↔ FAB", () => {
  it("shows the tile by default per session (not the FAB)", () => {
    renderFloating();
    expect(screen.getByTestId("fleet-bot-tile")).toBeInTheDocument();
    expect(screen.queryByTestId("agent-fab")).not.toBeInTheDocument();
  });

  it("tile X → FAB (and closes any open agent-detail modal); FAB → tile", () => {
    renderFloating();
    act(() => useAgentStore.getState().openAgentDetail(AGENT_ITEMS[0].id));

    fireEvent.click(screen.getByLabelText("Close"));
    expect(screen.queryByTestId("fleet-bot-tile")).not.toBeInTheDocument();
    expect(screen.getByTestId("agent-fab")).toBeInTheDocument();
    expect(useAgentStore.getState().detailItemId).toBeNull();

    fireEvent.click(screen.getByTestId("agent-fab"));
    expect(screen.getByTestId("fleet-bot-tile")).toBeInTheDocument();
  });

  it("is hidden entirely while pathname starts with /agent, and sets tileOpen=false", () => {
    renderFloating("/agent");
    expect(screen.queryByTestId("agent-floating")).not.toBeInTheDocument();
    // Leaving /agent must reveal the FAB, not the tile.
    expect(useAgentStore.getState().tileOpen).toBe(false);
  });

  it.each(["/auth", "/welcome"])("is hidden on the unauthenticated %s route", (path) => {
    renderFloating(path);
    expect(screen.queryByTestId("agent-floating")).not.toBeInTheDocument();
    // Unlike /agent, auth routes must not consume the session's default-open tile.
    expect(useAgentStore.getState().tileOpen).toBe(true);
  });
});

describe("AgentFab — pending dot", () => {
  beforeEach(() => {
    act(() => useAgentStore.getState().setTileOpen(false));
  });

  it("caps the derived visible-pending count at 9+", () => {
    renderFloating();
    // All 14 seed items are pending by default.
    expect(screen.getByTestId("agent-fab-dot")).toHaveTextContent("9+");
  });

  it("shows the exact count at ≤9 and reacts to state changes", () => {
    renderFloating();
    leavePending(3);
    expect(screen.getByTestId("agent-fab-dot")).toHaveTextContent("3");

    // Accepting one (pending → running) drops the derived count — never stale.
    act(() => useAgentStore.getState().acceptItem(AGENT_ITEMS[0].id));
    expect(screen.getByTestId("agent-fab-dot")).toHaveTextContent("2");
  });

  it("removes the dot at zero pending", () => {
    renderFloating();
    leavePending(0);
    expect(screen.getByTestId("agent-fab")).toBeInTheDocument();
    expect(screen.queryByTestId("agent-fab-dot")).not.toBeInTheDocument();
  });
});

describe("FleetBotTile — buckets, View all, Ask input", () => {
  it("bucket rows expand in place with back link and empty copy", () => {
    renderFloating();
    leavePending(0); // nothing pending
    fireEvent.click(screen.getByTestId("tile-bucket-pending"));
    expect(screen.getByText("All caught up")).toBeInTheDocument();
    expect(screen.getAllByText("Need attention").length).toBeGreaterThan(0); // header title swaps

    fireEvent.click(screen.getByText("All tasks"));
    expect(screen.getByTestId("tile-bucket-running")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("tile-bucket-running"));
    expect(screen.getByText("No tasks running")).toBeInTheDocument();
    fireEvent.click(screen.getByText("All tasks"));
    fireEvent.click(screen.getByTestId("tile-bucket-completed"));
    expect(screen.getByText("No recent activity")).toBeInTheDocument();
  });

  it("expanded rows open the agent detail via the store", () => {
    renderFloating();
    fireEvent.click(screen.getByTestId("tile-bucket-pending"));
    fireEvent.click(screen.getByText(AGENT_ITEMS[0].title));
    expect(useAgentStore.getState().detailItemId).toBe(AGENT_ITEMS[0].id);
  });

  it("View all navigates to /agent, which hides the floating layer", () => {
    renderFloating();
    fireEvent.click(screen.getByText("View all"));
    expect(screen.queryByTestId("agent-floating")).not.toBeInTheDocument();
    expect(useAgentStore.getState().tileOpen).toBe(false);
  });

  it("Ask input seeds pendingComposerSeed and navigates; whitespace is a no-op", () => {
    renderFloating();
    const input = screen.getByTestId("fleet-bot-ask-input");

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(useAgentStore.getState().pendingComposerSeed).toBeNull();
    expect(screen.getByTestId("fleet-bot-tile")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "why are miners offline?" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(useAgentStore.getState().pendingComposerSeed).toBe("why are miners offline?");
    expect(screen.queryByTestId("agent-floating")).not.toBeInTheDocument();
  });

  it("lists seed automations with Pause/Resume round-trip", () => {
    renderFloating();
    const seed = Object.values(useAgentStore.getState().workflows)[0];
    expect(screen.getByTestId(`tile-automation-${seed.id}`)).toHaveTextContent(seed.name);

    fireEvent.click(screen.getAllByText("Pause")[0]);
    expect(useAgentStore.getState().workflows[seed.id].paused).toBe(true);
    expect(screen.getByText("Paused")).toBeInTheDocument(); // paused subgroup appears

    fireEvent.click(screen.getByText("Resume"));
    expect(useAgentStore.getState().workflows[seed.id].paused).toBe(false);
  });
});
