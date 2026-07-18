import { ReactNode, useState } from "react";
import AutomateEditor from "@/protoFleet/features/agent/components/detail/AutomateEditor";
import DismissPicker from "@/protoFleet/features/agent/components/detail/DismissPicker";
import SnoozePicker from "@/protoFleet/features/agent/components/detail/SnoozePicker";
import { getAgentItem } from "@/protoFleet/features/agent/lib/agentItems";
import { formatRelTime } from "@/protoFleet/features/agent/lib/time";
import { useAgentItemState, useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { AgentCardState, AgentItemImpact, AgentStateEntry, Workflow } from "@/protoFleet/features/agent/types";
import Button, { variants } from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";

/**
 * Agent recommendation detail modal (proto-smart-cards.md §4), store-routed:
 * reads `detailItemId` and mounts EXACTLY ONCE — inside AgentFloating (P6)
 * when the flag is on, from AgentPage on flag-off deep-links — so every
 * surface — page, tile, banners — opens it by dispatching
 * `openAgentDetail(id)` (PORT_PLAN.md §3.2).
 *
 * Uses the shared Modal (sanctioned divergence D1). Modal-gotcha protocol:
 * this is a multi-stage flow (actions row ↔ dismiss/snooze/automate picker
 * swaps), so ALL stage actions live in the body footer as plain Buttons —
 * no auto-dismissing header buttons (PORT_PLAN.md §6).
 *
 * Footer state machine (§4.2–4.3):
 * - pending → Dismiss (pushed left) / Snooze / Automate (iff item.workflow)
 *   / Accept; pickers are in-body view swaps with "← Back".
 * - any other state → state-info line + Resolution section + Close.
 * Accept dispatches `acceptItem` (store owns the toast + the guarded 4.5s
 * running→completed timer).
 */
type FooterView = "actions" | "dismiss" | "snooze" | "automate";

/** Verbatim §4.2 resolution copy per non-pending state. */
const RESOLUTION_COPY: Record<Exclude<AgentCardState, "pending">, string> = {
  running: "Awaiting completion confirmation from fleet.",
  completed: "Action completed. See Activity log for details.",
  dismissed: "Removed from queue. Re-surface manually if needed.",
  snoozed: "Will return when snooze expires.",
  automated: "Future occurrences run unattended. Pause or revoke from Automations.",
};

/** Verbatim §4.2 state-info line per non-pending state. */
const stateInfoText = (entry: AgentStateEntry, workflow: Workflow | undefined): string => {
  switch (entry.state) {
    case "running":
      return `Accepted ${formatRelTime(entry.acceptedAt)}. Action in progress.`;
    case "completed":
      return `Completed ${formatRelTime(entry.completedAt)}.`;
    case "dismissed":
      return `Dismissed: ${entry.dismissReason || "no reason"}.`;
    case "snoozed":
      return `Snoozed ${entry.snoozeLabel}.`;
    case "automated":
      return workflow ? `Handled by automation "${workflow.name}".` : "Handled by automation.";
    default:
      return "";
  }
};

/** Impact grid cells: label mapping dollars→"Net", extra→"Notes"; falsy cells dropped (§4.1). */
const impactCells = (impact: AgentItemImpact): [string, string][] =>
  (
    [
      ["Devices", impact.devices],
      ["Hashrate", impact.hashrate],
      ["Net", impact.dollars],
      ["Notes", impact.extra],
    ] as [string, string | undefined][]
  ).filter((cell): cell is [string, string] => Boolean(cell[1]));

const Section = ({ label, children }: { label: string; children: ReactNode }) => (
  <section className="border-t border-border-5 py-4 first:border-t-0">
    <div className="mb-2 text-heading-50 tracking-wide text-text-primary-50 uppercase">{label}</div>
    <div className="text-300 text-text-primary">{children}</div>
  </section>
);

const AgentDetailModal = () => {
  const detailItemId = useAgentStore((s) => s.detailItemId);
  const closeAgentDetail = useAgentStore((s) => s.closeAgentDetail);
  const acceptItem = useAgentStore((s) => s.acceptItem);
  const dismissItem = useAgentStore((s) => s.dismissItem);
  const snoozeItem = useAgentStore((s) => s.snoozeItem);
  const automateItem = useAgentStore((s) => s.automateItem);
  const entry = useAgentItemState(detailItemId ?? "");
  const linkedWorkflow = useAgentStore((s) => (entry.workflowId ? s.workflows[entry.workflowId] : undefined));

  const [view, setView] = useState<FooterView>("actions");
  // Reset the footer view whenever a different card opens (render-time
  // adjustment, same pattern as AddChannelModal's prevOpen).
  const [prevItemId, setPrevItemId] = useState(detailItemId);
  if (prevItemId !== detailItemId) {
    setPrevItemId(detailItemId);
    setView("actions");
  }

  const item = detailItemId ? getAgentItem(detailItemId) : undefined;
  if (!item) return null;

  const pending = entry.state === "pending";
  const cells = impactCells(item.impact);

  const handleDismiss = (reason: string) => {
    dismissItem(item.id, reason);
    closeAgentDetail();
  };
  const handleSnooze = (key: string, label: string) => {
    snoozeItem(item.id, key, label);
    closeAgentDetail();
  };
  const handleAccept = () => {
    acceptItem(item.id);
    closeAgentDetail();
  };
  const handleAutomate = (workflow: Workflow) => {
    automateItem(item.id, workflow);
    closeAgentDetail();
  };

  return (
    <Modal open onDismiss={() => closeAgentDetail()} divider={false} testId="agent-detail-modal">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-emphasis-300 text-text-primary">{item.cat}</span>
          <span className="text-300 text-text-primary-50">{item.site}</span>
          {entry.state === "running" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-core-accent-10 px-2.5 py-1 text-emphasis-200 text-text-emphasis">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-core-accent-fill" />
              Running
            </span>
          ) : null}
          {entry.state === "completed" ? (
            <span className="inline-flex items-center rounded-full bg-surface-5 px-2.5 py-1 text-emphasis-200 text-text-primary-50">
              Completed
            </span>
          ) : null}
        </div>
        <div className="text-heading-300 text-text-primary">{item.title}</div>
        {item.sub ? <div className="text-300 text-text-primary-50">{item.sub}</div> : null}
      </div>

      <div className="mt-4">
        <Section label="Why this fired">{item.signal}</Section>
        <Section label="Proposed action">{item.plan}</Section>
        {cells.length > 0 ? (
          <Section label="Impact">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {cells.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <div className="text-200 text-text-primary-50">{label}</div>
                  <div className="text-300 text-text-primary">{value}</div>
                </div>
              ))}
            </div>
          </Section>
        ) : null}
        {entry.state === "pending" ? null : <Section label="Resolution">{RESOLUTION_COPY[entry.state]}</Section>}
      </div>

      <div className="mt-2 border-t border-border-5 pt-4">
        {pending ? (
          <>
            {view === "actions" ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  text="Dismiss"
                  variant={variants.secondaryDanger}
                  className="mr-auto"
                  onClick={() => setView("dismiss")}
                  testId="agent-detail-dismiss"
                />
                <Button
                  text="Snooze"
                  variant={variants.secondary}
                  onClick={() => setView("snooze")}
                  testId="agent-detail-snooze"
                />
                {item.workflow ? (
                  <Button
                    text="Automate"
                    variant={variants.secondary}
                    onClick={() => setView("automate")}
                    testId="agent-detail-automate"
                  />
                ) : null}
                <Button text="Accept" variant={variants.primary} onClick={handleAccept} testId="agent-detail-accept" />
              </div>
            ) : null}
            {view === "dismiss" ? <DismissPicker onSelect={handleDismiss} onBack={() => setView("actions")} /> : null}
            {view === "snooze" ? <SnoozePicker onSelect={handleSnooze} onBack={() => setView("actions")} /> : null}
            {view === "automate" ? (
              <AutomateEditor key={item.id} item={item} onSave={handleAutomate} onBack={() => setView("actions")} />
            ) : null}
          </>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-300 text-text-primary-70" data-testid="agent-detail-state-text">
              {stateInfoText(entry, linkedWorkflow)}
            </span>
            <Button
              text="Close"
              variant={variants.secondary}
              onClick={() => closeAgentDetail()}
              testId="agent-detail-close"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AgentDetailModal;
