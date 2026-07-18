import clsx from "clsx";

type CompositionTone = "healthy" | "warning" | "unhealthy" | "offline";

interface CompositionSegment {
  tone: CompositionTone;
  flex: number;
  /** Legend marker shape: warning/unhealthy are triangles, the rest dots. */
  marker: "dot" | "tri";
  label: string;
}

const COMPOSITION: CompositionSegment[] = [
  { tone: "healthy", flex: 89, marker: "dot", label: "89% healthy" },
  { tone: "warning", flex: 8, marker: "tri", label: "8% warning" },
  { tone: "unhealthy", flex: 2, marker: "tri", label: "2% unhealthy" },
  { tone: "offline", flex: 1, marker: "dot", label: "1% offline" },
];

const SEGMENT_FILLS: Record<CompositionTone, string> = {
  healthy: "bg-core-primary-fill",
  warning: "bg-intent-warning-fill",
  unhealthy: "bg-intent-critical-fill",
  offline: "bg-core-primary-20",
};

const TRIANGLE_FILLS: Record<CompositionTone, string> = {
  healthy: "border-b-core-primary-fill",
  warning: "border-b-intent-warning-fill",
  unhealthy: "border-b-intent-critical-fill",
  offline: "border-b-core-primary-20",
};

/**
 * Fleet Summary/Health tile (proto-smart-cards.md §5.2). Its ONLY home is
 * the dashboard AgentPageInsights module (the prototype removed it from the
 * chat landing in 2792ec3). Copy is verbatim, including the intentional
 * line break after "efficiency," and the underlined pseudo-links
 * ("maintenance"/"tuning" — cursor pointer, no handler).
 */
const FleetSummaryCard = ({ className }: { className?: string }) => (
  <div
    data-testid="fleet-summary-card"
    className={clsx("flex flex-col gap-6 rounded-2xl bg-surface-elevated-base px-7 py-6 shadow-100", className)}
  >
    <div className="flex items-start justify-between gap-12">
      <div>
        <div className="mb-2 text-300 text-text-primary-50">Summary</div>
        <p className="text-heading-200 font-normal text-text-primary">
          Systems are stable with most units online and performing near target efficiency,
          <br />
          with minor <span className="cursor-pointer underline underline-offset-[3px]">maintenance</span> and{" "}
          <span className="cursor-pointer underline underline-offset-[3px]">tuning</span> needed.
        </p>
      </div>
      <div className="min-w-[140px] shrink-0">
        <div className="mb-2 text-300 text-text-primary-50">Health</div>
        <div className="text-heading-200 font-normal text-text-primary">Moderate</div>
      </div>
    </div>
    <div className="flex h-2 gap-1 overflow-hidden rounded">
      {COMPOSITION.map((segment) => (
        <div
          key={segment.tone}
          className={clsx("h-full rounded-xs", SEGMENT_FILLS[segment.tone])}
          style={{ flex: segment.flex }}
        />
      ))}
    </div>
    <div className="flex flex-wrap gap-6 text-300 text-text-primary-70">
      {COMPOSITION.map((segment) => (
        <span key={segment.tone} className="inline-flex items-center gap-1.5">
          {segment.marker === "tri" ? (
            <span
              aria-hidden="true"
              className={clsx("h-0 w-0 border-x-[5px] border-b-8 border-x-transparent", TRIANGLE_FILLS[segment.tone])}
            />
          ) : (
            <span aria-hidden="true" className={clsx("size-2 rounded-full", SEGMENT_FILLS[segment.tone])} />
          )}
          {segment.label}
        </span>
      ))}
    </div>
  </div>
);

export default FleetSummaryCard;
