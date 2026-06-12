import RuleMultiSelectField from "./RuleMultiSelectField";
import type { NotificationUser } from "@/protoFleet/features/notifications/types";

interface RuleRecipientsFieldProps {
  id?: string;
  users: NotificationUser[];
  selectedIds: string[];
  onToggle: (userId: string) => void;
}

// Recipient picker. Empty selection means everyone — selecting narrows who gets paged.
const RuleRecipientsField = ({ id = "rule-recipients", users, selectedIds, onToggle }: RuleRecipientsFieldProps) => (
  <RuleMultiSelectField
    id={id}
    label="Notify"
    placeholder="All users"
    emptyMessage="No users yet."
    items={users.map((u) => ({ id: u.id, name: u.name }))}
    selectedIds={selectedIds}
    onToggle={onToggle}
  />
);

export default RuleRecipientsField;
