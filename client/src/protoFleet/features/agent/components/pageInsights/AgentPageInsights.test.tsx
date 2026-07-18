import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import AgentPageInsights from "@/protoFleet/features/agent/components/pageInsights/AgentPageInsights";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { AgentStateEntry } from "@/protoFleet/features/agent/types";

// The runtime's built-in localStorage stub is non-functional under vitest
// (node's `--localstorage-file` webstorage). Install the repo's Map-backed
// mock BEFORE the imports above are evaluated (vi.hoisted moves it ahead of
// them) so the store's persist middleware binds to it (same pattern as
// agentStore.test.ts).
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

const setItemStates = (itemStates: Record<string, AgentStateEntry>) => {
  useAgentStore.setState({ itemStates });
};

const cardIds = (page: string): string[] =>
  within(screen.getByTestId(`agent-page-insights-${page}`))
    .getAllByTestId(new RegExp(`^smart-card-pageinsight-${page}-`))
    .map((card) => card.getAttribute("data-testid")!.replace(`smart-card-pageinsight-${page}-`, ""));

beforeEach(() => {
  window.localStorage.clear();
  useAgentStore.setState(useAgentStore.getInitialState(), true);
});

describe("AgentPageInsights — dashboard variant", () => {
  it("renders the header, the FleetSummaryCard, and the first 4 pending items of any category", () => {
    render(<AgentPageInsights page="dashboard" />);

    const module = screen.getByTestId("agent-page-insights-dashboard");
    expect(within(module).getByText("Agent insights")).toBeVisible();

    // Summary/Health tile — dashboard ("home") is its only home.
    const summary = within(module).getByTestId("fleet-summary-card");
    expect(within(summary).getByText("Summary")).toBeVisible();
    expect(within(summary).getByText("Moderate")).toBeVisible();
    expect(within(summary).getByText("89% healthy")).toBeVisible();
    expect(within(summary).getByText("1% offline")).toBeVisible();

    // null category list = any; first 4 in AGENT_ITEMS priority order.
    expect(cardIds("dashboard")).toEqual([
      "energy-power-spike",
      "network-offline-17",
      "weather-high-temp",
      "diag-hot-9",
    ]);
  });

  it("shows only PENDING items — a running item drops out and the next pending takes its slot", () => {
    setItemStates({ "energy-power-spike": { state: "running", acceptedAt: Date.now() } });
    render(<AgentPageInsights page="dashboard" />);

    expect(cardIds("dashboard")).toEqual(["network-offline-17", "weather-high-temp", "diag-hot-9", "fw-update"]);
  });

  it("the X dismisses the whole module for the session", async () => {
    const user = userEvent.setup();
    render(<AgentPageInsights page="dashboard" />);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByTestId("agent-page-insights-dashboard")).not.toBeInTheDocument();
    expect(useAgentStore.getState().insightModulesClosed).toContain("dashboard");
  });
});

describe("AgentPageInsights — miners variant", () => {
  it("honors PAGE_INSIGHT_CATS verbatim (Hardware/Pool match nothing) and omits the summary tile", () => {
    render(<AgentPageInsights page="miners" />);

    // Only Network/Diagnostics/Software match seeded data; 5 candidates
    // capped at 4 (diag-racks-hot is 5th in priority order).
    expect(cardIds("miners")).toEqual(["network-offline-17", "diag-hot-9", "fw-update", "net-unstable-33"]);
    expect(screen.queryByTestId("fleet-summary-card")).not.toBeInTheDocument();
  });

  it("is fully absent — not just empty — once all matching items leave pending", () => {
    setItemStates(
      Object.fromEntries(
        ["network-offline-17", "diag-hot-9", "fw-update", "net-unstable-33", "diag-racks-hot"].map((id) => [
          id,
          { state: "dismissed", dismissedAt: Date.now() } as AgentStateEntry,
        ]),
      ),
    );
    const { container } = render(<AgentPageInsights page="miners" />);

    expect(container).toBeEmptyDOMElement();
  });
});
