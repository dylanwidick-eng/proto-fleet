import clsx from "clsx";
import SmartCard from "@/protoFleet/features/agent/components/cards/SmartCard";
import { SparkFilledIcon } from "@/protoFleet/features/agent/components/icons";
import FleetSummaryCard from "@/protoFleet/features/agent/components/pageInsights/FleetSummaryCard";
import { useAgentStore, usePageInsightItems } from "@/protoFleet/features/agent/store/agentStore";
import type { PageInsightPage } from "@/protoFleet/features/agent/types";
import { Dismiss } from "@/shared/assets/icons";

export interface AgentPageInsightsProps {
  page: PageInsightPage;
}

/**
 * "Agent insights" page banner module (proto-smart-cards.md §3): header
 * strip (AI mark + title + dismiss X) above a horizontally scrolling run of
 * smart cards — up to 4 visible PENDING items matched by PAGE_INSIGHT_CATS
 * (running/completed cards never appear here). Fully absent when nothing
 * matches or after the per-session dismiss. The dashboard variant adds the
 * FleetSummaryCard (its only home); the miners variant renders fixed-200px
 * vertical cards (§3.5). Mounted into shell pages at integration (P8).
 */
const AgentPageInsights = ({ page }: AgentPageInsightsProps) => {
  const items = usePageInsightItems(page);
  const closeInsightModule = useAgentStore((s) => s.closeInsightModule);

  // Covers both empty-match and session-dismissed (the selector returns []
  // once the module is closed) — the module disappears entirely, not just
  // its cards.
  if (items.length === 0) return null;

  const vertical = page === "miners";

  return (
    <section data-testid={`agent-page-insights-${page}`} className="mt-1 mb-4 rounded-2xl bg-surface-5 px-6 py-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-core-primary-fill text-text-contrast">
          <SparkFilledIcon size={14} />
        </span>
        <span className="text-emphasis-400 text-text-primary">Agent insights</span>
        <button
          type="button"
          aria-label="Close"
          onClick={() => closeInsightModule(page)}
          className="ml-auto flex size-8 cursor-pointer items-center justify-center rounded-full text-text-primary-50 transition-colors hover:bg-surface-10 hover:text-text-primary"
        >
          <Dismiss width="w-[18px]" />
        </button>
      </div>
      {page === "dashboard" ? <FleetSummaryCard className="mb-4" /> : null}
      <div
        className={clsx(
          "grid [scrollbar-width:none] grid-flow-col gap-3 overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          vertical ? "auto-cols-[200px]" : "auto-cols-[minmax(280px,1fr)]",
        )}
      >
        {items.map((item) => (
          <SmartCard
            key={item.id}
            item={item}
            context={`pageinsight-${page}`}
            layout={vertical ? "vertical" : "horizontal"}
          />
        ))}
      </div>
    </section>
  );
};

export default AgentPageInsights;
