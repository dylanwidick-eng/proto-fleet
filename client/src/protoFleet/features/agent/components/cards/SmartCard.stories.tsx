import type { Meta } from "@storybook/react-vite";

import SmartCard from "@/protoFleet/features/agent/components/cards/SmartCard";
import { AGENT_ITEMS } from "@/protoFleet/features/agent/lib/agentItems";
import { AGENT_TURNS_ACTIVITY } from "@/protoFleet/features/agent/lib/agentTurns";

const meta = {
  title: "Proto Fleet/Agent/SmartCard",
  component: SmartCard,
} satisfies Meta<typeof SmartCard>;

export default meta;

/**
 * All 14 seeded AGENT_ITEMS in the standard horizontal 60/40 layout.
 * Note the intentionally EMPTY viz panes on the five non-calendar callout
 * items (proto-smart-cards.md §7.2 — deliberate design, not a bug).
 */
export const AllSeededItems = () => (
  <div className="grid max-w-[1100px] grid-cols-2 gap-3">
    {AGENT_ITEMS.map((item) => (
      <SmartCard key={item.id} item={item} context="story" />
    ))}
  </div>
);

/** Thread-turn card payloads, including the "MAY 6" calendar-tile callout. */
export const ThreadTurnCards = () => (
  <div className="grid max-w-[1100px] grid-cols-2 gap-3">
    {AGENT_TURNS_ACTIVITY.map((turn) => (
      <SmartCard key={turn.card.id} item={turn.card} context="story-turn" />
    ))}
  </div>
);

/** Miners page-insight variant: 200px columns, 120px viz thumbnail on top. */
export const VerticalLayout = () => (
  <div className="grid auto-cols-[200px] grid-flow-col gap-3">
    {AGENT_ITEMS.slice(0, 5).map((item) => (
      <SmartCard key={item.id} item={item} context="story-vertical" layout="vertical" />
    ))}
  </div>
);
