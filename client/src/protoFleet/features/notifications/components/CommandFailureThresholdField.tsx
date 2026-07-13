import RuleMultiSelectField from "./RuleMultiSelectField";
import { COMMAND_KINDS } from "@/protoFleet/features/notifications/lib/commandKinds";
import type { CommandFailureMode } from "@/protoFleet/features/notifications/types";
import Input from "@/shared/components/Input";
import SegmentedControl from "@/shared/components/SegmentedControl";
import Select from "@/shared/components/Select";

const WINDOW_OPTIONS = [
  { value: "300", label: "5 min" },
  { value: "900", label: "15 min" },
  { value: "1800", label: "30 min" },
  { value: "3600", label: "1 hour" },
];

const MODE_HELP: Record<CommandFailureMode, string> = {
  any: "Triggers on the first failed command of the selected kinds.",
  count: "Triggers when this many of the selected commands fail within the window.",
  rate: "Triggers when this share of attempts fail within the window — catches degradation at high command volume.",
};

interface CommandFailureThresholdFieldProps {
  mode: CommandFailureMode;
  onModeChange: (mode: CommandFailureMode) => void;
  selectedKinds: string[];
  onToggleKind: (id: string) => void;
  value: string;
  onValueChange: (value: string) => void;
  windowSeconds: string;
  onWindowChange: (value: string) => void;
  populationLabel?: string;
}

// Command-failure threshold UI. Event/counter based (not a gauge): pick which
// command kinds matter, then how sensitive the trigger is.
const CommandFailureThresholdField = ({
  mode,
  onModeChange,
  selectedKinds,
  onToggleKind,
  value,
  onValueChange,
  windowSeconds,
  onWindowChange,
  populationLabel,
}: CommandFailureThresholdFieldProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border-5 p-4">
      <RuleMultiSelectField
        id="cmd-kinds"
        label="Commands"
        placeholder="All commands"
        emptyMessage="No command types."
        items={COMMAND_KINDS.map((k) => ({ id: k.id, name: k.label }))}
        selectedIds={selectedKinds}
        onToggle={onToggleKind}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-200 text-text-primary-50">Trigger</span>
          {populationLabel ? <span className="text-200 text-text-primary-50">{populationLabel}</span> : null}
        </div>
        <SegmentedControl
          segments={[
            { key: "any", title: "Any failure" },
            { key: "count", title: "Count" },
            { key: "rate", title: "Rate" },
          ]}
          initialSegmentKey={mode}
          onSelect={(key) => onModeChange(key as CommandFailureMode)}
        />
      </div>

      <p className="text-200 text-text-primary-50">{MODE_HELP[mode]}</p>

      {mode === "count" ? (
        <div className="grid grid-cols-2 gap-4">
          <Input id="cmd-count" label="Failures (count)" initValue={value} onChange={onValueChange} />
          <Select
            id="cmd-window"
            label="Within"
            value={windowSeconds}
            options={WINDOW_OPTIONS}
            onChange={onWindowChange}
          />
        </div>
      ) : null}

      {mode === "rate" ? (
        <div className="grid grid-cols-2 gap-4">
          <Input id="cmd-rate" label="Failure rate (%)" initValue={value} onChange={onValueChange} />
          <Select
            id="cmd-window"
            label="Within"
            value={windowSeconds}
            options={WINDOW_OPTIONS}
            onChange={onWindowChange}
          />
        </div>
      ) : null}
    </div>
  );
};

export default CommandFailureThresholdField;
