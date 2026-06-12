import { useState } from "react";
import clsx from "clsx";

import NotificationDetailBody from "@/protoFleet/features/notifications/components/NotificationDetailBody";
import {
  type NotificationActivityItem,
  getSeedNotificationActivity,
  notificationIconMap,
} from "@/protoFleet/features/notifications/lib/seedNotificationActivity";
import { variants } from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import { formatActivityTimestamp } from "@/shared/utils/formatTimestamp";

interface NotificationDrawerProps {
  open: boolean;
  onDismiss: () => void;
}

type DrawerTab = "unread" | "all";
type DrawerStep = { kind: "list" } | { kind: "detail"; item: NotificationActivityItem };

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

  if (step.kind === "detail") {
    const item = step.item;
    const detailButtons = [
      {
        text: "Back",
        variant: variants.secondary,
        dismissModalOnClick: false,
        onClick: () => setStep({ kind: "list" }),
      },
      {
        text: "View related miners",
        variant: variants.primary,
        disabled: !item.scopeLabel,
        dismissModalOnClick: false,
        onClick: () => {
          // Demo placeholder — wire later to scoped fleet view.
        },
      },
    ];
    return (
      <Modal open={open} onDismiss={onDismiss} title={item.description} buttons={detailButtons} divider={false}>
        <NotificationDetailBody item={item} />
      </Modal>
    );
  }

  return (
    <Modal open={open} onDismiss={onDismiss} divider={false}>
      <div className="flex flex-col">
        <div className="mb-4 text-heading-300 text-text-primary">Notifications</div>
        <div className="flex gap-1 border-b border-surface-10">
          {(["unread", "all"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? "border-b-2 border-core-primary-fill px-3 py-2 text-200 font-medium text-text-primary"
                  : "border-b-2 border-transparent px-3 py-2 text-200 text-text-primary-50 hover:text-text-primary"
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
                      "flex w-full items-start gap-3 px-2 py-3 text-left hover:bg-surface-5",
                      isRead && "text-text-primary-50",
                    )}
                  >
                    <div className="shrink-0 pt-0.5">
                      <Icon width="w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="break-words">{item.description}</div>
                      <div className="text-200 text-text-primary-50">
                        {item.scopeLabel} · {formatActivityTimestamp(Math.floor(item.createdAt.getTime() / 1000))}
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
