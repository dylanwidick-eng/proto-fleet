import FleetActionModal from "@/protoFleet/features/agent/components/actions/FleetActionModal";
import FleetActionTiles from "@/protoFleet/features/agent/components/actions/FleetActionTiles";

/**
 * The 5-tile Automations row wired to the store-routed modal — click a tile
 * to walk the full Plan → Execution → Results flow (600ms simulated ticks,
 * promote banner on completion).
 */
export const FleetActions = () => (
  <div className="flex flex-col gap-6 p-6">
    <FleetActionTiles />
    <FleetActionModal />
  </div>
);

export default {
  title: "ProtoFleet/Agent/Fleet actions",
};
