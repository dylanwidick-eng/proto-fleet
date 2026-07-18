/**
 * Frozen cross-package contract for the agent design prototype
 * (`features/agent`). Every P2–P7 package codes against these shapes; after
 * P1 lands, changes go through the P1 owner (PORT_PLAN.md §8).
 *
 * The shapes mirror the proto-hub prototype's data verbatim (see
 * proto-smart-cards.md §1, proto-automations.md §1, proto-action-modals.md
 * §2) expressed as a plausible future API contract: id-keyed maps and
 * epoch-ms timestamps, like the alerts precedent.
 */

// ── Smart-card items ────────────────────────────────────────────────────────

/** Right-pane visual spec for a smart card. Absent viz ⇒ empty pane. */
export type Viz =
  | { type: "callout"; value: string; sub: string } // calendar tile ("MAY 6") or intentionally EMPTY pane
  | { type: "rack-grid"; total: number; affected: number }
  | { type: "pie"; data: number[]; labels: string[] }
  | { type: "bar"; data: number[]; labels: string[]; threshold?: number }
  | { type: "comparison"; data: number[]; labels: string[] }
  | { type: "dualbar"; data: number[]; labels: string[] }; // engine supports; unused in seed data

export type Weekday = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface WorkflowSchedule {
  days: Weekday[];
  /** 24h "HH:MM", e.g. "14:00". */
  startTime?: string;
  endTime?: string;
}

/** Promotion defaults carried by items whose detail modal offers "Automate". */
export interface AgentItemWorkflow {
  defaultName: string;
  /** Absent ⇒ "condition" (free-text When). */
  triggerType?: "schedule";
  whenText?: string;
  schedule?: WorkflowSchedule;
  thenText: string;
}

/** Detail-modal Impact grid; only truthy cells render (dollars→"Net", extra→"Notes"). */
export interface AgentItemImpact {
  devices?: string;
  hashrate?: string;
  dollars?: string;
  extra?: string;
}

export interface AgentItem {
  /** Stable slug, e.g. "energy-power-spike". */
  id: string;
  /** Category label — detail modal header + Tasks filtering. Not shown on the card. */
  cat: string;
  title: string;
  sub?: string;
  /** Location context — detail modal header only. */
  site: string;
  /** Primary button label on the card (fallback "View"). */
  action: string;
  /** DORMANT provenance string — no surface renders it (proto-smart-cards.md §2.6). */
  source?: string;
  /** Detail modal "Why this fired" body. */
  signal: string;
  /** Detail modal "Proposed action" body. */
  plan: string;
  impact: AgentItemImpact;
  viz?: Viz;
  /** Presence enables the "Automate" button in the detail modal. */
  workflow?: AgentItemWorkflow;
}

// ── Card runtime state ──────────────────────────────────────────────────────

export type AgentCardState = "pending" | "running" | "completed" | "dismissed" | "snoozed" | "automated";

/** Per-card runtime state entry; default is `{ state: "pending" }` when absent. */
export interface AgentStateEntry {
  state: AgentCardState;
  acceptedAt?: number;
  completedAt?: number;
  dismissedAt?: number;
  dismissReason?: string;
  snoozedAt?: number;
  snoozeKey?: string;
  snoozeLabel?: string;
  automatedAt?: number;
  workflowId?: string;
}

// ── Workflows (automations) ─────────────────────────────────────────────────

export type WorkflowTriggerType = "schedule" | "condition";
export type WorkflowScope = "all" | "this";

export interface Workflow {
  /** `wf_${Date.now().toString(36)}` (or "wf_seed_*" for seeds). */
  id: string;
  name: string;
  triggerType: WorkflowTriggerType;
  /** Human-readable trigger ("Mon–Fri, 2:00 PM–5:00 PM" / "Miners are in pool-warning for >2h"). */
  whenText: string;
  /** Present only for triggerType "schedule". */
  schedule: WorkflowSchedule | null;
  thenText: string;
  scope: WorkflowScope;
  /** Agent recommendation id this was promoted from, or null. */
  sourceItemId: string | null;
  /** "all" or a site label like "Dalton, GA". */
  site: string;
  cat: string;
  createdAt: number;
  lastFiredAt: number | null;
  fireCount: number;
  paused: boolean;
}

// ── Chat ────────────────────────────────────────────────────────────────────

/**
 * Ephemeral chat-log turn. `role: "user"` carries `text`; agent turns carry
 * either `thinking: true` (temporary placeholder), a `cardId`, or `text`
 * (the fallback sentence).
 */
export interface ChatTurn {
  id: string;
  role: "user" | "agent";
  text?: string;
  cardId?: string;
  thinking?: boolean;
}

/** Canned response payload picked by the keyword matchers. */
export type AgentChatResponse = { cardId: string } | { text: string };

export interface AgentThread {
  id: string;
  label: string;
  timeAgo: string;
}

// ── Thread activity feed (canned AGENT_TURNS_ACTIVITY) ──────────────────────

export type BotIcon = "reboot" | "energy" | "settings" | "pool";

export type ActivityTaskState = "done" | "running" | "pending";

export interface ActivityTaskTreeItem {
  state: ActivityTaskState;
  text: string;
  subtext?: string;
}

export interface ActivityTaskList {
  count: number;
  time: string;
}

/** Lightweight card payload carried by a thread turn (subset of AgentItem). */
export interface ActivityCard {
  id: string;
  cat: string;
  site: string;
  action: string;
  title: string;
  sub: string;
  viz: Viz;
}

export interface ActivityTurn {
  bot: string;
  botIcon: BotIcon;
  card: ActivityCard;
  taskList?: ActivityTaskList;
  taskTree?: ActivityTaskTreeItem[];
}

// ── Fleet actions ───────────────────────────────────────────────────────────

export type FleetActionKey = "reboot" | "curtail" | "firmware" | "off" | "blink";

export interface FleetActionChip {
  label: string;
  active: boolean;
  /** Data-only flag from the prototype — no visual treatment exists. */
  danger?: boolean;
}

export interface FleetActionCohort {
  count: number;
  unit: string;
  reason: string;
}

export interface FleetActionCopy {
  progressTitle: string;
  completeTitle: string;
  /** e.g. "rebooted" — status line, tally, receipts. */
  pastTense: string;
  successText: string;
  failureText: string;
}

/**
 * "Automate this?" promotion defaults. when/then are PLAIN ">" strings
 * rendered as JSX text — no HTML entities (PORT_PLAN.md divergence F5).
 */
export interface FleetActionPromoteRule {
  whenText: string;
  /** Contains `{batch}` and `{hold}` placeholders (except "off"). */
  thenTemplate: string;
  name: string;
  cat: string;
}

export interface FleetActionConfig {
  key: FleetActionKey;
  title: string;
  subtitle: string;
  runLabel: string;
  verb: string;
  cohort: FleetActionCohort;
  /** Multi-select toggles; cosmetic — feed the "Cohort:" receipt only. */
  refineChips: FleetActionChip[];
  /** Single-select. "All at once" ⇒ batchSize = total (divergence F3). */
  batchChips: FleetActionChip[];
  /** Single-select; display-only (hold never affects sim timing). */
  holdChips: FleetActionChip[];
  /** Display-only abort criterion. */
  abort: string;
  copy: FleetActionCopy;
  promoteRule: FleetActionPromoteRule;
}

export type FleetExecEventTone = "info" | "rebooted" | "failed";

export interface FleetExecEvent {
  tone: FleetExecEventTone;
  text: string;
  /** Epoch ms of the event (relative times are recomputed each render and age live). */
  t: number;
}

/** Live simulation state owned by `useFleetActionRun` (P6). */
export interface FleetExecState {
  total: number;
  batchSize: number;
  queued: number;
  inFlight: number;
  /** Generic success counter for ALL actions (prototype name kept). */
  rebooted: number;
  failed: number;
  /** Newest-first, capped at 60. */
  events: FleetExecEvent[];
  flaggedIds: string[];
  pendingIds: string[];
  inFlightIds: { id: string; ticksInFlight: number }[];
  paused: boolean;
  done: boolean;
  stopped: boolean;
  startedAt: number;
}

/** Persisted per-action run history (drives promote-banner copy). */
export interface FleetActionRunRecord {
  count: number;
  lastRunAt: number;
}

// ── Agent screen shell ──────────────────────────────────────────────────────

/** Active section of the /agent screen. Store state, not routes. */
export type AgentSection = "chat" | "insights" | "automations" | "tasks";

/** Pages that host an AgentPageInsights module ("home" in the prototype = dashboard here). */
export type PageInsightPage = "dashboard" | "miners" | "energy" | "reports";

// ── SmartCard component contract (frozen; P1 stub → P2 real body) ───────────

/**
 * Anything renderable as a smart card: a full AgentItem or a lightweight
 * thread-turn ActivityCard. The card renders title/sub/action/viz and looks
 * up runtime state + dispatches `openAgentDetail(item.id)` itself via the
 * store — consumers only supply the item and a surface context.
 */
export interface SmartCardItem {
  id: string;
  title: string;
  sub?: string;
  /** Action pill label; falls back to "View". */
  action?: string;
  viz?: Viz;
}

export interface SmartCardProps {
  item: SmartCardItem;
  /**
   * Surface prefix (e.g. "tasks", "insights", "chat-{turnId}",
   * "pageinsight-dashboard") — keeps keys/test ids unique when the same item
   * mounts on several surfaces simultaneously.
   */
  context: string;
  /** "vertical" = miners page-insight variant: 120px viz thumbnail on top (spec §3.5). */
  layout?: "horizontal" | "vertical";
  className?: string;
}
