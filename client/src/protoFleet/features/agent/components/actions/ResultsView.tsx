import PromoteBanner from "@/protoFleet/features/agent/components/actions/PromoteBanner";
import { elapsedStr, stripCountSuffix } from "@/protoFleet/features/agent/lib/time";
import type { FleetActionChip, FleetActionConfig, FleetExecState } from "@/protoFleet/features/agent/types";
import { pushToast, STATUSES } from "@/shared/features/toaster";

/** Flagged list shows up to 8 ids; the rest hide behind "Review flagged" (§6.2). */
const FLAGGED_VISIBLE_MAX = 8;

const OutcomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="10" className="fill-intent-success-fill" />
    <path
      d="M6.5 11.5l3 3 6-7"
      className="stroke-surface-base"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface ResultsViewProps {
  config: FleetActionConfig;
  exec: FleetExecState;
  /** Run duration captured when Done was clicked (prototype computed it at results render). */
  elapsedMs: number;
  refineChips: FleetActionChip[];
  batchLabel: string;
  holdLabel: string;
}

/**
 * Fleet-action results view (proto-action-modals.md §6): outcome card,
 * promote banner, flagged-for-review list (≤8 + overflow), and the
 * "What changed" receipts in verbatim order.
 */
const ResultsView = ({ config, exec, elapsedMs, refineChips, batchLabel, holdLabel }: ResultsViewProps) => {
  const past = config.copy.pastTense;
  const elapsed = elapsedStr(elapsedMs);
  const visibleFlagged = exec.flaggedIds.slice(0, FLAGGED_VISIBLE_MAX);
  const overflow = exec.flaggedIds.length - visibleFlagged.length;

  const refineActive = refineChips.filter((c) => c.active).map((c) => stripCountSuffix(c.label));
  const receipts = [
    `${past.charAt(0).toUpperCase() + past.slice(1)} ${exec.rebooted} of ${exec.total} targeted miners`,
    `Cohort: ${refineActive.join(" · ") || "all targeted"}`,
    `Cadence: batches of ${batchLabel}, holding ${holdLabel} between batches`,
    ...(exec.failed > 0 ? [`${exec.failed} miners flagged for review and added to your watchlist`] : []),
    `Total time: ${elapsed}`,
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3 rounded-xl bg-surface-5 p-4">
        <OutcomeIcon />
        <div className="flex flex-col gap-0.5">
          <div className="text-emphasis-400 text-text-primary" data-testid="fleet-action-outcome-headline">
            {exec.rebooted} of {exec.total} miners {past}
          </div>
          <div className="text-200 text-text-primary-50" data-testid="fleet-action-outcome-meta">
            Took {elapsed}
            {exec.failed > 0 ? ` • ${exec.failed} flagged for follow-up` : ""}
          </div>
        </div>
      </div>

      <PromoteBanner config={config} batchLabel={batchLabel} holdLabel={holdLabel} />

      {exec.failed > 0 ? (
        <section className="flex flex-col gap-2">
          <div className="text-heading-50 tracking-wide text-text-primary-50 uppercase">Flagged for review</div>
          <div className="max-h-[180px] overflow-y-auto rounded-xl border border-border-5 bg-surface-elevated-base">
            {visibleFlagged.map((id) => (
              <div
                key={id}
                className="flex items-center gap-2 border-b border-border-5 px-3.5 py-2 text-200 last:border-b-0"
              >
                <span className="font-medium text-text-primary">{id}</span>
                {/* Reason copy stays the hardcoded reboot-flavored string for all actions (faithful, noted). */}
                <span className="flex-1 text-text-primary-50">didn&apos;t return after 3 attempts</span>
                <button
                  type="button"
                  onClick={() =>
                    pushToast({ message: `Open ${id} — miner detail surface coming next`, status: STATUSES.success })
                  }
                  className="cursor-pointer text-text-primary underline underline-offset-[3px] hover:text-text-primary-50"
                >
                  View
                </button>
              </div>
            ))}
            {overflow > 0 ? (
              <div className="flex justify-center px-3.5 py-2 text-200 text-text-primary-50">
                + {overflow} more — see Review flagged
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <div className="text-heading-50 tracking-wide text-text-primary-50 uppercase">What changed</div>
        <ul className="flex flex-col gap-1.5" data-testid="fleet-action-receipts">
          {receipts.map((text) => (
            <li key={text} className="relative pl-[18px] text-200 leading-relaxed text-text-primary">
              <span className="absolute top-[9px] left-1 h-1 w-1 rounded-full bg-core-primary-50" />
              {text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default ResultsView;
