/**
 * Inline-SVG bar chart with NO text elements (the stat block carries the
 * numbers — proto-smart-cards.md §2.2 kill rules baked in, PORT_PLAN.md §6).
 * Geometry mirrors the prototype engine's createBarChart (120×80 viewBox,
 * baseline y=65, 48-unit plot height). Bars over the threshold flip to the
 * primary fill and a dashed threshold line is drawn, matching the engine.
 */
interface BarVizProps {
  data: number[];
  threshold?: number;
}

const VIEW_W = 120;
const PAD = 8;
const CHART_H = 48;
const BASELINE = 65;

const BarViz = ({ data, threshold }: BarVizProps) => {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const plotW = VIEW_W - PAD * 2;
  const n = data.length;
  const spacing = Math.max(3, Math.min(8, Math.floor(plotW * 0.02)));
  const barWidth = Math.max(10, Math.floor((plotW - (n - 1) * spacing) / n));
  const thresholdY = threshold != null ? BASELINE - (threshold / max) * CHART_H : null;

  return (
    <svg
      data-testid="bar-viz"
      viewBox={`0 0 ${VIEW_W} 80`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full max-w-[140px]"
      aria-hidden="true"
    >
      {data.map((value, i) => {
        const height = (value / max) * CHART_H;
        const over = threshold != null && value > threshold;
        return (
          <rect
            key={i}
            x={PAD + i * (barWidth + spacing)}
            y={BASELINE - height}
            width={barWidth}
            height={height}
            rx={3}
            className={over ? "fill-core-primary-fill" : "fill-core-accent-fill"}
          />
        );
      })}
      {thresholdY != null ? (
        <line
          x1={PAD}
          x2={VIEW_W - PAD}
          y1={thresholdY}
          y2={thresholdY}
          strokeWidth={1}
          strokeDasharray="4 3"
          className="stroke-text-primary-50"
        />
      ) : null}
    </svg>
  );
};

export default BarViz;
