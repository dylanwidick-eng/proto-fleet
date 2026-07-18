import SmartCard from "@/protoFleet/features/agent/components/cards/SmartCard";
import ThinkingDots from "@/protoFleet/features/agent/components/chat/ThinkingDots";
import { RebootIcon } from "@/protoFleet/features/agent/components/icons";
import { getAgentItem } from "@/protoFleet/features/agent/lib/agentItems";
import type { ChatTurn as ChatTurnModel } from "@/protoFleet/features/agent/types";

interface Props {
  turn: ChatTurnModel;
}

/**
 * One chat-log turn (proto-nav-chat.md §5.4–5.5).
 *
 * - User: right-aligned soft bubble, no avatar, newlines preserved.
 * - Agent: 44px dark rounded-square avatar (ALWAYS the reboot glyph in chat,
 *   regardless of card category) + "Fleet bot" name, then the body —
 *   `thinking` overrides everything with the bouncing dots; otherwise a
 *   smart card (when `cardId` resolves) and/or plain text (the fallback
 *   sentence). Each turn mounts its own card keyed by turn id, so duplicate
 *   card replies each get their own chart (divergence F1 — React keys fix
 *   the prototype's chart context collision for free).
 */
const ChatTurn = ({ turn }: Props) => {
  if (turn.role === "user") {
    return (
      <div className="flex justify-end px-10 pt-6" data-testid={`agent-turn-user-${turn.id}`}>
        <div className="max-w-[75%] rounded-[18px] bg-surface-5 px-4 py-2.5 text-300 break-words whitespace-pre-wrap text-text-primary">
          {turn.text}
        </div>
      </div>
    );
  }

  const item = turn.cardId ? getAgentItem(turn.cardId) : undefined;

  return (
    <div className="px-10 pt-6" data-testid={`agent-turn-agent-${turn.id}`}>
      <div className="flex items-start gap-4 pb-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-core-primary-fill text-text-contrast">
          <RebootIcon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-emphasis-300 text-text-primary">Fleet bot</div>
          {turn.thinking ? (
            <ThinkingDots />
          ) : (
            <>
              {item ? (
                <div className="mt-2 max-w-[560px]">
                  <SmartCard item={item} context={`chat-${turn.id}`} />
                </div>
              ) : null}
              {turn.text ? <div className="text-300 text-text-primary">{turn.text}</div> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatTurn;
