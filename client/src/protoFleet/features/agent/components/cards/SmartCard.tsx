import type { KeyboardEvent, MouseEvent } from "react";
import clsx from "clsx";
import SmartCardViz from "@/protoFleet/features/agent/components/cards/SmartCardViz";
import { useAgentItemState, useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { SmartCardProps } from "@/protoFleet/features/agent/types";

/**
 * The universal agent-response card (proto-smart-cards.md §2): 60/40
 * stat|viz split, one outlined action pill, status badge only for
 * running/completed. The whole card AND the pill both dispatch
 * `openAgentDetail(item.id)` (stopPropagation on the pill just prevents
 * double-fire); ids not in AGENT_ITEMS no-op silently in the store
 * (PORT_PLAN.md Q1). No thumbs, no source line, no cat/site on the card
 * (§2.6 final state).
 *
 * `layout="vertical"` is the miners page-insight variant (§3.5): 120px viz
 * thumbnail on top, stat block below, no min-height.
 */
const SmartCard = ({ item, context, layout = "horizontal", className }: SmartCardProps) => {
  const { state } = useAgentItemState(item.id);
  const openAgentDetail = useAgentStore((s) => s.openAgentDetail);
  const vertical = layout === "vertical";

  const open = () => openAgentDetail(item.id);
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };
  const handlePillClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    open();
  };

  const viz = (
    <div
      data-testid="smart-card-viz"
      className={clsx(
        "flex items-center justify-center overflow-hidden bg-surface-2 p-3",
        vertical ? "h-[120px] shrink-0" : "flex-[0_0_40%]",
      )}
    >
      <SmartCardViz itemId={item.id} viz={item.viz} />
    </div>
  );

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`smart-card-${context}-${item.id}`}
      onClick={open}
      onKeyDown={handleKeyDown}
      className={clsx(
        "flex cursor-pointer overflow-hidden rounded-xl border border-border-10 bg-surface-elevated-base shadow-100 transition-shadow hover:shadow-200",
        vertical ? "flex-col" : "min-h-[200px] flex-row",
        className,
      )}
    >
      {vertical ? viz : null}
      <div className={clsx("flex min-w-0 flex-col justify-between gap-3 p-4", vertical ? "flex-1" : "flex-[1_1_60%]")}>
        <div className="flex flex-col gap-1.5">
          <div className="text-emphasis-400 text-text-primary">{item.title}</div>
          {item.sub ? <div className="text-200 text-text-primary-70">{item.sub}</div> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePillClick}
            className="h-7 rounded-full px-3 text-200 whitespace-nowrap text-text-primary ring-1 ring-core-primary-50 ring-inset hover:bg-surface-5"
          >
            {item.action || "View"}
          </button>
          {state === "running" ? (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-core-accent-10 px-2 py-[3px] text-emphasis-200 text-text-emphasis">
              <span className="h-[5px] w-[5px] animate-pulse rounded-full bg-core-accent-fill" />
              Running
            </span>
          ) : null}
          {state === "completed" ? (
            <span className="inline-flex items-center rounded-full bg-surface-5 px-2 py-[3px] text-emphasis-200 text-text-primary-50">
              Completed
            </span>
          ) : null}
        </div>
      </div>
      {vertical ? null : viz}
    </div>
  );
};

export default SmartCard;
