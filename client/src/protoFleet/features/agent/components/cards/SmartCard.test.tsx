import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The runtime's built-in localStorage stub is non-functional under vitest
// (node's `--localstorage-file` webstorage). Install the repo's Map-backed
// mock BEFORE agentStore is imported so persist middleware binds to it
// (same pattern as agentStore.test.ts).
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

import SmartCard from "@/protoFleet/features/agent/components/cards/SmartCard";
import { AGENT_ITEMS, getAgentItem } from "@/protoFleet/features/agent/lib/agentItems";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";

const item = (id: string) => {
  const found = getAgentItem(id);
  if (!found) throw new Error(`missing seed item ${id}`);
  return found;
};

beforeEach(() => {
  window.localStorage.clear();
  useAgentStore.setState(useAgentStore.getInitialState(), true);
});

describe("SmartCard", () => {
  it("renders title, sub and the action pill; cat/site never appear on the card", () => {
    render(<SmartCard item={item("network-offline-17")} context="tasks" />);

    expect(screen.getByText("17 miners offline")).toBeVisible();
    expect(screen.getByText("No auto reboot, last telemetry 3:48 AM")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reboot all" })).toBeVisible();
    expect(screen.queryByText("Network")).not.toBeInTheDocument();
    expect(screen.queryByText("Building A, Rack 12")).not.toBeInTheDocument();
  });

  it("falls back to a 'View' pill when the item has no action label", () => {
    render(<SmartCard item={{ id: "no-action", title: "Bare item" }} context="story" />);
    expect(screen.getByRole("button", { name: "View" })).toBeVisible();
  });

  it("opens the detail modal from the whole card AND from the action pill", () => {
    render(<SmartCard item={item("diag-hot-9")} context="tasks" />);

    fireEvent.click(screen.getByTestId("smart-card-tasks-diag-hot-9"));
    expect(useAgentStore.getState().detailItemId).toBe("diag-hot-9");

    useAgentStore.getState().closeAgentDetail();
    fireEvent.click(screen.getByRole("button", { name: "Throttle" }));
    expect(useAgentStore.getState().detailItemId).toBe("diag-hot-9");
  });

  it("silently no-ops for card ids not in AGENT_ITEMS (thread-turn cards)", () => {
    render(
      <SmartCard item={{ id: "turn-reboot-a7", title: "17 miners offline", action: "Reboot rack" }} context="chat-1" />,
    );
    fireEvent.click(screen.getByTestId("smart-card-chat-1-turn-reboot-a7"));
    expect(useAgentStore.getState().detailItemId).toBeNull();
  });

  it("shows a status badge only for running/completed", () => {
    const { rerender } = render(<SmartCard item={item("fw-update")} context="tasks" />);
    expect(screen.queryByText("Running")).not.toBeInTheDocument();
    expect(screen.queryByText("Completed")).not.toBeInTheDocument();

    useAgentStore.setState({ itemStates: { "fw-update": { state: "running", acceptedAt: Date.now() } } });
    rerender(<SmartCard item={item("fw-update")} context="tasks" />);
    expect(screen.getByText("Running")).toBeVisible();

    useAgentStore.setState({ itemStates: { "fw-update": { state: "completed", completedAt: Date.now() } } });
    rerender(<SmartCard item={item("fw-update")} context="tasks" />);
    expect(screen.getByText("Completed")).toBeVisible();
    expect(screen.queryByText("Running")).not.toBeInTheDocument();
  });

  describe("viz pane", () => {
    it("renders the seeded rack grid with the exact affected count, stable across mounts", () => {
      const hotPattern = () => {
        const cells = Array.from(screen.getByTestId("rack-grid-viz").children);
        return cells.map((cell) => (cell as HTMLElement).dataset.hot === "true");
      };

      const first = render(<SmartCard item={item("network-offline-17")} context="a" />);
      const cellsA = hotPattern();
      expect(cellsA).toHaveLength(25);
      expect(cellsA.filter(Boolean)).toHaveLength(17);
      first.unmount();

      render(<SmartCard item={item("network-offline-17")} context="b" />);
      expect(hotPattern()).toEqual(cellsA);
    });

    it("renders an intentionally EMPTY pane for non-calendar callouts", () => {
      render(<SmartCard item={item("energy-power-spike")} context="tasks" />);
      const pane = screen.getByTestId("smart-card-viz");
      expect(pane).toBeEmptyDOMElement();
      // The callout value only ever lives in the stat block, not the pane.
      expect(screen.getByText("Power costs +35%")).toBeVisible();
    });

    it("renders the calendar tile for calendar-pattern callouts (MAY 6)", () => {
      render(
        <SmartCard
          item={{
            id: "turn-curtail-austin",
            title: "Curtailment scheduled",
            action: "View schedule",
            viz: { type: "callout", value: "MAY 6", sub: "tomorrow" },
          }}
          context="chat-2"
        />,
      );
      const tile = screen.getByTestId("calendar-viz");
      expect(within(tile).getByText("MAY")).toBeVisible();
      expect(within(tile).getByText("6")).toBeVisible();
    });

    it("renders charts with no text elements inside the SVG", () => {
      for (const seeded of AGENT_ITEMS) {
        const { container, unmount } = render(<SmartCard item={seeded} context="sweep" />);
        expect(container.querySelectorAll("svg text")).toHaveLength(0);
        unmount();
      }
    });
  });

  it("vertical layout puts the 120px viz thumbnail on top", () => {
    render(<SmartCard item={item("diag-hot-9")} context="pageinsight-miners" layout="vertical" />);
    const card = screen.getByTestId("smart-card-pageinsight-miners-diag-hot-9");
    expect(card).toHaveClass("flex-col");
    const pane = screen.getByTestId("smart-card-viz");
    expect(pane).toHaveClass("h-[120px]");
    // Viz pane is the FIRST child in the vertical variant (spec §3.5 order:-1).
    expect(card.firstElementChild).toBe(pane);
  });
});
