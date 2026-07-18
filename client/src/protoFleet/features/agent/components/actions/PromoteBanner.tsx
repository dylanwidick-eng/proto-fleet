import { useState } from "react";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { FleetActionConfig, Workflow } from "@/protoFleet/features/agent/types";
import Button, { sizes as buttonSizes, variants } from "@/shared/components/Button";

interface PromoteBannerProps {
  config: FleetActionConfig;
  /** Active batch/hold chip labels — fill the {batch}/{hold} template slots. */
  batchLabel: string;
  holdLabel: string;
}

/**
 * "Automate this?" promotion banner (proto-action-modals.md §6.3–6.4).
 * Shown from the FIRST completed run; copy adapts at 1 / 2 / ≥3 runs (the
 * persisted history already includes the run just recorded). Declines are
 * per-action per-session; Save promotes the rule into the workflow store.
 * when/then are plain ">" strings rendered as JSX text (divergence F5).
 */
const PromoteBanner = ({ config, batchLabel, holdLabel }: PromoteBannerProps) => {
  const count = useAgentStore((s) => s.actionHistory[config.key]?.count ?? 0);
  const declined = useAgentStore((s) => s.promoteDeclined.includes(config.key));
  const declinePromote = useAgentStore((s) => s.declinePromote);
  const saveWorkflow = useAgentStore((s) => s.saveWorkflow);
  const [saved, setSaved] = useState(false);

  if (declined || saved) return null;

  const thenText = config.promoteRule.thenTemplate.replace("{batch}", batchLabel).replace("{hold}", holdLabel);

  const message =
    count >= 3
      ? `You've handled this manually ${count} times in the last 30 days. I can take over this trigger going forward and only escalate the flagged outliers.`
      : count === 2
        ? "That's the second time this week. I can take over this trigger going forward and only escalate the flagged outliers."
        : "If this is recurring work, I can take over this trigger going forward and only escalate the flagged outliers.";

  const handleSave = () => {
    const workflow: Workflow = {
      id: `wf_${Date.now().toString(36)}`,
      name: config.promoteRule.name,
      triggerType: "condition",
      whenText: config.promoteRule.whenText,
      schedule: null,
      thenText,
      scope: "all",
      sourceItemId: null,
      site: "all",
      cat: config.promoteRule.cat,
      createdAt: Date.now(),
      lastFiredAt: null,
      fireCount: 0,
      paused: false,
    };
    // The store fires the single save toast; copy is the prototype's
    // verbatim promote-save string (app.js:4211, divergence F8).
    saveWorkflow(workflow, "Automation saved — visible under Automations");
    setSaved(true);
  };

  return (
    <div
      className="flex flex-col gap-2.5 rounded-xl border border-border-10 bg-surface-elevated-base px-4 py-3.5"
      data-testid="fleet-action-promote"
    >
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-core-primary-fill px-2 py-0.5 text-[11px] font-medium tracking-[0.2px] text-text-contrast uppercase">
          Suggested
        </span>
        <span className="text-emphasis-300 text-text-primary">Automate this going forward?</span>
      </div>
      <p className="text-200 leading-relaxed text-text-primary-70">{message}</p>
      <div className="rounded-lg bg-surface-5 px-3 py-2.5 font-mono text-200 text-text-primary">
        <strong className="font-semibold">When</strong> {config.promoteRule.whenText}
        <br />
        <strong className="font-semibold">Then</strong> {thenText}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => declinePromote(config.key)}
          className="cursor-pointer rounded-3xl border border-border-10 bg-surface-elevated-base px-3.5 py-2 text-emphasis-200 text-text-primary hover:border-border-20 hover:bg-surface-5"
        >
          Not now
        </button>
        <Button variant={variants.primary} size={buttonSizes.compact} text="Save automation" onClick={handleSave} />
      </div>
    </div>
  );
};

export default PromoteBanner;
