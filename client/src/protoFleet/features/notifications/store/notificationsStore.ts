import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Channel, NotificationRole, NotificationUser, Rule, Silence, SilenceWithActive } from "../types";

const ORG_ID = "org_local_dev";

const seedUsers: NotificationUser[] = [
  { id: "u_guccimane", name: "guccimane" },
  { id: "u_dwidick", name: "dwidick" },
  { id: "u_jchang", name: "Ryan Chang" },
  { id: "u_oncall", name: "On-call rotation" },
];

// Notifications scope to roles (mapped to channels / on-call), not individual users.
const seedRoles: NotificationRole[] = [
  { id: "role_site_ops", name: "Site ops" },
  { id: "role_facilities", name: "Facilities" },
  { id: "role_energy", name: "Energy manager" },
  { id: "role_noc", name: "NOC" },
  { id: "role_security", name: "Security" },
];

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();
const hoursAhead = (h: number) => new Date(Date.now() + h * 3600 * 1000).toISOString();

const seedChannels: Channel[] = [
  {
    id: "chn_ops_webhook",
    organization_id: ORG_ID,
    name: "Ops on-call webhook",
    kind: "webhook",
    webhook: { url: "https://hooks.slack.com/services/T0/B0/xxx", bearer_header: null },
    smtp: null,
    created_at: "2026-05-04T10:00:00Z",
    updated_at: "2026-05-04T10:00:00Z",
    validated_at: "2026-05-04T10:00:30Z",
    validation_state: "ok",
    validation_error: null,
  },
  {
    id: "chn_oncall_email",
    organization_id: ORG_ID,
    name: "On-call email",
    kind: "smtp",
    webhook: null,
    smtp: {
      host: "smtp.gmail.com",
      port: 587,
      username: "alerts@blockfleet.example",
      from: "Proto Fleet Alerts <alerts@blockfleet.example>",
      to: ["oncall@blockfleet.example"],
    },
    created_at: "2026-05-04T10:05:00Z",
    updated_at: "2026-05-04T10:05:00Z",
    validated_at: "2026-05-04T10:05:30Z",
    validation_state: "ok",
    validation_error: null,
  },
];

const seedRules: Rule[] = [
  {
    id: "rul_offline_5min",
    organization_id: ORG_ID,
    name: "Miners offline >5 min",
    template: "offline",
    scope: { kind: "all", group_id: null, device_ids: [] },
    threshold: { duration_seconds: 300, value: null, comparator: null },
    custom_expr: null,
    channel_ids: ["chn_ops_webhook", "chn_oncall_email"],
    silenced_until: null,
    enabled: true,
    created_at: "2026-05-04T10:10:00Z",
    updated_at: "2026-05-04T10:10:00Z",
    last_fired_at: "2026-05-11T03:53:00Z",
    fire_count: 7,
    compile_state: "ok",
    compile_error: null,
  },
  {
    id: "rul_temp_85c",
    organization_id: ORG_ID,
    name: "Hashboard temp >85°C for >15 min",
    template: "temperature",
    scope: { kind: "all", group_id: null, device_ids: [] },
    threshold: { duration_seconds: 900, value: 85, comparator: ">" },
    custom_expr: null,
    channel_ids: ["chn_ops_webhook"],
    silenced_until: null,
    enabled: true,
    created_at: "2026-05-04T10:12:00Z",
    updated_at: "2026-05-04T10:12:00Z",
    last_fired_at: "2026-05-11T08:42:00Z",
    fire_count: 12,
    compile_state: "ok",
    compile_error: null,
  },
  {
    id: "rul_hashrate_drop",
    organization_id: ORG_ID,
    name: "Hashrate <80% of expected",
    template: "hashrate",
    scope: { kind: "group", group_id: "grp_dalton_bottom", device_ids: [] },
    threshold: { duration_seconds: 600, value: 80, comparator: "<" },
    custom_expr: null,
    channel_ids: ["chn_ops_webhook"],
    silenced_until: null,
    enabled: true,
    created_at: "2026-05-04T10:15:00Z",
    updated_at: "2026-05-04T10:15:00Z",
    last_fired_at: null,
    fire_count: 0,
    compile_state: "ok",
    compile_error: null,
  },
  {
    id: "rul_pool_default",
    organization_id: ORG_ID,
    name: "Pool disconnects",
    template: "pool",
    scope: { kind: "all", group_id: null, device_ids: [] },
    threshold: { duration_seconds: 120, value: null, comparator: null },
    custom_expr: null,
    channel_ids: ["chn_ops_webhook"],
    silenced_until: null,
    enabled: true,
    created_at: "2026-05-04T10:18:00Z",
    updated_at: "2026-05-04T10:18:00Z",
    last_fired_at: null,
    fire_count: 0,
    compile_state: "ok",
    compile_error: null,
  },
  {
    id: "rul_command_failure_default",
    organization_id: ORG_ID,
    name: "Command failures",
    template: "command_failure",
    scope: { kind: "all", group_id: null, device_ids: [] },
    threshold: { duration_seconds: 0, value: null, comparator: null },
    custom_expr: null,
    channel_ids: ["chn_ops_webhook"],
    silenced_until: null,
    enabled: true,
    created_at: "2026-05-04T10:20:00Z",
    updated_at: "2026-05-04T10:20:00Z",
    last_fired_at: null,
    fire_count: 0,
    compile_state: "ok",
    compile_error: null,
  },
  {
    id: "rul_hardware_error_default",
    organization_id: ORG_ID,
    name: "Hardware errors",
    template: "hardware_error",
    scope: { kind: "all", group_id: null, device_ids: [] },
    threshold: { duration_seconds: 0, value: null, comparator: null },
    custom_expr: null,
    channel_ids: ["chn_ops_webhook", "chn_oncall_email"],
    silenced_until: null,
    enabled: true,
    created_at: "2026-05-04T10:22:00Z",
    updated_at: "2026-05-04T10:22:00Z",
    last_fired_at: null,
    fire_count: 0,
    compile_state: "ok",
    compile_error: null,
  },
  {
    id: "rul_curtailment_default",
    organization_id: ORG_ID,
    name: "Curtailment triggered",
    template: "energy",
    scope: { kind: "site", group_id: null, device_ids: [], target_id: "site_denver" },
    threshold: { duration_seconds: 0, value: null, comparator: null },
    custom_expr: null,
    channel_ids: ["chn_ops_webhook", "chn_oncall_email"],
    silenced_until: null,
    enabled: true,
    created_at: "2026-05-04T10:24:00Z",
    updated_at: "2026-05-04T10:24:00Z",
    last_fired_at: null,
    fire_count: 0,
    compile_state: "ok",
    compile_error: null,
  },
  {
    id: "rul_dr_compliance_default",
    organization_id: ORG_ID,
    name: "DR compliance",
    template: "energy",
    scope: { kind: "site", group_id: null, device_ids: [], target_id: "site_denver" },
    threshold: { duration_seconds: 0, value: null, comparator: null },
    custom_expr: null,
    channel_ids: ["chn_oncall_email"],
    silenced_until: null,
    enabled: true,
    created_at: "2026-05-04T10:26:00Z",
    updated_at: "2026-05-04T10:26:00Z",
    last_fired_at: null,
    fire_count: 0,
    compile_state: "ok",
    compile_error: null,
  },
];

const seedSilences: Silence[] = [
  {
    id: "sil_seed_hvac",
    organization_id: ORG_ID,
    scope: { kind: "rule", rule_id: "rul_hashrate_drop", device_ids: [], group_id: null, site_id: null },
    starts_at: hoursAgo(2),
    ends_at: hoursAhead(4),
    comment: "HVAC service in Building D — expected hashrate dip",
    created_by: "u_dwidick",
    created_at: hoursAgo(2.1),
  },
];

const withActive = (s: Silence): SilenceWithActive => {
  const now = Date.now();
  const start = new Date(s.starts_at).getTime();
  const end = s.ends_at ? new Date(s.ends_at).getTime() : Infinity;
  return { ...s, active: now >= start && now < end };
};

interface NotificationsState {
  channels: Channel[];
  rules: Rule[];
  silences: Silence[];
  users: NotificationUser[];
  roles: NotificationRole[];

  // Channels
  appendChannel: (channel: Channel) => void;
  updateChannel: (id: string, mutator: (prev: Channel) => Channel) => void;
  removeChannel: (id: string) => void;

  // Rules
  appendRule: (rule: Rule) => void;
  updateRule: (id: string, mutator: (prev: Rule) => Rule) => void;
  removeRule: (id: string) => void;

  // Silences
  appendSilence: (silence: Silence) => void;
  updateSilence: (id: string, mutator: (prev: Silence) => Silence) => void;
  removeSilence: (id: string) => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  immer((set) => ({
    channels: seedChannels,
    rules: seedRules,
    silences: seedSilences,
    users: seedUsers,
    roles: seedRoles,

    appendChannel: (channel) =>
      set((state) => {
        state.channels.unshift(channel);
      }),
    updateChannel: (id, mutator) =>
      set((state) => {
        const i = state.channels.findIndex((c) => c.id === id);
        if (i >= 0) state.channels[i] = mutator(state.channels[i]);
      }),
    removeChannel: (id) =>
      set((state) => {
        const i = state.channels.findIndex((c) => c.id === id);
        if (i >= 0) state.channels.splice(i, 1);
      }),

    appendRule: (rule) =>
      set((state) => {
        state.rules.unshift(rule);
      }),
    updateRule: (id, mutator) =>
      set((state) => {
        const i = state.rules.findIndex((r) => r.id === id);
        if (i >= 0) state.rules[i] = mutator(state.rules[i]);
      }),
    removeRule: (id) =>
      set((state) => {
        const i = state.rules.findIndex((r) => r.id === id);
        if (i >= 0) state.rules.splice(i, 1);
      }),

    appendSilence: (silence) =>
      set((state) => {
        state.silences.unshift(silence);
      }),
    updateSilence: (id, mutator) =>
      set((state) => {
        const i = state.silences.findIndex((s) => s.id === id);
        if (i >= 0) state.silences[i] = mutator(state.silences[i]);
      }),
    removeSilence: (id) =>
      set((state) => {
        const i = state.silences.findIndex((s) => s.id === id);
        if (i >= 0) state.silences.splice(i, 1);
      }),
  })),
);

// Selectors
//
// Important: only return raw store references here. Anything that maps or
// filters (e.g. computing `active` for silences) MUST be done inside a
// component `useMemo` keyed on the raw selector — otherwise every render
// returns a fresh array reference, the consumer re-renders, and you hit
// "Maximum update depth exceeded" in React 19.

export const selectChannels = (s: NotificationsState) => s.channels;
export const selectRules = (s: NotificationsState) => s.rules;
export const selectSilences = (s: NotificationsState) => s.silences;
export const selectUsers = (s: NotificationsState) => s.users;
export const selectRoles = (s: NotificationsState) => s.roles;

// Pure helper exported alongside the store so components can derive `active`
// on the silence row inside their own useMemo.
export const computeSilenceActive = withActive;
