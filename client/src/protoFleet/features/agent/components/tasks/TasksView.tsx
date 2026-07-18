import { useMemo, useState } from "react";
import clsx from "clsx";
import SmartCard from "@/protoFleet/features/agent/components/cards/SmartCard";
import CategoryFilter from "@/protoFleet/features/agent/components/tasks/CategoryFilter";
import { useAgentStore, useVisibleAgentItems } from "@/protoFleet/features/agent/store/agentStore";
import type { AgentCardState, AgentItem } from "@/protoFleet/features/agent/types";

type BucketState = Extract<AgentCardState, "pending" | "running" | "completed">;
type StateFilter = "all" | BucketState;

const STATE_FILTERS: { id: StateFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Needs attention" },
  { id: "running", label: "Running" },
  { id: "completed", label: "Recent" },
];

const BUCKETS: { state: BucketState; label: string; emptyText: string }[] = [
  { state: "pending", label: "Needs attention", emptyText: "All caught up" },
  { state: "running", label: "Running", emptyText: "No tasks running" },
  { state: "completed", label: "Recent", emptyText: "No recent activity" },
];

/**
 * Tasks section of the /agent screen (proto-smart-cards.md §6.1): state
 * chips with counts, category multi-select behind the funnel button, and
 * three buckets (Needs attention = pending, Running, Recent = completed).
 * Category filtering is REAL — counts and buckets compute on the filtered
 * set; the category list derives from ALL visible items so every category
 * stays selectable while filters are active.
 */
const TasksView = () => {
  const allVisible = useVisibleAgentItems();
  const itemStates = useAgentStore((s) => s.itemStates);
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const categories = useMemo(() => [...new Set(allVisible.map((item) => item.cat).filter(Boolean))], [allVisible]);

  const buckets = useMemo(() => {
    const filtered =
      selectedCats.length === 0 ? allVisible : allVisible.filter((item) => selectedCats.includes(item.cat));
    const grouped: Record<BucketState, AgentItem[]> = { pending: [], running: [], completed: [] };
    for (const item of filtered) {
      // Visible items only ever hold the three bucket states —
      // dismissed/snoozed/automated are already filtered out upstream.
      const state = itemStates[item.id]?.state ?? "pending";
      if (state === "pending" || state === "running" || state === "completed") grouped[state].push(item);
    }
    return grouped;
  }, [allVisible, itemStates, selectedCats]);

  const countFor = (id: StateFilter): number =>
    id === "all" ? buckets.pending.length + buckets.running.length + buckets.completed.length : buckets[id].length;

  const toggleCat = (cat: string) =>
    setSelectedCats((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));

  return (
    <div className="flex w-full max-w-[1280px] flex-col gap-5 px-10 pt-8 pb-12">
      <h1 className="text-heading-300 text-text-primary">Tasks</h1>
      <div className="flex flex-wrap items-center gap-2">
        {STATE_FILTERS.map((filter) => {
          const active = stateFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={active}
              onClick={() => setStateFilter(filter.id)}
              className={clsx(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-emphasis-200 transition-colors",
                active
                  ? "border-transparent bg-core-primary-fill text-text-contrast"
                  : "border-border-10 bg-surface-base text-text-primary hover:bg-surface-5",
              )}
            >
              <span>{filter.label}</span>
              <span className={active ? "opacity-70" : "text-text-primary-50"}>{countFor(filter.id)}</span>
            </button>
          );
        })}
        <CategoryFilter
          categories={categories}
          selected={selectedCats}
          onToggle={toggleCat}
          onClear={() => setSelectedCats([])}
        />
      </div>
      {BUCKETS.filter((bucket) => stateFilter === "all" || stateFilter === bucket.state).map((bucket) => {
        const items = buckets[bucket.state];
        return (
          <section key={bucket.state} aria-label={bucket.label} className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-heading-50 tracking-wide uppercase">
              <span className="text-text-primary-50">{bucket.label}</span>
              <span className="text-text-primary-30">{items.length}</span>
            </div>
            {items.length === 0 ? (
              <p className="text-200 text-text-primary-50">{bucket.emptyText}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
                {items.map((item) => (
                  <SmartCard key={item.id} item={item} context="tasks" />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default TasksView;
