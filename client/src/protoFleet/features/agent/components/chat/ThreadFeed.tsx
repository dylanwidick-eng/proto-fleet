import SmartCard from "@/protoFleet/features/agent/components/cards/SmartCard";
import TaskListRow from "@/protoFleet/features/agent/components/chat/TaskListRow";
import TaskTree from "@/protoFleet/features/agent/components/chat/TaskTree";
import { BOT_ICONS } from "@/protoFleet/features/agent/components/icons";
import { AGENT_TURNS_ACTIVITY } from "@/protoFleet/features/agent/lib/agentTurns";
import type { ActivityTurn } from "@/protoFleet/features/agent/types";

interface TurnProps {
  turn: ActivityTurn;
  index: number;
}

const ActivityTurnBlock = ({ turn, index }: TurnProps) => {
  const Avatar = BOT_ICONS[turn.botIcon];
  return (
    <div className="px-10 pt-6">
      <div className="flex items-start gap-4 pb-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-core-primary-fill text-text-contrast">
          <Avatar size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-emphasis-300 text-text-primary">{turn.bot}</div>
          <div className="mt-2 max-w-[560px]">
            <SmartCard item={turn.card} context={`thread-${index}`} />
          </div>
        </div>
      </div>
      {turn.taskList ? <TaskListRow count={turn.taskList.count} time={turn.taskList.time} /> : null}
      {turn.taskTree ? <TaskTree items={turn.taskTree} /> : null}
    </div>
  );
};

/**
 * Canned "Activity" conversation (proto-nav-chat.md §6). EVERY chat-history
 * thread renders this same 5-turn feed — thread switching is visually
 * stubbed, faithful to the prototype. Card ids here are not in AGENT_ITEMS,
 * so clicking them is a silent no-op in the detail modal (PORT_PLAN.md open
 * question Q1 — kept faithful pending Dylan's call).
 */
const ThreadFeed = () => (
  <div className="min-h-0 flex-1 overflow-y-auto pb-6" data-testid="agent-thread-feed">
    {AGENT_TURNS_ACTIVITY.map((turn, index) => (
      <ActivityTurnBlock key={turn.card.id} turn={turn} index={index} />
    ))}
  </div>
);

export default ThreadFeed;
