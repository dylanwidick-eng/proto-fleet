// Command catalog, mirroring proto minercommand/v1 CommandType. `highStakes`
// marks the commands whose failure is an incident (default-selected) vs the
// cosmetic ones (Blink LED / Download logs) that are noise when they fail.
export interface CommandKindMeta {
  id: string;
  label: string;
  highStakes: boolean;
}

export const COMMAND_KINDS: CommandKindMeta[] = [
  { id: "reboot", label: "Reboot", highStakes: true },
  { id: "firmware_update", label: "Firmware update", highStakes: true },
  { id: "set_power_target", label: "Set power target", highStakes: true },
  { id: "set_cooling_mode", label: "Set cooling mode", highStakes: true },
  { id: "start_mining", label: "Start mining", highStakes: true },
  { id: "stop_mining", label: "Stop mining", highStakes: true },
  { id: "update_mining_pools", label: "Update mining pools", highStakes: true },
  { id: "update_miner_password", label: "Update password", highStakes: true },
  { id: "blink_led", label: "Blink LED", highStakes: false },
  { id: "download_logs", label: "Download logs", highStakes: false },
];

export const DEFAULT_COMMAND_KIND_IDS = COMMAND_KINDS.filter((k) => k.highStakes).map((k) => k.id);

// Short label for the selected command kinds, used in the live-preview copy.
export const formatCommandKinds = (ids: string[]): string => {
  if (ids.length === 0 || ids.length === COMMAND_KINDS.length) return "commands";
  if (ids.length === 1) {
    const meta = COMMAND_KINDS.find((k) => k.id === ids[0]);
    return meta ? `${meta.label.toLowerCase()} commands` : "commands";
  }
  return "selected commands";
};
