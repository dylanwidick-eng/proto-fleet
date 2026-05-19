import type { Channel, Rule } from "@/protoFleet/features/notifications/types";

// "When" column for the rule list. Matches the prototype's conditionLabel.
// Example: "hashrate < 80 for 600s on group grp_dalton_bottom"
export const formatRuleCondition = (rule: Rule): string => {
  if (rule.template === "custom") return "Custom PromQL";

  const kind = rule.scope.kind;
  const target = rule.scope.target_id ?? rule.scope.group_id;
  let scopeLabel: string;
  if (kind === "all") scopeLabel = "all devices";
  else if (kind === "devices") scopeLabel = `${(rule.scope.device_ids ?? []).length} devices`;
  else if (kind === "pool")
    scopeLabel = `pool ${target ? target.replace(/^stratum\+tcp:\/\//, "") : "—"}`;
  else scopeLabel = `${kind} ${target ?? "—"}`;

  const comparator = rule.threshold.comparator ?? "";
  const value = rule.threshold.value ?? "";
  return `${rule.template} ${comparator} ${value} for ${rule.threshold.duration_seconds}s on ${scopeLabel}`
    .replace(/\s+/g, " ")
    .trim();
};

// "Then" column — channel names, or em-dash placeholder.
export const formatRuleChannels = (rule: Rule, channels: Channel[]): string => {
  if (!rule.channel_ids?.length) return "—";
  return rule.channel_ids
    .map((id) => channels.find((c) => c.id === id)?.name ?? id)
    .join(", ");
};
