import type { ValidationState } from "@/protoFleet/features/notifications/types";

interface ChannelStatusBadgeProps {
  state: ValidationState;
}

const LABEL: Record<ValidationState, string> = {
  ok: "Validated",
  failed: "Failed",
  pending: "Not tested",
};

const ChannelStatusBadge = ({ state }: ChannelStatusBadgeProps) => (
  <span className="text-200 text-text-primary-50">{LABEL[state]}</span>
);

export default ChannelStatusBadge;
