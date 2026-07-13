import type { CommandFailureMode, RuleScopeKind, TemperatureMode } from "@/protoFleet/features/notifications/types";

// Demonstration population per scope kind — so the modal can show "~N miners"
// and the live preview can use realistic counts. Shared so the readout and the
// preview agree. (Real impl would read the actual scope membership.)
export const SCOPE_DEMO_POPULATION: Record<RuleScopeKind, number> = {
  all: 52,
  site: 47,
  building: 12,
  rack: 3,
  group: 4,
  devices: 1,
  pool: 87,
  schedule: 8,
};

// Inline readout shown near the scope picker so the operator can see what their
// evaluation is actually reducing over.
export const formatScopePopulation = (scope: RuleScopeKind): string => {
  const n = SCOPE_DEMO_POPULATION[scope];
  return `Evaluating ~${n} ${n === 1 ? "miner" : "miners"}`;
};

// Which temperature "Evaluate" modes make sense for a scope. A single-device
// scope makes "average" (the avg of one miner) and "count" (N-of-1) degenerate,
// so only "any miner" is offered.
export const availableTemperatureModes = (scope: RuleScopeKind): TemperatureMode[] => {
  if (SCOPE_DEMO_POPULATION[scope] <= 1) return ["any_miner"];
  return ["any_miner", "scope_average", "count"];
};

// Smart default for the temperature "Evaluate" mode, by scope size:
// large scopes lean on the average (systemic / HVAC), small/targeted scopes
// care about any single hot miner.
export const defaultTemperatureModeForScope = (scope: RuleScopeKind): TemperatureMode => {
  switch (scope) {
    case "all":
    case "site":
    case "building":
      return "scope_average";
    default:
      return "any_miner";
  }
};

// Command-failure default: at large scope "any failure" is noisy, so lean on a
// count; targeted scopes alert on the first failure.
export const defaultCommandFailureModeForScope = (scope: RuleScopeKind): CommandFailureMode => {
  switch (scope) {
    case "all":
    case "site":
    case "building":
      return "count";
    default:
      return "any";
  }
};
