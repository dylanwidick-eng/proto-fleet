import clsx from "clsx";
import { ClockIcon, LightningIcon } from "@/protoFleet/features/agent/components/icons";
import { isScheduleActiveNow } from "@/protoFleet/features/agent/lib/schedule";
import { formatRelTime } from "@/protoFleet/features/agent/lib/time";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { Workflow } from "@/protoFleet/features/agent/types";

interface AutomationCardProps {
  workflow: Workflow;
}

/**
 * Automation card (proto-automations.md §2.5) — the SAME component renders on
 * the Automations list and inside P6's FleetBotTile Automations section.
 * Pause/Resume/Revoke dispatch store actions; the store fires the exact
 * toast copy (`Paused:`/`Resumed:`/`Revoked:`) — do not double-toast here.
 * Revoke round-trips: the store resets a promoted item back to pending.
 */
const AutomationCard = ({ workflow }: AutomationCardProps) => {
  const toggleWorkflowPause = useAgentStore((s) => s.toggleWorkflowPause);
  const revokeWorkflow = useAgentStore((s) => s.revokeWorkflow);

  const isSchedule = workflow.triggerType === "schedule";
  const activeNow = !workflow.paused && isSchedule && isScheduleActiveNow(workflow.schedule);

  return (
    <div
      data-testid={`automation-card-${workflow.id}`}
      data-paused={workflow.paused}
      className={clsx(
        "flex flex-col gap-1.5 rounded-xl border border-border-5 bg-surface-5 px-4 py-3.5",
        workflow.paused ? "opacity-55" : null,
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={clsx(
            "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md",
            isSchedule ? "bg-intent-info-10 text-intent-info-fill" : "bg-core-accent-10 text-text-emphasis",
          )}
        >
          {isSchedule ? <ClockIcon size={14} /> : <LightningIcon size={14} />}
        </span>
        <span className="min-w-0 flex-1 truncate text-emphasis-300 text-text-primary">{workflow.name}</span>
        {activeNow ? (
          <span className="flex items-center gap-1.5 rounded-full bg-intent-success-10 px-2 py-0.5 text-emphasis-200 text-intent-success-fill">
            <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-intent-success-fill" />
            Active now
          </span>
        ) : null}
      </div>
      <div className="text-300 text-text-primary-70">
        <span className="font-medium text-text-primary">When</span> {workflow.whenText}
      </div>
      <div className="text-300 text-text-primary-70">
        <span className="font-medium text-text-primary">Then</span> {workflow.thenText}
      </div>
      <div className="flex flex-wrap gap-3 text-200 text-text-primary-50">
        <span>{workflow.scope === "all" ? "All sites" : workflow.site || "This site"}</span>
        <span>
          Fired {workflow.fireCount || 0}× · last {formatRelTime(workflow.lastFiredAt) || "never"}
        </span>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="text-200 text-text-primary-50 hover:text-text-primary"
          onClick={() => toggleWorkflowPause(workflow.id)}
        >
          {workflow.paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          className="text-200 text-text-primary-50 hover:text-text-primary"
          onClick={() => revokeWorkflow(workflow.id)}
        >
          Revoke
        </button>
      </div>
    </div>
  );
};

export default AutomationCard;
