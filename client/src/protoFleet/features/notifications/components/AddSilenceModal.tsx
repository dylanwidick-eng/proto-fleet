import { useCallback, useMemo, useState } from "react";
import SinglePickerField from "./SinglePickerField";
import {
  SILENCE_QUICK_OPTIONS,
  SILENCE_SCOPE_OPTIONS,
  toLocalDatetimeValue,
} from "@/protoFleet/features/notifications/lib/silenceOptions";
import { useNotificationsStore } from "@/protoFleet/features/notifications/store/notificationsStore";
import type {
  SilenceScopeKind,
  SilenceWithActive,
} from "@/protoFleet/features/notifications/types";
import { Alert } from "@/shared/assets/icons";
import { variants } from "@/shared/components/Button";
import Callout from "@/shared/components/Callout";
import Input from "@/shared/components/Input";
import Modal from "@/shared/components/Modal";
import { pushToast, STATUSES } from "@/shared/features/toaster";

interface AddSilenceModalProps {
  open: boolean;
  editingSilence: SilenceWithActive | null;
  // When opening from a rule row action, pre-pick that rule.
  prefillRuleId?: string | null;
  onDismiss: () => void;
}

const newSilenceId = () => `sil_${Date.now().toString(36)}`;

const DEFAULT_QUICK = "4h";

const computeEndsFromQuick = (quick: string): Date => {
  const meta = SILENCE_QUICK_OPTIONS.find((q) => q.id === quick);
  const hours = meta?.hours ?? 4;
  return new Date(Date.now() + hours * 3600 * 1000);
};

const AddSilenceModal = ({
  open,
  editingSilence,
  prefillRuleId,
  onDismiss,
}: AddSilenceModalProps) => {
  const rules = useNotificationsStore((s) => s.rules);
  const appendSilence = useNotificationsStore((s) => s.appendSilence);
  const updateSilence = useNotificationsStore((s) => s.updateSilence);

  const isEditing = editingSilence != null;

  const [scope, setScope] = useState<SilenceScopeKind>("rule");
  const [ruleId, setRuleId] = useState<string | null>(null);
  const [quick, setQuick] = useState<string | null>(DEFAULT_QUICK);
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [comment, setComment] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const syncKey = open ? (editingSilence?.id ?? `__add__${prefillRuleId ?? ""}`) : null;
  if (syncedFor !== syncKey) {
    setSyncedFor(syncKey);
    if (open) {
      if (editingSilence) {
        setScope(editingSilence.scope.kind);
        setRuleId(editingSilence.scope.rule_id);
        setQuick(null); // Editing: no quick window preset, show explicit datetimes.
        setStarts(toLocalDatetimeValue(new Date(editingSilence.starts_at)));
        setEnds(editingSilence.ends_at ? toLocalDatetimeValue(new Date(editingSilence.ends_at)) : "");
        setComment(editingSilence.comment);
        setErrorMsg("");
      } else {
        const now = new Date();
        const end = computeEndsFromQuick(DEFAULT_QUICK);
        setScope("rule");
        setRuleId(prefillRuleId ?? rules[0]?.id ?? null);
        setQuick(DEFAULT_QUICK);
        setStarts(toLocalDatetimeValue(now));
        setEnds(toLocalDatetimeValue(end));
        setComment("");
        setErrorMsg("");
      }
    }
  }

  const clearError = () => setErrorMsg("");

  const ruleOptions = useMemo(() => rules.map((r) => ({ id: r.id, label: r.name })), [rules]);

  const handleQuickChange = useCallback((next: string) => {
    setQuick(next);
    const now = new Date();
    const end = computeEndsFromQuick(next);
    setStarts(toLocalDatetimeValue(now));
    setEnds(toLocalDatetimeValue(end));
    clearError();
  }, []);

  // If the operator hand-edits the datetimes, the preset window no longer
  // matches — drop the quick-window selection to "Custom".
  const handleStartsChange = (value: string) => {
    setStarts(value);
    setQuick(null);
    clearError();
  };
  const handleEndsChange = (value: string) => {
    setEnds(value);
    setQuick(null);
    clearError();
  };

  const handleSave = useCallback(() => {
    if (!starts || !ends) {
      setErrorMsg("Pick a start and end time");
      return;
    }
    if (new Date(ends) <= new Date(starts)) {
      setErrorMsg("End must be after start");
      return;
    }

    if (scope === "rule" && !ruleId) {
      setErrorMsg("Pick a rule");
      return;
    }

    const partial = {
      scope: {
        kind: scope,
        rule_id: scope === "rule" ? ruleId : null,
        // Group / site / specific devices pickers are stubbed in the prototype too.
        // Engineer will wire real pickers when implementing the backend.
        group_id: scope === "group" ? "grp_demo" : null,
        site_id: scope === "site" ? "site_demo" : null,
        device_ids: scope === "device" ? [] : [],
      },
      starts_at: new Date(starts).toISOString(),
      ends_at: new Date(ends).toISOString(),
      comment: comment.trim(),
    };

    if (isEditing && editingSilence) {
      updateSilence(editingSilence.id, (prev) => ({ ...prev, ...partial }));
      pushToast({ message: "Silence updated", status: STATUSES.success });
    } else {
      appendSilence({
        id: newSilenceId(),
        organization_id: "org_local_dev",
        ...partial,
        created_by: "u_dwidick",
        created_at: new Date().toISOString(),
      });
      pushToast({ message: "Silence saved", status: STATUSES.success });
    }
    onDismiss();
  }, [
    starts,
    ends,
    scope,
    ruleId,
    comment,
    isEditing,
    editingSilence,
    appendSilence,
    updateSilence,
    onDismiss,
  ]);

  return (
    <Modal
      open={open}
      onDismiss={onDismiss}
      title={isEditing ? "Edit silence" : "Add silence"}
      description="Mute alerts during planned work. Silenced events still record to the activity log so you can audit what would have fired."
      buttons={[
        {
          text: "Save silence",
          onClick: handleSave,
          variant: variants.primary,
          dismissModalOnClick: false,
        },
      ]}
      divider={false}
    >
      {errorMsg ? <Callout className="mb-6" intent="danger" prefixIcon={<Alert />} title={errorMsg} /> : null}

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <SinglePickerField
            id="silence-scope"
            label="Silence"
            options={SILENCE_SCOPE_OPTIONS}
            value={scope}
            onChange={(value) => {
              setScope(value as SilenceScopeKind);
              clearError();
            }}
          />
          {scope === "rule" ? (
            <SinglePickerField
              id="silence-rule"
              label="Rule"
              options={ruleOptions}
              value={ruleId}
              placeholder="Pick a rule"
              emptyMessage="No rules yet — add one in the Rules section."
              onChange={(value) => {
                setRuleId(value);
                clearError();
              }}
            />
          ) : null}
        </div>

        <SinglePickerField
          id="silence-quick"
          label="Quick window"
          options={SILENCE_QUICK_OPTIONS}
          value={quick}
          placeholder="Custom"
          onChange={handleQuickChange}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            id="silence-starts"
            label="Starts"
            type="datetime-local"
            initValue={starts}
            onChange={handleStartsChange}
          />
          <Input
            id="silence-ends"
            label="Ends"
            type="datetime-local"
            initValue={ends}
            onChange={handleEndsChange}
          />
        </div>

        <Input
          id="silence-comment"
          label="Reason"
          initValue={comment}
          onChange={(value) => {
            setComment(value);
            clearError();
          }}
        />
      </div>
    </Modal>
  );
};

export default AddSilenceModal;
