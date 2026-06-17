import { useCallback, useMemo, useState } from "react";
import RuleChannelsField from "./RuleChannelsField";
import RuleLivePreview from "./RuleLivePreview";
import RuleRecipientsField from "./RuleRecipientsField";
import SinglePickerField from "./SinglePickerField";
import { getLivePreview } from "@/protoFleet/features/notifications/lib/livePreview";
import {
  RULE_SCOPE_LABELS,
  RULE_SCOPE_NO_TARGET,
  RULE_SCOPE_TARGET_LABELS,
  RULE_TEMPLATES,
} from "@/protoFleet/features/notifications/lib/ruleTemplates";
import { getRuleScopeTargets } from "@/protoFleet/features/notifications/lib/scopeTargets";
import { selectUsers, useNotificationsStore } from "@/protoFleet/features/notifications/store/notificationsStore";
import type { Rule, RuleScopeKind, RuleTemplate } from "@/protoFleet/features/notifications/types";
import { Alert } from "@/shared/assets/icons";
import { variants } from "@/shared/components/Button";
import Callout from "@/shared/components/Callout";
import Input from "@/shared/components/Input";
import Modal from "@/shared/components/Modal";
import Select from "@/shared/components/Select";
import Switch from "@/shared/components/Switch";
import { pushToast, STATUSES } from "@/shared/features/toaster";

interface AddRuleModalProps {
  open: boolean;
  editingRule: Rule | null;
  onDismiss: () => void;
  onBack?: () => void;
}

const newRuleId = () => `rul_${Date.now().toString(36)}`;

const SCOPE_OPTIONS = (Object.keys(RULE_SCOPE_LABELS) as RuleScopeKind[]).map((kind) => ({
  value: kind,
  label: RULE_SCOPE_LABELS[kind],
}));

const TEMPLATE_OPTIONS = RULE_TEMPLATES.map((t) => ({ value: t.id, label: t.label }));

const AddRuleModal = ({ open, editingRule, onDismiss, onBack }: AddRuleModalProps) => {
  const channels = useNotificationsStore((s) => s.channels);
  const users = useNotificationsStore(selectUsers);
  const appendRule = useNotificationsStore((s) => s.appendRule);
  const updateRule = useNotificationsStore((s) => s.updateRule);

  const isEditing = editingRule != null;

  const [template, setTemplate] = useState<RuleTemplate>("offline");
  const [name, setName] = useState("");
  const [scope, setScope] = useState<RuleScopeKind>("all");
  const [scopeTarget, setScopeTarget] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");
  const [thresholdDuration, setThresholdDuration] = useState("300");
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [createTicket, setCreateTicket] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState<"form" | "preview">("form");

  const tplMeta = useMemo(() => RULE_TEMPLATES.find((t) => t.id === template), [template]);

  // Sync form state when the modal opens (init from editing rule, or reset to defaults).
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const syncKey = open ? (editingRule?.id ?? "__add__") : null;
  if (syncedFor !== syncKey) {
    setSyncedFor(syncKey);
    if (!open) {
      // Defer the reset to next open so closed modals don't redo state on every render.
    } else if (editingRule) {
      setTemplate(editingRule.template);
      setName(editingRule.name);
      setScope(editingRule.scope.kind);
      setScopeTarget(editingRule.scope.target_id ?? editingRule.scope.group_id ?? null);
      setThresholdValue(editingRule.threshold.value != null ? String(editingRule.threshold.value) : "");
      setThresholdDuration(String(editingRule.threshold.duration_seconds ?? 300));
      setSelectedChannelIds(editingRule.channel_ids ?? []);
      setSelectedUserIds(editingRule.recipient_user_ids ?? []);
      setCreateTicket(editingRule.create_ticket ?? false);
      setErrorMsg("");
      setStep("form");
    } else {
      setTemplate("offline");
      setName("");
      setScope("all");
      setScopeTarget(null);
      setThresholdValue("");
      setThresholdDuration("300");
      setSelectedChannelIds(channels.length > 0 ? [channels[0].id] : []);
      setSelectedUserIds([]);
      setCreateTicket(false);
      setErrorMsg("");
      setStep("form");
    }
  }

  const clearError = () => setErrorMsg("");

  const handleTemplateChange = (next: string) => {
    const id = next as RuleTemplate;
    setTemplate(id);
    const meta = RULE_TEMPLATES.find((t) => t.id === id);
    if (meta) {
      setThresholdDuration(String(meta.defaultDuration));
      setThresholdValue(meta.defaultValue != null ? String(meta.defaultValue) : "");
    }
    clearError();
  };

  const handleScopeChange = (next: string) => {
    const id = next as RuleScopeKind;
    if (id !== scope) setScopeTarget(null);
    setScope(id);
    clearError();
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(channelId) ? prev.filter((id) => id !== channelId) : [...prev, channelId],
    );
    clearError();
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
    clearError();
  };

  const validateAndPreview = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Add a name for this rule");
      return;
    }
    setErrorMsg("");
    setStep("preview");
  }, [name]);

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Add a name for this rule");
      setStep("form");
      return;
    }

    const duration = parseInt(thresholdDuration, 10) || 0;
    const value = thresholdValue ? parseFloat(thresholdValue) || null : null;
    const targetId = RULE_SCOPE_NO_TARGET.has(scope) ? null : scopeTarget;

    const partial = {
      name: trimmedName,
      template,
      scope: {
        kind: scope,
        target_id: targetId,
        group_id: scope === "group" ? targetId : null,
        device_ids: [],
      },
      threshold: {
        duration_seconds: duration,
        value,
        comparator: tplMeta?.comparator ?? null,
      },
      custom_expr: null,
      channel_ids: selectedChannelIds,
      recipient_user_ids: selectedUserIds,
      create_ticket: createTicket,
      updated_at: new Date().toISOString(),
    };

    if (isEditing && editingRule) {
      updateRule(editingRule.id, (prev) => ({ ...prev, ...partial }));
      pushToast({ message: `Updated: ${trimmedName}`, status: STATUSES.success });
    } else {
      appendRule({
        id: newRuleId(),
        organization_id: "org_local_dev",
        ...partial,
        silenced_until: null,
        enabled: true,
        created_at: new Date().toISOString(),
        last_fired_at: null,
        fire_count: 0,
        compile_state: "ok",
        compile_error: null,
      });
      pushToast({ message: `Saved: ${trimmedName}`, status: STATUSES.success });
    }
    onDismiss();
  }, [
    name,
    template,
    scope,
    scopeTarget,
    thresholdValue,
    thresholdDuration,
    selectedChannelIds,
    selectedUserIds,
    createTicket,
    tplMeta,
    isEditing,
    editingRule,
    appendRule,
    updateRule,
    onDismiss,
  ]);

  const scopeTargets = useMemo(() => getRuleScopeTargets(scope), [scope]);
  const showTarget = !RULE_SCOPE_NO_TARGET.has(scope);

  const livePreview = useMemo(() => {
    const targetLabel = scopeTargets.find((t) => t.id === scopeTarget)?.label ?? null;
    const channelNames = selectedChannelIds
      .map((id) => channels.find((c) => c.id === id)?.name)
      .filter((n): n is string => Boolean(n));
    const recipientNames = selectedUserIds
      .map((id) => users.find((u) => u.id === id)?.name)
      .filter((n): n is string => Boolean(n));
    return getLivePreview({
      template,
      scope,
      scopeTargetLabel: targetLabel,
      thresholdValue,
      thresholdDuration,
      channelNames,
      customExpr: "",
      ruleName: name.trim() || undefined,
      recipientNames,
    });
  }, [
    template,
    scope,
    scopeTarget,
    scopeTargets,
    thresholdValue,
    thresholdDuration,
    selectedChannelIds,
    channels,
    selectedUserIds,
    users,
    name,
  ]);

  const previewButtons = [
    {
      text: "Back",
      onClick: () => setStep("form"),
      variant: variants.secondary,
      dismissModalOnClick: false,
    },
    {
      text: "Confirm and save",
      onClick: handleSave,
      variant: variants.primary,
      dismissModalOnClick: false,
    },
  ];

  const formButtons = [
    ...(onBack
      ? [
          {
            text: "Back",
            onClick: onBack,
            variant: variants.secondary,
            dismissModalOnClick: false,
          },
        ]
      : []),
    {
      text: "Save rule",
      onClick: validateAndPreview,
      variant: variants.primary,
      dismissModalOnClick: false,
    },
  ];

  return (
    <Modal
      open={open}
      onDismiss={onDismiss}
      title={step === "preview" ? "Preview" : isEditing ? "Edit rule" : "Add rule"}
      description={
        step === "preview"
          ? "Confirm this is what your notification will look like across channels."
          : "Define when an alert fires and who gets notified. Start from a template and adjust the threshold to fit your fleet."
      }
      buttons={step === "preview" ? previewButtons : formButtons}
      divider={false}
    >
      {errorMsg ? <Callout className="mb-6" intent="danger" prefixIcon={<Alert />} title={errorMsg} /> : null}

      {step === "preview" ? (
        <RuleLivePreview preview={livePreview} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="rule-template"
              label="Template"
              value={template}
              options={TEMPLATE_OPTIONS}
              onChange={handleTemplateChange}
            />
            <Input
              id="rule-name"
              label="Name"
              initValue={name}
              onChange={(value) => {
                setName(value);
                clearError();
              }}
              autoFocus
            />
          </div>

          <Select id="rule-scope" label="Scope" value={scope} options={SCOPE_OPTIONS} onChange={handleScopeChange} />
          {showTarget ? (
            <SinglePickerField
              id="rule-scope-target"
              label={RULE_SCOPE_TARGET_LABELS[scope] ?? "Target"}
              options={scopeTargets}
              value={scopeTarget}
              emptyMessage={`No ${(RULE_SCOPE_TARGET_LABELS[scope] ?? "target").toLowerCase()}s yet`}
              onChange={(value) => {
                setScopeTarget(value);
                clearError();
              }}
            />
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="rule-threshold-value"
              label="Threshold"
              initValue={thresholdValue}
              onChange={(value) => {
                setThresholdValue(value);
                clearError();
              }}
            />
            <Input
              id="rule-threshold-duration"
              label="Sustained for (seconds)"
              initValue={thresholdDuration}
              onChange={(value) => {
                setThresholdDuration(value);
                clearError();
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <RuleChannelsField channels={channels} selectedIds={selectedChannelIds} onToggle={toggleChannel} />
            <RuleRecipientsField users={users} selectedIds={selectedUserIds} onToggle={toggleUser} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-300 text-text-primary">Create ticket</span>
              <span className="text-200 text-text-primary-50">
                Open a repair ticket automatically when this rule fires.
              </span>
            </div>
            <Switch checked={createTicket} setChecked={setCreateTicket} />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AddRuleModal;
