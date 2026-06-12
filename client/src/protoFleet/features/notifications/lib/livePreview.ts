import { renderAlertEmail } from "@/protoFleet/features/notifications/lib/emailTemplate";
import { RULE_SCOPE_TARGET_LABELS } from "@/protoFleet/features/notifications/lib/ruleTemplates";
import type { NotificationSeverity } from "@/protoFleet/features/notifications/lib/seedNotificationActivity";
import type { RuleScopeKind, RuleTemplate } from "@/protoFleet/features/notifications/types";

export interface LivePreviewInput {
  template: RuleTemplate;
  scope: RuleScopeKind;
  scopeTargetLabel: string | null;
  thresholdValue: string;
  thresholdDuration: string;
  channelNames: string[];
  customExpr: string;
  ruleName?: string;
  recipientNames?: string[];
}

export interface LivePreview {
  severity: NotificationSeverity;
  subject: string;
  summary: string;
  slack: string;
  sms: string;
  channelsDelivered: string;
  /** Full rendered HTML email, for a rich preview in an iframe. */
  emailHtml: string;
}

const SEVERITY_EMOJI: Record<NotificationSeverity, string> = {
  critical: "🔴",
  warning: "⚠️",
  info: "ℹ️",
  resolved: "✅",
};

const DEFAULT_SEVERITY: Record<RuleTemplate, NotificationSeverity> = {
  offline: "critical",
  temperature: "critical",
  hashrate: "warning",
  pool: "critical",
  command_failure: "warning",
  hardware_error: "critical",
  energy: "warning",
  custom: "info",
};

// Demonstration counts that feel realistic at each scope. Used so the
// preview reads as a concrete example, not a template with `{count}` slots.
const DEMO_COUNT: Record<RuleScopeKind, number> = {
  all: 52,
  site: 47,
  building: 12,
  rack: 3,
  group: 4,
  devices: 1,
  pool: 87,
  schedule: 8,
};

const scopePhrase = (scope: RuleScopeKind, target: string | null): string => {
  switch (scope) {
    case "all":
      return "fleet-wide across 3 sites";
    case "site":
      return target ?? "Denver";
    case "building":
      return target ?? "Building A, Denver";
    case "rack":
      return target ?? "Rack R07, Building A, Denver";
    case "group":
      return target ? `"${target}"` : '"Night shift safe"';
    case "pool":
      return target ?? "Braiins (primary)";
    case "schedule":
      return target ? `"${target}"` : '"Weekday ramp-up"';
    case "devices":
      return "selected miners";
    default:
      return "—";
  }
};

const scopeShortLabel = (scope: RuleScopeKind, target: string | null): string => {
  const meta = RULE_SCOPE_TARGET_LABELS[scope];
  if (target) return target;
  if (meta) return `a ${meta.toLowerCase()}`;
  return scope === "all" ? "all miners" : "selected miners";
};

const minutes = (durationStr: string): number => {
  const s = parseInt(durationStr, 10);
  if (!Number.isFinite(s) || s <= 0) return 5;
  return Math.max(1, Math.round(s / 60));
};

const compose = (input: LivePreviewInput): { summary: string; slack: string; sms: string } => {
  const { template, scope, scopeTargetLabel, thresholdValue, thresholdDuration } = input;
  const count = DEMO_COUNT[scope];
  const where = scopePhrase(scope, scopeTargetLabel);
  const mins = minutes(thresholdDuration);
  const threshold = thresholdValue || "—";

  if (template === "offline") {
    if (scope === "devices") {
      return {
        summary: `M0001 went offline ${mins} min ago — ${where}`,
        slack: `M0001 went offline ${mins} min ago (${where}).`,
        sms: `PROTO FLEET: M0001 offline ${mins}m. ${where}.`,
      };
    }
    return {
      summary: `${count} miners offline for >${mins} min on ${where}`,
      slack: `${count} miners offline on ${where}. Duration: ${mins} min.`,
      sms: `PROTO FLEET: ${count} miners offline - ${where}. ${mins}m.`,
    };
  }

  if (template === "temperature") {
    return {
      summary: `${count} miners above ${threshold}°C chip temp on ${where}`,
      slack: `${count} miners above ${threshold}°C on ${where} (sustained ${mins} min).`,
      sms: `PROTO FLEET: ${count} miners >${threshold}C - ${where}.`,
    };
  }

  if (template === "hashrate") {
    return {
      summary: `${where} hashrate ${threshold}% below expected (${count} miners affected)`,
      slack: `${where}: hashrate ${threshold}% below expected. ${count} miners affected.`,
      sms: `PROTO FLEET: ${where} hashrate -${threshold}%. ${count} miners.`,
    };
  }

  if (template === "pool") {
    return {
      summary: `Pool disconnect on ${where} — ${count} miners affected`,
      slack: `${count} miners lost pool connection on ${where}.`,
      sms: `PROTO FLEET: ${count} miners pool down - ${where}.`,
    };
  }

  if (template === "command_failure") {
    return {
      summary: `Command failure on ${where} — ${count} miners did not complete`,
      slack: `Command failure on ${where}: ${count} miners did not complete.`,
      sms: `PROTO FLEET: ${count} cmd fail - ${where}.`,
    };
  }

  if (template === "hardware_error") {
    return {
      summary: `Hardware errors detected on ${where} — ${count} miners affected`,
      slack: `${where}: ${count} new hardware errors (PSU/fan/hashboard).`,
      sms: `PROTO FLEET: ${count} HW errors - ${where}.`,
    };
  }

  if (template === "energy") {
    return {
      summary: `Curtailment / DR event triggered on ${where}`,
      slack: `Curtailment active on ${where}: target reduction in progress.`,
      sms: `PROTO FLEET: Curtailment - ${where}.`,
    };
  }

  // custom
  return {
    summary: `Custom rule fired on ${where}`,
    slack: `Custom rule fired on ${where}.`,
    sms: `PROTO FLEET: Custom alert - ${where}.`,
  };
};

export const getLivePreview = (input: LivePreviewInput): LivePreview => {
  const severity = DEFAULT_SEVERITY[input.template];
  const composed = compose(input);
  const subjectScope = scopeShortLabel(input.scope, input.scopeTargetLabel);
  const subject = `[Proto Fleet] ${SEVERITY_EMOJI[severity]} ${composed.summary} — ${subjectScope}`;
  const channelsDelivered =
    input.channelNames.length === 0
      ? "No channels selected"
      : input.channelNames.length === 1
        ? input.channelNames[0]
        : input.channelNames.slice(0, -1).join(", ") + " and " + input.channelNames[input.channelNames.length - 1];
  const slack = `${SEVERITY_EMOJI[severity]} ${severity.toUpperCase()}: ${composed.slack}`;
  const emailHtml = renderAlertEmail({
    subject,
    headline: composed.summary,
    scopePhrase: scopePhrase(input.scope, input.scopeTargetLabel),
    severity,
    ruleName: input.ruleName,
    channelNames: input.channelNames,
    recipientNames: input.recipientNames,
  });
  return {
    severity,
    subject,
    summary: composed.summary,
    slack,
    sms: composed.sms,
    channelsDelivered,
    emailHtml,
  };
};
