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

// Rule — when a notification triggers and how it's scoped.

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
  // The rule editor reuses the schedule targeting pickers, which can hold
  // multiple selected rows per resource type before the backend contract exists.
  site_ids?: string[];
  building_ids?: string[];
  rack_ids?: string[];
  group_ids?: string[];
}

// Hashrate template uses a richer, template-specific threshold (see HashrateThresholdField):
// the guided UI supports percent-of-expected and absolute floors. sudden_drop remains
// in the type so older prototype rules can still be read and normalized by the editor.
export type HashrateMode = "pct_expected" | "absolute" | "sudden_drop";
export type HashrateUnit = "TH/s" | "PH/s";

// Temperature template is per-device and averageable (not a sum). `mode` is how
// readings aggregate across the scope; `reading` is which per-miner metric.
export type TemperatureMode = "any_miner" | "scope_average" | "count";
export type TemperatureReading = "max" | "avg";
export type TemperatureUnit = "°C" | "°F";

// Command-failure template is event/counter based (not a gauge): which command
// kinds matter, and how sensitive the trigger is.
export type CommandFailureMode = "any" | "count" | "rate";

export interface RuleThreshold {
  duration_seconds: number;
  value: number | null;
  comparator: ">" | "<" | ">=" | "<=" | "==" | null;
  // Hashrate-only. Other templates leave these undefined.
  // pct_expected → value is a percent; absolute → value + hashrate_unit; sudden_drop → value is a percent drop over hashrate_window_seconds.
  hashrate_mode?: HashrateMode;
  hashrate_unit?: HashrateUnit;
  hashrate_window_seconds?: number;
  // Temperature-only. value is the threshold in temperature_unit; temperature_min_count applies to the "count" mode.
  temperature_mode?: TemperatureMode;
  temperature_reading?: TemperatureReading;
  temperature_unit?: TemperatureUnit;
  temperature_min_count?: number;
  // Command-failure-only. command_kinds empty/undefined = all commands.
  // count mode → value is a failure count; rate mode → value is a percent; both use command_window_seconds.
  command_failure_mode?: CommandFailureMode;
  command_kinds?: string[];
  command_window_seconds?: number;
}

export type CompileState = "ok" | "error";

// A person who can be targeted as a notification recipient.
export interface NotificationUser {
  id: string;
  name: string;
}

// A role notifications are scoped to (mapped to channels / on-call downstream).
// Notifications target roles, not individual users.
export interface NotificationRole {
  id: string;
  name: string;
}

export interface Rule {
  id: string;
  organization_id: string;
  name: string;
  template: RuleTemplate;
  scope: RuleScope;
  threshold: RuleThreshold;
  custom_expr: string | null;
  channel_ids: string[];
  // Roles to notify (mapped to channels / on-call). Empty = default routing.
  recipient_role_ids?: string[];
  // When true, firing this rule opens a repair ticket.
  create_ticket?: boolean;
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
