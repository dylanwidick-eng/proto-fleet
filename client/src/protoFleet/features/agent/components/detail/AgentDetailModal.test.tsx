import type { HTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: ({
      children,
      // strip motion-only props so they don't leak onto the DOM node
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      ...props
    }: HTMLAttributes<HTMLDivElement> & Record<"initial" | "animate" | "exit" | "transition", unknown>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

import AgentDetailModal from "@/protoFleet/features/agent/components/detail/AgentDetailModal";
import { ACCEPT_COMPLETE_MS, useAgentStore } from "@/protoFleet/features/agent/store/agentStore";

const openDetail = (id: string) => {
  useAgentStore.getState().openAgentDetail(id);
  return render(<AgentDetailModal />);
};

beforeEach(() => {
  window.localStorage.clear();
  useAgentStore.setState(useAgentStore.getInitialState(), true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AgentDetailModal", () => {
  it("renders nothing until the store routes an item to it", () => {
    render(<AgentDetailModal />);
    expect(screen.queryByTestId("agent-detail-modal")).not.toBeInTheDocument();
  });

  it("renders cat/site header, all body sections and the Net/Notes impact mapping", () => {
    openDetail("energy-power-spike");

    expect(screen.getByText("Energy")).toBeVisible();
    expect(screen.getByText("Dalton, GA")).toBeVisible();
    expect(screen.getByText("Power costs +35%")).toBeVisible();
    expect(screen.getByText("Why this fired")).toBeVisible();
    expect(screen.getByText("Proposed action")).toBeVisible();
    expect(screen.getByText("Impact")).toBeVisible();

    // dollars → "Net", extra → "Notes"
    expect(screen.getByText("Net")).toBeVisible();
    expect(screen.getByText("+$1,840 net vs continuing")).toBeVisible();
    expect(screen.getByText("Notes")).toBeVisible();
    expect(screen.getByText("Restore complete by 6:20 PM")).toBeVisible();

    // Pending: no Resolution section, no state-info line.
    expect(screen.queryByText("Resolution")).not.toBeInTheDocument();
    expect(screen.queryByTestId("agent-detail-state-text")).not.toBeInTheDocument();
  });

  it("drops falsy impact cells (network-offline-17 has no extra → no Notes)", () => {
    openDetail("network-offline-17");
    expect(screen.getByText("Net")).toBeVisible();
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });

  it("shows Automate only for items carrying a workflow definition", () => {
    const first = openDetail("energy-power-spike"); // no workflow
    expect(screen.getByTestId("agent-detail-accept")).toBeVisible();
    expect(screen.queryByTestId("agent-detail-automate")).not.toBeInTheDocument();
    first.unmount();

    openDetail("network-offline-17"); // has workflow
    expect(screen.getByTestId("agent-detail-automate")).toBeVisible();
  });

  it("Accept → running (modal closes), then completed after the guarded 4.5s store timer", () => {
    vi.useFakeTimers();
    openDetail("network-offline-17");

    fireEvent.click(screen.getByTestId("agent-detail-accept"));
    expect(useAgentStore.getState().itemStates["network-offline-17"].state).toBe("running");
    expect(useAgentStore.getState().detailItemId).toBeNull();

    vi.advanceTimersByTime(ACCEPT_COMPLETE_MS);
    expect(useAgentStore.getState().itemStates["network-offline-17"].state).toBe("completed");
    vi.runOnlyPendingTimers();
  });

  it("dismiss picker swaps in-body, Back returns, and a reason chip commits + closes", () => {
    openDetail("diag-hot-9");

    fireEvent.click(screen.getByTestId("agent-detail-dismiss"));
    expect(screen.getByText("Why are you dismissing?")).toBeVisible();
    // Actions row is swapped out while the picker is up.
    expect(screen.queryByTestId("agent-detail-accept")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "← Back" }));
    expect(screen.getByTestId("agent-detail-accept")).toBeVisible();

    fireEvent.click(screen.getByTestId("agent-detail-dismiss"));
    fireEvent.click(screen.getByRole("button", { name: "False positive" }));
    expect(useAgentStore.getState().itemStates["diag-hot-9"]).toMatchObject({
      state: "dismissed",
      dismissReason: "False positive",
    });
    expect(useAgentStore.getState().detailItemId).toBeNull();
  });

  it("snooze picker stores the exact key/label pair and closes", () => {
    openDetail("diag-hot-9");
    fireEvent.click(screen.getByTestId("agent-detail-snooze"));
    expect(screen.getByText("Snooze for how long?")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Until tomorrow" }));
    expect(useAgentStore.getState().itemStates["diag-hot-9"]).toMatchObject({
      state: "snoozed",
      snoozeKey: "tomorrow",
      snoozeLabel: "until tomorrow",
    });
    expect(useAgentStore.getState().detailItemId).toBeNull();
  });

  describe("non-pending states", () => {
    it("running: state line + Resolution copy + Close instead of actions", () => {
      useAgentStore.setState({ itemStates: { "fw-update": { state: "running", acceptedAt: Date.now() } } });
      openDetail("fw-update");

      expect(screen.getByTestId("agent-detail-state-text")).toHaveTextContent("Accepted just now. Action in progress.");
      expect(screen.getByText("Resolution")).toBeVisible();
      expect(screen.getByText("Awaiting completion confirmation from fleet.")).toBeVisible();
      expect(screen.queryByTestId("agent-detail-accept")).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId("agent-detail-close"));
      expect(useAgentStore.getState().detailItemId).toBeNull();
    });

    it("automated: names the linked workflow", () => {
      useAgentStore.setState({
        itemStates: { "diag-hot-9": { state: "automated", automatedAt: Date.now(), workflowId: "wf_x" } },
        workflows: {
          wf_x: {
            id: "wf_x",
            name: "Auto-throttle overheating miners",
            triggerType: "condition",
            whenText: "when",
            schedule: null,
            thenText: "then",
            scope: "this",
            sourceItemId: "diag-hot-9",
            site: "Building C",
            cat: "Diagnostics",
            createdAt: Date.now(),
            lastFiredAt: null,
            fireCount: 0,
            paused: false,
          },
        },
      });
      openDetail("diag-hot-9");
      expect(screen.getByTestId("agent-detail-state-text")).toHaveTextContent(
        'Handled by automation "Auto-throttle overheating miners".',
      );
      expect(screen.getByText("Future occurrences run unattended. Pause or revoke from Automations.")).toBeVisible();
    });
  });

  describe("automate editor", () => {
    it("condition trigger: prefilled fields, saved workflow matches §4.5, item round-trips to automated", () => {
      openDetail("network-offline-17");
      fireEvent.click(screen.getByTestId("agent-detail-automate"));

      expect(screen.getByText("Create automation")).toBeVisible();
      expect(screen.getByLabelText("Name")).toHaveValue("Auto-reboot offline miners");
      expect(screen.getByLabelText("When")).toHaveValue(
        "Any miner stops reporting telemetry for >30 min outside a maintenance window",
      );
      // Site "Building A, Rack 12" → scope defaults to "This site only".
      expect(screen.getByRole("button", { name: "This site only" })).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(screen.getByTestId("agent-automate-save"));

      const workflows = Object.values(useAgentStore.getState().workflows);
      const saved = workflows.find((wf) => wf.sourceItemId === "network-offline-17");
      expect(saved).toMatchObject({
        name: "Auto-reboot offline miners",
        triggerType: "condition",
        whenText: "Any miner stops reporting telemetry for >30 min outside a maintenance window",
        schedule: null,
        thenText: "Send reboot. Escalate to technician dispatch after 90s if still offline.",
        scope: "this",
        site: "Building A, Rack 12",
        cat: "Network",
        fireCount: 0,
        lastFiredAt: null,
        paused: false,
      });
      expect(saved!.id).toMatch(/^wf_/);
      expect(useAgentStore.getState().itemStates["network-offline-17"]).toMatchObject({
        state: "automated",
        workflowId: saved!.id,
      });
      expect(useAgentStore.getState().detailItemId).toBeNull();
    });

    it("schedule trigger: day chips + times prefilled; saved whenText keeps the humanizeSchedule Suns quirk", () => {
      openDetail("pattern-sunday-reboot");
      fireEvent.click(screen.getByTestId("agent-detail-automate"));

      expect(screen.getByRole("button", { name: "Sun" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "Mon" })).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByLabelText("Start")).toHaveValue("04:00");
      expect(screen.getByLabelText("End")).toHaveValue("05:00");

      fireEvent.click(screen.getByTestId("agent-automate-save"));
      const saved = Object.values(useAgentStore.getState().workflows).find(
        (wf) => wf.sourceItemId === "pattern-sunday-reboot",
      );
      expect(saved).toMatchObject({
        triggerType: "schedule",
        whenText: "Suns, 4:00 AM–5:00 AM",
        schedule: { days: ["Sun"], startTime: "04:00", endTime: "05:00" },
      });
    });

    it("controlled-input regression: type name → toggle day chip → name preserved", () => {
      openDetail("pattern-weekday-curtail");
      fireEvent.click(screen.getByTestId("agent-detail-automate"));

      const nameInput = screen.getByLabelText("Name");
      fireEvent.change(nameInput, { target: { value: "My curtail rule" } });
      fireEvent.click(screen.getByRole("button", { name: "Sat" }));

      expect(screen.getByLabelText("Name")).toHaveValue("My curtail rule");
      expect(screen.getByRole("button", { name: "Sat" })).toHaveAttribute("aria-pressed", "true");

      fireEvent.click(screen.getByTestId("agent-automate-save"));
      const saved = Object.values(useAgentStore.getState().workflows).find(
        (wf) => wf.sourceItemId === "pattern-weekday-curtail",
      );
      expect(saved!.name).toBe("My curtail rule");
      expect(saved!.schedule!.days).toContain("Sat");
    });

    it("scope defaults to All sites for all-sites items; blank name falls back to the default", () => {
      openDetail("sec-weak-pwd"); // site "All sites"
      fireEvent.click(screen.getByTestId("agent-detail-automate"));
      expect(screen.getByRole("button", { name: "All sites" })).toHaveAttribute("aria-pressed", "true");

      fireEvent.change(screen.getByLabelText("Name"), { target: { value: "   " } });
      fireEvent.click(screen.getByTestId("agent-automate-save"));
      const saved = Object.values(useAgentStore.getState().workflows).find((wf) => wf.sourceItemId === "sec-weak-pwd");
      expect(saved).toMatchObject({ name: "Auto-rotate weak passwords", scope: "all" });
    });
  });
});
