import { useCallback, useState } from "react";
import { useNotificationsStore } from "@/protoFleet/features/notifications/store/notificationsStore";
import type { Channel, ChannelKind } from "@/protoFleet/features/notifications/types";
import { Alert } from "@/shared/assets/icons";
import { variants } from "@/shared/components/Button";
import Callout from "@/shared/components/Callout";
import Input from "@/shared/components/Input";
import Modal from "@/shared/components/Modal";
import SegmentedControl from "@/shared/components/SegmentedControl";
import { pushToast, STATUSES } from "@/shared/features/toaster";

interface AddChannelModalProps {
  open: boolean;
  editingChannel?: Channel | null;
  onDismiss: () => void;
}

const newChannelId = () => `chn_${Date.now().toString(36)}`;

const AddChannelModal = ({ open, editingChannel, onDismiss }: AddChannelModalProps) => {
  const channelsCount = useNotificationsStore((s) => s.channels.length);
  const rules = useNotificationsStore((s) => s.rules);
  const appendChannel = useNotificationsStore((s) => s.appendChannel);
  const updateChannel = useNotificationsStore((s) => s.updateChannel);
  const updateRule = useNotificationsStore((s) => s.updateRule);

  const isEditing = editingChannel != null;

  const [kind, setKind] = useState<ChannelKind>("webhook");
  const [name, setName] = useState("");
  // Webhook fields
  const [webhookUrl, setWebhookUrl] = useState("");
  const [bearerHeader, setBearerHeader] = useState("");
  // SMTP fields
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [smtpTo, setSmtpTo] = useState("");

  const [errorMsg, setErrorMsg] = useState("");

  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const syncKey = open ? (editingChannel?.id ?? "__add__") : null;
  if (syncedFor !== syncKey) {
    setSyncedFor(syncKey);
    if (open && editingChannel) {
      setKind(editingChannel.kind);
      setName(editingChannel.name);
      setWebhookUrl(editingChannel.webhook?.url ?? "");
      setBearerHeader(editingChannel.webhook?.bearer_header ?? "");
      setSmtpHost(editingChannel.smtp?.host ?? "");
      setSmtpPort(editingChannel.smtp?.port != null ? String(editingChannel.smtp.port) : "");
      setSmtpUsername(editingChannel.smtp?.username ?? "");
      setSmtpFrom(editingChannel.smtp?.from ?? "");
      setSmtpTo((editingChannel.smtp?.to ?? []).join(", "));
      setErrorMsg("");
    } else if (open) {
      setKind("webhook");
      setName("");
      setWebhookUrl("");
      setBearerHeader("");
      setSmtpHost("");
      setSmtpPort("");
      setSmtpUsername("");
      setSmtpFrom("");
      setSmtpTo("");
      setErrorMsg("");
    }
  }

  const clearError = () => setErrorMsg("");

  const handleSendTest = useCallback(() => {
    // Synthetic test — engineer will wire to real send-test endpoint later.
    pushToast({ message: "Test alert sent (synthetic)", status: STATUSES.success });
  }, []);

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Add a name for this channel");
      return;
    }

    let webhook: Channel["webhook"] = null;
    let smtp: Channel["smtp"] = null;

    if (kind === "webhook") {
      const url = webhookUrl.trim();
      if (!url) {
        setErrorMsg("Add a webhook URL");
        return;
      }
      webhook = { url, bearer_header: bearerHeader.trim() || null };
    } else {
      const host = smtpHost.trim();
      const port = parseInt(smtpPort, 10) || 587;
      const to = smtpTo
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!host || to.length === 0) {
        setErrorMsg("Need a host and at least one To address");
        return;
      }
      smtp = {
        host,
        port,
        username: smtpUsername.trim(),
        from: smtpFrom.trim(),
        to,
      };
    }

    const now = new Date().toISOString();

    if (isEditing && editingChannel) {
      updateChannel(editingChannel.id, (prev) => ({
        ...prev,
        name: trimmedName,
        kind,
        webhook,
        smtp,
        updated_at: now,
        // Destination changed → invalidate previous test result
        validated_at:
          prev.kind === kind &&
          (kind === "webhook" ? prev.webhook?.url === webhook?.url : JSON.stringify(prev.smtp) === JSON.stringify(smtp))
            ? prev.validated_at
            : null,
        validation_state:
          prev.kind === kind &&
          (kind === "webhook" ? prev.webhook?.url === webhook?.url : JSON.stringify(prev.smtp) === JSON.stringify(smtp))
            ? prev.validation_state
            : "pending",
        validation_error: null,
      }));
      pushToast({ message: `Updated: ${trimmedName}`, status: STATUSES.success });
      onDismiss();
      return;
    }

    const channel: Channel = {
      id: newChannelId(),
      organization_id: "org_local_dev",
      name: trimmedName,
      kind,
      webhook,
      smtp,
      created_at: now,
      updated_at: now,
      validated_at: null,
      validation_state: "pending",
      validation_error: null,
    };

    const wasFirstChannel = channelsCount === 0;
    appendChannel(channel);

    // Auto-attach this channel to any enabled rule that has no channels yet
    // so a fresh operator's first channel actually starts delivering alerts.
    let autoAttached = 0;
    rules.forEach((rule) => {
      if (rule.enabled && (!rule.channel_ids || rule.channel_ids.length === 0)) {
        updateRule(rule.id, (prev) => ({
          ...prev,
          channel_ids: [channel.id],
          updated_at: new Date().toISOString(),
        }));
        autoAttached += 1;
      }
    });

    let toastMessage: string;
    if (autoAttached > 0) {
      toastMessage = `Saved: ${trimmedName} · auto-attached to ${autoAttached} default rule${
        autoAttached === 1 ? "" : "s"
      }`;
    } else if (wasFirstChannel) {
      toastMessage = `Saved: ${trimmedName} · default rules now have a destination`;
    } else {
      toastMessage = `Saved: ${trimmedName}`;
    }
    pushToast({ message: toastMessage, status: STATUSES.success });
    onDismiss();
  }, [
    name,
    kind,
    webhookUrl,
    bearerHeader,
    smtpHost,
    smtpPort,
    smtpUsername,
    smtpFrom,
    smtpTo,
    channelsCount,
    rules,
    appendChannel,
    updateChannel,
    updateRule,
    onDismiss,
    isEditing,
    editingChannel,
  ]);

  // Only surface "Send test" once there's something testable. For webhooks that's
  // a URL; for SMTP we need at least one To address (matches the save validator).
  const canTest = kind === "webhook" ? webhookUrl.trim().length > 0 : smtpTo.trim().length > 0;

  return (
    <Modal
      open={open}
      onDismiss={onDismiss}
      title={isEditing ? "Edit channel" : "Add channel"}
      description="Pick a destination. Test the channel before saving so you don't ship a dead receiver into the live config."
      buttons={[
        ...(canTest
          ? [
              {
                text: "Send test",
                onClick: handleSendTest,
                variant: variants.secondary,
                dismissModalOnClick: false,
                // Match the codebase's existing fade-in (used in Setup, etc.).
                className: "animate-[fade-in_.3s_ease-in-out]",
              },
            ]
          : []),
        {
          text: "Save channel",
          onClick: handleSave,
          variant: variants.primary,
          dismissModalOnClick: false,
        },
      ]}
      divider={false}
    >
      {errorMsg ? <Callout className="mb-6" intent="danger" prefixIcon={<Alert />} title={errorMsg} /> : null}

      <div className="flex flex-col gap-4">
        <SegmentedControl
          segments={[
            { key: "webhook", title: "Webhook" },
            { key: "smtp", title: "SMTP (email)" },
          ]}
          initialSegmentKey={kind}
          onSelect={(key) => {
            setKind(key as ChannelKind);
            clearError();
          }}
        />

        <Input
          id="channel-name"
          label="Name"
          initValue={name}
          onChange={(value) => {
            setName(value);
            clearError();
          }}
          autoFocus
        />

        {kind === "webhook" ? (
          <>
            <Input
              id="channel-webhook-url"
              label="URL"
              initValue={webhookUrl}
              onChange={(value) => {
                setWebhookUrl(value);
                clearError();
              }}
            />
            <Input
              id="channel-webhook-bearer"
              label="Bearer header (optional)"
              initValue={bearerHeader}
              onChange={(value) => {
                setBearerHeader(value);
                clearError();
              }}
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_120px] gap-4">
              <Input
                id="channel-smtp-host"
                label="Host"
                initValue={smtpHost}
                onChange={(value) => {
                  setSmtpHost(value);
                  clearError();
                }}
              />
              <Input
                id="channel-smtp-port"
                label="Port"
                initValue={smtpPort}
                onChange={(value) => {
                  setSmtpPort(value);
                  clearError();
                }}
              />
            </div>
            <Input
              id="channel-smtp-username"
              label="Username"
              initValue={smtpUsername}
              onChange={(value) => {
                setSmtpUsername(value);
                clearError();
              }}
            />
            <Input
              id="channel-smtp-from"
              label="From"
              initValue={smtpFrom}
              onChange={(value) => {
                setSmtpFrom(value);
                clearError();
              }}
            />
            <Input
              id="channel-smtp-to"
              label="To (comma-separated)"
              initValue={smtpTo}
              onChange={(value) => {
                setSmtpTo(value);
                clearError();
              }}
            />
          </>
        )}

        <p className="pt-2 text-200 text-text-primary-50">
          Verify the destination before saving — Alertmanager doesn't let you test in place.
        </p>
      </div>
    </Modal>
  );
};

export default AddChannelModal;
