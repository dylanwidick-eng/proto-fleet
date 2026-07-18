import type { HTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pushToastMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/features/toaster", () => ({
  pushToast: pushToastMock,
  STATUSES: { queued: "queued", loading: "loading", success: "success", error: "error" },
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

// The runtime's built-in localStorage stub is non-functional under vitest;
// install the Map-backed mock BEFORE agentStore is imported so the persist
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
import AutomationCard from "@/protoFleet/features/agent/components/automations/AutomationCard";
import NewAutomationModal from "@/protoFleet/features/agent/components/automations/NewAutomationModal";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { Workflow } from "@/protoFleet/features/agent/types";

const makeWorkflow = (overrides: Partial<Workflow> = {}): Workflow => ({
  id: "wf_test",
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

// Always active regardless of wall-clock: every day, open-ended from midnight.
const ALWAYS_ACTIVE_SCHEDULE: Workflow["schedule"] = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  startTime: "00:00",
};

beforeEach(() => {
  window.localStorage.clear();
  useAgentStore.setState(useAgentStore.getInitialState(), true);
  pushToastMock.mockClear();
});

describe("AutomationCard", () => {
  it("renders When/Then, scope and fired meta", () => {
    render(
      <AutomationCard
        workflow={makeWorkflow({ whenText: "Mon–Fri, 2:00–5:00 PM", thenText: "Curtail R03–R10 to 60 kW" })}
      />,
    );

    expect(screen.getByText("Mon–Fri, 2:00–5:00 PM")).toBeInTheDocument();
    expect(screen.getByText("Curtail R03–R10 to 60 kW")).toBeInTheDocument();
    expect(screen.getByText("All sites")).toBeInTheDocument();
    expect(screen.getByText("Fired 0× · last never")).toBeInTheDocument();
  });

  it("shows the pulsing 'Active now' badge only for unpaused schedules inside their window", () => {
    const { rerender } = render(
      <AutomationCard workflow={makeWorkflow({ triggerType: "schedule", schedule: ALWAYS_ACTIVE_SCHEDULE })} />,
    );
    expect(screen.getByText("Active now")).toBeInTheDocument();

    rerender(
      <AutomationCard
        workflow={makeWorkflow({ triggerType: "schedule", schedule: ALWAYS_ACTIVE_SCHEDULE, paused: true })}
      />,
    );
    expect(screen.queryByText("Active now")).not.toBeInTheDocument();

    rerender(<AutomationCard workflow={makeWorkflow()} />);
    expect(screen.queryByText("Active now")).not.toBeInTheDocument();
  });

  it("dims paused cards (opacity-55) and flips the Pause label to Resume", () => {
    render(<AutomationCard workflow={makeWorkflow({ paused: true })} />);

    expect(screen.getByTestId("automation-card-wf_test")).toHaveClass("opacity-55");
    expect(screen.getByTestId("automation-card-wf_test")).toHaveAttribute("data-paused", "true");
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
  });

  it("Pause/Resume dispatch the store toggle with the exact toast copy", () => {
    const seed = useAgentStore.getState().workflows["wf_seed_dr"];
    render(<AutomationCard workflow={seed} />);

    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(useAgentStore.getState().workflows["wf_seed_dr"].paused).toBe(true);
    expect(pushToastMock).toHaveBeenCalledWith({ message: "Paused: ERCOT DR curtailment", status: "success" });

    render(<AutomationCard workflow={useAgentStore.getState().workflows["wf_seed_dr"]} />);
    fireEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(useAgentStore.getState().workflows["wf_seed_dr"].paused).toBe(false);
    expect(pushToastMock).toHaveBeenCalledWith({ message: "Resumed: ERCOT DR curtailment", status: "success" });
  });

  it("Revoke deletes the workflow and round-trips the source item back to pending", () => {
    const wf = makeWorkflow({ id: "wf_rt", name: "Auto-reboot offline miners", sourceItemId: "network-offline-17" });
    useAgentStore.getState().automateItem("network-offline-17", wf);
    expect(useAgentStore.getState().itemStates["network-offline-17"].state).toBe("automated");
    pushToastMock.mockClear();

    render(<AutomationCard workflow={wf} />);
    fireEvent.click(screen.getByRole("button", { name: "Revoke" }));

    expect(useAgentStore.getState().workflows["wf_rt"]).toBeUndefined();
    // Entry removed entirely → default pending → the card re-surfaces.
    expect(useAgentStore.getState().itemStates["network-offline-17"]).toBeUndefined();
    expect(pushToastMock).toHaveBeenCalledWith({ message: "Revoked: Auto-reboot offline miners", status: "success" });
  });
});

// NewAutomationModal specs live here because P5's owned file list has exactly
// two test files (PORT_PLAN.md §8 P5) — this is the sanctioned home for the
// named controlled-inputs regression test.
describe("NewAutomationModal", () => {
  const clickSave = () => fireEvent.click(screen.getAllByRole("button", { name: "Save automation" })[0]);

  it("type name → toggle day chip → name preserved (controlled-inputs regression, divergence F2)", () => {
    render(<NewAutomationModal open onDismiss={vi.fn()} />);

    const name = screen.getByPlaceholderText("e.g. Off-peak firmware updates");
    fireEvent.change(name, { target: { value: "Night shift reboots" } });
    fireEvent.click(screen.getByRole("button", { name: "Sat" }));

    expect(name).toHaveValue("Night shift reboots");
    expect(screen.getByRole("button", { name: "Sat" })).toHaveAttribute("data-active", "true");
  });

  it("validates name then then, without dismissing (header Save has dismissModalOnClick: false)", () => {
    const onDismiss = vi.fn();
    render(<NewAutomationModal open onDismiss={onDismiss} />);

    clickSave();
    expect(pushToastMock).toHaveBeenCalledWith({ message: "Add a name for this automation", status: "error" });
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText("e.g. Off-peak firmware updates"), {
      target: { value: "Named" },
    });
    clickSave();
    expect(pushToastMock).toHaveBeenCalledWith({ message: "Describe what should happen", status: "error" });
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("saves a schedule workflow with humanized whenText and the fixed defaults", () => {
    const onDismiss = vi.fn();
    render(<NewAutomationModal open onDismiss={onDismiss} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Off-peak firmware updates"), {
      target: { value: "Afternoon curtail" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. Reboot in batches of 50, hold 1m between batches"), {
      target: { value: "Curtail bottom-100 miners" },
    });
    clickSave();

    const saved = Object.values(useAgentStore.getState().workflows).find((wf) => wf.name === "Afternoon curtail");
    expect(saved).toMatchObject({
      triggerType: "schedule",
      whenText: "Mon–Fri, 2:00 PM–5:00 PM",
      schedule: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "14:00", endTime: "17:00" },
      thenText: "Curtail bottom-100 miners",
      scope: "all",
      sourceItemId: null,
      site: "all",
      cat: "Settings",
      paused: false,
    });
    expect(onDismiss).toHaveBeenCalled();
  });

  it("saves a condition workflow, defaulting an empty When to 'Custom condition'", () => {
    const onDismiss = vi.fn();
    render(<NewAutomationModal open onDismiss={onDismiss} />);

    // SegmentedControl segments select on mouse-down.
    fireEvent.mouseDown(screen.getByRole("button", { name: "Condition" }));
    expect(screen.getByPlaceholderText("e.g. Miners are in pool-warning for >2h")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("e.g. Off-peak firmware updates"), {
      target: { value: "Pool watchdog" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. Reboot in batches of 50, hold 1m between batches"), {
      target: { value: "Reboot in batches of 50" },
    });
    clickSave();

    const saved = Object.values(useAgentStore.getState().workflows).find((wf) => wf.name === "Pool watchdog");
    expect(saved).toMatchObject({ triggerType: "condition", whenText: "Custom condition", schedule: null });
    expect(onDismiss).toHaveBeenCalled();
  });
});
