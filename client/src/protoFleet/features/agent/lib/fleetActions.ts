import type { FleetActionConfig, FleetActionKey } from "@/protoFleet/features/agent/types";

/**
 * FLEET_ACTIONS — the five fleet-action agent configs, verbatim from the
 * prototype (proto-action-modals.md §2), with one sanctioned divergence:
 * promoteRule when/then are stored as PLAIN ">" strings and rendered as JSX
 * text — the prototype's `&gt;` innerHTML entity dance is dropped
 * (PORT_PLAN.md divergence F5; identical rendered output).
 *
 * Configs are deep-copied into local modal state on every open, so chip
 * selections always reset to these defaults.
 */
export const FLEET_ACTIONS: Record<FleetActionKey, FleetActionConfig> = {
  reboot: {
    key: "reboot",
    title: "Reboot agent",
    subtitle:
      "I'll roll through the miners that have been stuck in pool-warning the longest. You can refine the cohort or tweak the cadence before I start.",
    runLabel: "Run reboot",
    verb: "reboot",
    cohort: {
      count: 247,
      unit: "miners",
      reason:
        "These miners have been in pool-warning for >2h across racks R03–R08. Reboot resolves this for ~92% of cases historically.",
    },
    refineChips: [
      { label: "All unhealthy (412)", active: false },
      { label: "R03–R08 only (247)", active: true },
      { label: "R03 only (38)", active: false },
      { label: "Exclude curtailed", active: true },
    ],
    batchChips: [
      { label: "25", active: false },
      { label: "50", active: true },
      { label: "100", active: false },
      { label: "All at once", active: false, danger: true },
    ],
    holdChips: [
      { label: "30s", active: false },
      { label: "1m", active: true },
      { label: "2m", active: false },
      { label: "5m", active: false },
    ],
    abort: ">3 miners fail to come back online in a row",
    copy: {
      progressTitle: "Reboot in progress",
      completeTitle: "Reboot complete",
      pastTense: "rebooted",
      successText: "back online",
      failureText: "didn't return — flagged for review",
    },
    promoteRule: {
      whenText: "Miners are in pool-warning for >2h",
      thenTemplate: "Reboot in batches of {batch}, hold {hold}, abort if >3 fail in a row",
      name: "Auto-reboot pool-warning miners",
      cat: "Network",
    },
  },
  curtail: {
    key: "curtail",
    title: "Curtail agent",
    subtitle:
      "I'll throttle the lowest-efficiency miners during the price-spike window. You can broaden the cohort or shift the cadence before I start.",
    runLabel: "Run curtailment",
    verb: "curtail",
    cohort: {
      count: 247,
      unit: "miners",
      reason:
        "ERCOT day-ahead price hits $128/MWh from 3–6 PM. These bottom-efficiency miners drop below break-even at this price.",
    },
    refineChips: [
      { label: "Bottom 200 (247)", active: true },
      { label: "Bottom 100 (124)", active: false },
      { label: "Dalton, GA only (180)", active: true },
      { label: "Exclude already curtailed", active: true },
    ],
    batchChips: [
      { label: "25", active: false },
      { label: "50", active: true },
      { label: "100", active: false },
      { label: "All at once", active: false, danger: true },
    ],
    holdChips: [
      { label: "30s", active: true },
      { label: "1m", active: false },
      { label: "2m", active: false },
      { label: "5m", active: false },
    ],
    abort: ">3 miners fail to throttle in a row",
    copy: {
      progressTitle: "Curtailment in progress",
      completeTitle: "Curtailment complete",
      pastTense: "curtailed",
      successText: "curtailed to 70%",
      failureText: "didn't throttle — flagged for review",
    },
    promoteRule: {
      whenText: "ERCOT day-ahead price exceeds $100/MWh",
      thenTemplate:
        "Curtail bottom-200 efficiency miners in batches of {batch}, hold {hold}, restore after price window closes",
      name: "Auto-curtail on price spike",
      cat: "Energy",
    },
  },
  firmware: {
    key: "firmware",
    title: "Firmware agent",
    subtitle:
      "I'll stage the v4.2.1 rollout across miners still on v4.1.x. Pick a cohort and batch cadence; I'll auto-rollback if canary hashrate drops.",
    runLabel: "Stage rollout",
    verb: "update",
    cohort: {
      count: 3989,
      unit: "miners",
      reason:
        "Bitmain v4.2.1 patches a high-severity pool-credential leak (CVE-2026-4419). 3,989 miners are still on v4.1.x.",
    },
    refineChips: [
      { label: "All v4.1.x (3,989)", active: true },
      { label: "Building A (1,234)", active: false },
      { label: "Canary 200 only", active: false },
      { label: "Skip maintenance window", active: true },
    ],
    batchChips: [
      { label: "100", active: false },
      { label: "250", active: true },
      { label: "500", active: false },
      { label: "1000", active: false, danger: true },
    ],
    holdChips: [
      { label: "1m", active: false },
      { label: "5m", active: true },
      { label: "15m", active: false },
      { label: "30m", active: false },
    ],
    abort: ">2% hashrate drop in current batch",
    copy: {
      progressTitle: "Firmware rollout in progress",
      completeTitle: "Firmware rollout complete",
      pastTense: "updated",
      successText: "on v4.2.1",
      failureText: "rollback triggered — flagged for review",
    },
    promoteRule: {
      whenText: "A new firmware version is published",
      thenTemplate: "Stage rollout in batches of {batch}, hold {hold}, auto-rollback if >2% hashrate drop",
      name: "Auto-stage firmware updates",
      cat: "Software",
    },
  },
  off: {
    key: "off",
    title: "Power-off agent",
    subtitle:
      "I'll power down miners flagged as unrecoverable so they don't keep wearing components while waiting on parts.",
    runLabel: "Power off",
    verb: "shut down",
    cohort: {
      count: 8,
      unit: "miners",
      reason:
        "These 8 miners have sustained hashboard failures and aren't recoverable via reboot. Powering down prevents further wear until parts arrive.",
    },
    refineChips: [
      { label: "All flagged (8)", active: true },
      { label: "Building C (5)", active: false },
      { label: "Critical only (3)", active: false },
    ],
    batchChips: [
      { label: "2", active: false },
      { label: "4", active: true },
      { label: "All at once", active: false },
    ],
    holdChips: [
      { label: "15s", active: false },
      { label: "30s", active: true },
      { label: "1m", active: false },
    ],
    abort: "Power-off command fails on >1 miner",
    copy: {
      progressTitle: "Powering down miners",
      completeTitle: "Power-down complete",
      pastTense: "powered off",
      successText: "powered off",
      failureText: "didn't power down — flagged for review",
    },
    promoteRule: {
      whenText: "A miner is flagged as unrecoverable (sustained hashboard failures)",
      // No {batch}/{hold} placeholders in this template (faithful).
      thenTemplate: "Power off automatically and open a parts replacement ticket",
      name: "Auto-power-off unrecoverable miners",
      cat: "Hardware",
    },
  },
  blink: {
    key: "blink",
    title: "Locate agent",
    subtitle: "I'll blink the LEDs on the selected miners so the on-site tech can find them in the rack.",
    runLabel: "Blink LEDs",
    verb: "blink",
    cohort: {
      count: 24,
      unit: "miners",
      reason:
        "Pre-staged from the last 'Flagged for review' list — 24 miners across R03–R08 that need a physical walkthrough.",
    },
    refineChips: [
      { label: "Last flagged batch (24)", active: true },
      { label: "R03 only (5)", active: false },
      { label: "R04–R08 only (19)", active: false },
    ],
    batchChips: [
      { label: "1", active: false },
      { label: "5", active: true },
      { label: "All at once", active: false },
    ],
    holdChips: [
      { label: "10s", active: true },
      { label: "30s", active: false },
      { label: "1m", active: false },
    ],
    abort: "Blink command fails on >2 miners",
    copy: {
      progressTitle: "Blinking LEDs",
      completeTitle: "Blink complete",
      pastTense: "blinked",
      successText: "LEDs blinking",
      failureText: "didn't respond — flagged for review",
    },
    promoteRule: {
      whenText: 'Miners are added to the "Flagged for review" list',
      thenTemplate: "Blink their LEDs automatically in batches of {batch}, hold {hold} between batches",
      name: "Auto-blink flagged miners",
      cat: "Operations",
    },
  },
};

/** Tile-row order (proto-action-modals.md §1.1). */
export const FLEET_ACTION_KEYS: FleetActionKey[] = ["reboot", "curtail", "firmware", "off", "blink"];
