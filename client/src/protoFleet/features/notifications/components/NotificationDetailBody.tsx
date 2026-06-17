import clsx from "clsx";

import {
  selectChannels,
  selectRules,
  useNotificationsStore,
} from "@/protoFleet/features/notifications/store/notificationsStore";
import {
  type NotificationActivityItem,
  type NotificationSeverity,
  severityLabel,
} from "@/protoFleet/features/notifications/lib/seedNotificationActivity";
import StatusCircle from "@/shared/components/StatusCircle";

interface NotificationDetailBodyProps {
  item: NotificationActivityItem;
  onViewRule?: (ruleId: string) => void;
}

const severityStatus: Record<NotificationSeverity, "error" | "warning" | "pending" | "normal"> = {
  critical: "error",
  warning: "warning",
  info: "pending",
  resolved: "normal",
};

const SummaryRow = ({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className="flex items-baseline justify-between gap-4 py-3">
    <span className="shrink-0 text-text-primary-50">{label}</span>
    <span className={clsx("text-right text-text-primary", className)}>{children}</span>
  </div>
);

const formatWhen = (d: Date) => {
  const date = d.toLocaleDateString(undefined, { year: "2-digit", month: "2-digit", day: "2-digit" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} ${time}`;
};

const NotificationDetailBody = ({ item, onViewRule }: NotificationDetailBodyProps) => {
  const channels = useNotificationsStore(selectChannels);
  const rules = useNotificationsStore(selectRules);

  const linkedRule = item.ruleId ? rules.find((r) => r.id === item.ruleId) : null;
  const deliveredChannels = item.deliveredChannelIds
    .map((id) => channels.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const whenText = formatWhen(item.createdAt);
  const scopeText = `${
    item.scopeCount > 0 ? `${item.scopeCount} ${item.scopeCount === 1 ? "device" : "devices"} · ` : ""
  }${item.scopeLabel}${item.scopeType ? ` (${item.scopeType})` : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="divide-y divide-surface-10">
        <SummaryRow label="Severity">
          <span className="inline-flex items-center gap-1.5">
            <StatusCircle status={severityStatus[item.severity]} variant="simple" width="w-1.5" removeMargin />
            {severityLabel[item.severity]}
          </span>
        </SummaryRow>
        <SummaryRow label="When">{whenText}</SummaryRow>
        {item.scopeLabel ? <SummaryRow label="Scope">{scopeText}</SummaryRow> : null}
        {linkedRule ? (
          <SummaryRow label="Triggered by">
            <span className="inline-flex items-center gap-3">
              {linkedRule.name}
              {onViewRule ? (
                <button
                  type="button"
                  onClick={() => onViewRule(linkedRule.id)}
                  className="text-200 font-medium text-text-primary underline underline-offset-4 hover:text-text-primary-50"
                >
                  View rule →
                </button>
              ) : null}
            </span>
          </SummaryRow>
        ) : null}
        {deliveredChannels.length > 0 ? (
          <SummaryRow label="Delivered to">{deliveredChannels.map((c) => c.name).join(", ")}</SummaryRow>
        ) : null}
      </div>
    </div>
  );
};

export default NotificationDetailBody;
