import { useMemo } from "react";
import useMeasure from "@/shared/hooks/useMeasure";
import { useWindowDimensions } from "@/shared/hooks/useWindowDimensions";

interface RulePreviewPaneProps {
  appliesToValue: string;
  matchingCount: number;
  matchingMiners: Array<{
    id: string;
    name: string;
    value: string;
  }>;
  triggerSummary: string;
}

const formatCriteriaCount = (count: number): string =>
  `${count} currently ${count === 1 ? "meets" : "meet"} this criteria`;

const displayRows = (matchingMiners: RulePreviewPaneProps["matchingMiners"]) => {
  if (matchingMiners.length <= 6) return matchingMiners.map((miner) => ({ type: "miner" as const, miner }));
  return [
    ...matchingMiners.slice(0, 3).map((miner) => ({ type: "miner" as const, miner })),
    { type: "ellipsis" as const, id: "ellipsis" },
    ...matchingMiners.slice(-3).map((miner) => ({ type: "miner" as const, miner })),
  ];
};

type PreviewRow = ReturnType<typeof displayRows>[number];

interface PreviewSummaryProps {
  appliesToValue: string;
  matchingCount: number;
  triggerSummary: string;
}

const PreviewSummary = ({ appliesToValue, matchingCount, triggerSummary }: PreviewSummaryProps) => (
  <>
    <div className="text-heading-200 text-text-primary">{triggerSummary}</div>

    <div className="mt-10 text-emphasis-300 text-text-primary-50">Applies to</div>
    <div className="mt-5 flex flex-col gap-2">
      <div className="text-heading-100 text-text-primary">{appliesToValue}</div>
      <div className="text-300 text-text-primary-70">{formatCriteriaCount(matchingCount)}</div>
    </div>
  </>
);

interface PreviewStackProps extends PreviewSummaryProps {
  rows?: PreviewRow[];
  className?: string;
  measureRef?: (element: HTMLDivElement | null) => void;
  ariaHidden?: boolean;
}

const PreviewTable = ({ rows }: { rows: PreviewRow[] }) => (
  <div className="pt-8">
    {rows.map((row, index) =>
      row.type === "ellipsis" ? (
        <div key={row.id} className="border-t border-border-5 py-4 text-center text-300 text-text-primary-50">
          ...
        </div>
      ) : (
        <div
          key={row.miner.id}
          className={`flex items-center justify-between gap-6 py-4 text-300 text-text-primary ${
            index > 0 ? "border-t border-border-5" : ""
          }`}
        >
          <span className="min-w-0 truncate">{row.miner.name}</span>
          <span className="shrink-0 text-right">{row.miner.value}</span>
        </div>
      ),
    )}
  </div>
);

const PreviewStack = ({
  appliesToValue,
  matchingCount,
  triggerSummary,
  rows,
  className = "",
  measureRef,
  ariaHidden,
}: PreviewStackProps) => (
  <div ref={measureRef} className={className} aria-hidden={ariaHidden}>
    <PreviewSummary appliesToValue={appliesToValue} matchingCount={matchingCount} triggerSummary={triggerSummary} />
    {rows && rows.length > 0 ? <PreviewTable rows={rows} /> : null}
  </div>
);

const SECTION_VERTICAL_PADDING = 40;
const VIEWPORT_BOTTOM_GUTTER = 24;

const RulePreviewPane = ({ appliesToValue, matchingCount, matchingMiners, triggerSummary }: RulePreviewPaneProps) => {
  const rows = useMemo(() => displayRows(matchingMiners), [matchingMiners]);
  const [sectionMeasureRef, , sectionRect] = useMeasure<HTMLElement>();
  const [fullStackMeasureRef, fullStackRect] = useMeasure<HTMLDivElement>();
  const { height: windowHeight } = useWindowDimensions();
  const hasRows = rows.length > 0;
  const hasMeasurements = sectionRect.height > 0 && (!hasRows || fullStackRect.height > 0);
  const visibleSectionHeight = Math.min(
    sectionRect.height,
    Math.max(0, windowHeight - sectionRect.top - VIEWPORT_BOTTOM_GUTTER),
  );
  const availableContentHeight = Math.max(0, visibleSectionHeight - SECTION_VERTICAL_PADDING);
  const showTable = hasRows && hasMeasurements && fullStackRect.height <= Math.floor(availableContentHeight);

  return (
    <>
      <div className="flex min-h-16 items-center justify-center px-6 py-4 laptop:hidden">
        <div className="w-full text-center">
          <div className="text-emphasis-300 text-text-primary">{triggerSummary}</div>
        </div>
      </div>

      <section
        ref={sectionMeasureRef}
        className="hidden flex-col justify-center px-16 pt-6 pb-4 laptop:flex laptop:flex-1"
      >
        <div className="relative max-w-[520px]">
          <PreviewStack
            appliesToValue={appliesToValue}
            matchingCount={matchingCount}
            triggerSummary={triggerSummary}
            rows={showTable ? rows : undefined}
          />

          {hasRows ? (
            <PreviewStack
              appliesToValue={appliesToValue}
              matchingCount={matchingCount}
              triggerSummary={triggerSummary}
              rows={rows}
              measureRef={fullStackMeasureRef}
              className="pointer-events-none invisible absolute inset-x-0 top-0"
              ariaHidden
            />
          ) : null}
        </div>
      </section>
    </>
  );
};

export default RulePreviewPane;
