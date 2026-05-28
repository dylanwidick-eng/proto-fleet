import { useCallback, useMemo, useState } from "react";
import AddChannelModal from "./AddChannelModal";
import ChannelEditableCell from "./ChannelEditableCell";
import ChannelStatusBadge from "./ChannelStatusBadge";
import { useNotificationsStore } from "@/protoFleet/features/notifications/store/notificationsStore";
import type { Channel } from "@/protoFleet/features/notifications/types";
import { Checkmark, Edit, Trash } from "@/shared/assets/icons";
import Button, { sizes, variants } from "@/shared/components/Button";
import Header from "@/shared/components/Header";
import List from "@/shared/components/List";
import type { ColConfig, ColTitles, ListAction } from "@/shared/components/List/types";
import { pushToast, STATUSES } from "@/shared/features/toaster";

type ChannelColumns = "name" | "destination" | "status";

const colTitles: ColTitles<ChannelColumns> = {
  name: "Name",
  destination: "Destination",
  status: "Status",
};

const activeCols: ChannelColumns[] = ["name", "destination", "status"];

const formatDestination = (c: Channel) =>
  c.kind === "webhook" ? c.webhook?.url ?? "" : (c.smtp?.to ?? []).join(", ");

const ChannelsSection = () => {
  const channels = useNotificationsStore((s) => s.channels);
  const updateChannel = useNotificationsStore((s) => s.updateChannel);
  const removeChannel = useNotificationsStore((s) => s.removeChannel);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  const handleEdit = useCallback((channel: Channel) => {
    setEditingChannel(channel);
    setShowAddModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setEditingChannel(null);
  }, []);

  const handleTest = useCallback(
    (id: string) => {
      // Mock test: flip to validated. Engineer will wire real send-test flow later.
      updateChannel(id, (prev) => ({
        ...prev,
        validated_at: new Date().toISOString(),
        validation_state: "ok",
        validation_error: null,
        updated_at: new Date().toISOString(),
      }));
      pushToast({ message: "Test delivery sent", status: STATUSES.success });
    },
    [updateChannel],
  );

  const handleDelete = useCallback(
    (channel: Channel) => {
      removeChannel(channel.id);
      pushToast({ message: `Deleted channel "${channel.name}"`, status: STATUSES.success });
    },
    [removeChannel],
  );

  const actions: ListAction<Channel>[] = useMemo(
    () => [
      {
        title: "Edit",
        icon: <Edit />,
        actionHandler: handleEdit,
      },
      {
        title: "Test",
        icon: <Checkmark />,
        actionHandler: (channel) => handleTest(channel.id),
      },
      {
        title: "Delete",
        icon: <Trash />,
        variant: "destructive",
        actionHandler: handleDelete,
      },
    ],
    [handleEdit, handleTest, handleDelete],
  );

  const colConfig: ColConfig<Channel, string, ChannelColumns> = useMemo(
    () => ({
      name: {
        component: (channel) => <ChannelEditableCell value={channel.name} />,
        width: "w-80",
      },
      destination: {
        component: (channel) => <ChannelEditableCell value={formatDestination(channel)} />,
        width: "w-96",
        allowWrap: true,
      },
      status: {
        component: (channel) => <ChannelStatusBadge state={channel.validation_state} />,
        width: "w-80",
      },
    }),
    [],
  );

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border-5 p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <Header title="Channels" titleSize="text-heading-200" />
          <Button
            variant={variants.secondary}
            size={sizes.compact}
            text="Add channel"
            onClick={() => setShowAddModal(true)}
          />
        </div>
        <p className="text-300 text-text-primary-50">
          Webhook and email destinations the rule engine delivers notifications to.
        </p>
      </div>

      <List<Channel, string, ChannelColumns>
        items={channels}
        itemKey="id"
        activeCols={activeCols}
        colTitles={colTitles}
        colConfig={colConfig}
        total={channels.length}
        itemName={{ singular: "channel", plural: "channels" }}
        noDataElement={
          <div className="py-10 text-center text-text-primary-50">
            No channels yet — add an SMTP relay or webhook URL to start getting alerts.
          </div>
        }
        actions={actions}
        applyColumnWidthsToCells
        tableClassName="mb-6 [&_td]:!border-x-0 [&_th]:!border-x-0 [&_td[data-testid='action']>div]:!ml-auto"
      />

      <AddChannelModal open={showAddModal} editingChannel={editingChannel} onDismiss={closeModal} />
    </section>
  );
};

export default ChannelsSection;
