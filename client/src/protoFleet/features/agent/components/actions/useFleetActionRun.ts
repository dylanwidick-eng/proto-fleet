import { useCallback, useEffect, useRef, useState } from "react";
import { minerIdPool } from "@/protoFleet/features/agent/lib/minerIds";
import type { FleetActionCopy, FleetExecEvent, FleetExecState } from "@/protoFleet/features/agent/types";

/**
 * DEV-ONLY demo pacing constant (PORT_PLAN.md §3.5 graft). Faithful timing is
 * the default: a firmware run (3,989 miners, batches of 250) takes many
 * minutes at 600ms ticks, exactly like the prototype. Flip to `true` IN CODE
 * to scale promotions-per-tick by `total/batchSize` so firmware completes in
 * under a minute for demos. Never wired to UI or env.
 */
export const DEMO_ACCELERATE = false;

/** Simulation cadence (proto-action-modals.md §5.1). */
export const TICK_MS = 600;

/** Events are newest-first, capped at 60 (proto-action-modals.md §5.1). */
const EVENT_CAP = 60;

/** Forced resolution after this many ticks in flight (§5.2). */
const FORCE_TICKS = 6;

/**
 * Queued → in-flight promotions per tick: `max(2, ceil(batchSize/10))`,
 * scaled by `total/batchSize` only in accelerated demo mode.
 */
export const promotionsPerTick = (batchSize: number, total: number, accelerate: boolean): number => {
  const base = Math.max(2, Math.ceil(batchSize / 10));
  return accelerate ? base * Math.max(1, Math.ceil(total / batchSize)) : base;
};

const pushEvent = (events: FleetExecEvent[], tone: FleetExecEvent["tone"], text: string): FleetExecEvent[] =>
  [{ tone, text, t: Date.now() }, ...events].slice(0, EVENT_CAP);

/** One 600ms simulation step (proto-action-modals.md §5.2). Pure aside from `Math.random`/`Date.now`. */
const advanceTick = (prev: FleetExecState, copy: FleetActionCopy, accelerate: boolean): FleetExecState => {
  const next: FleetExecState = {
    ...prev,
    events: prev.events,
    flaggedIds: [...prev.flaggedIds],
    pendingIds: [...prev.pendingIds],
    inFlightIds: prev.inFlightIds.map((m) => ({ ...m })),
  };

  // 1) Promote queued → in-flight, gated so the queue movement reads visibly.
  const promoteCap = promotionsPerTick(next.batchSize, next.total, accelerate);
  let promoted = 0;
  while (next.inFlight < next.batchSize && next.queued > 0 && promoted < promoteCap) {
    const id = next.pendingIds.shift();
    if (id === undefined) break;
    next.inFlightIds.push({ id, ticksInFlight: 0 });
    next.queued -= 1;
    next.inFlight += 1;
    promoted += 1;
  }

  // 2) Resolve in-flight miners: ~25% success, ~2% fail per tick; forced
  //    resolution after 6 ticks (~97% success / 3% fail on force).
  const stillInFlight: FleetExecState["inFlightIds"] = [];
  for (const m of next.inFlightIds) {
    m.ticksInFlight += 1;
    const r = Math.random();
    const force = m.ticksInFlight >= FORCE_TICKS;
    if (r < 0.25 || (force && r < 0.97)) {
      next.rebooted += 1;
      next.inFlight -= 1;
      next.events = pushEvent(next.events, "rebooted", `${m.id} ${copy.successText}`);
    } else if (r < 0.27 || force) {
      next.failed += 1;
      next.inFlight -= 1;
      next.flaggedIds.push(m.id);
      next.events = pushEvent(next.events, "failed", `${m.id} ${copy.failureText}`);
    } else {
      stillInFlight.push(m);
    }
  }
  next.inFlightIds = stillInFlight;

  // 3) Completion.
  if (next.queued === 0 && next.inFlight === 0) {
    next.done = true;
    const elapsed = Math.round((Date.now() - next.startedAt) / 1000);
    next.events = pushEvent(
      next.events,
      "info",
      `Complete — ${next.rebooted} ${copy.pastTense}, ${next.failed} flagged in ${elapsed}s`,
    );
  }

  return next;
};

export interface FleetActionRunStartArgs {
  total: number;
  batchSize: number;
  copy: FleetActionCopy;
}

export interface FleetActionRun {
  /** Live simulation state; `null` until `start` is called. */
  exec: FleetExecState | null;
  /**
   * Epoch-ms clock bumped every tick — INCLUDING while paused, so activity
   * timestamps keep aging during pause (faithful, proto-action-modals.md §7).
   */
  now: number;
  start: (args: FleetActionRunStartArgs) => void;
  /** No-op once done/stopped. Pause leaves the interval alive (ticks early-return). */
  togglePause: () => void;
  /** Stop clears the interval and records NOTHING — history is the completion path's. */
  stop: () => void;
}

/**
 * Owns the 600ms fleet-action simulation interval (PORT_PLAN.md §3.5). The
 * interval is cleared on completion, on `stop`, and on unmount — closing the
 * modal mid-run unmounts the host and silently abandons the run (faithful).
 */
export const useFleetActionRun = (): FleetActionRun => {
  const [exec, setExec] = useState<FleetExecState | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const execRef = useRef<FleetExecState | null>(null);
  const copyRef = useRef<FleetActionCopy | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => clearTick, [clearTick]);

  const commit = useCallback((state: FleetExecState) => {
    execRef.current = state;
    setExec(state);
  }, []);

  const tick = useCallback(() => {
    // Ages the relative event timestamps every tick, even while paused.
    setNow(Date.now());
    const current = execRef.current;
    const copy = copyRef.current;
    if (!current || !copy || current.paused || current.done || current.stopped) return;
    const next = advanceTick(current, copy, DEMO_ACCELERATE);
    if (next.done) clearTick();
    commit(next);
  }, [clearTick, commit]);

  const start = useCallback(
    ({ total, batchSize, copy }: FleetActionRunStartArgs) => {
      copyRef.current = copy;
      commit({
        total,
        batchSize,
        queued: total,
        inFlight: 0,
        rebooted: 0,
        failed: 0,
        events: pushEvent([], "info", `Started — ${total} miners queued in batches of ${batchSize}`),
        flaggedIds: [],
        pendingIds: minerIdPool(total),
        inFlightIds: [],
        paused: false,
        done: false,
        stopped: false,
        startedAt: Date.now(),
      });
      setNow(Date.now());
      clearTick();
      intervalRef.current = setInterval(tick, TICK_MS);
    },
    [clearTick, commit, tick],
  );

  const togglePause = useCallback(() => {
    const current = execRef.current;
    if (!current || current.done || current.stopped) return;
    const paused = !current.paused;
    commit({
      ...current,
      paused,
      events: pushEvent(current.events, "info", paused ? "Paused — agent is holding" : "Resumed"),
    });
  }, [commit]);

  const stop = useCallback(() => {
    const current = execRef.current;
    const copy = copyRef.current;
    if (!current || !copy || current.done || current.stopped) return;
    clearTick();
    commit({
      ...current,
      stopped: true,
      events: pushEvent(
        current.events,
        "info",
        `Stopped by operator — ${current.rebooted} ${copy.pastTense}, ${current.queued + current.inFlight} not run`,
      ),
    });
  }, [clearTick, commit]);

  return { exec, now, start, togglePause, stop };
};
