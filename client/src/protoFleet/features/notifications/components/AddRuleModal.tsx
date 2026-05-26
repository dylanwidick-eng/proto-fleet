import { useCallback, useMemo, useState } from "react";
import RuleChannelsField from "./RuleChannelsField";
import RuleLivePreview from "./RuleLivePreview";
import SinglePickerField from "./SinglePickerField";
import { useNotificationsStore } from "@/protoFleet/features/notifications/store/notificationsStore";
import { getLivePreview } from "@/protoFleet/features/notifications/lib/livePreview";
import {
  FLEET_METRICS,
  RULE_SCOPE_LABELS,
  RULE_SCOPE_NO_TARGET,
  RULE_SCOPE_TARGET_LABELS,
  RULE_TEMPLATES,
} from "@/protoFleet/features/notifications/lib/ruleTemplates";
import { getRuleScopeTargets } from "@/protoFleet/features/notifications/lib/scopeTargets";
import type { Rule, RuleScopeKind, RuleTemplate } from "@/protoFleet/features/notifications/types";
import { Alert } from "@/shared/assets/icons";
import { variants } from "@/shared/components/Button";
import Callout from "@/shared/components/Callout";
import Input from "@/shared/components/Input";
import Modal from "@/shared/components/Modal";
import Select from "@/shared/components/Select";
import Textarea from "@/shared/components/Textarea";
import { pushToast, STATUSES } from "@/shared/features/toaster";

interface AddRuleModalProps {
  open: boolean;
  editingRule: Rule | null;
  onDismiss: () => void;
}

const newRuleId = () => `rul_${Date.now().toString(36)}`;

const SCOPE_OPTIONS = (Object.keys(RULE_SCOPE_LABELS) as RuleScopeKind[]).map((kind) => ({
  value: kind,
  label: RULE_SCOPE_LABELS[kind],
}));

const TEMPLATE_OPTIONS = RULE_TEMPLATES.map((t) => ({ value: t.id, label: t.label }));

const AddRuleModal = ({ open, editingRule, onDismiss }: AddRuleModalProps) => {
  const channels = useNotificationsStore((s) => s.channels);
  const appendRule = useNotificationsStore((s) => s.appendRule);
  const updateRule = useNotificationsStore((s) => s.updateRule);

  const isEditing = editingRule != null;

  const [template, setTemplate] = useState<RuleTemplate>("offline");
  const [name, setName] = useState("");
  const [scope, setScope] = useState<RuleScopeKind>("all");
  const [scopeTarget, setScopeTarget] = useState<string | null>(null);
  const [thresholdValue, setThresholdValue] = useState("");
  const [thresholdDuration, setThresholdDuration] = useState("300");
  const [customExpr, setCustomExpr] = useState("");
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState<"form" | "preview">("form");

  const tplMeta = useMemo(() => RULE_TEMPLATES.find((t) => t.id === template), [template]);

  // Sync form state when the modal opens (init from editing rule, or reset to defaults).
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const syncKey = open ? editingRule?.id ?? "__add__" : null;
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
      setCustomExpr(editingRule.custom_expr ?? "");
      setSelectedChannelIds(editingRule.channel_ids ?? []);
      setErrorMsg("");
      setStep("form");
    } else {
      setTemplate("offline");
      setName("");
      setScope("all");
      setScopeTarget(null);
      setThresholdValue("");
      setThresholdDuration("300");
      setCustomExpr("");
      setSelectedChannelIds(channels.length > 0 ? [channels[0].id] : []);
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
    const value =
      template === "custom" ? null : thresholdValue ? parseFloat(thresholdValue) || null : null;
    const expr = template === "custom" ? customExpr.trim() : null;
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
      custom_expr: expr,
      channel_ids: selectedChannelIds,
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
    customExpr,
    selectedChannelIds,
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
    return getLivePreview({
      template,
      scope,
      scopeTargetLabel: targetLabel,
      thresholdValue,
      thresholdDuration,
      channelNames,
      customExpr,
    });
  }, [template, scope, scopeTarget, scopeTargets, thresholdValue, thresholdDuration, selectedChannelIds, channels, customExpr]);

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
          : "Start from a template or write your own PromQL. The server scopes everything to this org automatically."
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

        {template === "custom" ? (
          <>
            <Textarea
              id="rule-custom-expr"
              label="PromQL expression"
              initValue={customExpr}
              onChange={(value) => {
                setCustomExpr(value);
                clearError();
              }}
              rows={3}
            />
            <p className="text-200 text-text-primary-50">
              Server injects organization_id automatically. Only metrics in the{" "}
              <code className="rounded bg-surface-5 px-1 font-mono">fleet_</code> namespace are allowed.
            </p>
            <details className="rounded-xl border border-border-5 p-3">
              <summary className="cursor-pointer text-emphasis-300 text-text-primary">
                Available metrics
              </summary>
              <div className="mt-3 flex flex-col gap-2">
                {FLEET_METRICS.map((m) => (
                  <div key={m.name} className="flex flex-col">
                    <span className="font-mono text-300 text-text-primary">{m.name}</span>
                    <span className="text-200 text-text-primary-50">
                      {m.type} · {m.unit} · labels: {m.labels.join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          </>
        ) : (
          <>
            <Select
              id="rule-scope"
              label="Scope"
              value={scope}
              options={SCOPE_OPTIONS}
              onChange={handleScopeChange}
            />
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
          </>
        )}

        <RuleChannelsField
          channels={channels}
          selectedIds={selectedChannelIds}
          onToggle={toggleChannel}
        />
      </div>
      )}
    </Modal>
  );
};

export default AddRuleModal;
