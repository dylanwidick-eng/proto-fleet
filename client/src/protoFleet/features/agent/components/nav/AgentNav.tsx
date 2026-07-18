import type { ComponentType } from "react";
import clsx from "clsx";
import {
  ChecklistIcon,
  CollapseArrowIcon,
  DisclosureChevronIcon,
  EditIcon,
  type GlyphProps,
  LightningIcon,
  SparkOutlineIcon,
} from "@/protoFleet/features/agent/components/icons";
import { AGENT_THREADS } from "@/protoFleet/features/agent/lib/agentThreads";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { AgentSection } from "@/protoFleet/features/agent/types";

/**
 * Codex-style minimalist top stack (proto-nav-chat.md §2.1). "New chat" is an
 * action row — it never gets the active highlight. There is no "chat" row, so
 * no top row is highlighted on the default landing (§11.10). The Bots tab was
 * deliberately dropped in the prototype; do not add one.
 */
const NAV_TOPS: {
  id: "new-chat" | AgentSection;
  label: string;
  icon: ComponentType<GlyphProps>;
  isAction?: boolean;
}[] = [
  { id: "new-chat", label: "New chat", icon: EditIcon, isAction: true },
  { id: "insights", label: "Insights", icon: SparkOutlineIcon },
  { id: "automations", label: "Automations", icon: LightningIcon },
  { id: "tasks", label: "Tasks", icon: ChecklistIcon },
];

/**
 * Agent screen left nav (proto-nav-chat.md §2): 280↔64px column with a 0.22s
 * width transition and — deliberately — NO right border (nav and main read as
 * one white surface). Icon/label inversion rule (§2.4, easy to get
 * backwards): EXPANDED hides the top-stack icons (labels alone carry the
 * row); COLLAPSED shows icons only, centered. The Chat-history disclosure
 * (open by default, session-only) hides entirely when collapsed. Only the
 * collapse state persists (store `navCollapsed`).
 */
const AgentNav = () => {
  const collapsed = useAgentStore((s) => s.navCollapsed);
  const activeSection = useAgentStore((s) => s.activeSection);
  const activeThread = useAgentStore((s) => s.activeThread);
  const historyOpen = useAgentStore((s) => s.chatHistoryOpen);
  const newChat = useAgentStore((s) => s.newChat);
  const setActiveSection = useAgentStore((s) => s.setActiveSection);
  const selectThread = useAgentStore((s) => s.selectThread);
  const toggleChatHistory = useAgentStore((s) => s.toggleChatHistory);
  const setNavCollapsed = useAgentStore((s) => s.setNavCollapsed);

  return (
    <nav
      aria-label="Agent"
      data-testid="agent-nav"
      className={clsx(
        "flex shrink-0 flex-col gap-1 overflow-x-hidden overflow-y-auto bg-surface-base py-4",
        "transition-[width] duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
        collapsed ? "w-16" : "w-[280px]",
      )}
    >
      <div className="flex flex-col gap-0.5">
        {NAV_TOPS.map(({ id, label, icon: Icon, isAction }) => {
          const active = !isAction && id === activeSection;
          return (
            <button
              key={id}
              type="button"
              title={label}
              aria-current={active ? "true" : undefined}
              onClick={() => (isAction ? newChat() : setActiveSection(id as AgentSection))}
              className={clsx(
                "flex w-full cursor-pointer items-center gap-3 text-left transition-colors hover:bg-surface-5",
                collapsed ? "justify-center px-0 py-2.5" : "px-6 py-1.5",
                active && "bg-surface-5",
              )}
            >
              {collapsed ? (
                <span data-testid={`agent-nav-icon-${id}`} className="inline-flex text-text-primary">
                  <Icon size={18} />
                </span>
              ) : (
                <span className="min-w-0 flex-1 truncate text-emphasis-300 text-text-primary">{label}</span>
              )}
            </button>
          );
        })}
      </div>

      {collapsed ? null : (
        <div className="mt-4 flex flex-col gap-0.5">
          <button
            type="button"
            onClick={toggleChatHistory}
            className="flex w-full cursor-pointer items-center justify-between px-6 py-1.5 text-left transition-colors hover:bg-surface-5"
          >
            <span className="text-200 text-text-primary-50">Chat history</span>
            <span className="inline-flex text-text-primary-50">
              <DisclosureChevronIcon open={historyOpen} size={14} />
            </span>
          </button>
          {historyOpen
            ? AGENT_THREADS.map((thread) => {
                const active = activeSection === "chat" && thread.id === activeThread;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    title={thread.label}
                    aria-current={active ? "true" : undefined}
                    onClick={() => selectThread(thread.id)}
                    className={clsx(
                      "flex w-full cursor-pointer items-center gap-3 px-6 py-1.5 text-left transition-colors hover:bg-surface-5",
                      active && "bg-surface-5",
                    )}
                  >
                    <span
                      className={clsx(
                        "min-w-0 flex-1 truncate text-300",
                        active ? "text-text-primary" : "text-text-primary-70",
                      )}
                    >
                      {thread.label}
                    </span>
                    <span className="shrink-0 text-200 text-text-primary-50">{thread.timeAgo}</span>
                  </button>
                );
              })
            : null}
        </div>
      )}

      <button
        type="button"
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        onClick={() => setNavCollapsed(!collapsed)}
        className={clsx(
          "mt-auto flex size-9 cursor-pointer items-center justify-center rounded-lg text-text-primary-50 transition-colors hover:bg-surface-5 hover:text-text-primary",
          collapsed ? "self-center" : "mb-1 ml-3 self-start",
        )}
      >
        {/* Arrow mirrors when collapsed so it points outward (§11.9). */}
        <CollapseArrowIcon className={collapsed ? "-scale-x-100" : undefined} />
      </button>
    </nav>
  );
};

export default AgentNav;
