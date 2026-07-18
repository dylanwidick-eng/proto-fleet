import { act, fireEvent, render, screen } from "@testing-library/react";
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
import FleetActionModal from "@/protoFleet/features/agent/components/actions/FleetActionModal";
import { TICK_MS } from "@/protoFleet/features/agent/components/actions/useFleetActionRun";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { FleetActionKey } from "@/protoFleet/features/agent/types";

const openAction = (key: FleetActionKey) => {
  act(() => {
    useAgentStore.getState().openFleetAction(key);
  });
};

const tick = (times = 1) => {
  act(() => {
    vi.advanceTimersByTime(TICK_MS * times);
  });
};

/** Run the "off" action (total 8, default batch 4) to completion with all-success randomness. */
const completeOffRun = () => {
  openAction("off");
  fireEvent.click(screen.getByText("Power off"));
  tick(6); // 2 promotions+resolutions per tick ⇒ done after 4 ticks
  fireEvent.click(screen.getByText("Done"));
};

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  useAgentStore.setState(useAgentStore.getInitialState(), true);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
});

describe("FleetActionModal — plan view", () => {
  it("renders nothing until a fleet action is opened", () => {
    render(<FleetActionModal />);
    expect(screen.queryByTestId("fleet-action-modal")).not.toBeInTheDocument();
  });

  it("renders the reboot plan: title, unformatted cohort count, chips, summary", () => {
    render(<FleetActionModal />);
    openAction("reboot");

    expect(screen.getByText("Reboot agent")).toBeInTheDocument();
    expect(screen.getByText("Targeting 247 miners")).toBeInTheDocument();
    expect(screen.getByText(/Reboot resolves this for ~92% of cases historically\./)).toBeInTheDocument();
    expect(screen.getByText(">3 miners fail to come back online in a row")).toBeInTheDocument();
    expect(screen.getByText("Run reboot")).toBeInTheDocument();
    // Defaults: batch 50, hold 1m.
    expect(screen.getByTestId("fleet-action-batch-chip-1")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("fleet-action-hold-chip-1")).toHaveAttribute("data-active", "true");
  });

  it("firmware cohort count stays unformatted (Targeting 3989 miners)", () => {
    render(<FleetActionModal />);
    openAction("firmware");
    expect(screen.getByText("Targeting 3989 miners")).toBeInTheDocument();
  });

  it("refine chips multi-select; batch chips single-select", () => {
    render(<FleetActionModal />);
    openAction("reboot");

    // Refine: independent toggles — activating one leaves others active.
    fireEvent.click(screen.getByTestId("fleet-action-refine-chip-0"));
    expect(screen.getByTestId("fleet-action-refine-chip-0")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("fleet-action-refine-chip-1")).toHaveAttribute("data-active", "true");

    // Batch: radio behavior.
    fireEvent.click(screen.getByTestId("fleet-action-batch-chip-0"));
    expect(screen.getByTestId("fleet-action-batch-chip-0")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("fleet-action-batch-chip-1")).toHaveAttribute("data-active", "false");
  });

  it("chip selections reset to config defaults on every open (deep copy)", () => {
    render(<FleetActionModal />);
    openAction("reboot");
    fireEvent.click(screen.getByTestId("fleet-action-refine-chip-0"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByTestId("fleet-action-modal")).not.toBeInTheDocument();

    openAction("reboot");
    expect(screen.getByTestId("fleet-action-refine-chip-0")).toHaveAttribute("data-active", "false");
  });
});

describe("FleetActionModal — execution", () => {
  it('"All at once" runs with batchSize = total (divergence F3)', () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<FleetActionModal />);
    openAction("reboot");

    fireEvent.click(screen.getByText("All at once"));
    fireEvent.click(screen.getByText("Run reboot"));

    expect(screen.getByText("Reboot in progress")).toBeInTheDocument();
    expect(screen.getByText("Working through 247 miners in batches of 247.")).toBeInTheDocument();
  });

  it("pause swaps to Resume; stop then Done closes with no history record", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    render(<FleetActionModal />);
    openAction("reboot");
    fireEvent.click(screen.getByText("Run reboot"));
    tick(2);

    fireEvent.click(screen.getByText("Pause"));
    expect(screen.getByText("Resume")).toBeInTheDocument();
    expect(screen.getByText("Paused — agent is holding")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Resume"));

    fireEvent.click(screen.getByText("Stop"));
    expect(screen.getByTestId("fleet-action-exec-status")).toHaveTextContent(/^Stopped/);
    expect(screen.queryByText("Pause")).not.toBeInTheDocument();

    // Done after stop: modal closes, NOTHING recorded, no receipts.
    fireEvent.click(screen.getByText("Done"));
    expect(screen.queryByTestId("fleet-action-modal")).not.toBeInTheDocument();
    expect(useAgentStore.getState().actionHistory.reboot).toBeUndefined();
  });
});

describe("FleetActionModal — results + promote", () => {
  it("completion → Done shows receipts and records the run", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1); // all succeed
    render(<FleetActionModal />);
    completeOffRun();

    expect(screen.getByText("Power-down complete")).toBeInTheDocument();
    expect(screen.getByTestId("fleet-action-outcome-headline")).toHaveTextContent("8 of 8 miners powered off");
    const receipts = screen.getByTestId("fleet-action-receipts");
    expect(receipts).toHaveTextContent("Powered off 8 of 8 targeted miners");
    expect(receipts).toHaveTextContent("Cohort: All flagged"); // count suffix stripped
    expect(receipts).toHaveTextContent("Cadence: batches of 4, holding 30s between batches");
    expect(receipts).toHaveTextContent(/Total time: \d+s/);
    expect(useAgentStore.getState().actionHistory.off?.count).toBe(1);
    // No failures ⇒ no flagged section, no Review flagged button.
    expect(screen.queryByText("Flagged for review")).not.toBeInTheDocument();
    expect(screen.queryByText("Review flagged")).not.toBeInTheDocument();
  });

  it("failures fill the flagged list with the hardcoded reboot-flavored reason", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.26); // 0.25 ≤ r < 0.27 ⇒ fail
    render(<FleetActionModal />);
    completeOffRun();

    expect(screen.getByTestId("fleet-action-outcome-meta")).toHaveTextContent("8 flagged for follow-up");
    expect(screen.getByText("Flagged for review")).toBeInTheDocument();
    expect(screen.getAllByText("didn't return after 3 attempts")).toHaveLength(8);
    expect(screen.getByText("Review flagged")).toBeInTheDocument();
    expect(screen.getByTestId("fleet-action-receipts")).toHaveTextContent(
      "8 miners flagged for review and added to your watchlist",
    );
  });

  it("promote banner: first-run copy, Save creates the workflow", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<FleetActionModal />);
    completeOffRun();

    expect(screen.getByTestId("fleet-action-promote")).toHaveTextContent(
      "If this is recurring work, I can take over this trigger going forward and only escalate the flagged outliers.",
    );
    // Rule preview renders plain ">" strings as JSX text (divergence F5).
    expect(screen.getByTestId("fleet-action-promote")).toHaveTextContent(
      "A miner is flagged as unrecoverable (sustained hashboard failures)",
    );

    fireEvent.click(screen.getByText("Save automation"));
    expect(screen.queryByTestId("fleet-action-promote")).not.toBeInTheDocument();
    const workflows = Object.values(useAgentStore.getState().workflows);
    const saved = workflows.find((w) => w.name === "Auto-power-off unrecoverable miners");
    expect(saved).toMatchObject({
      triggerType: "condition",
      whenText: "A miner is flagged as unrecoverable (sustained hashboard failures)",
      thenText: "Power off automatically and open a parts replacement ticket",
      schedule: null,
      scope: "all",
      sourceItemId: null,
      site: "all",
      cat: "Hardware",
      paused: false,
    });
  });

  it("promote copy adapts at 2 and ≥3 runs (history includes the run just recorded)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    act(() => useAgentStore.getState().recordActionRun("off"));
    render(<FleetActionModal />);
    completeOffRun();
    expect(screen.getByTestId("fleet-action-promote")).toHaveTextContent("That's the second time this week.");
    fireEvent.click(screen.getByText("Close"));

    completeOffRun();
    expect(screen.getByTestId("fleet-action-promote")).toHaveTextContent(
      "You've handled this manually 3 times in the last 30 days.",
    );
  });

  it("Not now declines per-action for the session; the next run shows no banner", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    render(<FleetActionModal />);
    completeOffRun();

    fireEvent.click(screen.getByText("Not now"));
    expect(screen.queryByTestId("fleet-action-promote")).not.toBeInTheDocument();
    expect(useAgentStore.getState().promoteDeclined).toContain("off");
    fireEvent.click(screen.getByText("Close"));

    completeOffRun();
    expect(screen.getByTestId("fleet-action-outcome-headline")).toBeInTheDocument();
    expect(screen.queryByTestId("fleet-action-promote")).not.toBeInTheDocument();
  });
});
