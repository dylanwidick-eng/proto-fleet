import type { Channel, Rule } from "@/protoFleet/features/notifications/types";

// "When" column for the rule list. Matches the prototype's conditionLabel.
// Example: "hashrate < 80 for 600s on group grp_dalton_bottom"
export const formatRuleCondition = (rule: Rule): string => {
  if (rule.template === "custom") return "Custom PromQL";

  const kind = rule.scope.kind;
  const target = rule.scope.target_id ?? rule.scope.group_id;
  let scopeLabel: string;
  if (kind === "all") scopeLabel = "all miners";
  else if (kind === "devices") scopeLabel = `${(rule.scope.device_ids ?? []).length} miners`;
  else if (kind === "pool") scopeLabel = `pool ${target ? target.replace(/^stratum\+tcp:\/\//, "") : "—"}`;
  else scopeLabel = `${kind} ${target ?? "—"}`;

  const comparator = rule.threshold.comparator ?? "";
  const value = rule.threshold.value ?? "";
  return `${rule.template} ${comparator} ${value} for ${rule.threshold.duration_seconds}s on ${scopeLabel}`
    .replace(/\s+/g, " ")
    .trim();
};

// Scope summary for the Name cell subtext — mirrors the Schedules "Applies to N miners" line.
// Example: "Applies to 4 miners" / "All miners" / "Group grp_dalton_bottom".
export const formatRuleScopeSummary = (rule: Rule): string => {
  const { kind, device_ids } = rule.scope;
  const target = rule.scope.target_id ?? rule.scope.group_id;
  if (kind === "all") return "All miners";
  if (kind === "devices") {
    const count = (device_ids ?? []).length;
    return `Applies to ${count} ${count === 1 ? "miner" : "miners"}`;
  }
  if (kind === "pool") return `Pool ${target ? target.replace(/^stratum\+tcp:\/\//, "") : "—"}`;
  const label = kind.charAt(0).toUpperCase() + kind.slice(1);
  return `${label} ${target ?? "—"}`;
};

// Condition without the scope clause — scope now lives in the Name cell.
// Example: "hashrate < 80 for 600s".
export const formatRuleThreshold = (rule: Rule): string => {
  if (rule.template === "custom") return "Custom PromQL";
  const comparator = rule.threshold.comparator ?? "";
  const value = rule.threshold.value ?? "";
  return `${rule.template} ${comparator} ${value} for ${rule.threshold.duration_seconds}s`.replace(/\s+/g, " ").trim();
};

// Last-triggered subtext for the Condition cell, mirroring the Schedules "next run" line.
export const formatRuleLastFired = (rule: Rule): string => {
  if (!rule.last_fired_at) return "Never triggered";
  const d = new Date(rule.last_fired_at);
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `Last triggered ${date}, ${time}`;
};

// "Then" column — channel names, or em-dash placeholder.
export const formatRuleChannels = (rule: Rule, channels: Channel[]): string => {
  if (!rule.channel_ids?.length) return "—";
  return rule.channel_ids.map((id) => channels.find((c) => c.id === id)?.name ?? id).join(", ");
};
