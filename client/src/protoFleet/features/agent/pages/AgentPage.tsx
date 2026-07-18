import { useEffect } from "react";
import { AGENT_ENABLED } from "@/protoFleet/constants/featureFlags";
import FleetActionModal from "@/protoFleet/features/agent/components/actions/FleetActionModal";
import AutomationsView from "@/protoFleet/features/agent/components/automations/AutomationsView";
import ChatLanding from "@/protoFleet/features/agent/components/chat/ChatLanding";
import Composer from "@/protoFleet/features/agent/components/chat/Composer";
import ThreadFeed from "@/protoFleet/features/agent/components/chat/ThreadFeed";
import AgentDetailModal from "@/protoFleet/features/agent/components/detail/AgentDetailModal";
import InsightsView from "@/protoFleet/features/agent/components/insights/InsightsView";
import AgentNav from "@/protoFleet/features/agent/components/nav/AgentNav";
import TasksView from "@/protoFleet/features/agent/components/tasks/TasksView";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import { installAgentDevReset } from "@/protoFleet/features/agent/store/devReset";

// Dev-only QA escape hatch for stale persisted demo state (PORT_PLAN.md
// risk #12): installs `window.__agentReset()` once when the agent page
// module loads; no-ops in prod builds.
installAgentDevReset();

/**
 * The single /agent route (proto-nav-chat.md §1). Section/thread selection is
 * store state, not routes — it survives in-session navigation away and back,
 * and resets on refresh (faithful ephemeral semantics).
 *
 * Height note (PORT_PLAN.md §3.1 day-one verification): AppLayout's content
 * region is a `fixed` scroll container with both top and bottom offsets
 * (AppLayout.tsx), so route children have a definite height and `h-full`
 * resolves here — the feed scrolls internally with no double scrollbar and
 * the documented `h-[calc(100vh-…)]` fallback is not needed. The page adds
 * no padding of its own (the prototype's `--page-pad: 0`).
 */
const AgentPage = () => {
  const activeSection = useAgentStore((s) => s.activeSection);
  const activeThread = useAgentStore((s) => s.activeThread);
  const setTileOpen = useAgentStore((s) => s.setTileOpen);

  // Entering /agent closes the floating Fleet-bot tile (the prototype's
  // showScreen('agent') → closeFleetBotTile()), so leaving the page reveals
  // the FAB rather than the tile (§11.15). Idempotent alongside the
  // pathname-driven hiding in AgentFloating (divergence F7).
  useEffect(() => {
    setTileOpen(false);
  }, [setTileOpen]);

  return (
    <div className="flex h-full min-h-0 bg-surface-base" data-testid="agent-page">
      <AgentNav />
      <main className="flex min-w-0 flex-1 flex-col bg-surface-base">
        {activeSection === "chat" ? (
          activeThread !== null ? (
            <ThreadFeed />
          ) : (
            <ChatLanding />
          )
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeSection === "tasks" ? <TasksView /> : null}
            {activeSection === "insights" ? <InsightsView /> : null}
            {activeSection === "automations" ? <AutomationsView /> : null}
          </div>
        )}
        {/* The composer is a chat-only affordance (§11.12): visible on the
            landing AND an open thread feed, hidden on every other section. */}
        {activeSection === "chat" ? <Composer /> : null}
      </main>
      {/* The store-routed modals single-mount inside AgentFloating when the
          flag is on. With the flag OFF, /agent stays deep-linkable (QA
          convention, featureFlags.ts) but AgentFloating never mounts — so
          mount them here instead, preserving the exactly-one-mount
          invariant either way. */}
      {AGENT_ENABLED ? null : (
        <>
          <FleetActionModal />
          <AgentDetailModal />
        </>
      )}
    </div>
  );
};

export default AgentPage;
