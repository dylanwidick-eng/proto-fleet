import RuleMultiSelectField from "./RuleMultiSelectField";
import type { Channel } from "@/protoFleet/features/notifications/types";

interface RuleChannelsFieldProps {
  id?: string;
  channels: Channel[];
  selectedIds: string[];
  onToggle: (channelId: string) => void;
}

const RuleChannelsField = ({ id = "rule-channels", channels, selectedIds, onToggle }: RuleChannelsFieldProps) => (
  <RuleMultiSelectField
    id={id}
    label="Send to"
    placeholder="Pick a channel"
    emptyMessage="No channels yet — add one first."
    items={channels.map((c) => ({ id: c.id, name: c.name }))}
    selectedIds={selectedIds}
    onToggle={onToggle}
  />
);

export default RuleChannelsField;
