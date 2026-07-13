import { type ReactNode } from "react";
import clsx from "clsx";

import {
  type NotificationActivityItem,
  type NotificationSeverity,
  severityLabel,
  ticketStatusLabel,
} from "@/protoFleet/features/notifications/lib/seedNotificationActivity";
import {
  selectChannels,
  selectRules,
  useNotificationsStore,
} from "@/protoFleet/features/notifications/store/notificationsStore";
import Button, { variants } from "@/shared/components/Button";
import StatusCircle from "@/shared/components/StatusCircle";

interface NotificationDetailBodyProps {
  item: NotificationActivityItem;
  onViewRule?: (ruleId: string) => void;
  onViewTicket?: (ticketId: string) => void;
  onCreateTicket?: () => void;
}

const severityStatus: Record<NotificationSeverity, "error" | "warning" | "pending" | "normal"> = {
  critical: "error",
  warning: "warning",
  info: "pending",
  resolved: "normal",
};

const SummaryRow = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
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

const NotificationDetailBody = ({ item, onViewRule, onViewTicket, onCreateTicket }: NotificationDetailBodyProps) => {
  const channels = useNotificationsStore(selectChannels);
  const rules = useNotificationsStore(selectRules);

  const linkedRule = item.ruleId ? rules.find((r) => r.id === item.ruleId) : null;
  const deliveredChannels = item.deliveredChannelIds
    .map((id) => channels.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const whenText = formatWhen(item.createdAt);
  const scopeText = `${
    item.scopeCount > 0 ? `${item.scopeCount} ${item.scopeCount === 1 ? "miner" : "miners"}, ` : ""
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
                <Button
                  text="View rule"
                  variant={variants.secondary}
                  size="compact"
                  onClick={() => onViewRule(linkedRule.id)}
                />
              ) : null}
            </span>
          </SummaryRow>
        ) : null}
        {deliveredChannels.length > 0 ? (
          <SummaryRow label="Notified">{deliveredChannels.map((c) => c.name).join(", ")}</SummaryRow>
        ) : (
          <SummaryRow label="Notified" className="text-text-primary-50">
            Not notified, recorded only
          </SummaryRow>
        )}
        <SummaryRow label="Ticket">
          {item.ticket ? (
            <span className="inline-flex items-center gap-3">
              {item.ticket.number}, {ticketStatusLabel[item.ticket.status] ?? item.ticket.status}
              <Button
                text="View ticket"
                variant={variants.secondary}
                size="compact"
                onClick={() => onViewTicket?.(item.ticket!.id)}
              />
            </span>
          ) : (
            <Button
              text="Create ticket"
              variant={variants.secondary}
              size="compact"
              onClick={() => onCreateTicket?.()}
            />
          )}
        </SummaryRow>
      </div>
    </div>
  );
};

export default NotificationDetailBody;
