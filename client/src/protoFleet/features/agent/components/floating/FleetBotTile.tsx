import { useState } from "react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { ClockIcon, LightningIcon, SparkFilledIcon } from "@/protoFleet/features/agent/components/icons";
import { isScheduleActiveNow } from "@/protoFleet/features/agent/lib/schedule";
import { formatRelTime } from "@/protoFleet/features/agent/lib/time";
import { useAgentStore, useVisibleAgentItems, useWorkflowsList } from "@/protoFleet/features/agent/store/agentStore";
import type { AgentCardState, AgentItem, Workflow } from "@/protoFleet/features/agent/types";

type TaskBucket = Extract<AgentCardState, "pending" | "running" | "completed">;

const BUCKETS: TaskBucket[] = ["pending", "running", "completed"];

const BUCKET_LABELS: Record<TaskBucket, string> = {
  pending: "Need attention",
  running: "Running",
  completed: "Recent",
};

const BUCKET_EMPTY: Record<TaskBucket, string> = {
  pending: "All caught up",
  running: "No tasks running",
  completed: "No recent activity",
};

const BUCKET_BADGE_COLORS: Record<TaskBucket, string> = {
  pending: "bg-core-accent-fill",
  running: "bg-core-accent-fill",
  completed: "bg-core-primary-50",
};

const CloseGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="m3 1.586.707.707L10 8.586l6.293-6.293.707-.707L18.414 3l-.707.707L11.414 10l6.293 6.293.707.707L17 18.414l-.707-.707L10 11.414l-6.293 6.293-.707.707L1.586 17l.707-.707L8.586 10 2.293 3.707 1.586 3 3 1.586Z"
      fill="currentColor"
    />
  </svg>
);

const BackGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M11 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SendGlyph = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M10 18V4M4 10l6-6 6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StateBadge = ({ state }: { state: "running" | "completed" }) => (
  <span
    className={clsx(
      "ml-1.5 inline-flex items-center rounded-full px-1.5 py-px align-middle text-[10px] font-medium",
      state === "running"
        ? "bg-intent-warning-10 text-intent-warning-text"
        : "bg-intent-success-10 text-intent-success-text",
    )}
  >
    {state === "running" ? "Running" : "Completed"}
  </span>
);

const SubgroupHeader = ({ label, count }: { label: string; count: number }) => (
  <div className="flex items-center justify-between px-4 pt-2 pb-1">
    <span className="text-emphasis-200 text-text-primary-50">{label}</span>
    <span className="text-200 text-text-primary-30">{count}</span>
  </div>
);

/** Compact automation card for the tile (prototype `rebuildFleetBotAutomations`). */
const TileAutomationCard = ({ workflow }: { workflow: Workflow }) => {
  const toggleWorkflowPause = useAgentStore((s) => s.toggleWorkflowPause);
  const revokeWorkflow = useAgentStore((s) => s.revokeWorkflow);
  const activeNow = !workflow.paused && workflow.triggerType === "schedule" && isScheduleActiveNow(workflow.schedule);
  const TriggerIcon = workflow.triggerType === "schedule" ? ClockIcon : LightningIcon;

  return (
    <div
      className={clsx("mx-4 mb-2 flex flex-col gap-1 rounded-xl border border-border-5 px-3 py-2.5", {
        "opacity-45": workflow.paused,
      })}
      data-testid={`tile-automation-${workflow.id}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-text-primary-70">
          <TriggerIcon size={14} />
        </span>
        <span className="min-w-0 flex-1 truncate text-emphasis-200 text-text-primary">{workflow.name}</span>
        {activeNow ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-intent-success-10 px-1.5 py-px text-[10px] font-medium text-intent-success-text">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-intent-success-fill" />
            Active now
          </span>
        ) : null}
      </div>
      <div className="truncate text-200 text-text-primary-70">
        <strong className="font-medium text-text-primary">When</strong> {workflow.whenText}
      </div>
      <div className="truncate text-200 text-text-primary-70">
        <strong className="font-medium text-text-primary">Then</strong> {workflow.thenText}
      </div>
      <div className="flex items-center justify-between text-200 text-text-primary-50">
        <span>{workflow.scope === "all" ? "All sites" : workflow.site || "This site"}</span>
        <span>
          Fired {workflow.fireCount || 0}× · last {workflow.lastFiredAt ? formatRelTime(workflow.lastFiredAt) : "never"}
        </span>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => toggleWorkflowPause(workflow.id)}
          className="cursor-pointer text-200 text-text-primary-50 hover:text-text-primary"
        >
          {workflow.paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          onClick={() => revokeWorkflow(workflow.id)}
          className="cursor-pointer text-200 text-text-primary-50 hover:text-text-primary"
        >
          Revoke
        </button>
      </div>
    </div>
  );
};

/**
 * Floating Fleet-bot Tasks tile (proto-mode-data.md §4.4, §5.3; ftask
 * sections of the prototype's app.js). 380px bottom-right panel: Tasks
 * header with "View all" → /agent, three task buckets that expand in place,
 * an Automations section (Active/Paused workflow cards), and the "Ask Fleet
 * bot…" input that seeds the /agent composer and navigates.
 */
const FleetBotTile = () => {
  const navigate = useNavigate();
  const setTileOpen = useAgentStore((s) => s.setTileOpen);
  const closeAgentDetail = useAgentStore((s) => s.closeAgentDetail);
  const openAgentDetail = useAgentStore((s) => s.openAgentDetail);
  const seedComposer = useAgentStore((s) => s.seedComposer);
  const setActiveSection = useAgentStore((s) => s.setActiveSection);
  const itemStates = useAgentStore((s) => s.itemStates);
  const visibleItems = useVisibleAgentItems();
  const workflows = useWorkflowsList();

  const [expandedBucket, setExpandedBucket] = useState<TaskBucket | null>(null);
  const [ask, setAsk] = useState("");

  const stateOf = (item: AgentItem): AgentCardState => itemStates[item.id]?.state ?? "pending";
  const bucketItems = (bucket: TaskBucket) => visibleItems.filter((item) => stateOf(item) === bucket);

  const activeWorkflows = workflows.filter((w) => !w.paused);
  const pausedWorkflows = workflows.filter((w) => w.paused);

  const handleClose = () => {
    // Prototype `closeFleetBotTile()` also closes any open agent-detail modal.
    setTileOpen(false);
    closeAgentDetail();
  };

  const handleAsk = () => {
    const trimmed = ask.trim();
    if (!trimmed) return;
    // Seed the /agent composer and navigate; AgentFloating's pathname effect
    // closes the tile (PORT_PLAN.md §3.6). Route to the chat section so the
    // composer actually mounts and consumes the seed — section selection is
    // sticky in-session, so a user who last left /agent on Tasks would
    // otherwise never see the seeded text.
    seedComposer(trimmed);
    setActiveSection("chat");
    navigate("/agent");
  };

  return (
    <div
      data-testid="fleet-bot-tile"
      className="flex max-h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl bg-surface-elevated-base shadow-300"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border-5 px-4 py-3">
        <div className="flex items-center gap-2 text-text-primary">
          <SparkFilledIcon size={18} />
          <span className="text-emphasis-300">{expandedBucket ? BUCKET_LABELS[expandedBucket] : "Tasks"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate("/agent")}
            className="cursor-pointer rounded-md px-2 py-1 text-200 text-text-primary-50 hover:bg-surface-5 hover:text-text-primary"
          >
            View all
          </button>
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-text-primary-50 hover:bg-surface-5 hover:text-text-primary"
          >
            <CloseGlyph />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-2">
        {expandedBucket ? (
          <div className="flex flex-col pb-1">
            <button
              type="button"
              onClick={() => setExpandedBucket(null)}
              className="flex cursor-pointer items-center gap-1.5 px-4 py-2 text-left text-200 text-text-primary-50 hover:text-text-primary"
            >
              <BackGlyph />
              <span>All tasks</span>
            </button>
            {bucketItems(expandedBucket).length === 0 ? (
              <div className="px-4 py-3 text-200 text-text-primary-50">{BUCKET_EMPTY[expandedBucket]}</div>
            ) : (
              bucketItems(expandedBucket).map((item) => {
                const state = stateOf(item);
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openAgentDetail(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openAgentDetail(item.id);
                    }}
                    className="flex cursor-pointer items-center gap-2 border-t border-border-5 px-4 py-2.5 transition-colors hover:bg-surface-5"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="truncate text-emphasis-200 text-text-primary">
                        {item.title}
                        {state === "running" || state === "completed" ? <StateBadge state={state} /> : null}
                      </div>
                      <div className="truncate text-200 text-text-primary-50">{item.sub || ""}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              {BUCKETS.map((bucket) => (
                <button
                  key={bucket}
                  type="button"
                  data-testid={`tile-bucket-${bucket}`}
                  onClick={() => setExpandedBucket(bucket)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-5"
                >
                  <span
                    className={clsx(
                      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-emphasis-200 text-text-base-contrast-static",
                      BUCKET_BADGE_COLORS[bucket],
                    )}
                  >
                    {bucketItems(bucket).length}
                  </span>
                  <span className="flex-1 text-300 text-text-primary">{BUCKET_LABELS[bucket]}</span>
                </button>
              ))}
            </div>

            <div className="mt-2 border-t border-border-5 px-4 pt-3 pb-1 text-heading-50 tracking-wide text-text-primary-50 uppercase">
              Automations
            </div>
            <SubgroupHeader label="Active" count={activeWorkflows.length} />
            {activeWorkflows.length === 0 ? (
              <div className="px-4 py-1 pb-3 text-200 text-text-primary-50">
                No automations yet — promote a recommendation to set one up
              </div>
            ) : (
              activeWorkflows.map((workflow) => <TileAutomationCard key={workflow.id} workflow={workflow} />)
            )}
            {pausedWorkflows.length > 0 ? (
              <>
                <SubgroupHeader label="Paused" count={pausedWorkflows.length} />
                {pausedWorkflows.map((workflow) => (
                  <TileAutomationCard key={workflow.id} workflow={workflow} />
                ))}
              </>
            ) : null}
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-border-5 px-3 py-2.5">
        <input
          type="text"
          value={ask}
          onChange={(e) => setAsk(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAsk();
          }}
          placeholder="Ask Fleet bot…"
          data-testid="fleet-bot-ask-input"
          className="min-w-0 flex-1 rounded-lg border border-transparent bg-surface-5 px-3 py-2 text-200 text-text-primary outline-none placeholder:text-text-primary-50 focus:border-border-20 focus:bg-surface-base"
        />
        <button
          type="button"
          aria-label="Send"
          onClick={handleAsk}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-core-primary-fill text-text-contrast hover:opacity-85"
        >
          <SendGlyph />
        </button>
      </div>
    </div>
  );
};

export default FleetBotTile;
