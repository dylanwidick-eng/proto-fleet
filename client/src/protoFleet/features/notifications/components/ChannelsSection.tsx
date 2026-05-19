import { useCallback, useMemo, useState } from "react";
import AddChannelModal from "./AddChannelModal";
import ChannelEditableCell from "./ChannelEditableCell";
import ChannelStatusBadge from "./ChannelStatusBadge";
import { useNotificationsStore } from "@/protoFleet/features/notifications/store/notificationsStore";
import type { Channel } from "@/protoFleet/features/notifications/types";
import { Checkmark, Trash } from "@/shared/assets/icons";
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

  const handleSaveName = useCallback(
    (id: string, next: string) => {
      updateChannel(id, (prev) => ({ ...prev, name: next, updated_at: new Date().toISOString() }));
      pushToast({ message: `Renamed: ${next}`, status: STATUSES.success });
    },
    [updateChannel],
  );

  const handleSaveDestination = useCallback(
    (id: string, next: string) => {
      updateChannel(id, (prev) => {
        const updated: Channel = {
          ...prev,
          updated_at: new Date().toISOString(),
          // Editing destination invalidates the previous test — operator can retest.
          validated_at: null,
          validation_state: "pending",
          validation_error: null,
        };
        if (prev.kind === "webhook") {
          updated.webhook = { ...(prev.webhook ?? { bearer_header: null }), url: next };
        } else {
          const to = next.split(",").map((s) => s.trim()).filter(Boolean);
          updated.smtp = {
            host: prev.smtp?.host ?? "smtp.example.com",
            port: prev.smtp?.port ?? 587,
            username: prev.smtp?.username ?? "alerts@example.com",
            from: prev.smtp?.from ?? "Proto Fleet Alerts <alerts@example.com>",
            to,
          };
        }
        return updated;
      });
      pushToast({ message: "Destination updated", status: STATUSES.success });
    },
    [updateChannel],
  );

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
    [handleTest, handleDelete],
  );

  const colConfig: ColConfig<Channel, string, ChannelColumns> = useMemo(
    () => ({
      name: {
        component: (channel) => (
          <ChannelEditableCell
            value={channel.name}
            placeholder="Name"
            ariaLabel="name"
            onSave={(next) => handleSaveName(channel.id, next)}
          />
        ),
        width: "w-64",
      },
      destination: {
        component: (channel) => (
          <ChannelEditableCell
            value={formatDestination(channel)}
            placeholder={channel.kind === "webhook" ? "https://hooks…" : "oncall@example.com"}
            ariaLabel="destination"
            onSave={(next) => handleSaveDestination(channel.id, next)}
          />
        ),
        width: "w-96",
        allowWrap: true,
      },
      status: {
        component: (channel) => <ChannelStatusBadge state={channel.validation_state} />,
        width: "w-40",
      },
    }),
    [handleSaveName, handleSaveDestination],
  );

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border-5 p-6">
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
      />

      <AddChannelModal open={showAddModal} onDismiss={() => setShowAddModal(false)} />
    </section>
  );
};

export default ChannelsSection;
