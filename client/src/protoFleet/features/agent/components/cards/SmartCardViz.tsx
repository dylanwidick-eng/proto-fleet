import BarViz from "@/protoFleet/features/agent/components/cards/viz/BarViz";
import CalendarViz from "@/protoFleet/features/agent/components/cards/viz/CalendarViz";
import ComparisonViz from "@/protoFleet/features/agent/components/cards/viz/ComparisonViz";
import PieViz from "@/protoFleet/features/agent/components/cards/viz/PieViz";
import RackGridViz from "@/protoFleet/features/agent/components/cards/viz/RackGridViz";
import type { Viz } from "@/protoFleet/features/agent/types";

/**
 * Dispatch on `viz.type` (proto-smart-cards.md §2.3). Absent viz ⇒ empty
 * pane; non-calendar callouts also render empty (CalendarViz returns null).
 * All charts are module-local inline SVG with zero text elements.
 */
interface SmartCardVizProps {
  /** Seeds the rack-grid shuffle so hot cells are stable per item. */
  itemId: string;
  viz?: Viz;
}

const SmartCardViz = ({ itemId, viz }: SmartCardVizProps) => {
  if (!viz) return null;
  switch (viz.type) {
    case "callout":
      return <CalendarViz value={viz.value} />;
    case "rack-grid":
      return <RackGridViz itemId={itemId} total={viz.total} affected={viz.affected} />;
    case "bar":
      return <BarViz data={viz.data} threshold={viz.threshold} />;
    case "pie":
      return <PieViz data={viz.data} />;
    case "comparison":
      return <ComparisonViz data={viz.data} />;
    case "dualbar":
      // Engine pass-through type, unused in seed data — render as plain bars.
      return <BarViz data={viz.data} />;
    default:
      return null;
  }
};

export default SmartCardViz;
