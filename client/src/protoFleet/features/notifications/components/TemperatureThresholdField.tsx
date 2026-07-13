import type { ReactNode } from "react";
import type { TemperatureMode, TemperatureReading, TemperatureUnit } from "@/protoFleet/features/notifications/types";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";

const TEMPERATURE_UNITS: Array<{ value: TemperatureUnit; label: TemperatureUnit }> = [
  { value: "°C", label: "°C" },
  { value: "°F", label: "°F" },
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

interface TemperatureThresholdFieldProps {
  mode: TemperatureMode;
  onModeChange: (mode: TemperatureMode) => void;
  reading: TemperatureReading;
  onReadingChange: (reading: TemperatureReading) => void;
  value: string;
  onValueChange: (value: string) => void;
  unit: TemperatureUnit;
  onUnitChange: (unit: TemperatureUnit) => void;
  count: string;
  onCountChange: (value: string) => void;
  durationSeconds: string;
  onDurationChange: (value: string) => void;
  availableModes: TemperatureMode[];
  resetKey?: string;
}

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

const TemperatureThresholdField = ({
  value,
  onValueChange,
  unit,
  onUnitChange,
  durationSeconds,
  onDurationChange,
}: TemperatureThresholdFieldProps) => {
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

  return (
    <div className="grid gap-4">
      <Row label="exceeds">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="temp-threshold-amount"
            label="Amount"
            initValue={value}
            inputMode="decimal"
            onChange={onValueChange}
          />
          <Select
            id="temp-threshold-unit"
            label="Unit"
            options={TEMPERATURE_UNITS}
            value={unit}
            onChange={(nextUnit) => onUnitChange(nextUnit as TemperatureUnit)}
          />
        </div>
      </Row>

      <Row label="for longer than">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="temp-duration-amount"
            label="Amount"
            initValue={durationAmount}
            inputMode="decimal"
            onChange={(nextAmount) => setDuration(nextAmount)}
          />
          <Select
            id="temp-duration-unit"
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

export default TemperatureThresholdField;
