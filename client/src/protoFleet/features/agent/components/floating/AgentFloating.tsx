import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import clsx from "clsx";
import FleetActionModal from "@/protoFleet/features/agent/components/actions/FleetActionModal";
import AgentDetailModal from "@/protoFleet/features/agent/components/detail/AgentDetailModal";
import AgentFab from "@/protoFleet/features/agent/components/floating/AgentFab";
import FleetBotTile from "@/protoFleet/features/agent/components/floating/FleetBotTile";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import { useIsActionBarVisible } from "@/protoFleet/store";

/**
 * The agent floating layer, lazy-mounted from App.tsx next to the Toaster
 * (PORT_PLAN.md §3.6, §4 row 6).
 *
 * - Tile is visible by default per session (`tileOpen` initial true) —
 *   faithful: the prototype's default entry is the tile, not FAB-only.
 * - X → FAB; FAB → tile (bucket expansion resets because the tile remounts).
 * - Both are hidden while `pathname.startsWith("/agent")` — one pathname rule
 *   replaces the prototype's three mechanisms (divergence F7). Entering
 *   /agent also sets `tileOpen = false`, so LEAVING the agent surface reveals
 *   the FAB, exactly like the prototype's `closeFleetBotTile()` on entry.
 * - Also hidden on the unauthenticated fullscreen routes (/auth, /welcome) —
 *   the prototype had no auth concept, so this has no fidelity counterpart.
 * - Also hosts the store-routed FleetActionModal single mount, so any surface
 *   (Automations tiles live on /agent) opens it by dispatch.
 */
const AgentFloating = () => {
  const { pathname } = useLocation();
  const tileOpen = useAgentStore((s) => s.tileOpen);
  const setTileOpen = useAgentStore((s) => s.setTileOpen);
  const isActionBarVisible = useIsActionBarVisible();

  const onAgentSurface = pathname.startsWith("/agent");
  const onAuthSurface = pathname.startsWith("/auth") || pathname.startsWith("/welcome");

  useEffect(() => {
    if (onAgentSurface) setTileOpen(false);
  }, [onAgentSurface, setTileOpen]);

  return (
    <>
      {onAgentSurface || onAuthSurface ? null : (
        <div
          data-testid="agent-floating"
          className={clsx(
            "fixed right-6 z-60 transition-[bottom] duration-200",
            isActionBarVisible ? "bottom-24 phone:bottom-30 tablet-only:bottom-30" : "bottom-6",
          )}
        >
          {tileOpen ? <FleetBotTile /> : <AgentFab />}
        </div>
      )}
      {/* Store-routed modal single mounts — dispatched from any surface
          (page, tile, banners), per PORT_PLAN.md §2 / §3.2. AgentFloating
          only mounts when AGENT_ENABLED; on flag-off /agent deep-links,
          AgentPage mounts these instead. */}
      <FleetActionModal />
      <AgentDetailModal />
    </>
  );
};

export default AgentFloating;
