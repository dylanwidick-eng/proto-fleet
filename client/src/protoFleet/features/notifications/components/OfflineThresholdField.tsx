import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";

interface OfflineThresholdFieldProps {
  durationSeconds: string;
  onDurationChange: (value: string) => void;
}

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

const getDurationUnit = (seconds: number): string => {
  if (seconds > 0 && seconds % UNIT_TO_SECONDS.hours === 0) return "hours";
  if (seconds > 0 && seconds % UNIT_TO_SECONDS.minutes === 0) return "minutes";
  return "seconds";
};

const formatAmount = (seconds: number, unit: string): string => {
  const amount = seconds / UNIT_TO_SECONDS[unit];
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1);
};

const OfflineThresholdField = ({ durationSeconds, onDurationChange }: OfflineThresholdFieldProps) => {
  const parsedSeconds = parseInt(durationSeconds, 10) || 0;
  const unit = getDurationUnit(parsedSeconds);
  const amount = formatAmount(parsedSeconds, unit);

  const setDuration = (nextAmount: string, nextUnit = unit) => {
    const parsedAmount = parseFloat(nextAmount);
    const seconds = Number.isFinite(parsedAmount)
      ? Math.max(0, Math.round(parsedAmount * UNIT_TO_SECONDS[nextUnit]))
      : 0;
    onDurationChange(String(seconds));
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <Input
        id="offline-duration-amount"
        label="Amount"
        initValue={amount}
        inputMode="decimal"
        onChange={(value) => setDuration(value)}
      />
      <Select
        id="offline-duration-unit"
        label="Unit"
        options={DURATION_UNITS}
        value={unit}
        onChange={(nextUnit) => setDuration(amount, nextUnit)}
      />
    </div>
  );
};

export default OfflineThresholdField;
