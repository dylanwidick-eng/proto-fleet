import type { ReactNode } from "react";
import type { HashrateMode, HashrateUnit } from "@/protoFleet/features/notifications/types";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";

type HashrateThresholdUnit = "%" | HashrateUnit;

const DROP_UNIT_OPTIONS: Array<{ value: HashrateThresholdUnit; label: string }> = [
  { value: "%", label: "%" },
  { value: "TH/s", label: "TH/s" },
  { value: "PH/s", label: "PH/s" },
];

const TARGET_TYPE_OPTIONS: { value: HashrateMode; label: string }[] = [
  { value: "absolute", label: "Fixed amount" },
  { value: "pct_expected", label: "% of expected" },
];

const DURATION_UNITS = [
  { value: "seconds", label: "seconds" },
  { value: "minutes", label: "minutes" },
  { value: "hours", label: "hours" },
];

const UNIT_TO_SECONDS: Record<string, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
};

interface HashrateThresholdFieldProps {
  mode: HashrateMode;
  onModeChange: (mode: HashrateMode) => void;
  dropValue: string;
  onDropValueChange: (value: string) => void;
  value: string;
  onValueChange: (value: string) => void;
  unit: HashrateUnit;
  onUnitChange: (unit: HashrateUnit) => void;
  durationSeconds: string;
  onDurationChange: (value: string) => void;
}

const guidedMode = (mode: HashrateMode): Extract<HashrateMode, "pct_expected" | "absolute"> =>
  mode === "absolute" ? "absolute" : "pct_expected";

const getDurationUnit = (seconds: number): string => {
  if (seconds > 0 && seconds % UNIT_TO_SECONDS.hours === 0) return "hours";
  if (seconds > 0 && seconds % UNIT_TO_SECONDS.minutes === 0) return "minutes";
  return "seconds";
};

const formatAmount = (seconds: number, unit: string): string => {
  const amount = seconds / UNIT_TO_SECONDS[unit];
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid items-center gap-4 laptop:grid-cols-[minmax(9rem,0.9fr)_minmax(0,2fr)]">
    <div className="text-300 text-text-primary">{label}</div>
    {children}
  </div>
);

const HashrateThresholdField = ({
  mode,
  onModeChange,
  dropValue,
  onDropValueChange,
  value,
  onValueChange,
  unit,
  onUnitChange,
  durationSeconds,
  onDurationChange,
}: HashrateThresholdFieldProps) => {
  const selectedMode = guidedMode(mode);
  const selectedThresholdUnit: HashrateThresholdUnit = selectedMode === "absolute" ? unit : "%";
  const thresholdAmount = selectedMode === "absolute" ? value : dropValue;
  const parsedSeconds = parseInt(durationSeconds, 10) || 0;
  const durationUnit = getDurationUnit(parsedSeconds);
  const durationAmount = formatAmount(parsedSeconds, durationUnit);

  const setDuration = (nextAmount: string, nextUnit = durationUnit) => {
    const parsedAmount = parseFloat(nextAmount);
    const seconds = Number.isFinite(parsedAmount)
      ? Math.max(0, Math.round(parsedAmount * UNIT_TO_SECONDS[nextUnit]))
      : 0;
    onDurationChange(String(seconds));
  };

  const setThresholdUnit = (nextUnit: string) => {
    if (nextUnit === "%") {
      if (selectedMode === "absolute") onDropValueChange(value);
      onModeChange("pct_expected");
      return;
    }

    if (selectedMode !== "absolute") onValueChange(dropValue);
    onModeChange("absolute");
    onUnitChange(nextUnit as HashrateUnit);
  };

  const setThresholdAmount = (nextValue: string) => {
    if (selectedMode === "absolute") {
      onValueChange(nextValue);
      return;
    }

    onDropValueChange(nextValue);
  };

  return (
    <div className="grid gap-4">
      <Row label="drops below">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="hashrate-drop-amount"
            label="Amount"
            initValue={thresholdAmount}
            inputMode="decimal"
            onChange={setThresholdAmount}
          />
          <Select
            id="hashrate-drop-unit"
            label="Unit"
            options={DROP_UNIT_OPTIONS}
            value={selectedThresholdUnit}
            onChange={setThresholdUnit}
          />
        </div>
      </Row>

      <Row label="target">
        <div className="grid grid-cols-2 gap-4">
          <Select
            id="hashrate-target-type"
            label="Type"
            value={selectedMode}
            options={TARGET_TYPE_OPTIONS}
            onChange={(nextMode) => onModeChange(nextMode as HashrateMode)}
          />
          <Input
            id="hashrate-target"
            label={selectedMode === "absolute" ? `Hashrate (${unit})` : "% of expected"}
            initValue={value}
            inputMode="decimal"
            onChange={onValueChange}
          />
        </div>
      </Row>

      <Row label="for longer than">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="hashrate-duration-amount"
            label="Amount"
            initValue={durationAmount}
            inputMode="decimal"
            onChange={(nextAmount) => setDuration(nextAmount)}
          />
          <Select
            id="hashrate-duration-unit"
            label="Unit"
            options={DURATION_UNITS}
            value={durationUnit}
            onChange={(nextUnit) => setDuration(durationAmount, nextUnit)}
          />
        </div>
      </Row>
    </div>
  );
};

export default HashrateThresholdField;
