import RuleMultiSelectField from "./RuleMultiSelectField";
import type { NotificationRole } from "@/protoFleet/features/notifications/types";

interface RuleRecipientsFieldProps {
  id?: string;
  roles: NotificationRole[];
  selectedIds: string[];
  onToggle: (roleId: string) => void;
}

// Notify picker — scoped to roles (mapped to channels / on-call downstream), not
// individual users. Empty selection falls back to default routing.
const RuleRecipientsField = ({ id = "rule-recipients", roles, selectedIds, onToggle }: RuleRecipientsFieldProps) => (
  <RuleMultiSelectField
    id={id}
    label="Notify"
    placeholder="Default routing"
    emptyMessage="No roles configured."
    items={roles.map((r) => ({ id: r.id, name: r.name }))}
    selectedIds={selectedIds}
    onToggle={onToggle}
  />
);

export default RuleRecipientsField;
