import clsx from "clsx";
import { paletteFor } from "@/protoFleet/features/agent/lib/palette";
import type { Workflow } from "@/protoFleet/features/agent/types";
import { pushToast, STATUSES } from "@/shared/features/toaster";

interface AlwaysOnStripProps {
  /** Condition-triggered workflows — no time slot, so no calendar cell. */
  conditions: Workflow[];
}

/**
 * Dashed "Always on" strip above the month toolbar
 * (proto-automations.md §2.4.2). Renders only when at least one condition
 * workflow exists. Pill click is a toast stub — no edit surface exists yet.
 */
const AlwaysOnStrip = ({ conditions }: AlwaysOnStripProps) => {
  if (conditions.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border-10 bg-surface-5 px-3.5 py-3">
      <span className="text-heading-50 tracking-wide text-text-primary-50 uppercase">Always on</span>
      {conditions.map((wf) => {
        const palette = paletteFor(wf.id);
        return (
          <button
            key={wf.id}
            type="button"
            data-testid={`alwayson-pill-${wf.id}`}
            className={clsx(
              "rounded-full border px-2.5 py-1 text-emphasis-200 hover:brightness-95",
              palette.bg,
              palette.text,
              palette.border,
              wf.paused ? "opacity-45" : null,
            )}
            onClick={() =>
              pushToast({ message: `Edit ${wf.name || wf.id} — detail surface coming next`, status: STATUSES.success })
            }
          >
            {wf.name}
          </button>
        );
      })}
    </div>
  );
};

export default AlwaysOnStrip;
