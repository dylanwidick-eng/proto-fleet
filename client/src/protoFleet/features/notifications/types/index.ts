// Channel — destination the rule engine delivers notifications to.
// Greenfield in prod; engineer will swap this for the Connect-RPC shape later.

export type ChannelKind = "webhook" | "smtp";
export type ValidationState = "ok" | "failed" | "pending";

export interface WebhookConfig {
  url: string;
  bearer_header: string | null;
}

export interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  from: string;
  to: string[];
}

export interface Channel {
  id: string;
  organization_id: string;
  name: string;
  kind: ChannelKind;
  webhook: WebhookConfig | null;
  smtp: SmtpConfig | null;
  created_at: string;
  updated_at: string;
  validated_at: string | null;
  validation_state: ValidationState;
  validation_error: string | null;
}

// Rule — when a notification fires and how it's scoped.

export type RuleTemplate =
  | "offline"
  | "temperature"
  | "hashrate"
  | "pool"
  | "command_failure"
  | "hardware_error"
  | "energy"
  | "custom";

export type RuleScopeKind = "all" | "site" | "building" | "rack" | "group" | "pool" | "schedule" | "devices";

export interface RuleScope {
  kind: RuleScopeKind;
  group_id: string | null;
  device_ids: string[];
  // The prototype also tracks site_id/building_id/rack_id/pool_id/schedule_id inline;
  // we keep one optional `target_id` here to mirror that without a wide union.
  target_id?: string | null;
}

export interface RuleThreshold {
  duration_seconds: number;
  value: number | null;
  comparator: ">" | "<" | ">=" | "<=" | "==" | null;
}

export type CompileState = "ok" | "error";

export interface Rule {
  id: string;
  organization_id: string;
  name: string;
  template: RuleTemplate;
  scope: RuleScope;
  threshold: RuleThreshold;
  custom_expr: string | null;
  channel_ids: string[];
  silenced_until: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  last_fired_at: string | null;
  fire_count: number;
  compile_state: CompileState;
  compile_error: string | null;
}

// Silence — temporary mute that blocks a rule from delivering during a window.

export type SilenceScopeKind = "rule" | "group" | "site" | "device";

export interface SilenceScope {
  kind: SilenceScopeKind;
  rule_id: string | null;
  group_id: string | null;
  site_id: string | null;
  device_ids: string[];
}

export interface Silence {
  id: string;
  organization_id: string;
  scope: SilenceScope;
  starts_at: string;
  ends_at: string | null;
  comment: string;
  created_by: string;
  created_at: string;
}

export interface SilenceWithActive extends Silence {
  active: boolean;
}
