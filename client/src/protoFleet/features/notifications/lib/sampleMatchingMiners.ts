import { SCOPE_DEMO_POPULATION } from "@/protoFleet/features/notifications/lib/scopeEvaluation";
import type {
  CommandFailureMode,
  HashrateMode,
  HashrateUnit,
  RuleScopeKind,
  RuleTemplate,
  TemperatureMode,
  TemperatureUnit,
} from "@/protoFleet/features/notifications/types";

// Live "who matches right now" preview for the rule editor. There's no real
// telemetry in the prototype, so we synthesize a deterministic fleet snapshot
// and filter it by the rule's current config. Deterministic (seeded off the
// miner index) so the sample doesn't reshuffle on every keystroke — only the
// match set grows/shrinks as the operator tunes the threshold.

export interface SampleMiner {
  id: string;
  name: string;
  location: string;
  value: string;
}

export interface MinerSample {
  totalInScope: number;
  matchCount: number;
  sample: SampleMiner[];
  metricLabel: string;
  // Set when the rule evaluates an aggregate (scope average, fleet total,
  // site-level signal) rather than per-miner — the list then reads as context.
  note?: string;
}

export interface MinerSampleInput {
  template: RuleTemplate;
  scope: RuleScopeKind;
  thresholdValue: string;
  thresholdDurationSeconds: number;
  hashrateMode?: HashrateMode;
  hashrateUnit?: HashrateUnit;
  temperatureMode?: TemperatureMode;
  temperatureUnit?: TemperatureUnit;
  commandFailureMode?: CommandFailureMode;
}

const POOL_SIZE = 90;
const SITES = ["Denver", "Austin", "Miami"];
const BUILDINGS = ["A", "B", "C", "D"];
const MAX_SAMPLE = 7;

// Deterministic 0..1 from an index + salt — stable across renders, no Math.random.
const pseudo = (i: number, salt: number): number => {
  const x = Math.sin((i + 1) * salt) * 10000;
  return x - Math.floor(x);
};

interface PoolMiner {
  id: string;
  name: string;
  location: string;
  tempC: number;
  hashratePct: number;
  hashrateTh: number;
  offlineMin: number;
  cmdFails: number;
  hwFault: boolean;
  poolDown: boolean;
}

const buildMiner = (i: number): PoolMiner => {
  const name = `Miner ${String(i * 7 + 1).padStart(3, "0")}`;
  const site = SITES[i % SITES.length];
  const building = BUILDINGS[i % BUILDINGS.length];
  const rack = `R${(i % 12) + 1}`;
  return {
    id: `mnr_${i}`,
    name,
    location: `${site}, ${building}-${rack}`,
    tempC: Math.round(60 + pseudo(i, 12.9) * 38), // 60–98°C
    hashratePct: Math.round(55 + pseudo(i, 7.3) * 55), // 55–110% of expected
    hashrateTh: Math.round((280 + pseudo(i, 11.7) * 120) * 10) / 10,
    offlineMin: pseudo(i, 3.1) > 0.85 ? Math.round(pseudo(i, 5.5) * 55) + 3 : 0, // ~15% offline
    cmdFails: pseudo(i, 9.9) > 0.78 ? Math.round(pseudo(i, 2.2) * 6) + 1 : 0, // ~22% with failures
    hwFault: pseudo(i, 4.4) > 0.9, // ~10%
    poolDown: pseudo(i, 8.8) > 0.88, // ~12%
  };
};

const POOL: PoolMiner[] = Array.from({ length: POOL_SIZE }, (_, i) => buildMiner(i));

const num = (s: string, fallback: number): number => {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
};

const formatHashrate = (valueTh: number, unit: HashrateUnit | undefined): string => {
  if (unit === "PH/s") return `${(valueTh / 1000).toFixed(2)} PH/s`;
  return `${valueTh.toFixed(1)} TH/s`;
};

const celsiusToFahrenheit = (value: number): number => value * (9 / 5) + 32;
const fahrenheitToCelsius = (value: number): number => (value - 32) * (5 / 9);

const toCelsiusThreshold = (value: number, unit: TemperatureUnit | undefined): number =>
  unit === "°F" ? fahrenheitToCelsius(value) : value;

const formatTemperatureValue = (valueCelsius: number, unit: TemperatureUnit | undefined): string => {
  if (unit === "°F") return `${celsiusToFahrenheit(valueCelsius).toFixed(1)}°F`;
  return `${valueCelsius.toFixed(1)}°C`;
};

const formatTemperature = (miner: PoolMiner, thresholdCelsius: number, unit: TemperatureUnit | undefined): string => {
  const overThreshold = thresholdCelsius + 0.1 + pseudo(parseInt(miner.id.replace("mnr_", ""), 10), 6.4) * 2;
  return formatTemperatureValue(overThreshold, unit);
};

export const getMatchingMiners = (input: MinerSampleInput): MinerSample => {
  const totalInScope = SCOPE_DEMO_POPULATION[input.scope] ?? POOL.length;
  const inScope = POOL.slice(0, Math.min(totalInScope, POOL.length));

  let metricLabel = "Status";
  let note: string | undefined;
  let matches: { miner: PoolMiner; value: string }[];

  switch (input.template) {
    case "temperature": {
      const unit = input.temperatureUnit ?? "°C";
      const thresholdValue = num(input.thresholdValue, unit === "°F" ? 185 : 85);
      const threshold = toCelsiusThreshold(thresholdValue, unit);
      const thresholdLabel = `${thresholdValue}${unit}`;
      metricLabel = "Temp";
      matches = inScope
        .filter((m) => m.tempC > threshold)
        .map((m) => ({ miner: m, value: formatTemperature(m, threshold, unit) }));
      if (input.temperatureMode === "scope_average") {
        const avg = Math.round(inScope.reduce((s, m) => s + m.tempC, 0) / Math.max(inScope.length, 1));
        note = `Scope-average rule — triggers when the average across ~${totalInScope} miners exceeds ${thresholdLabel}. Currently averaging ${formatTemperatureValue(avg, unit)}. Hottest miners shown below.`;
      }
      break;
    }
    case "hashrate": {
      const threshold = num(input.thresholdValue, 80);
      metricLabel = "Hashrate";
      if (input.hashrateMode === "absolute" || input.hashrateMode === "sudden_drop") {
        note = `This rule watches combined hashrate across ~${totalInScope} miners. Lowest performers shown below.`;
        matches = [...inScope]
          .sort((a, b) => a.hashrateTh - b.hashrateTh)
          .slice(0, MAX_SAMPLE)
          .map((m) => ({ miner: m, value: formatHashrate(m.hashrateTh, input.hashrateUnit) }));
      } else {
        matches = inScope
          .filter((m) => m.hashratePct < threshold)
          .map((m) => ({ miner: m, value: `${m.hashratePct}%` }));
      }
      break;
    }
    case "offline": {
      metricLabel = "Downtime";
      const minMinutes = input.thresholdDurationSeconds / 60;
      matches = inScope
        .filter((m) => m.offlineMin >= minMinutes && m.offlineMin > 0)
        .map((m) => ({ miner: m, value: `${m.offlineMin} min` }));
      break;
    }
    case "command_failure": {
      const threshold = input.commandFailureMode === "any" ? 1 : num(input.thresholdValue, 1);
      metricLabel = "Failures";
      matches = inScope
        .filter((m) => m.cmdFails >= threshold)
        .map((m) => ({ miner: m, value: `${m.cmdFails} failed` }));
      break;
    }
    case "hardware_error": {
      metricLabel = "Fault";
      matches = inScope.filter((m) => m.hwFault).map((m) => ({ miner: m, value: "Hardware fault" }));
      break;
    }
    case "pool": {
      metricLabel = "Pool";
      matches = inScope.filter((m) => m.poolDown).map((m) => ({ miner: m, value: "Disconnected" }));
      break;
    }
    case "energy": {
      metricLabel = "Scope";
      note = `Site-level rule — applies to all ~${totalInScope} miners in scope whenever a curtailment / DR signal fires. Not evaluated per-miner.`;
      matches = [];
      break;
    }
    default: {
      note = "Custom rule — matching preview not available for custom expressions.";
      matches = [];
    }
  }

  return {
    totalInScope,
    matchCount: matches.length,
    sample: matches.slice(0, MAX_SAMPLE).map(({ miner, value }) => ({
      id: miner.id,
      name: miner.name,
      location: miner.location,
      value,
    })),
    metricLabel,
    note,
  };
};
