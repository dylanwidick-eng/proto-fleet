import { type ReactNode } from "react";

import {
  Alert,
  ControlBoard,
  Curtail,
  MiningPools,
  Notification,
  Reboot,
  Speedometer,
  type IconProps,
} from "@/shared/assets/icons";

export type NotificationActivityKind =
  | "offline"
  | "temperature"
  | "hashrate"
  | "pool"
  | "command"
  | "hardware"
  | "energy";
export type NotificationSeverity = "critical" | "warning" | "info" | "resolved";

export interface NotificationActivityItem {
  id: string;
  kind: NotificationActivityKind;
  severity: NotificationSeverity;
  description: string;
  ruleId: string | null;
  ruleName: string;
  scopeType: string;
  scopeLabel: string;
  scopeCount: number;
  deliveredChannelIds: string[];
  result: "success" | "failure";
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);

export const notificationIconMap: Record<NotificationActivityKind, (props: IconProps) => ReactNode> = {
  offline: Notification,
  temperature: Alert,
  hashrate: Speedometer,
  pool: MiningPools,
  command: Reboot,
  hardware: ControlBoard,
  energy: Curtail,
};

export const severityLabel: Record<NotificationSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
  resolved: "Resolved",
};

export function getSeedNotificationActivity(): NotificationActivityItem[] {
  return [
    {
      id: "ntf_offline_1",
      kind: "offline",
      severity: "critical",
      description: "5 miners offline for >5 min",
      ruleId: "rul_offline_5min",
      ruleName: "Miners offline >5 min",
      scopeType: "building",
      scopeLabel: "Building D",
      scopeCount: 5,
      deliveredChannelIds: ["chn_ops_webhook", "chn_oncall_email"],
      result: "success",
      metadata: { duration_seconds: 312, devices_offline: 5, building_id: "bld_d" },
      createdAt: minutesAgo(7),
    },
    {
      id: "ntf_temp_1",
      kind: "temperature",
      severity: "warning",
      description: "Hashboard temp 92°C on Antminer-12",
      ruleId: "rul_temp_85c",
      ruleName: "Hashboard temp >85°C for >15 min",
      scopeType: "device",
      scopeLabel: "Antminer-12",
      scopeCount: 1,
      deliveredChannelIds: ["chn_ops_webhook"],
      result: "success",
      metadata: { peak_temp_c: 92, board_id: 2, duration_seconds: 945 },
      createdAt: minutesAgo(23),
    },
    {
      id: "ntf_hashrate_1",
      kind: "hashrate",
      severity: "warning",
      description: "Dalton Bottom hashrate at 72% of expected",
      ruleId: "rul_hashrate_drop",
      ruleName: "Hashrate <80% of expected",
      scopeType: "group",
      scopeLabel: "Dalton Bottom",
      scopeCount: 48,
      deliveredChannelIds: ["chn_ops_webhook"],
      result: "success",
      metadata: { observed_pct: 72, expected_th: 4800, observed_th: 3456 },
      createdAt: minutesAgo(41),
    },
    {
      id: "ntf_pool_1",
      kind: "pool",
      severity: "info",
      description: "Pool stratum+tcp://pool.btc.com:3333 disconnected",
      ruleId: "rul_pool_default",
      ruleName: "Pool disconnects",
      scopeType: "pool",
      scopeLabel: "pool.btc.com",
      scopeCount: 0,
      deliveredChannelIds: ["chn_ops_webhook"],
      result: "success",
      metadata: { pool_url: "stratum+tcp://pool.btc.com:3333", reconnect_attempts: 4 },
      createdAt: minutesAgo(58),
    },
    {
      id: "ntf_cmd_1",
      kind: "command",
      severity: "warning",
      description: 'Schedule "Weekday ramp-up" partial failure — 8 of 100 miners',
      ruleId: "rul_command_failure_default",
      ruleName: "Command failures",
      scopeType: "schedule",
      scopeLabel: "Weekday ramp-up",
      scopeCount: 8,
      deliveredChannelIds: ["chn_ops_webhook"],
      result: "failure",
      metadata: { action: "Set power target to max", succeeded: 92, failed: 8, offline_count: 3, timeout_count: 5 },
      createdAt: minutesAgo(72),
    },
    {
      id: "ntf_hw_1",
      kind: "hardware",
      severity: "critical",
      description: "M0001 PSU fault (code 1012) — recommend PSU replacement",
      ruleId: "rul_hardware_error_default",
      ruleName: "Hardware errors",
      scopeType: "device",
      scopeLabel: "Antminer M0001",
      scopeCount: 1,
      deliveredChannelIds: ["chn_ops_webhook", "chn_oncall_email"],
      result: "success",
      metadata: { error_code: 1012, component: "PSU", recommended_action: "Replace PSU", rack: "R07" },
      createdAt: minutesAgo(95),
    },
    {
      id: "ntf_energy_1",
      kind: "energy",
      severity: "warning",
      description: "Curtailment active — ERCOT grid signal, Denver site",
      ruleId: "rul_curtailment_default",
      ruleName: "Curtailment triggered",
      scopeType: "site",
      scopeLabel: "Denver",
      scopeCount: 480,
      deliveredChannelIds: ["chn_ops_webhook", "chn_oncall_email"],
      result: "success",
      metadata: {
        rule: "Peak Price (priority 1)",
        trigger: "LMP crossed $85/MWh (threshold $80)",
        target_reduction_mw: 2.4,
        strategy: "worst-first, 50/batch, 5 min interval",
        eta_min: 25,
      },
      createdAt: minutesAgo(110),
    },
    {
      id: "ntf_energy_2",
      kind: "energy",
      severity: "warning",
      description: "DR compliance risk — 4.6/5.0 MW (8% below obligation), Denver",
      ruleId: "rul_dr_compliance_default",
      ruleName: "DR compliance",
      scopeType: "site",
      scopeLabel: "Denver",
      scopeCount: 12,
      deliveredChannelIds: ["chn_oncall_email"],
      result: "success",
      metadata: {
        current_mw: 4.6,
        obligation_mw: 5.0,
        shortfall_pct: 8,
        failed_to_curtail: 12,
        dr_program: "ERCOT ERS",
      },
      createdAt: minutesAgo(128),
    },
    {
      id: "ntf_offline_rack_1",
      kind: "offline",
      severity: "critical",
      description: "3 of 25 miners offline in Rack R07 — Building A, Denver",
      ruleId: "rul_offline_5min",
      ruleName: "Miners offline >5 min",
      scopeType: "rack",
      scopeLabel: "Rack R07, Building A, Denver",
      scopeCount: 3,
      deliveredChannelIds: ["chn_ops_webhook"],
      result: "success",
      metadata: {
        rack_total: 25,
        fleet_impact_pct: -0.1,
        possible_cause: "Slots share Column 3 power rail — check PDU breaker",
        affected_miners: ["M0003", "M0008", "M0012"],
      },
      createdAt: minutesAgo(145),
    },
    {
      id: "ntf_hashrate_fleet_1",
      kind: "hashrate",
      severity: "warning",
      description: "Fleet hashrate 14.2 PH/s — 3.2% below baseline across 3 sites",
      ruleId: "rul_hashrate_drop",
      ruleName: "Hashrate <80% of expected",
      scopeType: "fleet",
      scopeLabel: "All sites",
      scopeCount: 187,
      deliveredChannelIds: ["chn_ops_webhook", "chn_oncall_email"],
      result: "success",
      metadata: {
        observed_ph: 14.2,
        baseline_ph: 14.67,
        deviation_pct: -3.2,
        affected_miners: 187,
        sites: { Denver: 112, Austin: 48, Miami: 27 },
      },
      createdAt: minutesAgo(170),
    },
  ];
}
