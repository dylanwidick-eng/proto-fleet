import { SparkFilledIcon } from "@/protoFleet/features/agent/components/icons";
import { useAgentStore, usePendingCount } from "@/protoFleet/features/agent/store/agentStore";

/**
 * 56px sparkle circle that reopens the Fleet-bot tile (proto-nav-chat.md §7).
 * The red dot is DERIVED from the store's visible-pending count on every
 * render — it can never go stale — and caps its display at "9+".
 */
const AgentFab = () => {
  const setTileOpen = useAgentStore((s) => s.setTileOpen);
  const pending = usePendingCount();

  return (
    <button
      type="button"
      aria-label="Open Fleet bot"
      data-testid="agent-fab"
      onClick={() => setTileOpen(true)}
      className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-border-5 bg-surface-elevated-base text-text-primary shadow-200 transition-transform duration-[180ms] hover:scale-105"
    >
      <SparkFilledIcon size={22} />
      {pending > 0 ? (
        <span
          data-testid="agent-fab-dot"
          className="absolute top-1.5 right-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface-elevated-base bg-intent-critical-fill px-[5px] text-[10px] leading-none font-semibold text-text-base-contrast-static"
        >
          {pending > 9 ? "9+" : String(pending)}
        </span>
      ) : null}
    </button>
  );
};

export default AgentFab;
