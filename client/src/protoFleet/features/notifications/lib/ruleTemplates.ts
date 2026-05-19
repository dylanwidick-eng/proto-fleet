import type { RuleScopeKind, RuleTemplate } from "@/protoFleet/features/notifications/types";

export interface RuleTemplateMeta {
  id: RuleTemplate;
  label: string;
  defaultDuration: number;
  defaultValue: number | null;
  comparator: ">" | "<" | ">=" | "<=" | "==" | null;
}

export const RULE_TEMPLATES: RuleTemplateMeta[] = [
  { id: "offline", label: "Offline", defaultDuration: 300, defaultValue: null, comparator: null },
  { id: "hashrate", label: "Hashrate", defaultDuration: 600, defaultValue: 80, comparator: "<" },
  { id: "temperature", label: "Temperature", defaultDuration: 900, defaultValue: 85, comparator: ">" },
  { id: "pool", label: "Pool", defaultDuration: 120, defaultValue: null, comparator: null },
  { id: "command_failure", label: "Cmd failure", defaultDuration: 0, defaultValue: null, comparator: null },
  { id: "custom", label: "Custom", defaultDuration: 60, defaultValue: null, comparator: null },
];

export const RULE_SCOPE_LABELS: Record<RuleScopeKind, string> = {
  all: "All devices",
  site: "A site",
  building: "A building",
  rack: "A rack",
  group: "A group",
  devices: "Specific devices",
  pool: "A pool",
  schedule: "A schedule",
};

// Per-kind label shown on the secondary "target" picker.
export const RULE_SCOPE_TARGET_LABELS: Partial<Record<RuleScopeKind, string>> = {
  site: "Site",
  building: "Building",
  rack: "Rack",
  group: "Group",
  pool: "Pool",
  schedule: "Schedule",
};

// Kinds that don't need a secondary target picker.
export const RULE_SCOPE_NO_TARGET: ReadonlySet<RuleScopeKind> = new Set<RuleScopeKind>(["all", "devices"]);

// Phase-1 metric contract (mirrored in proto-designer-test-hub/notes/data-shapes.md).
// Surfaced inline next to the custom PromQL field so power users don't have to
// leave the modal to look up metric names + labels.
export interface FleetMetric {
  name: string;
  type: "gauge" | "counter";
  unit: string;
  labels: string[];
}

export const FLEET_METRICS: FleetMetric[] = [
  {
    name: "fleet_device_online",
    type: "gauge",
    unit: "bool",
    labels: ["organization_id", "device_id", "group_id", "manufacturer", "model"],
  },
  {
    name: "fleet_device_hashrate_terahash",
    type: "gauge",
    unit: "TH/s",
    labels: ["organization_id", "device_id", "group_id", "manufacturer", "model"],
  },
  {
    name: "fleet_device_hashrate_expected_terahash",
    type: "gauge",
    unit: "TH/s",
    labels: ["organization_id", "device_id", "group_id", "manufacturer", "model"],
  },
  {
    name: "fleet_device_temperature_max_celsius",
    type: "gauge",
    unit: "°C",
    labels: ["…", "sensor_kind"],
  },
  {
    name: "fleet_device_temperature_avg_celsius",
    type: "gauge",
    unit: "°C",
    labels: ["…", "sensor_kind"],
  },
  {
    name: "fleet_device_pool_connected",
    type: "gauge",
    unit: "bool",
    labels: ["…", "pool_id"],
  },
  {
    name: "fleet_command_total",
    type: "counter",
    unit: "count",
    labels: ["…", "kind", "result"],
  },
  {
    name: "fleet_telemetry_poll_total",
    type: "counter",
    unit: "count",
    labels: ["…", "result"],
  },
];
