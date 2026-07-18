import { useLayoutEffect, useRef } from "react";
import ChatTurn from "@/protoFleet/features/agent/components/chat/ChatTurn";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";

/**
 * Chat landing surface (proto-nav-chat.md §3.1, §5.4): empty above the
 * composer until the first send, then the top-aligned turn log. The feed
 * scroll container lives here so scroll-to-bottom tracks every chat-log
 * render (checklist §11.13) — including the thinking → card replace-in-place,
 * which changes content height without changing the log length.
 *
 * Turns keep the prototype's double inset: this container pads 40px and each
 * turn pads another 40px, so the effective landing inset is 80px (§5.5 note —
 * preserved deliberately).
 */
const ChatLanding = () => {
  const chatLog = useAgentStore((s) => s.chatLog);
  const feedRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const feed = feedRef.current;
    if (feed) feed.scrollTop = feed.scrollHeight;
  }, [chatLog]);

  return (
    <div ref={feedRef} className="min-h-0 flex-1 overflow-y-auto" data-testid="agent-chat-landing">
      {chatLog.length > 0 ? (
        <div className="flex max-w-[1280px] flex-col gap-6 px-10 pt-8 pb-12">
          {chatLog.map((turn) => (
            <ChatTurn key={turn.id} turn={turn} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ChatLanding;
