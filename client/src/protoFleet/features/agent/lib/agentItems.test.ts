import { describe, expect, it } from "vitest";
import { AGENT_ITEMS, getAgentItem } from "@/protoFleet/features/agent/lib/agentItems";
import { AGENT_THREADS } from "@/protoFleet/features/agent/lib/agentThreads";
import { AGENT_TURNS_ACTIVITY } from "@/protoFleet/features/agent/lib/agentTurns";
import { FLEET_ACTION_KEYS, FLEET_ACTIONS } from "@/protoFleet/features/agent/lib/fleetActions";
import { createSeedWorkflows } from "@/protoFleet/features/agent/lib/seedWorkflows";
import { SUGGESTION_CHIPS } from "@/protoFleet/features/agent/lib/suggestionChips";

/**
 * Transcription guard — counts and unicode-heavy spot strings that break if
 * anyone "fixes" the verbatim prototype copy (PORT_PLAN.md §6: `·`, `–`, `—`,
 * `−` minus, `°C`, `×` are load-bearing).
 */
describe("verbatim data counts", () => {
  it("has 14 agent items, 5 activity turns, 6 threads, 6 chips, 5 fleet actions, 3 seed workflows", () => {
    expect(AGENT_ITEMS).toHaveLength(14);
    expect(AGENT_TURNS_ACTIVITY).toHaveLength(5);
    expect(AGENT_THREADS).toHaveLength(6);
    expect(SUGGESTION_CHIPS).toHaveLength(6);
    expect(Object.keys(FLEET_ACTIONS)).toHaveLength(5);
    expect(FLEET_ACTION_KEYS).toEqual(["reboot", "curtail", "firmware", "off", "blink"]);
    expect(createSeedWorkflows(0)).toHaveLength(3);
  });

  it("has unique item ids and a working lookup", () => {
    expect(new Set(AGENT_ITEMS.map((i) => i.id)).size).toBe(14);
    expect(getAgentItem("energy-power-spike")?.title).toBe("Power costs +35%");
    expect(getAgentItem("turn-reboot-a7")).toBeUndefined();
  });

  it("keeps 7 items with workflow promotion defaults, 2 of them schedule-type", () => {
    const withWorkflow = AGENT_ITEMS.filter((i) => i.workflow);
    expect(withWorkflow.map((i) => i.id)).toEqual([
      "network-offline-17",
      "diag-hot-9",
      "inv-fans",
      "sec-weak-pwd",
      "pools-need-pool",
      "pattern-weekday-curtail",
      "pattern-sunday-reboot",
    ]);
    expect(withWorkflow.filter((i) => i.workflow?.triggerType === "schedule").map((i) => i.id)).toEqual([
      "pattern-weekday-curtail",
      "pattern-sunday-reboot",
    ]);
  });
});

describe("unicode-heavy spot strings survive verbatim", () => {
  it("energy-power-spike: en dash range, minus-sign hashrate, dollar impact", () => {
    const item = getAgentItem("energy-power-spike");
    expect(item?.sub).toBe("Price spike expected from 3–6 PM");
    expect(item?.impact.hashrate).toBe("−9.3 PH/s during window");
    expect(item?.impact.dollars).toBe("+$1,840 net vs continuing");
    expect(item?.source).toBe("ERCOT day-ahead · live");
  });

  it("weather-high-temp: °C in sub and viz callout", () => {
    const item = getAgentItem("weather-high-temp");
    expect(item?.sub).toBe("39°C forecast tomorrow");
    expect(item?.viz).toEqual({ type: "callout", value: "39°C", sub: "tomorrow peak" });
  });

  it("diag-hot-9: — em dash in signal, >85°C threshold copy", () => {
    const item = getAgentItem("diag-hot-9");
    expect(item?.title).toBe("9 miners over 85°C");
    expect(item?.signal).toContain(">85°C for 47 min");
    expect(item?.signal).toContain("above 80°C — extended exposure");
  });

  it("pattern cards: × multiplication sign in callouts, middle dots in sub/source", () => {
    expect(getAgentItem("pattern-weekday-curtail")?.viz).toEqual({
      type: "callout",
      value: "47×",
      sub: "manual curtailments",
    });
    expect(getAgentItem("pattern-sunday-reboot")?.viz).toEqual({
      type: "callout",
      value: "8×",
      sub: "Sundays in a row",
    });
    expect(getAgentItem("pattern-weekday-curtail")?.sub).toBe("47 manual curtailments over 6 weeks · pattern matched");
  });

  it("fw-update keeps comma-formatted counts and pie labels", () => {
    const item = getAgentItem("fw-update");
    expect(item?.sub).toBe("3,989 miners need update to v4.2.1");
    expect(item?.viz).toEqual({ type: "pie", data: [3989, 1611], labels: ["v4.1.x", "v4.2.1"] });
  });

  it("inv-fans bar labels keep en dashes and > sign", () => {
    expect(getAgentItem("inv-fans")?.viz).toEqual({
      type: "bar",
      data: [45, 18, 37],
      labels: ["0–5%", "5–10%", ">10%"],
    });
  });
});

describe("fleet action verbatim spots", () => {
  it("reboot promote rule uses PLAIN '>' strings (divergence F5 — no HTML entities)", () => {
    expect(FLEET_ACTIONS.reboot.promoteRule.whenText).toBe("Miners are in pool-warning for >2h");
    expect(FLEET_ACTIONS.reboot.promoteRule.thenTemplate).toBe(
      "Reboot in batches of {batch}, hold {hold}, abort if >3 fail in a row",
    );
    expect(FLEET_ACTIONS.reboot.promoteRule.whenText).not.toContain("&gt;");
  });

  it("every config carries its own key and matching copy fields", () => {
    for (const key of FLEET_ACTION_KEYS) {
      expect(FLEET_ACTIONS[key].key).toBe(key);
      expect(FLEET_ACTIONS[key].copy.pastTense.length).toBeGreaterThan(0);
    }
  });

  it("off action has no {batch}/{hold} placeholders (faithful)", () => {
    expect(FLEET_ACTIONS.off.promoteRule.thenTemplate).toBe(
      "Power off automatically and open a parts replacement ticket",
    );
  });

  it("firmware cohort is 3,989 with the CVE string intact", () => {
    expect(FLEET_ACTIONS.firmware.cohort.count).toBe(3989);
    expect(FLEET_ACTIONS.firmware.cohort.reason).toContain("CVE-2026-4419");
    expect(FLEET_ACTIONS.firmware.refineChips[0].label).toBe("All v4.1.x (3,989)");
  });
});

describe("seed workflows", () => {
  it("keeps the three seed names and relative timestamps", () => {
    const seeds = createSeedWorkflows(1_000_000_000_000);
    expect(seeds.map((w) => w.name)).toEqual([
      "ERCOT DR curtailment",
      "Off-peak firmware updates",
      "Daily health report",
    ]);
    expect(seeds.map((w) => w.id)).toEqual(["wf_seed_dr", "wf_seed_firmware", "wf_seed_report"]);
    expect(seeds[0].whenText).toBe("Mon–Fri, 2:00–5:00 PM");
    expect(seeds[0].createdAt).toBe(1_000_000_000_000 - 7 * 86_400_000);
    expect(seeds[2].lastFiredAt).toBe(1_000_000_000_000 - 3_600_000);
    expect(seeds.map((w) => w.fireCount)).toEqual([12, 4, 21]);
  });
});
