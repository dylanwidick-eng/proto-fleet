import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import TasksView from "@/protoFleet/features/agent/components/tasks/TasksView";
import { AGENT_ITEMS } from "@/protoFleet/features/agent/lib/agentItems";
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

// The label and count live in separate spans, so the computed accessible
// name has no separator (e.g. "All14").
const chipButton = (label: string): HTMLElement => screen.getByRole("button", { name: new RegExp(`^${label}\\d+$`) });

const expectChipCount = (label: string, count: number) =>
  expect(within(chipButton(label)).getByText(String(count))).toBeInTheDocument();

beforeEach(() => {
  window.localStorage.clear();
  useAgentStore.setState(useAgentStore.getInitialState(), true);
  // jsdom has no layout, so every rect is 0×0 and the shared Popover keeps
  // itself `visibility: hidden` ("trigger not in viewport"). Report a real
  // on-screen rect so the category popover positions itself and its chips
  // are visible to role queries.
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: 100,
    y: 100,
    width: 32,
    height: 32,
    top: 100,
    left: 100,
    bottom: 132,
    right: 132,
    toJSON: () => ({}),
  } as DOMRect);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TasksView", () => {
  it("renders all three buckets with counts and the seeded items pending", () => {
    render(<TasksView />);

    expect(screen.getByRole("heading", { name: "Tasks" })).toBeVisible();
    expectChipCount("All", 14);
    expectChipCount("Needs attention", 14);
    expectChipCount("Running", 0);
    expectChipCount("Recent", 0);

    for (const item of AGENT_ITEMS) {
      expect(
        within(screen.getByRole("region", { name: "Needs attention" })).getByTestId(`smart-card-tasks-${item.id}`),
      ).toBeInTheDocument();
    }
    expect(screen.getByText("No tasks running")).toBeVisible();
    expect(screen.getByText("No recent activity")).toBeVisible();
  });

  it("buckets running/completed items and a state chip narrows to that bucket only", async () => {
    const user = userEvent.setup();
    setItemStates({
      "network-offline-17": { state: "running", acceptedAt: Date.now() },
      "diag-hot-9": { state: "completed", acceptedAt: Date.now(), completedAt: Date.now() },
    });
    render(<TasksView />);

    expect(
      within(screen.getByRole("region", { name: "Running" })).getByTestId("smart-card-tasks-network-offline-17"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Recent" })).getByTestId("smart-card-tasks-diag-hot-9"),
    ).toBeInTheDocument();
    expectChipCount("All", 14);
    expectChipCount("Needs attention", 12);

    await user.click(chipButton("Running"));
    expect(screen.getByRole("region", { name: "Running" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Needs attention" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Recent" })).not.toBeInTheDocument();
  });

  it("category filtering is real: buckets and counts compute on the filtered set", async () => {
    const user = userEvent.setup();
    render(<TasksView />);

    // No selection yet — no active dot.
    expect(screen.queryByTestId("agent-tasks-filter-dot")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filter by category" }));
    const popover = screen.getByTestId("agent-tasks-cat-popover");
    // Categories derive at runtime from visible items (11 seeded cats).
    expect(within(popover).getAllByRole("button", { pressed: false })).toHaveLength(11);
    expect(within(popover).queryByTestId("agent-tasks-cat-clear")).not.toBeInTheDocument();

    await user.click(within(popover).getByRole("button", { name: "Network" }));

    // Only the two Network items remain; counts follow the filtered set.
    expectChipCount("All", 2);
    expectChipCount("Needs attention", 2);
    const needsAttention = screen.getByRole("region", { name: "Needs attention" });
    expect(within(needsAttention).getByTestId("smart-card-tasks-network-offline-17")).toBeInTheDocument();
    expect(within(needsAttention).getByTestId("smart-card-tasks-net-unstable-33")).toBeInTheDocument();
    expect(within(needsAttention).queryByTestId("smart-card-tasks-energy-power-spike")).not.toBeInTheDocument();
    expect(screen.getByTestId("agent-tasks-filter-dot")).toBeInTheDocument();

    // Multi-select adds the second category's items.
    await user.click(within(popover).getByRole("button", { name: "Diagnostics" }));
    expectChipCount("All", 4);

    // Clear resets to the full set and drops the dot.
    await user.click(within(popover).getByTestId("agent-tasks-cat-clear"));
    expectChipCount("All", 14);
    expect(screen.queryByTestId("agent-tasks-filter-dot")).not.toBeInTheDocument();
  });

  it("every category stays selectable while a filter is active", async () => {
    const user = userEvent.setup();
    render(<TasksView />);

    await user.click(screen.getByRole("button", { name: "Filter by category" }));
    const popover = screen.getByTestId("agent-tasks-cat-popover");
    await user.click(within(popover).getByRole("button", { name: "Energy" }));

    // The chip list still derives from ALL visible items, not the narrowed set.
    expect(within(popover).getAllByRole("button", { name: /^(?!Clear)/ })).toHaveLength(11);
    expect(within(popover).getByRole("button", { name: "Pools" })).toBeInTheDocument();
  });

  it("hides the funnel button and shows empty copy when no items are visible", () => {
    setItemStates(
      Object.fromEntries(
        AGENT_ITEMS.map((item) => [item.id, { state: "dismissed", dismissedAt: Date.now() } as AgentStateEntry]),
      ),
    );
    render(<TasksView />);

    expect(screen.queryByRole("button", { name: "Filter by category" })).not.toBeInTheDocument();
    expect(screen.getByText("All caught up")).toBeVisible();
    expect(screen.getByText("No tasks running")).toBeVisible();
    expect(screen.getByText("No recent activity")).toBeVisible();
    expectChipCount("All", 0);
  });
});
