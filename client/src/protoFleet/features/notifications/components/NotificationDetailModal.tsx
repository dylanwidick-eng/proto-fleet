import NotificationDetailBody from "@/protoFleet/features/notifications/components/NotificationDetailBody";
import { type NotificationActivityItem } from "@/protoFleet/features/notifications/lib/seedNotificationActivity";
import { variants } from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";

interface NotificationDetailModalProps {
  item: NotificationActivityItem | null;
  onDismiss: () => void;
  onViewScope?: (item: NotificationActivityItem) => void;
  onViewRule?: (ruleId: string) => void;
}

const NotificationDetailModal = ({ item, onDismiss, onViewScope, onViewRule }: NotificationDetailModalProps) => {
  if (!item) return null;

  const headerButtons = [
    {
      text: "View related miners",
      variant: variants.primary,
      disabled: !item.scopeLabel,
      dismissModalOnClick: false,
      onClick: () => {
        if (item.scopeLabel) onViewScope?.(item);
      },
    },
  ];

  return (
    <Modal open onDismiss={onDismiss} title={item.description} buttons={headerButtons} divider={false}>
      <NotificationDetailBody item={item} onViewRule={onViewRule} />
    </Modal>
  );
};

export default NotificationDetailModal;
