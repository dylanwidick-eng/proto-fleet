import clsx from "clsx";
import { FLEET_ACTION_ICONS } from "@/protoFleet/features/agent/components/icons";
import { FLEET_ACTION_KEYS } from "@/protoFleet/features/agent/lib/fleetActions";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { FleetActionKey } from "@/protoFleet/features/agent/types";

type DotTone = "loading" | "success" | "warning" | "completed";

interface StatusSpan {
  tone?: DotTone;
  text: string;
}

const DOT_TONES: Record<DotTone, string> = {
  loading: "bg-core-primary-20",
  success: "bg-intent-success-fill",
  warning: "bg-intent-warning-fill",
  completed: "bg-core-primary-fill",
};

/** Tile titles are the short forms, not the config's modal titles (§1.1). */
const TILE_TITLES: Record<FleetActionKey, string> = {
  reboot: "Reboot",
  curtail: "Curtail",
  firmware: "Firmware",
  off: "Off",
  blink: "Blink LEDs",
};

/** Static mock status lines, verbatim (proto-action-modals.md §1.1). */
const TILE_STATUS_LINES: Record<FleetActionKey, StatusSpan[][]> = {
  reboot: [
    [{ tone: "loading", text: "11 rebooting" }],
    [
      { tone: "success", text: "6 repairs" },
      { tone: "warning", text: "2 issues" },
    ],
  ],
  curtail: [[{ text: "Tomorrow, 4 PM" }]],
  firmware: [[{ tone: "loading", text: "32 miners" }], [{ tone: "completed", text: "8 updated today" }]],
  off: [[{ text: "8 miners" }]],
  blink: [[{ text: "0 miners" }]],
};

/**
 * The 5-tile fleet-action row on the Automations page (proto-action-modals.md
 * §1.1). Each tile opens the store-routed FleetActionModal (mounted once in
 * AgentFloating) via `openFleetAction(key)`.
 */
const FleetActionTiles = () => {
  const openFleetAction = useAgentStore((s) => s.openFleetAction);

  return (
    <div className="grid grid-cols-5 overflow-hidden rounded-2xl bg-surface-elevated-base shadow-50">
      {FLEET_ACTION_KEYS.map((key) => {
        const Icon = FLEET_ACTION_ICONS[key];
        return (
          <button
            key={key}
            type="button"
            data-testid={`fleet-action-tile-${key}`}
            onClick={() => openFleetAction(key)}
            className="flex min-h-[140px] cursor-pointer flex-col gap-4 border-r border-border-5 p-6 text-left transition-colors last:border-r-0 hover:bg-surface-base-hover"
          >
            <span className="flex h-6 w-6 items-center justify-center text-text-primary">
              <Icon />
            </span>
            <span className="text-emphasis-400 text-text-primary">{TILE_TITLES[key]}</span>
            <span className="mt-auto flex flex-col gap-1.5">
              {TILE_STATUS_LINES[key].map((line, lineIndex) => (
                <span key={lineIndex} className="inline-flex items-center gap-1.5 text-200 text-text-primary-70">
                  {line.map((span, spanIndex) => (
                    <span key={span.text} className={clsx("inline-flex items-center gap-1.5", spanIndex > 0 && "ml-2")}>
                      {span.tone ? <span className={clsx("h-2 w-2 rounded-full", DOT_TONES[span.tone])} /> : null}
                      {span.text}
                    </span>
                  ))}
                </span>
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default FleetActionTiles;
