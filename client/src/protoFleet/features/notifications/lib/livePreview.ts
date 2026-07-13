import { renderAlertEmail } from "@/protoFleet/features/notifications/lib/emailTemplate";
import { RULE_SCOPE_TARGET_LABELS } from "@/protoFleet/features/notifications/lib/ruleTemplates";
import { SCOPE_DEMO_POPULATION } from "@/protoFleet/features/notifications/lib/scopeEvaluation";
import type { NotificationSeverity } from "@/protoFleet/features/notifications/lib/seedNotificationActivity";
import type {
  CommandFailureMode,
  HashrateMode,
  HashrateUnit,
  RuleScopeKind,
  RuleTemplate,
  TemperatureMode,
  TemperatureReading,
  TemperatureUnit,
} from "@/protoFleet/features/notifications/types";

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
  hashrateMode?: HashrateMode;
  hashrateUnit?: HashrateUnit;
  hashrateWindowSeconds?: number;
  temperatureMode?: TemperatureMode;
  temperatureReading?: TemperatureReading;
  temperatureUnit?: TemperatureUnit;
  temperatureMinCount?: number;
  commandFailureMode?: CommandFailureMode;
  commandLabel?: string;
  commandWindowSeconds?: number;
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

// Demonstration counts that feel realistic at each scope, shared with the
// modal's population readout so the two agree.
const DEMO_COUNT = SCOPE_DEMO_POPULATION;

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
    const tmode = input.temperatureMode ?? "any_miner";
    const reading = input.temperatureReading === "avg" ? "avg" : "max";
    const unit = input.temperatureUnit ?? "°C";
    const smsUnit = unit.replace("°", "");
    const temperature = `${threshold}${unit}`;
    if (tmode === "scope_average") {
      return {
        summary: `${where} average temperature above ${temperature} (${reading})`,
        slack: `${where}: average temperature above ${temperature} (${reading}, sustained ${mins} min).`,
        sms: `PROTO FLEET: ${where} avg temp >${threshold}${smsUnit}.`,
      };
    }
    if (tmode === "count") {
      const n = input.temperatureMinCount ?? 10;
      return {
        summary: `${n} miners above ${temperature} (${reading}) on ${where}`,
        slack: `${n} or more miners above ${temperature} (${reading}) on ${where}.`,
        sms: `PROTO FLEET: ${n}+ miners >${threshold}${smsUnit} - ${where}.`,
      };
    }
    return {
      summary: `A miner exceeded ${temperature} (${reading}) on ${where}`,
      slack: `A miner exceeded ${temperature} (${reading}) on ${where} (sustained ${mins} min).`,
      sms: `PROTO FLEET: miner >${threshold}${smsUnit} - ${where}.`,
    };
  }

  if (template === "hashrate") {
    const mode = input.hashrateMode ?? "pct_expected";
    if (mode === "absolute") {
      const unit = input.hashrateUnit ?? "PH/s";
      return {
        summary: `${where} combined hashrate below ${threshold} ${unit}`,
        slack: `${where}: combined hashrate below ${threshold} ${unit}.`,
        sms: `PROTO FLEET: ${where} hashrate <${threshold}${unit}.`,
      };
    }
    if (mode === "sudden_drop") {
      const win = minutes(String(input.hashrateWindowSeconds ?? 600));
      return {
        summary: `${where} total hashrate dropped ${threshold}% within ${win} min`,
        slack: `${where}: total hashrate dropped ${threshold}% in the last ${win} min.`,
        sms: `PROTO FLEET: ${where} hashrate -${threshold}% in ${win}m.`,
      };
    }
    return {
      summary: `${where} combined hashrate below ${threshold}% of expected`,
      slack: `${where}: combined hashrate below ${threshold}% of expected.`,
      sms: `PROTO FLEET: ${where} hashrate <${threshold}% expected.`,
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
    const cmode = input.commandFailureMode ?? "any";
    const label = input.commandLabel ?? "commands";
    const single = label !== "commands" && label !== "selected commands";
    const kindWord = single ? label.replace(/ commands$/, "") : "";
    const win = minutes(String(input.commandWindowSeconds ?? 900));
    if (cmode === "count") {
      return {
        summary: `${threshold} failed ${label} on ${where} in the last ${win} min`,
        slack: `${threshold} failed ${label} on ${where} in the last ${win} min.`,
        sms: `PROTO FLEET: ${threshold} cmd fails - ${where}.`,
      };
    }
    if (cmode === "rate") {
      return {
        summary: `${threshold}% of ${label} failing on ${where} (last ${win} min)`,
        slack: `${threshold}% of ${label} failing on ${where} over the last ${win} min.`,
        sms: `PROTO FLEET: ${threshold}% cmd fail - ${where}.`,
      };
    }
    return {
      summary: `A ${kindWord ? `${kindWord} ` : ""}command failed on ${where}`,
      slack: `A ${kindWord ? `${kindWord} ` : ""}command failed on ${where}.`,
      sms: `PROTO FLEET: cmd fail - ${where}.`,
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
    summary: `Custom rule triggered on ${where}`,
    slack: `Custom rule triggered on ${where}.`,
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
