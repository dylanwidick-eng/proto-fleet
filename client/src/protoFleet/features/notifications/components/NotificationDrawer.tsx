import { useState } from "react";
import clsx from "clsx";

import CreateTicketModal from "@/protoFleet/features/maintenance/components/CreateTicket/CreateTicketModal";
import TicketDetailModal from "@/protoFleet/features/maintenance/components/TicketDetail/TicketDetailModal";
import NotificationDetailBody from "@/protoFleet/features/notifications/components/NotificationDetailBody";
import {
  getSeedNotificationActivity,
  type NotificationActivityItem,
  notificationIconMap,
} from "@/protoFleet/features/notifications/lib/seedNotificationActivity";
import { ArrowLeftCompact } from "@/shared/assets/icons";
import Modal from "@/shared/components/Modal";
import { formatActivityTimestamp } from "@/shared/utils/formatTimestamp";

interface NotificationDrawerProps {
  open: boolean;
  onDismiss: () => void;
}

type DrawerTab = "unread" | "all";
type DrawerStep =
  | { kind: "list" }
  | { kind: "detail"; item: NotificationActivityItem }
  | { kind: "ticket"; ticketId: string; fromItem: NotificationActivityItem }
  | { kind: "create-ticket"; fromItem: NotificationActivityItem };

const NotificationDrawer = ({ open, onDismiss }: NotificationDrawerProps) => {
  const [items] = useState<NotificationActivityItem[]>(() => getSeedNotificationActivity());
  const [readKeys, setReadKeys] = useState<Set<string>>(() => new Set());
  const [step, setStep] = useState<DrawerStep>({ kind: "list" });
  const [tab, setTab] = useState<DrawerTab>("unread");

  // Reset to list whenever the modal opens
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setStep({ kind: "list" });
  }

  const markRead = (id: string) => {
    setReadKeys((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleSelect = (item: NotificationActivityItem) => {
    markRead(item.id);
    setStep({ kind: "detail", item });
  };

  const sortedAll = [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const unreadCount = items.filter((i) => !readKeys.has(i.id)).length;
  const visible = tab === "unread" ? sortedAll.filter((i) => !readKeys.has(i.id)) : sortedAll;

  // Create-ticket output — open jmarr's create flow, prefilled from the alert.
  if (step.kind === "create-ticket") {
    if (!open) return null;
    const back = step.fromItem;
    return (
      <CreateTicketModal
        onDismiss={() => setStep({ kind: "detail", item: back })}
        onSuccess={() => setStep({ kind: "detail", item: back })}
        prefill={{
          alertId: back.id,
          component: typeof back.metadata.component === "string" ? back.metadata.component : undefined,
          diagnosis: back.description,
        }}
      />
    );
  }

  // Ticket output — open jmarr's real ticket detail, with a reverse link back to this alert.
  if (step.kind === "ticket") {
    if (!open) return null;
    const back = step.fromItem;
    return (
      <TicketDetailModal
        ticketId={step.ticketId}
        onDismiss={() => setStep({ kind: "detail", item: back })}
        onViewAlert={(alertId) => {
          const alert = items.find((i) => i.id === alertId);
          setStep(alert ? { kind: "detail", item: alert } : { kind: "list" });
        }}
      />
    );
  }

  if (step.kind === "detail") {
    const item = step.item;
    return (
      <Modal
        open={open}
        onDismiss={onDismiss}
        icon={<ArrowLeftCompact />}
        iconAriaLabel="Back to alerts"
        onIconClick={() => setStep({ kind: "list" })}
        title={item.description}
        divider={false}
      >
        <NotificationDetailBody
          item={item}
          onViewTicket={(ticketId) => setStep({ kind: "ticket", ticketId, fromItem: item })}
          onCreateTicket={() => setStep({ kind: "create-ticket", fromItem: item })}
        />
      </Modal>
    );
  }

  return (
    <Modal open={open} onDismiss={onDismiss} divider={false}>
      <div className="flex flex-col">
        <div className="mb-4 text-heading-300 text-text-primary">Alerts</div>
        <div className="flex gap-1 border-b border-surface-10">
          {(["unread", "all"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? "border-b-2 border-core-primary-fill px-3 py-2 text-300 font-medium text-text-primary"
                  : "border-b-2 border-transparent px-3 py-2 text-300 text-text-primary-50 hover:text-text-primary"
              }
            >
              {t === "unread" ? `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` : "All"}
            </button>
          ))}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {visible.length === 0 ? (
            <div className="py-10 text-center text-text-primary-50">
              {tab === "unread" ? "All caught up" : "No notifications"}
            </div>
          ) : (
            <div className="divide-y divide-surface-10">
              {visible.map((item) => {
                const Icon = notificationIconMap[item.kind];
                const isRead = readKeys.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={clsx(
                      "flex w-full items-center gap-3 px-2 py-3 text-left hover:bg-surface-5",
                      isRead ? "text-text-primary-50" : "text-text-primary",
                    )}
                  >
                    <div className="shrink-0">
                      <Icon width="w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-400 break-words">{item.description}</div>
                      <div className="text-300 text-text-primary-50">
                        {item.scopeLabel}, {formatActivityTimestamp(Math.floor(item.createdAt.getTime() / 1000))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default NotificationDrawer;
