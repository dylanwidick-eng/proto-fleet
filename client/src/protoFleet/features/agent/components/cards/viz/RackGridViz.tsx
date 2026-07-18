import clsx from "clsx";
import { rackGridHotSet } from "@/protoFleet/features/agent/lib/rackGridSeed";

/**
 * Native CSS-grid rack viz (proto-smart-cards.md §2.3.2). Columns scale with
 * the cohort (≤16→4, ≤25→5, ≤36→6, else 7); hot cells come from the exact
 * prototype LCG Fisher–Yates in lib/rackGridSeed, keyed on the item id, so
 * the pattern is pixel-stable across renders and sessions.
 */
interface RackGridVizProps {
  /** Seeds the hot-cell shuffle — same id ⇒ same pattern every render. */
  itemId: string;
  total: number;
  affected: number;
}

const colsFor = (total: number): number => {
  if (total <= 16) return 4;
  if (total <= 25) return 5;
  if (total <= 36) return 6;
  return 7;
};

const RackGridViz = ({ itemId, total: totalProp, affected: affectedProp }: RackGridVizProps) => {
  const total = totalProp || 25;
  const affected = Math.min(affectedProp || 0, total);
  const cols = colsFor(total);
  const rows = Math.ceil(total / cols);
  const hot = rackGridHotSet(itemId, total, affected);

  return (
    <div
      data-testid="rack-grid-viz"
      className="grid place-content-center gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${cols}, 14px)`, gridTemplateRows: `repeat(${rows}, 14px)` }}
    >
      {Array.from({ length: total }, (_, i) => {
        const isHot = hot.has(i);
        return (
          <div
            key={i}
            data-hot={isHot ? "true" : undefined}
            className={clsx("relative h-3.5 w-3.5 rounded-[2px]", isHot ? "bg-intent-critical-20" : "bg-surface-10")}
          >
            {isHot ? (
              <div className="absolute top-1/2 left-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-intent-critical-fill" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

export default RackGridViz;
