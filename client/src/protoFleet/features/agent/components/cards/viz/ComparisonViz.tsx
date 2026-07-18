/**
 * Two-bar comparison chart, inline SVG with NO text elements
 * (proto-smart-cards.md §2.3.3). Geometry mirrors the prototype engine's
 * createComparisonChart (120×80 viewBox, 20-unit side pads, baseline y=65);
 * the first bar is the reference (engine gray "666" → primary token), the
 * second the highlighted value (engine orange "FF6B35" → accent token).
 */
interface ComparisonVizProps {
  data: number[];
}

const VIEW_W = 120;
const PAD = 20;
const CHART_H = 48;
const BASELINE = 65;

const ComparisonViz = ({ data }: ComparisonVizProps) => {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const plotW = VIEW_W - PAD * 2;
  const n = data.length;
  const spacing = Math.max(8, Math.floor(plotW * 0.08));
  const barWidth = Math.max(16, Math.floor((plotW - (n - 1) * spacing) / n));

  return (
    <svg
      data-testid="comparison-viz"
      viewBox={`0 0 ${VIEW_W} 80`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full max-w-[140px]"
      aria-hidden="true"
    >
      {data.map((value, i) => {
        const height = (value / max) * CHART_H;
        return (
          <rect
            key={i}
            x={PAD + i * (barWidth + spacing)}
            y={BASELINE - height}
            width={barWidth}
            height={height}
            rx={3}
            className={i === 0 ? "fill-core-primary-50" : "fill-core-accent-fill"}
          />
        );
      })}
    </svg>
  );
};

export default ComparisonViz;
