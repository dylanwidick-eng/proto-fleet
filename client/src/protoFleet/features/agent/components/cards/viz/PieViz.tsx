/**
 * Inline-SVG pie chart with NO text elements (legend/labels are killed by
 * design — proto-smart-cards.md §2.2/§2.3.3). Geometry mirrors the prototype
 * engine's createPieChart (120×80 viewBox, center 40/40, radius 20 — the pie
 * sits left of center because the engine reserved the right side for the
 * legend that the CSS kill rules hid). Slice palette maps the engine's
 * orange/gray hexes (FF6B35, 666, 999, CCC) onto semantic tokens.
 */
interface PieVizProps {
  data: number[];
}

const SLICE_CLASSES = ["fill-core-accent-fill", "fill-core-primary-80", "fill-core-primary-50", "fill-core-primary-20"];

const CX = 40;
const CY = 40;
const R = 20;

const PieViz = ({ data }: PieVizProps) => {
  const total = data.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return null;

  let currentAngle = 0;
  return (
    <svg
      data-testid="pie-viz"
      viewBox="0 0 120 80"
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full max-w-[140px]"
      aria-hidden="true"
    >
      {data.map((value, index) => {
        const sliceAngle = (value / total) * 2 * Math.PI;
        const fillClass = SLICE_CLASSES[index % SLICE_CLASSES.length];
        // A ~full-circle arc degenerates (start == end); draw a circle instead.
        if (sliceAngle >= 2 * Math.PI - 1e-6) {
          return <circle key={index} cx={CX} cy={CY} r={R} className={fillClass} />;
        }
        const endAngle = currentAngle + sliceAngle;
        const x1 = CX + R * Math.cos(currentAngle);
        const y1 = CY + R * Math.sin(currentAngle);
        const x2 = CX + R * Math.cos(endAngle);
        const y2 = CY + R * Math.sin(endAngle);
        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
        const d = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
        currentAngle = endAngle;
        return <path key={index} d={d} className={fillClass} />;
      })}
    </svg>
  );
};

export default PieViz;
