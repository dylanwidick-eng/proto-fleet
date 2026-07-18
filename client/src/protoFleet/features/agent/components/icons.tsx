/**
 * Module-local glyphs for `features/agent`, transcribed EXACTLY from the
 * prototype's inline SVGs (proto-hub app.js / proto-nav-chat.md §9). All are
 * `currentColor` line/fill glyphs — color comes from the parent's text token.
 *
 * Owned by P1; consumed by every package. The shared-icon variant of the
 * 4-petal sparkle (`src/shared/assets/icons/Agent.tsx`) is P7's — these are
 * the agent-module-internal ones.
 *
 * Exports (by surface):
 * - Nav sections (18px): `EditIcon`, `SparkOutlineIcon`, `LightningIcon`,
 *   `ChecklistIcon`; filled sparkle `SparkFilledIcon` (nav bot / FAB / tile /
 *   composer chip row / page-insight header). Small nav glyphs (14px):
 *   `ChatThreadIcon`; `CollapseArrowIcon` (mirror via `className`
 *   `-scale-x-100` when collapsed); `DisclosureChevronIcon` (`open` prop).
 * - Bot avatars + fleet-action tiles (20px): `RebootIcon`, `EnergyIcon`,
 *   `SettingsIcon`, `PoolIcon`, `PauseCircleIcon`, `TargetIcon`,
 *   `PowerIcon`, `DotsIcon`; lookup records `BOT_ICONS` (by `BotIcon`) and
 *   `FLEET_ACTION_ICONS` (by `FleetActionKey`).
 * - Tasks filter (16px): `FunnelIcon`.
 * - Automations toolbar (14px): `CalendarIcon`, `ListIcon`, `PlusIcon`,
 *   `ChevronLeftIcon`, `ChevronRightIcon`.
 * - Task tree (20px): `CheckIcon`, `ClockIcon`.
 */
import type { ComponentType } from "react";
import type { BotIcon, FleetActionKey } from "@/protoFleet/features/agent/types";

export interface GlyphProps {
  /** Rendered width/height in px; each glyph's default matches the prototype. */
  size?: number;
  className?: string;
}

const SPARK_PATH =
  "M8.22244 2.57388L8.78959 0.872413C9.17733 -0.290802 10.8227 -0.290805 11.2104 0.87241L11.7776 2.57387C12.6665 5.24076 14.7592 7.33347 17.4261 8.22244L19.1276 8.78959C20.2908 9.17733 20.2908 10.8227 19.1276 11.2104L17.4261 11.7776C14.7592 12.6665 12.6665 14.7592 11.7776 17.4261L11.2104 19.1276C10.8227 20.2908 9.17733 20.2908 8.78959 19.1276L8.22244 17.4261C7.33348 14.7592 5.24077 12.6665 2.57388 11.7776L0.872413 11.2104C-0.290802 10.8227 -0.290805 9.17733 0.87241 8.78959L2.57387 8.22244C5.24076 7.33348 7.33347 5.24077 8.22244 2.57388Z";

/** Canonical 4-petal AI sparkle, filled. */
export const SparkFilledIcon = ({ size = 18, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d={SPARK_PATH} fill="currentColor" />
  </svg>
);

/** 4-petal sparkle, outlined — the nav Insights icon. */
export const SparkOutlineIcon = ({ size = 18, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d={SPARK_PATH} stroke="currentColor" strokeWidth="1.4" fill="none" />
  </svg>
);

/** Pencil-over-line — the "New chat" nav action. */
export const EditIcon = ({ size = 18, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M14.5 3.5l2 2L8 14H6v-2l8.5-8.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M3.5 17h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** Lightning bolt — Automations nav + CurtailBot avatar (at size 20). */
export const LightningIcon = ({ size = 18, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M11 2L4 11h5l-1 7 7-9h-5l1-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

/** Checklist — Tasks nav. */
export const ChecklistIcon = ({ size = 18, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path
      d="M3 5l1.5 1.5L7 4M3 10l1.5 1.5L7 9M3 15l1.5 1.5L7 14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10 5h7M10 10h7M10 15h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** Speech bubble — chat-history thread rows. */
export const ChatThreadIcon = ({ size = 14, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path
      d="M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3.5 3v-3H5a2 2 0 0 1-2-2V5Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Nav collapse arrow (Figma "24/log-out" glyph). When the nav is collapsed,
 * mirror it with `className="-scale-x-100"` so the arrow points outward.
 */
export const CollapseArrowIcon = ({ size = 18, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className} aria-hidden="true">
    <path d="M14.5 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M11 9H3.5M3.5 9l3-3M3.5 9l3 3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Chat-history disclosure chevron: down when open, right when closed. */
export const DisclosureChevronIcon = ({ open, size = 14, className }: GlyphProps & { open: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path
      d={open ? "M5 7.5l5 5 5-5" : "M7.5 5l5 5-5 5"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Bot avatars / fleet-action tiles (20px) ─────────────────────────────────

/** Circular-arrows reboot glyph — RebootBot avatar + Reboot tile. */
export const RebootIcon = ({ size = 20, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path
      d="M3 10a7 7 0 0 1 12-4.95V3M17 10a7 7 0 0 1-12 4.95V17M15 5h-3M5 15h3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Lightning bolt at avatar size — CurtailBot. */
export const EnergyIcon = ({ size = 20, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M11 2L4 11h5l-1 7 7-9h-5l1-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

/** Sun-gear — UpdateBot avatar. */
export const SettingsIcon = ({ size = 20, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M10 1.5v3M10 15.5v3M3.5 3.5l2.1 2.1M14.4 14.4l2.1 2.1M1.5 10h3M15.5 10h3M3.5 16.5l2.1-2.1M14.4 5.6l2.1-2.1"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/** Waves + spire — PoolBot avatar. */
export const PoolIcon = ({ size = 20, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path
      d="M3 12c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0M3 16c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0M10 4l3 4H7l3-4Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** Pause-in-circle — Curtail tile. */
export const PauseCircleIcon = ({ size = 20, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    <rect x="7.5" y="7" width="1.5" height="6" fill="currentColor" />
    <rect x="11" y="7" width="1.5" height="6" fill="currentColor" />
  </svg>
);

/** Concentric target — Firmware tile. */
export const TargetIcon = ({ size = 20, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="1" fill="currentColor" />
  </svg>
);

/** Power symbol — Off tile. */
export const PowerIcon = ({ size = 20, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M10 3v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5.5 6.5a6 6 0 1 0 9 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** Four LED dots — Blink LEDs tile. */
export const DotsIcon = ({ size = 20, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <circle cx="6" cy="6" r="1.4" fill="currentColor" />
    <circle cx="14" cy="6" r="1.4" fill="currentColor" />
    <circle cx="6" cy="14" r="1.4" fill="currentColor" />
    <circle cx="14" cy="14" r="1.4" fill="currentColor" />
  </svg>
);

/** Thread-turn bot avatars by `botIcon` key. */
// eslint-disable-next-line react-refresh/only-export-components -- static component lookup, not shared state
export const BOT_ICONS: Record<BotIcon, ComponentType<GlyphProps>> = {
  reboot: RebootIcon,
  energy: EnergyIcon,
  settings: SettingsIcon,
  pool: PoolIcon,
};

/** Fleet-action tile glyphs, tile-row order. */
// eslint-disable-next-line react-refresh/only-export-components -- static component lookup, not shared state
export const FLEET_ACTION_ICONS: Record<FleetActionKey, ComponentType<GlyphProps>> = {
  reboot: RebootIcon,
  curtail: PauseCircleIcon,
  firmware: TargetIcon,
  off: PowerIcon,
  blink: DotsIcon,
};

// ── Tasks / Automations chrome ──────────────────────────────────────────────

/** Funnel lines — Tasks category-filter button. */
export const FunnelIcon = ({ size = 16, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
    <path d="M2 4h12M4.5 8h7M6.5 12h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** Calendar — Automations view toggle. */
export const CalendarIcon = ({ size = 14, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
    <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/** List rows — Automations view toggle. */
export const ListIcon = ({ size = 14, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
    <path d="M3 4.5h10M3 8h10M3 11.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/** Plus — "Add automation". */
export const PlusIcon = ({ size = 14, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** ‹ — previous month. */
export const ChevronLeftIcon = ({ size = 14, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
    <path
      d="M10 3.5 5.5 8l4.5 4.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** › — next month. */
export const ChevronRightIcon = ({ size = 14, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
    <path
      d="M6 3.5 10.5 8 6 12.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Task tree ───────────────────────────────────────────────────────────────

/** Check — done task-tree step. */
export const CheckIcon = ({ size = 20, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <path d="M5 10l3.5 3.5L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Clock — pending task-tree step. */
export const ClockIcon = ({ size = 20, className }: GlyphProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 6v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
