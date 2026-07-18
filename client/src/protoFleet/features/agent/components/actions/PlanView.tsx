import clsx from "clsx";
import type { FleetActionChip, FleetActionConfig } from "@/protoFleet/features/agent/types";

interface ChipRowProps {
  chips: FleetActionChip[];
  onToggle: (index: number) => void;
  testIdPrefix: string;
}

/** Local ToggleChip pattern (PORT_PLAN.md §6) — active chips invert to the primary fill. */
const ChipRow = ({ chips, onToggle, testIdPrefix }: ChipRowProps) => (
  <div className="flex flex-wrap gap-1.5">
    {chips.map((chip, index) => (
      <button
        key={chip.label}
        type="button"
        data-testid={`${testIdPrefix}-${index}`}
        data-active={chip.active}
        onClick={() => onToggle(index)}
        className={clsx(
          "cursor-pointer rounded-full border px-3 py-1.5 text-emphasis-200 transition-colors",
          chip.active
            ? "border-core-primary-fill bg-core-primary-fill text-text-contrast"
            : "border-border-10 bg-surface-elevated-base text-text-primary hover:bg-surface-5",
        )}
      >
        {chip.label}
      </button>
    ))}
  </div>
);

const SectionLabel = ({ children }: { children: string }) => (
  <div className="text-heading-50 tracking-wide text-text-primary-50 uppercase">{children}</div>
);

interface PlanViewProps {
  config: FleetActionConfig;
  refineChips: FleetActionChip[];
  batchChips: FleetActionChip[];
  holdChips: FleetActionChip[];
  onToggleRefine: (index: number) => void;
  onSelectBatch: (index: number) => void;
  onSelectHold: (index: number) => void;
}

/**
 * Fleet-action plan view (proto-action-modals.md §4): targeting card, refine
 * multi-select (cosmetic — feeds the "Cohort:" receipt only), batch/hold
 * single-select, display-only abort criterion, and the bold plan sentence.
 */
const PlanView = ({
  config,
  refineChips,
  batchChips,
  holdChips,
  onToggleRefine,
  onSelectBatch,
  onSelectHold,
}: PlanViewProps) => {
  const batchLabel = batchChips.find((c) => c.active)?.label ?? "";
  const holdLabel = holdChips.find((c) => c.active)?.label ?? "";

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <SectionLabel>Targeting</SectionLabel>
        <div className="flex flex-col gap-1 rounded-xl bg-surface-5 px-4 py-3.5">
          {/* Count is intentionally NOT locale-formatted — firmware reads "Targeting 3989 miners" (faithful). */}
          <div className="text-heading-200 text-text-primary">
            Targeting {config.cohort.count} {config.cohort.unit}
          </div>
          <div className="text-200 text-text-primary-70">{config.cohort.reason}</div>
        </div>
        <div className="mt-1 text-200 text-text-primary-50">Refine</div>
        <ChipRow chips={refineChips} onToggle={onToggleRefine} testIdPrefix="fleet-action-refine-chip" />
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Plan</SectionLabel>
        <div className="flex flex-col gap-3 rounded-xl bg-surface-5 px-4 py-3.5">
          <div className="flex flex-col gap-1.5">
            <div className="text-200 text-text-primary-50">Batch size</div>
            <ChipRow chips={batchChips} onToggle={onSelectBatch} testIdPrefix="fleet-action-batch-chip" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="text-200 text-text-primary-50">Hold between batches</div>
            <ChipRow chips={holdChips} onToggle={onSelectHold} testIdPrefix="fleet-action-hold-chip" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="text-200 text-text-primary-50">Abort if</div>
            <div className="text-200 text-text-primary">{config.abort}</div>
          </div>
        </div>
      </section>

      <p className="rounded-[10px] bg-surface-5 px-3.5 py-3 text-200 leading-relaxed text-text-primary-70">
        Plan — {config.verb} <strong className="font-medium text-text-primary">{config.cohort.count}</strong> miners in
        batches of <strong className="font-medium text-text-primary">{batchLabel}</strong>, holding{" "}
        <strong className="font-medium text-text-primary">{holdLabel}</strong> between batches. I&apos;ll halt
        automatically if {config.abort}.
      </p>
    </div>
  );
};

export default PlanView;
