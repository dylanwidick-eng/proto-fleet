import { useState } from "react";
import ExecutionView from "@/protoFleet/features/agent/components/actions/ExecutionView";
import PlanView from "@/protoFleet/features/agent/components/actions/PlanView";
import ResultsView from "@/protoFleet/features/agent/components/actions/ResultsView";
import { useFleetActionRun } from "@/protoFleet/features/agent/components/actions/useFleetActionRun";
import { FLEET_ACTIONS } from "@/protoFleet/features/agent/lib/fleetActions";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { FleetActionChip, FleetActionConfig } from "@/protoFleet/features/agent/types";
import Button, { variants } from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import { pushToast, STATUSES } from "@/shared/features/toaster";

type FleetActionView = "plan" | "exec" | "results";

const copyChips = (chips: FleetActionChip[]): FleetActionChip[] => chips.map((chip) => ({ ...chip }));

interface FleetActionModalBodyProps {
  config: FleetActionConfig;
}

/**
 * One reusable fleet-action modal with three sequential views — Plan →
 * Execution → Results (proto-action-modals.md §3–6). Mounted ONCE (inside
 * AgentFloating when the flag is on, from AgentPage on flag-off deep-links)
 * and store-routed via `activeFleetAction`; the body remounts
 * per open, so chip selections always reset to config defaults (deep copy,
 * §3). Closing at any stage unmounts the body — `useFleetActionRun` clears
 * the 600ms interval on unmount, so a mid-run close silently abandons the
 * run with no history record (faithful).
 *
 * Modal-gotcha protocol (PORT_PLAN.md §6): ALL stage actions live in the
 * fixed footer as plain Buttons — no auto-dismissing header buttons.
 */
const FleetActionModalBody = ({ config }: FleetActionModalBodyProps) => {
  const closeFleetAction = useAgentStore((s) => s.closeFleetAction);
  const recordActionRun = useAgentStore((s) => s.recordActionRun);

  const [view, setView] = useState<FleetActionView>("plan");
  const [refineChips, setRefineChips] = useState(() => copyChips(config.refineChips));
  const [batchChips, setBatchChips] = useState(() => copyChips(config.batchChips));
  const [holdChips, setHoldChips] = useState(() => copyChips(config.holdChips));
  const [elapsedMs, setElapsedMs] = useState(0);
  const run = useFleetActionRun();

  const batchLabel = batchChips.find((c) => c.active)?.label ?? "";
  const holdLabel = holdChips.find((c) => c.active)?.label ?? "";

  const handleRun = () => {
    // "All at once" parses to NaN ⇒ batchSize = total (divergence F3 — the
    // prototype fell back to 50). Numeric labels are used verbatim.
    const parsed = parseInt(batchLabel, 10);
    const batchSize = Number.isNaN(parsed) ? config.cohort.count : parsed;
    run.start({ total: config.cohort.count, batchSize, copy: config.copy });
    setView("exec");
  };

  const handleDone = () => {
    if (!run.exec) return;
    if (run.exec.stopped) {
      // Stopped runs skip receipts entirely — no history record, no promote.
      closeFleetAction();
      return;
    }
    recordActionRun(config.key);
    setElapsedMs(Date.now() - run.exec.startedAt);
    setView("results");
  };

  const title =
    view === "plan" ? config.title : view === "exec" ? config.copy.progressTitle : config.copy.completeTitle;
  const description =
    view === "plan"
      ? config.subtitle
      : view === "exec" && run.exec
        ? `Working through ${run.exec.total} miners in batches of ${run.exec.batchSize}.`
        : undefined;

  const runEnded = Boolean(run.exec && (run.exec.done || run.exec.stopped));

  const footer =
    view === "plan" ? (
      <div className="flex justify-end gap-2">
        <Button variant={variants.secondary} text="Cancel" onClick={closeFleetAction} />
        <Button variant={variants.primary} text={config.runLabel} onClick={handleRun} testId="fleet-action-run-btn" />
      </div>
    ) : view === "exec" ? (
      <div className="flex justify-end gap-2">
        {runEnded ? null : (
          <>
            <Button variant={variants.secondaryDanger} text="Stop" onClick={run.stop} className="mr-auto" />
            <Button
              variant={variants.secondary}
              text={run.exec?.paused ? "Resume" : "Pause"}
              onClick={run.togglePause}
            />
          </>
        )}
        {runEnded ? <Button variant={variants.primary} text="Done" onClick={handleDone} /> : null}
      </div>
    ) : (
      <div className="flex justify-end gap-2">
        {run.exec && run.exec.failed > 0 ? (
          <Button
            variant={variants.secondary}
            text="Review flagged"
            onClick={() =>
              pushToast({ message: "Open flagged miners watchlist — coming next", status: STATUSES.success })
            }
          />
        ) : null}
        <Button variant={variants.primary} text="Close" onClick={closeFleetAction} />
      </div>
    );

  return (
    <Modal
      title={title}
      description={description}
      onDismiss={closeFleetAction}
      divider={false}
      fixedFooter={footer}
      testId="fleet-action-modal"
    >
      <div className="flex flex-col gap-4">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-5 py-1 pr-2.5 pl-2 text-emphasis-200 text-text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-core-primary-fill" />
          Agent
        </span>
        {view === "plan" ? (
          <PlanView
            config={config}
            refineChips={refineChips}
            batchChips={batchChips}
            holdChips={holdChips}
            onToggleRefine={(index) =>
              // Refine chips are independent multi-select toggles (cosmetic —
              // they never change cohort.count; they feed the Cohort receipt).
              setRefineChips((chips) => chips.map((c, i) => (i === index ? { ...c, active: !c.active } : c)))
            }
            onSelectBatch={(index) => setBatchChips((chips) => chips.map((c, i) => ({ ...c, active: i === index })))}
            onSelectHold={(index) => setHoldChips((chips) => chips.map((c, i) => ({ ...c, active: i === index })))}
          />
        ) : null}
        {view === "exec" && run.exec ? (
          <ExecutionView exec={run.exec} now={run.now} pastTense={config.copy.pastTense} />
        ) : null}
        {view === "results" && run.exec ? (
          <ResultsView
            config={config}
            exec={run.exec}
            elapsedMs={elapsedMs}
            refineChips={refineChips}
            batchLabel={batchLabel}
            holdLabel={holdLabel}
          />
        ) : null}
      </div>
    </Modal>
  );
};

/**
 * Store-routed host: renders nothing until some surface dispatches
 * `openFleetAction(key)`. Keyed remount guarantees a fresh deep-copied
 * config (chip selections reset) on every open.
 */
const FleetActionModal = () => {
  const activeFleetAction = useAgentStore((s) => s.activeFleetAction);
  if (!activeFleetAction) return null;
  return <FleetActionModalBody key={activeFleetAction} config={FLEET_ACTIONS[activeFleetAction]} />;
};

export default FleetActionModal;
