import SmartCard from "@/protoFleet/features/agent/components/cards/SmartCard";
import { useAgentStore, useVisibleAgentItems } from "@/protoFleet/features/agent/store/agentStore";

/**
 * Insights section of the /agent screen (proto-smart-cards.md §6.2): the
 * standalone proactive surface — a flat grid of ALL visible pending items.
 * No state chips, no category filter, no bucketing.
 */
const InsightsView = () => {
  const allVisible = useVisibleAgentItems();
  const itemStates = useAgentStore((s) => s.itemStates);
  const items = allVisible.filter((item) => (itemStates[item.id]?.state ?? "pending") === "pending");

  return (
    <div className="flex w-full max-w-[1280px] flex-col gap-5 px-10 pt-8 pb-12">
      <h1 className="text-heading-300 text-text-primary">Insights</h1>
      {items.length === 0 ? (
        <p className="text-200 text-text-primary-50">No insights right now — everything's behaving.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
          {items.map((item) => (
            <SmartCard key={item.id} item={item} context="insights" />
          ))}
        </div>
      )}
    </div>
  );
};

export default InsightsView;
