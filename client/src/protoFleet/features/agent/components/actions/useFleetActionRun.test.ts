import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEMO_ACCELERATE,
  promotionsPerTick,
  TICK_MS,
  useFleetActionRun,
} from "@/protoFleet/features/agent/components/actions/useFleetActionRun";
import { FLEET_ACTIONS } from "@/protoFleet/features/agent/lib/fleetActions";

const rebootCopy = FLEET_ACTIONS.reboot.copy;

const tick = (times = 1) => {
  act(() => {
    vi.advanceTimersByTime(TICK_MS * times);
  });
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("useFleetActionRun", () => {
  it("ships with faithful timing by default (DEMO_ACCELERATE=false)", () => {
    expect(DEMO_ACCELERATE).toBe(false);
  });

  it("promotionsPerTick: max(2, ceil(batchSize/10)); accelerated mode scales by total/batchSize", () => {
    expect(promotionsPerTick(50, 247, false)).toBe(5);
    expect(promotionsPerTick(4, 8, false)).toBe(2); // floor of 2
    expect(promotionsPerTick(250, 3989, false)).toBe(25);
    // Accelerated demo mode: 25 × ceil(3989/250) = 25 × 16 = 400/tick.
    expect(promotionsPerTick(250, 3989, true)).toBe(400);
  });

  it("promotes queued → in-flight at the capped rate, never past batchSize", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // stays in flight until forced
    const { result } = renderHook(() => useFleetActionRun());
    act(() => result.current.start({ total: 247, batchSize: 50, copy: rebootCopy }));

    expect(result.current.exec?.queued).toBe(247);
    expect(result.current.exec?.events[0].text).toBe("Started — 247 miners queued in batches of 50");

    tick();
    expect(result.current.exec?.inFlight).toBe(5); // max(2, ceil(50/10))
    tick();
    expect(result.current.exec?.inFlight).toBe(10);

    tick(20);
    expect(result.current.exec?.inFlight).toBeLessThanOrEqual(50);
  });

  it("forces resolution after 6 ticks in flight", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // 0.5 < 0.97 on force ⇒ success
    const { result } = renderHook(() => useFleetActionRun());
    act(() => result.current.start({ total: 247, batchSize: 50, copy: rebootCopy }));

    tick(5);
    expect(result.current.exec?.rebooted).toBe(0);
    tick(); // 6th tick — the first cohort of 5 hits ticksInFlight 6
    expect(result.current.exec?.rebooted).toBe(5);
    expect(result.current.exec?.events[0].text).toMatch(/back online$/);
  });

  it("runs to completion with no undefined ids beyond the prototype's 252-id pool", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1); // immediate success
    const { result } = renderHook(() => useFleetActionRun());
    act(() => result.current.start({ total: 300, batchSize: 300, copy: rebootCopy }));

    tick(15); // 30 promotions+resolutions per tick ⇒ done after 10 ticks
    const exec = result.current.exec;
    expect(exec?.done).toBe(true);
    expect(exec?.rebooted).toBe(300);
    expect(exec?.failed).toBe(0);
    expect(exec?.events[0].text).toMatch(/^Complete — 300 rebooted, 0 flagged in \d+s$/);
    expect(exec?.events.some((e) => e.text.includes("undefined"))).toBe(false);
    // Ids past the prototype's R03–R08 pool cycle into new racks (divergence F4).
    expect(exec?.events.some((e) => e.text.startsWith("M-R09-"))).toBe(true);
    expect(vi.getTimerCount()).toBe(0); // interval cleared on completion
  });

  it("pause freezes the sim but keeps the clock aging (interval stays alive)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const { result } = renderHook(() => useFleetActionRun());
    act(() => result.current.start({ total: 247, batchSize: 50, copy: rebootCopy }));
    tick(2);
    const frozen = result.current.exec;
    expect(frozen?.rebooted).toBeGreaterThan(0);

    act(() => result.current.togglePause());
    expect(result.current.exec?.paused).toBe(true);
    expect(result.current.exec?.events[0].text).toBe("Paused — agent is holding");

    const nowBefore = result.current.now;
    tick(3);
    expect(result.current.exec?.rebooted).toBe(frozen?.rebooted); // counts frozen
    expect(result.current.exec?.queued).toBe(frozen?.queued);
    expect(result.current.now).toBe(nowBefore + 3 * TICK_MS); // timestamps age live

    act(() => result.current.togglePause());
    expect(result.current.exec?.events[0].text).toBe("Resumed");
    tick();
    expect(result.current.exec?.rebooted).toBeGreaterThan(frozen?.rebooted ?? 0);
  });

  it("stop halts the run, clears the interval, and records the operator event", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const { result } = renderHook(() => useFleetActionRun());
    act(() => result.current.start({ total: 247, batchSize: 50, copy: rebootCopy }));
    tick(2);

    act(() => result.current.stop());
    const stopped = result.current.exec;
    expect(stopped?.stopped).toBe(true);
    expect(stopped?.events[0].text).toMatch(/^Stopped by operator — \d+ rebooted, \d+ not run$/);
    expect(vi.getTimerCount()).toBe(0);

    // Further pause/stop are no-ops after the run ended.
    act(() => result.current.togglePause());
    act(() => result.current.stop());
    expect(result.current.exec).toEqual(stopped);
  });

  it("clears the interval on unmount (mid-run close abandons silently)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const { result, unmount } = renderHook(() => useFleetActionRun());
    act(() => result.current.start({ total: 247, batchSize: 50, copy: rebootCopy }));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("caps the newest-first event log at 60", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const { result } = renderHook(() => useFleetActionRun());
    act(() => result.current.start({ total: 247, batchSize: 100, copy: rebootCopy }));
    tick(40);
    const exec = result.current.exec;
    expect(exec?.done).toBe(true);
    expect(exec?.events.length).toBeLessThanOrEqual(60);
    expect(exec?.events[0].text.startsWith("Complete —")).toBe(true);
  });
});
