import type { RuleScopeKind } from "@/protoFleet/features/notifications/types";

export interface ScopeTarget {
  id: string;
  label: string;
}

// Stub data for the scope target picker. Engineer will replace this with
// real data hooks (sites, buildings, racks, groups, pools, schedules) when
// wiring the Connect-RPC backend. The prototype pulled from in-memory
// sitesData / locationData / MINER_POOL / listWorkflows; matching those
// shapes to proto-fleet's real domain stores is a deliberate next step.
const STUB: Partial<Record<RuleScopeKind, ScopeTarget[]>> = {
  site: [
    { id: "dalton", label: "Dalton" },
    { id: "rockdale", label: "Rockdale" },
  ],
  building: [
    { id: "dalton/A", label: "Building A · Dalton" },
    { id: "dalton/B", label: "Building B · Dalton" },
    { id: "rockdale/A", label: "Building A · Rockdale" },
  ],
  rack: [
    { id: "dalton/A/R-01", label: "R-01 · Building A · Dalton" },
    { id: "dalton/A/R-02", label: "R-02 · Building A · Dalton" },
  ],
  group: [
    { id: "grp_dalton_bottom", label: "Dalton bottom row" },
    { id: "grp_high_efficiency", label: "High efficiency" },
  ],
  pool: [
    { id: "stratum+tcp://us-east.stratum.example:3333", label: "us-east.stratum.example:3333" },
    { id: "stratum+tcp://us-west.stratum.example:3333", label: "us-west.stratum.example:3333" },
  ],
  schedule: [
    { id: "sched_overnight_curtail", label: "Overnight curtail" },
    { id: "sched_morning_ramp", label: "Morning ramp" },
  ],
};

export const getRuleScopeTargets = (kind: RuleScopeKind): ScopeTarget[] => STUB[kind] ?? [];
