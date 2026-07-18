import { motion } from "motion/react";
import clsx from "clsx";
import type { FleetExecEventTone, FleetExecState } from "@/protoFleet/features/agent/types";

const CheckGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// (The prototype also shipped a filled-dot glyph for an "in-flight" event
// tone, but the sim never emits one — the contract's tones are info /
// rebooted / failed only, so it is intentionally not ported.)

const XGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const InfoGlyph = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const EVENT_ICONS: Record<FleetExecEventTone, () => ReturnType<typeof CheckGlyph>> = {
  rebooted: CheckGlyph,
  failed: XGlyph,
  info: InfoGlyph,
};

const EVENT_ICON_COLORS: Record<FleetExecEventTone, string> = {
  rebooted: "text-intent-success-fill",
  failed: "text-intent-critical-fill",
  info: "text-text-primary-50",
};

const SEGMENT_COLORS = {
  rebooted: "bg-intent-success-fill",
  "in-flight": "bg-intent-warning-fill",
  failed: "bg-intent-critical-fill",
  queued: "bg-transparent",
} as const;

const DOT_COLORS = {
  rebooted: "bg-intent-success-fill",
  "in-flight": "bg-intent-warning-fill",
  failed: "bg-intent-critical-fill",
  queued: "bg-surface-20",
} as const;

interface ExecutionViewProps {
  exec: FleetExecState;
  /** Tick-driven clock from `useFleetActionRun` — event times age live, even while paused. */
  now: number;
  pastTense: string;
}

/**
 * Fleet-action execution view (proto-action-modals.md §5.3): pulse header,
 * stacked progress bar, tally, and the newest-first activity log.
 */
const ExecutionView = ({ exec, now, pastTense }: ExecutionViewProps) => {
  const lead = exec.stopped ? "Stopped" : exec.done ? "All done" : exec.paused ? "Paused" : "Running";
  const running = !exec.stopped && !exec.done && !exec.paused;

  const segments = [
    { tone: "rebooted", count: exec.rebooted },
    { tone: "in-flight", count: exec.inFlight },
    { tone: "failed", count: exec.failed },
    { tone: "queued", count: exec.queued },
  ] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2.5 rounded-xl bg-surface-5 px-4 py-3.5">
        <motion.span
          data-testid="fleet-action-exec-pulse"
          data-state={exec.stopped ? "stopped" : exec.done ? "done" : exec.paused ? "paused" : "running"}
          className={clsx(
            "h-2.5 w-2.5 shrink-0 rounded-full",
            exec.stopped
              ? "bg-intent-critical-fill"
              : exec.done
                ? "bg-intent-success-fill"
                : exec.paused
                  ? "bg-core-primary-50"
                  : "bg-core-primary-fill",
          )}
          animate={running ? { opacity: [1, 0.35, 1], scale: [1, 0.7, 1] } : { opacity: 1, scale: 1 }}
          transition={running ? { duration: 1.4, ease: "easeInOut", repeat: Infinity } : { duration: 0 }}
        />
        <div className="text-emphasis-300 text-text-primary" data-testid="fleet-action-exec-status">
          {lead}
          <span className="ml-1.5 font-normal text-text-primary-50">
            {exec.rebooted} of {exec.total} {pastTense}
            {exec.failed > 0 ? ` • ${exec.failed} flagged` : ""}
          </span>
        </div>
      </div>

      <div className="flex h-2 overflow-hidden rounded-full bg-surface-5" data-testid="fleet-action-progress">
        {segments
          .filter((s) => s.count > 0)
          .map((s) => (
            <div
              key={s.tone}
              data-tone={s.tone}
              className={clsx("min-w-0 basis-0 transition-[flex-grow] duration-300 ease-out", SEGMENT_COLORS[s.tone])}
              style={{ flexGrow: s.count }}
            />
          ))}
      </div>

      <div className="flex flex-wrap gap-[18px]" data-testid="fleet-action-tally">
        {(
          [
            { tone: "rebooted", label: pastTense, count: exec.rebooted },
            { tone: "in-flight", label: "in flight", count: exec.inFlight },
            { tone: "failed", label: "flagged", count: exec.failed },
            { tone: "queued", label: "queued", count: exec.queued },
          ] as const
        ).map((item) => (
          <span key={item.tone} className="inline-flex items-center gap-1.5 text-200">
            <span className={clsx("h-2 w-2 rounded-full", DOT_COLORS[item.tone])} />
            <strong className="font-medium text-text-primary">{item.count}</strong>
            <span className="text-text-primary-50">{item.label}</span>
          </span>
        ))}
      </div>

      <section className="flex flex-col gap-2">
        <div className="text-heading-50 tracking-wide text-text-primary-50 uppercase">Activity</div>
        <div
          className="max-h-[220px] overflow-y-auto rounded-xl border border-border-5 bg-surface-elevated-base"
          data-testid="fleet-action-activity"
        >
          {exec.events.map((event) => {
            const Icon = EVENT_ICONS[event.tone];
            const sec = Math.max(0, Math.round((now - event.t) / 1000));
            return (
              <div
                key={`${event.t}-${event.text}`}
                className="flex items-center gap-2 border-b border-border-5 px-3.5 py-2 text-200 last:border-b-0"
                data-tone={event.tone}
              >
                <span className={clsx("shrink-0", EVENT_ICON_COLORS[event.tone])}>
                  <Icon />
                </span>
                <span className="min-w-0 flex-1 text-text-primary">{event.text}</span>
                <span className="shrink-0 text-text-primary-50">{sec < 1 ? "now" : `${sec}s`}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ExecutionView;
