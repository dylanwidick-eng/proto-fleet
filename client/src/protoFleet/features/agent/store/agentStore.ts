/**
 * agentStore — single zustand store for the agent design prototype
 * (`features/agent`). THIS COMMENT IS THE CROSS-PACKAGE API: P2–P7 code
 * against the action/selector list below; changes go through the P1 owner
 * (PORT_PLAN.md §5, §8).
 *
 * Persistence: one localStorage key `protoFleet:agentPrototype:v1`
 * (divergence F6). Persisted via `partialize`: `itemStates`, `workflows`,
 * `actionHistory`, `navCollapsed`. Everything else is session-only and
 * resets on refresh (faithful ephemeral semantics). Seed workflows are
 * (re)applied whenever the workflows map is empty — on hydrate and via
 * `seedWorkflowsIfEmpty()` on Automations mount (faithful re-seed-after-
 * revoke-all behavior, documented).
 *
 * Toasts: the store fires ALL prototype toast copy itself (divergence F8 —
 * shared toaster, exact strings). Surfaces must NOT double-toast.
 *
 * ── Actions ─────────────────────────────────────────────────────────────
 * Card state machine (per-item; default entry `{ state: "pending" }`):
 * - `acceptItem(id)`        pending → running (`acceptedAt`), toast
 *                           `Running: {title}`; a 4.5s timer then flips to
 *                           completed (`completedAt`) ONLY if still running.
 *                           The timer is re-armed on rehydrate for the
 *                           remaining time, so a reload can't strand a card.
 * - `dismissItem(id, reason)`   → dismissed (`dismissedAt`, `dismissReason`),
 *                           toast `Dismissed: {title}`.
 * - `snoozeItem(id, key, label)` → snoozed (`snoozedAt`, `snoozeKey`,
 *                           `snoozeLabel`), toast `Snoozed {label}: {title}`.
 *                           Snooze never expires (faithful, documented).
 * - `automateItem(id, workflow)` → automated (`automatedAt`, `workflowId`),
 *                           stores the workflow, toast
 *                           `Automation created: {name}`.
 * Workflows:
 * - `saveWorkflow(workflow, toastMessage?)`  add standalone workflow
 *                           (New-automation modal, promote banner); fires
 *                           ONE toast — `toastMessage` if given (surfaces
 *                           pass their verbatim prototype copy: `Saved:
 *                           {name}` / `Automation saved — visible under
 *                           Automations`), else `Automation created: {name}`.
 * - `toggleWorkflowPause(id)`    flip `paused`, toast `Paused: {name}` /
 *                           `Resumed: {name}`.
 * - `revokeWorkflow(id)`         delete; if `sourceItemId` set, reset that
 *                           item to pending (round-trip); toast
 *                           `Revoked: {name}`.
 * - `seedWorkflowsIfEmpty()`     apply the 3 seeds when the map is empty.
 * Fleet actions:
 * - `recordActionRun(key)`       bump persisted run history (promote copy).
 * - `declinePromote(key)`        hide the promote banner for this action
 *                           this session.
 * Chat (the 700ms timing + epoch guard live in P3's `useAgentChat`):
 * - `sendMessage(text)`          strict no-op (returns null) on
 *                           empty/whitespace; else appends the user turn +
 *                           a thinking placeholder and returns
 *                           `{ turnId, epoch }`.
 * - `resolveThinking(turnId, epoch, response)`  replace the placeholder
 *                           in-place with `{ cardId }` or `{ text }`;
 *                           no-ops if the epoch is stale or the turn is gone.
 * - `newChat()`                  clears the log, bumps `chatEpoch`
 *                           (cancelling in-flight replies), section → chat,
 *                           thread → null.
 * Shell / nav / modals:
 * - `setActiveSection(section)`  section switch (clears `activeThread`).
 * - `selectThread(id)`           open canned thread feed (section → chat).
 * - `toggleChatHistory()`        nav disclosure (session-only, default open).
 * - `setNavCollapsed(collapsed)` 280↔64px nav (persisted).
 * - `setTileOpen(open)`          floating tile ↔ FAB.
 * - `openAgentDetail(id)` / `closeAgentDetail()`   store-routed detail modal.
 * - `openFleetAction(key)` / `closeFleetAction()`  store-routed action modal.
 * - `seedComposer(text)` / `consumeComposerSeed()` Ask-input → composer seed.
 * - `closeInsightModule(page)` / `dismissInsightCard(id)`  page-insight
 *                           banner dismissals (session-only).
 *
 * ── Selector hooks ──────────────────────────────────────────────────────
 * - `useVisibleAgentItems()`     AGENT_ITEMS minus dismissed/snoozed/
 *                           automated (running/completed stay visible).
 * - `usePendingCount()`          count of visible pending items (FAB dot).
 * - `useAgentItemState(id)`      state entry, `{ state: "pending" }` default.
 * - `useWorkflowsList()`         workflows in insertion order.
 * - `usePageInsightItems(page)`  visible pending items for a page-insight
 *                           banner (category filter + per-session
 *                           dismissals; `[]` when the module is closed).
 * Plus `useAgentStore` itself for plain field reads
 * (e.g. `useAgentStore((s) => s.activeSection)`).
 */
import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { AGENT_ITEMS, getAgentItem } from "@/protoFleet/features/agent/lib/agentItems";
import { PAGE_INSIGHT_CATS, PAGE_INSIGHT_MAX } from "@/protoFleet/features/agent/lib/pageInsightConfig";
import { createSeedWorkflows } from "@/protoFleet/features/agent/lib/seedWorkflows";
import type {
  AgentChatResponse,
  AgentItem,
  AgentSection,
  AgentStateEntry,
  ChatTurn,
  FleetActionKey,
  FleetActionRunRecord,
  PageInsightPage,
  Workflow,
} from "@/protoFleet/features/agent/types";
import { pushToast, STATUSES } from "@/shared/features/toaster";

export const AGENT_STORE_KEY = "protoFleet:agentPrototype:v1";

/** Accept → auto-complete delay (proto-smart-cards.md §4.3). */
export const ACCEPT_COMPLETE_MS = 4500;

export interface AgentStore {
  // Persisted
  itemStates: Record<string, AgentStateEntry>;
  workflows: Record<string, Workflow>;
  actionHistory: Partial<Record<FleetActionKey, FleetActionRunRecord>>;
  navCollapsed: boolean;

  // Session-only
  activeSection: AgentSection;
  activeThread: string | null;
  chatHistoryOpen: boolean;
  chatLog: ChatTurn[];
  chatEpoch: number;
  tileOpen: boolean;
  insightModulesClosed: PageInsightPage[];
  insightCardsDismissed: string[];
  promoteDeclined: FleetActionKey[];
  detailItemId: string | null;
  activeFleetAction: FleetActionKey | null;
  pendingComposerSeed: string | null;

  // Card state machine
  acceptItem: (id: string) => void;
  dismissItem: (id: string, reason: string) => void;
  snoozeItem: (id: string, key: string, label: string) => void;
  automateItem: (id: string, workflow: Workflow) => void;

  // Workflows
  saveWorkflow: (workflow: Workflow, toastMessage?: string) => void;
  toggleWorkflowPause: (id: string) => void;
  revokeWorkflow: (id: string) => void;
  seedWorkflowsIfEmpty: () => void;

  // Fleet actions
  recordActionRun: (key: FleetActionKey) => void;
  declinePromote: (key: FleetActionKey) => void;

  // Chat
  sendMessage: (text: string) => { turnId: string; epoch: number } | null;
  resolveThinking: (turnId: string, epoch: number, response: AgentChatResponse) => void;
  newChat: () => void;

  // Shell / nav / modals
  setActiveSection: (section: AgentSection) => void;
  selectThread: (id: string) => void;
  toggleChatHistory: () => void;
  setNavCollapsed: (collapsed: boolean) => void;
  setTileOpen: (open: boolean) => void;
  openAgentDetail: (id: string) => void;
  closeAgentDetail: () => void;
  openFleetAction: (key: FleetActionKey) => void;
  closeFleetAction: () => void;
  seedComposer: (text: string) => void;
  consumeComposerSeed: () => string | null;
  closeInsightModule: (page: PageInsightPage) => void;
  dismissInsightCard: (id: string) => void;
}

/** States hidden from every card surface (proto-nav-chat.md §8.2). */
const HIDDEN_STATES: ReadonlySet<AgentStateEntry["state"]> = new Set(["dismissed", "snoozed", "automated"]);

const acceptTimers = new Map<string, ReturnType<typeof setTimeout>>();

let turnCounter = 0;
const nextTurnId = (): string => `turn_${Date.now().toString(36)}_${++turnCounter}`;

const seedMap = (): Record<string, Workflow> => Object.fromEntries(createSeedWorkflows().map((wf) => [wf.id, wf]));

export const useAgentStore = create<AgentStore>()(
  persist(
    immer((set, get) => ({
      itemStates: {},
      workflows: seedMap(),
      actionHistory: {},
      navCollapsed: false,

      activeSection: "chat",
      activeThread: null,
      chatHistoryOpen: true,
      chatLog: [],
      chatEpoch: 0,
      tileOpen: true,
      insightModulesClosed: [],
      insightCardsDismissed: [],
      promoteDeclined: [],
      detailItemId: null,
      activeFleetAction: null,
      pendingComposerSeed: null,

      acceptItem: (id) => {
        const item = getAgentItem(id);
        if (!item) return;
        set((s) => {
          s.itemStates[id] = { state: "running", acceptedAt: Date.now() };
        });
        pushToast({ message: `Running: ${item.title}`, status: STATUSES.success });
        const existing = acceptTimers.get(id);
        if (existing) clearTimeout(existing);
        acceptTimers.set(
          id,
          setTimeout(() => {
            acceptTimers.delete(id);
            set((s) => {
              const entry = s.itemStates[id];
              // Guard: only flip if the item is STILL running (a dismiss/
              // revoke/reset in the 4.5s window must not be overwritten).
              if (entry?.state === "running") {
                entry.state = "completed";
                entry.completedAt = Date.now();
              }
            });
          }, ACCEPT_COMPLETE_MS),
        );
      },

      dismissItem: (id, reason) => {
        const item = getAgentItem(id);
        if (!item) return;
        set((s) => {
          s.itemStates[id] = { state: "dismissed", dismissedAt: Date.now(), dismissReason: reason };
        });
        pushToast({ message: `Dismissed: ${item.title}`, status: STATUSES.success });
      },

      snoozeItem: (id, key, label) => {
        const item = getAgentItem(id);
        if (!item) return;
        set((s) => {
          s.itemStates[id] = { state: "snoozed", snoozedAt: Date.now(), snoozeKey: key, snoozeLabel: label };
        });
        pushToast({ message: `Snoozed ${label}: ${item.title}`, status: STATUSES.success });
      },

      automateItem: (id, workflow) => {
        const item = getAgentItem(id);
        if (!item) return;
        set((s) => {
          s.workflows[workflow.id] = workflow;
          s.itemStates[id] = { state: "automated", automatedAt: Date.now(), workflowId: workflow.id };
        });
        pushToast({ message: `Automation created: ${workflow.name}`, status: STATUSES.success });
      },

      saveWorkflow: (workflow, toastMessage) => {
        set((s) => {
          s.workflows[workflow.id] = workflow;
        });
        pushToast({
          message: toastMessage ?? `Automation created: ${workflow.name}`,
          status: STATUSES.success,
        });
      },

      toggleWorkflowPause: (id) => {
        const wf = get().workflows[id];
        if (!wf) return;
        const nowPaused = !wf.paused;
        set((s) => {
          s.workflows[id].paused = nowPaused;
        });
        pushToast({ message: `${nowPaused ? "Paused" : "Resumed"}: ${wf.name}`, status: STATUSES.success });
      },

      revokeWorkflow: (id) => {
        const wf = get().workflows[id];
        if (!wf) return;
        set((s) => {
          delete s.workflows[id];
          // Round-trip: the promoted recommendation re-surfaces as pending.
          if (wf.sourceItemId) delete s.itemStates[wf.sourceItemId];
        });
        pushToast({ message: `Revoked: ${wf.name}`, status: STATUSES.success });
      },

      seedWorkflowsIfEmpty: () => {
        if (Object.keys(get().workflows).length > 0) return;
        set((s) => {
          s.workflows = seedMap();
        });
      },

      recordActionRun: (key) => {
        set((s) => {
          const record = s.actionHistory[key];
          s.actionHistory[key] = { count: (record?.count ?? 0) + 1, lastRunAt: Date.now() };
        });
      },

      declinePromote: (key) => {
        set((s) => {
          if (!s.promoteDeclined.includes(key)) s.promoteDeclined.push(key);
        });
      },

      sendMessage: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return null; // strict whitespace no-op (checklist §11.1)
        const turnId = nextTurnId();
        const epoch = get().chatEpoch;
        set((s) => {
          s.chatLog.push({ id: nextTurnId(), role: "user", text: trimmed });
          s.chatLog.push({ id: turnId, role: "agent", thinking: true });
        });
        return { turnId, epoch };
      },

      resolveThinking: (turnId, epoch, response) => {
        set((s) => {
          if (epoch !== s.chatEpoch) return; // New chat cancelled this reply
          const turn = s.chatLog.find((t) => t.id === turnId);
          if (!turn?.thinking) return;
          delete turn.thinking;
          if ("cardId" in response) turn.cardId = response.cardId;
          else turn.text = response.text;
        });
      },

      newChat: () => {
        set((s) => {
          s.chatEpoch += 1;
          s.chatLog = [];
          s.activeSection = "chat";
          s.activeThread = null;
        });
      },

      setActiveSection: (section) => {
        set((s) => {
          s.activeSection = section;
          s.activeThread = null;
        });
      },

      selectThread: (id) => {
        set((s) => {
          s.activeSection = "chat";
          s.activeThread = id;
        });
      },

      toggleChatHistory: () => {
        set((s) => {
          s.chatHistoryOpen = !s.chatHistoryOpen;
        });
      },

      setNavCollapsed: (collapsed) => {
        set((s) => {
          s.navCollapsed = collapsed;
        });
      },

      setTileOpen: (open) => {
        set((s) => {
          s.tileOpen = open;
        });
      },

      openAgentDetail: (id) => {
        // Faithful silent no-op for thread-turn card ids not in AGENT_ITEMS
        // (PORT_PLAN.md resolution R3 / open question Q1).
        if (!getAgentItem(id)) return;
        set((s) => {
          s.detailItemId = id;
        });
      },

      closeAgentDetail: () => {
        set((s) => {
          s.detailItemId = null;
        });
      },

      openFleetAction: (key) => {
        set((s) => {
          s.activeFleetAction = key;
        });
      },

      closeFleetAction: () => {
        set((s) => {
          s.activeFleetAction = null;
        });
      },

      seedComposer: (text) => {
        set((s) => {
          s.pendingComposerSeed = text;
        });
      },

      consumeComposerSeed: () => {
        const seed = get().pendingComposerSeed;
        if (seed !== null) {
          set((s) => {
            s.pendingComposerSeed = null;
          });
        }
        return seed;
      },

      closeInsightModule: (page) => {
        set((s) => {
          if (!s.insightModulesClosed.includes(page)) s.insightModulesClosed.push(page);
        });
      },

      dismissInsightCard: (id) => {
        set((s) => {
          if (!s.insightCardsDismissed.includes(id)) s.insightCardsDismissed.push(id);
        });
      },
    })),
    {
      name: AGENT_STORE_KEY,
      partialize: (s) => ({
        itemStates: s.itemStates,
        workflows: s.workflows,
        actionHistory: s.actionHistory,
        navCollapsed: s.navCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Hydrating an empty persisted map (e.g. after revoking all three
        // seeds last session) re-seeds — faithful prototype behavior.
        state.seedWorkflowsIfEmpty();
        // acceptItem's 4.5s completion timer is in-memory only, but
        // `itemStates` (including `running`) persists — a reload inside the
        // window would otherwise strand the card in "Running" forever.
        // Re-arm each running item's timer for its remaining time, with the
        // same still-running guard as acceptItem.
        for (const [id, entry] of Object.entries(state.itemStates)) {
          if (entry.state !== "running") continue;
          const remaining = Math.max(0, (entry.acceptedAt ?? 0) + ACCEPT_COMPLETE_MS - Date.now());
          acceptTimers.set(
            id,
            setTimeout(() => {
              acceptTimers.delete(id);
              useAgentStore.setState((s) => {
                const current = s.itemStates[id];
                if (current?.state === "running") {
                  current.state = "completed";
                  current.completedAt = Date.now();
                }
              });
            }, remaining),
          );
        }
      },
    },
  ),
);

// ── Selector hooks ──────────────────────────────────────────────────────────

const PENDING_ENTRY: AgentStateEntry = { state: "pending" };

/** Runtime state for one card; stable `{ state: "pending" }` default. */
export const useAgentItemState = (id: string): AgentStateEntry =>
  useAgentStore((s) => s.itemStates[id] ?? PENDING_ENTRY);

/** AGENT_ITEMS minus dismissed/snoozed/automated (running/completed stay). */
export const useVisibleAgentItems = (): AgentItem[] => {
  const itemStates = useAgentStore((s) => s.itemStates);
  return useMemo(
    () => AGENT_ITEMS.filter((item) => !HIDDEN_STATES.has(itemStates[item.id]?.state ?? "pending")),
    [itemStates],
  );
};

/** Count of visible pending items — drives the FAB dot ("9+" cap is the FAB's). */
export const usePendingCount = (): number =>
  useAgentStore((s) =>
    AGENT_ITEMS.reduce((n, item) => ((s.itemStates[item.id]?.state ?? "pending") === "pending" ? n + 1 : n), 0),
  );

/** All workflows in insertion order (seeds first, then user-created). */
export const useWorkflowsList = (): Workflow[] => {
  const workflows = useAgentStore((s) => s.workflows);
  return useMemo(() => Object.values(workflows), [workflows]);
};

/**
 * Items for a page-insight banner: visible + pending + category-allowed +
 * not card-dismissed, first 4 in AGENT_ITEMS priority order. `[]` when the
 * module was closed this session (banner renders nothing either way).
 */
export const usePageInsightItems = (page: PageInsightPage): AgentItem[] => {
  const itemStates = useAgentStore((s) => s.itemStates);
  const modulesClosed = useAgentStore((s) => s.insightModulesClosed);
  const cardsDismissed = useAgentStore((s) => s.insightCardsDismissed);
  return useMemo(() => {
    if (modulesClosed.includes(page)) return [];
    const cats = PAGE_INSIGHT_CATS[page];
    return AGENT_ITEMS.filter(
      (item) =>
        (itemStates[item.id]?.state ?? "pending") === "pending" &&
        !cardsDismissed.includes(item.id) &&
        (cats === null || cats.includes(item.cat)),
    ).slice(0, PAGE_INSIGHT_MAX);
  }, [page, itemStates, modulesClosed, cardsDismissed]);
};
