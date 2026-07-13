import { useCallback, useMemo, useState } from "react";
import CommandFailureThresholdField from "./CommandFailureThresholdField";
import HashrateThresholdField from "./HashrateThresholdField";
import OfflineThresholdField from "./OfflineThresholdField";
import RulePreviewPane from "./RulePreviewPane";
import TemperatureThresholdField from "./TemperatureThresholdField";
import FullScreenTwoPaneModal from "@/protoFleet/components/FullScreenTwoPaneModal";
import { siteFilterFromActive, useActiveSite } from "@/protoFleet/components/PageHeader/SitePicker";
import TargetSelectButton, { getTargetButtonLabel } from "@/protoFleet/components/TargetSelectButton";
import { DEFAULT_COMMAND_KIND_IDS, formatCommandKinds } from "@/protoFleet/features/notifications/lib/commandKinds";
import { getLivePreview } from "@/protoFleet/features/notifications/lib/livePreview";
import {
  RULE_SCOPE_LABELS,
  RULE_SCOPE_NO_TARGET,
  RULE_TEMPLATES,
} from "@/protoFleet/features/notifications/lib/ruleTemplates";
import { getMatchingMiners } from "@/protoFleet/features/notifications/lib/sampleMatchingMiners";
import {
  availableTemperatureModes,
  defaultCommandFailureModeForScope,
  defaultTemperatureModeForScope,
  formatScopePopulation,
} from "@/protoFleet/features/notifications/lib/scopeEvaluation";
import { getRuleScopeTargets } from "@/protoFleet/features/notifications/lib/scopeTargets";
import { selectRoles, useNotificationsStore } from "@/protoFleet/features/notifications/store/notificationsStore";
import type {
  CommandFailureMode,
  HashrateMode,
  HashrateUnit,
  Rule,
  RuleScopeKind,
  RuleTemplate,
  TemperatureMode,
  TemperatureReading,
  TemperatureUnit,
} from "@/protoFleet/features/notifications/types";
import BuildingSelectionModal from "@/protoFleet/features/settings/components/Schedules/BuildingSelectionModal";
import GroupSelectionModal from "@/protoFleet/features/settings/components/Schedules/GroupSelectionModal";
import MinerSelectionModal from "@/protoFleet/features/settings/components/Schedules/MinerSelectionModal";
import RackSelectionModal from "@/protoFleet/features/settings/components/Schedules/RackSelectionModal";
import SiteSelectionModal from "@/protoFleet/features/settings/components/Schedules/SiteSelectionModal";
import { Alert } from "@/shared/assets/icons";
import { variants } from "@/shared/components/Button";
import Callout from "@/shared/components/Callout";
import Input from "@/shared/components/Input";
import Select from "@/shared/components/Select";
import { pushToast, STATUSES } from "@/shared/features/toaster";

interface AddRuleModalProps {
  open: boolean;
  editingRule: Rule | null;
  onDismiss: () => void;
  onBack?: () => void;
}

const newRuleId = () => `rul_${Date.now().toString(36)}`;

const TEMPLATE_OPTIONS = RULE_TEMPLATES.map((t) => ({ value: t.id, label: t.label }));

type ApplyTargetKind = "site" | "building" | "rack" | "group" | "devices";

interface ApplyTargetSelections {
  siteTargetIds: string[];
  buildingTargetIds: string[];
  rackTargetIds: string[];
  groupTargetIds: string[];
  minerTargetIds: string[];
}

const SectionHeader = ({ title, trailing }: { title: string; trailing?: string }) => (
  <div className="flex items-baseline justify-between gap-4">
    <div className="text-emphasis-300 text-text-primary">{title}</div>
    {trailing ? <span className="text-200 text-text-primary-50">{trailing}</span> : null}
  </div>
);

const normalizeHashrateMode = (mode: HashrateMode | undefined): HashrateMode =>
  mode === "absolute" ? "absolute" : "pct_expected";

const durationLabel = (value: string): string => {
  const seconds = parseInt(value, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return "a few minutes";
  if (seconds === 3600) return "1 hour";
  return `${Math.max(1, Math.round(seconds / 60))} minutes`;
};

const getTriggerSectionTitle = (template: RuleTemplate): string => {
  if (template === "hashrate") return "Alert me when hashrate";
  if (template === "offline") return "Alert me when miners are offline for";
  if (template === "temperature") return "Alert me when miner temperature";
  return "When should this alert trigger?";
};

const getNotificationSectionTitle = (template: RuleTemplate): string => {
  if (template === "hashrate") return "Then send notification to";
  return "Then send notification";
};

const getChannelLabel = (kind: string, name: string): string => {
  if (kind === "webhook") return "Slack";
  if (kind === "smtp") return "Email";
  return name;
};

const getRoleLabel = (id: string, name: string): string => {
  if (id === "role_site_ops") return "Site managers";
  return name;
};

const appliesToValue = (scope: RuleScopeKind, targetLabel: string | null): string => {
  if (scope === "all") return "All miners";
  if (scope === "devices") return "Selected miners";
  return targetLabel ?? RULE_SCOPE_LABELS[scope];
};

const getScopeFromTargetSelections = ({
  siteTargetIds,
  buildingTargetIds,
  rackTargetIds,
  groupTargetIds,
  minerTargetIds,
}: ApplyTargetSelections): { kind: RuleScopeKind; targetId: string | null } => {
  if (minerTargetIds.length > 0) return { kind: "devices", targetId: null };
  if (groupTargetIds.length > 0) return { kind: "group", targetId: groupTargetIds[0] };
  if (rackTargetIds.length > 0) return { kind: "rack", targetId: rackTargetIds[0] };
  if (buildingTargetIds.length > 0) return { kind: "building", targetId: buildingTargetIds[0] };
  if (siteTargetIds.length > 0) return { kind: "site", targetId: siteTargetIds[0] };
  return { kind: "all", targetId: null };
};

interface ApplyToSectionProps {
  siteTargetIds: string[];
  buildingTargetIds: string[];
  rackTargetIds: string[];
  groupTargetIds: string[];
  minerTargetIds: string[];
  onSelectSites: () => void;
  onSelectBuildings: () => void;
  onSelectRacks: () => void;
  onSelectGroups: () => void;
  onSelectMiners: () => void;
}

const ApplyToSection = ({
  siteTargetIds,
  buildingTargetIds,
  rackTargetIds,
  groupTargetIds,
  minerTargetIds,
  onSelectSites,
  onSelectBuildings,
  onSelectRacks,
  onSelectGroups,
  onSelectMiners,
}: ApplyToSectionProps) => (
  <div className="grid gap-4">
    <div className="text-emphasis-300 text-text-primary">Apply to</div>
    <div className="grid">
      <TargetSelectButton
        label="Sites"
        value={getTargetButtonLabel(siteTargetIds.length, "site")}
        onClick={onSelectSites}
      />
      <TargetSelectButton
        label="Buildings"
        value={getTargetButtonLabel(buildingTargetIds.length, "building")}
        onClick={onSelectBuildings}
      />
      <TargetSelectButton
        label="Racks"
        value={getTargetButtonLabel(rackTargetIds.length, "rack")}
        onClick={onSelectRacks}
      />
      <TargetSelectButton
        label="Groups"
        value={getTargetButtonLabel(groupTargetIds.length, "group")}
        onClick={onSelectGroups}
      />
      <TargetSelectButton
        label="Miners"
        value={getTargetButtonLabel(minerTargetIds.length, "miner")}
        onClick={onSelectMiners}
      />
    </div>
  </div>
);

const AddRuleModal = ({ open, editingRule, onDismiss, onBack }: AddRuleModalProps) => {
  const channels = useNotificationsStore((s) => s.channels);
  const roles = useNotificationsStore(selectRoles);
  const appendRule = useNotificationsStore((s) => s.appendRule);
  const updateRule = useNotificationsStore((s) => s.updateRule);
  const { activeSite } = useActiveSite({});
  const targetPickerScope = useMemo(() => siteFilterFromActive(activeSite), [activeSite]);

  const isEditing = editingRule != null;

  const [template, setTemplate] = useState<RuleTemplate>("offline");
  const [name, setName] = useState("");
  const [scope, setScope] = useState<RuleScopeKind>("all");
  const [scopeTarget, setScopeTarget] = useState<string | null>(null);
  const [siteTargetIds, setSiteTargetIds] = useState<string[]>([]);
  const [buildingTargetIds, setBuildingTargetIds] = useState<string[]>([]);
  const [rackTargetIds, setRackTargetIds] = useState<string[]>([]);
  const [groupTargetIds, setGroupTargetIds] = useState<string[]>([]);
  const [minerTargetIds, setMinerTargetIds] = useState<string[]>([]);
  const [thresholdValue, setThresholdValue] = useState("");
  const [thresholdDuration, setThresholdDuration] = useState("1800");
  // Hashrate-template-specific.
  const [hashrateMode, setHashrateMode] = useState<HashrateMode>("pct_expected");
  const [hashrateUnit, setHashrateUnit] = useState<HashrateUnit>("PH/s");
  const [hashrateDropValue, setHashrateDropValue] = useState("50");
  // Temperature-template-specific.
  const [temperatureMode, setTemperatureMode] = useState<TemperatureMode>("any_miner");
  const [temperatureReading, setTemperatureReading] = useState<TemperatureReading>("max");
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>("°C");
  const [temperatureCount, setTemperatureCount] = useState("10");
  // Command-failure-template-specific.
  const [commandFailureMode, setCommandFailureMode] = useState<CommandFailureMode>("any");
  const [commandKinds, setCommandKinds] = useState<string[]>(DEFAULT_COMMAND_KIND_IDS);
  const [commandWindow, setCommandWindow] = useState("900");
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [createTicket, setCreateTicket] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSiteSelectionModal, setShowSiteSelectionModal] = useState(false);
  const [showBuildingSelectionModal, setShowBuildingSelectionModal] = useState(false);
  const [showRackSelectionModal, setShowRackSelectionModal] = useState(false);
  const [showGroupSelectionModal, setShowGroupSelectionModal] = useState(false);
  const [showMinerSelectionModal, setShowMinerSelectionModal] = useState(false);

  const tplMeta = useMemo(() => RULE_TEMPLATES.find((t) => t.id === template), [template]);

  // Sync form state when the modal opens (init from editing rule, or reset to defaults).
  const [syncedFor, setSyncedFor] = useState<string | null>(null);
  const syncKey = open ? (editingRule?.id ?? "__add__") : null;
  if (syncedFor !== syncKey) {
    setSyncedFor(syncKey);
    if (!open) {
      // Defer the reset to next open so closed modals don't redo state on every render.
    } else if (editingRule) {
      const targetId = editingRule.scope.target_id ?? editingRule.scope.group_id ?? null;
      const siteIds = editingRule.scope.site_ids ?? (editingRule.scope.kind === "site" && targetId ? [targetId] : []);
      const buildingIds =
        editingRule.scope.building_ids ?? (editingRule.scope.kind === "building" && targetId ? [targetId] : []);
      const rackIds = editingRule.scope.rack_ids ?? (editingRule.scope.kind === "rack" && targetId ? [targetId] : []);
      const groupIds =
        editingRule.scope.group_ids ?? (editingRule.scope.kind === "group" && targetId ? [targetId] : []);
      setTemplate(editingRule.template);
      setName(editingRule.name);
      setScope(editingRule.scope.kind);
      setScopeTarget(targetId);
      setSiteTargetIds(siteIds);
      setBuildingTargetIds(buildingIds);
      setRackTargetIds(rackIds);
      setGroupTargetIds(groupIds);
      setMinerTargetIds(editingRule.scope.kind === "devices" ? (editingRule.scope.device_ids ?? []) : []);
      setThresholdValue(editingRule.threshold.value != null ? String(editingRule.threshold.value) : "");
      setThresholdDuration(String(editingRule.threshold.duration_seconds ?? 300));
      setHashrateMode(normalizeHashrateMode(editingRule.threshold.hashrate_mode));
      setHashrateUnit(editingRule.threshold.hashrate_unit ?? "PH/s");
      setHashrateDropValue("50");
      setTemperatureMode(editingRule.threshold.temperature_mode ?? "any_miner");
      setTemperatureReading(editingRule.threshold.temperature_reading ?? "max");
      setTemperatureUnit(editingRule.threshold.temperature_unit ?? "°C");
      setTemperatureCount(String(editingRule.threshold.temperature_min_count ?? 10));
      setCommandFailureMode(editingRule.threshold.command_failure_mode ?? "any");
      setCommandKinds(editingRule.threshold.command_kinds ?? DEFAULT_COMMAND_KIND_IDS);
      setCommandWindow(String(editingRule.threshold.command_window_seconds ?? 900));
      setSelectedChannelIds(editingRule.channel_ids ?? []);
      setSelectedRoleIds(editingRule.recipient_role_ids ?? []);
      setCreateTicket(editingRule.create_ticket ?? false);
      setSendNotification(
        (editingRule.channel_ids?.length ?? 0) > 0 || (editingRule.recipient_role_ids?.length ?? 0) > 0,
      );
      setErrorMsg("");
      setShowSiteSelectionModal(false);
      setShowBuildingSelectionModal(false);
      setShowRackSelectionModal(false);
      setShowGroupSelectionModal(false);
      setShowMinerSelectionModal(false);
    } else {
      setTemplate("offline");
      setName("");
      setScope("all");
      setScopeTarget(null);
      setSiteTargetIds([]);
      setBuildingTargetIds([]);
      setRackTargetIds([]);
      setGroupTargetIds([]);
      setMinerTargetIds([]);
      setThresholdValue("");
      setThresholdDuration("1800");
      setHashrateMode("pct_expected");
      setHashrateUnit("PH/s");
      setHashrateDropValue("50");
      setTemperatureMode("any_miner");
      setTemperatureReading("max");
      setTemperatureUnit("°C");
      setTemperatureCount("10");
      setCommandFailureMode("any");
      setCommandKinds(DEFAULT_COMMAND_KIND_IDS);
      setCommandWindow("900");
      setSelectedChannelIds(channels.length > 0 ? [channels[0].id] : []);
      setSelectedRoleIds(roles.length > 0 ? [roles[0].id] : []);
      setCreateTicket(false);
      setSendNotification(true);
      setErrorMsg("");
      setShowSiteSelectionModal(false);
      setShowBuildingSelectionModal(false);
      setShowRackSelectionModal(false);
      setShowGroupSelectionModal(false);
      setShowMinerSelectionModal(false);
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
    if (id === "hashrate") {
      setHashrateMode("absolute");
      setHashrateUnit("TH/s");
      setHashrateDropValue("50");
    }
    if (id === "temperature") {
      setTemperatureMode("any_miner");
      setTemperatureReading("max");
      setTemperatureUnit("°C");
      setTemperatureCount("10");
    }
    if (id === "command_failure") {
      setCommandFailureMode(defaultCommandFailureModeForScope(scope));
      setCommandKinds(DEFAULT_COMMAND_KIND_IDS);
      setCommandWindow("900");
      setThresholdValue("5");
    }
    clearError();
  };

  const handleApplyTargetSelect = (id: RuleScopeKind, targetId: string | null) => {
    setScope(id);
    setScopeTarget(targetId);
    // Temperature's evaluation default follows scope size (large → average, small → any miner).
    if (template === "temperature") setTemperatureMode(defaultTemperatureModeForScope(id));
    if (template === "command_failure") setCommandFailureMode(defaultCommandFailureModeForScope(id));
    clearError();
  };

  const handleTargetSelectionSave = (kind: ApplyTargetKind, ids: string[]) => {
    const nextSelections = {
      siteTargetIds: kind === "site" ? ids : siteTargetIds,
      buildingTargetIds: kind === "building" ? ids : buildingTargetIds,
      rackTargetIds: kind === "rack" ? ids : rackTargetIds,
      groupTargetIds: kind === "group" ? ids : groupTargetIds,
      minerTargetIds: kind === "devices" ? ids : minerTargetIds,
    };

    setSiteTargetIds(nextSelections.siteTargetIds);
    setBuildingTargetIds(nextSelections.buildingTargetIds);
    setRackTargetIds(nextSelections.rackTargetIds);
    setGroupTargetIds(nextSelections.groupTargetIds);
    setMinerTargetIds(nextSelections.minerTargetIds);

    const nextScope = getScopeFromTargetSelections(nextSelections);
    handleApplyTargetSelect(nextScope.kind, nextScope.targetId);
  };

  const toggleCommandKind = (kindId: string) => {
    setCommandKinds((prev) => (prev.includes(kindId) ? prev.filter((id) => id !== kindId) : [...prev, kindId]));
    clearError();
  };

  const handleSave = useCallback(() => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Add a name for this rule");
      return;
    }

    const duration = parseInt(thresholdDuration, 10) || 0;
    const value = thresholdValue ? parseFloat(thresholdValue) || null : null;
    const targetId = RULE_SCOPE_NO_TARGET.has(scope) ? null : scopeTarget;

    const savedHashrateMode = normalizeHashrateMode(hashrateMode);
    const partial = {
      name: trimmedName,
      template,
      scope: {
        kind: scope,
        target_id: targetId,
        group_id: scope === "group" ? targetId : null,
        site_ids: siteTargetIds,
        building_ids: buildingTargetIds,
        rack_ids: rackTargetIds,
        group_ids: groupTargetIds,
        device_ids: scope === "devices" ? minerTargetIds : [],
      },
      threshold: {
        duration_seconds: duration,
        value,
        comparator: tplMeta?.comparator ?? null,
        ...(template === "hashrate"
          ? {
              hashrate_mode: savedHashrateMode,
              ...(savedHashrateMode === "absolute" ? { hashrate_unit: hashrateUnit } : {}),
            }
          : {}),
        ...(template === "temperature"
          ? {
              temperature_mode: temperatureMode,
              temperature_reading: temperatureReading,
              temperature_unit: temperatureUnit,
              ...(temperatureMode === "count" ? { temperature_min_count: parseInt(temperatureCount, 10) || 1 } : {}),
            }
          : {}),
        ...(template === "command_failure"
          ? {
              command_failure_mode: commandFailureMode,
              command_kinds: commandKinds,
              ...(commandFailureMode !== "any" ? { command_window_seconds: parseInt(commandWindow, 10) || 900 } : {}),
            }
          : {}),
      },
      custom_expr: null,
      channel_ids: sendNotification ? selectedChannelIds : [],
      recipient_role_ids: sendNotification ? selectedRoleIds : [],
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
    siteTargetIds,
    buildingTargetIds,
    rackTargetIds,
    groupTargetIds,
    minerTargetIds,
    thresholdValue,
    thresholdDuration,
    hashrateMode,
    hashrateUnit,
    temperatureMode,
    temperatureReading,
    temperatureUnit,
    temperatureCount,
    commandFailureMode,
    commandKinds,
    commandWindow,
    selectedChannelIds,
    selectedRoleIds,
    createTicket,
    sendNotification,
    tplMeta,
    isEditing,
    editingRule,
    appendRule,
    updateRule,
    onDismiss,
  ]);

  const scopeTargets = useMemo(() => getRuleScopeTargets(scope), [scope]);
  const scopeTargetLabel = useMemo(
    () => scopeTargets.find((target) => target.id === scopeTarget)?.label ?? null,
    [scopeTarget, scopeTargets],
  );
  const channelOptions = useMemo(
    () => channels.map((channel) => ({ value: channel.id, label: getChannelLabel(channel.kind, channel.name) })),
    [channels],
  );
  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.id, label: getRoleLabel(role.id, role.name) })),
    [roles],
  );
  const selectedChannelValue = selectedChannelIds[0] ?? channels[0]?.id ?? "";
  const selectedRoleValue = selectedRoleIds[0] ?? roles[0]?.id ?? "";

  const livePreview = useMemo(() => {
    const channelNames = sendNotification
      ? selectedChannelIds.map((id) => channels.find((c) => c.id === id)?.name).filter((n): n is string => Boolean(n))
      : [];
    return getLivePreview({
      template,
      scope,
      scopeTargetLabel,
      thresholdValue,
      thresholdDuration,
      channelNames,
      customExpr: "",
      ruleName: name.trim() || undefined,
      hashrateMode,
      hashrateUnit,
      temperatureMode,
      temperatureReading,
      temperatureUnit,
      temperatureMinCount: parseInt(temperatureCount, 10) || 1,
      commandFailureMode,
      commandLabel: formatCommandKinds(commandKinds),
      commandWindowSeconds: parseInt(commandWindow, 10) || 900,
    });
  }, [
    template,
    scope,
    scopeTargetLabel,
    thresholdValue,
    thresholdDuration,
    hashrateMode,
    hashrateUnit,
    temperatureMode,
    temperatureReading,
    temperatureUnit,
    temperatureCount,
    commandFailureMode,
    commandKinds,
    commandWindow,
    selectedChannelIds,
    channels,
    name,
    sendNotification,
  ]);

  const triggerSummary = useMemo(() => {
    const duration = durationLabel(thresholdDuration);
    const mode = normalizeHashrateMode(hashrateMode);
    if (template === "hashrate" && mode === "absolute") {
      return `This alert triggers when included miners hashrate is less than ${thresholdValue || "the selected amount"} ${hashrateUnit} for ${duration}.`;
    }
    if (template === "hashrate") {
      return `This alert triggers when included miners hashrate drops below ${hashrateDropValue || thresholdValue || "the selected percentage"}% for ${duration}.`;
    }
    if (template === "offline") {
      return `This alert triggers when included miners are unintentionally offline for over ${duration}.`;
    }
    if (template === "temperature") {
      return `This alert triggers when included miners exceed a temperature of ${thresholdValue || "the selected temperature"}${temperatureUnit} for longer than ${duration}.`;
    }
    return `This alert triggers when ${livePreview.summary.replace(/[.\s]+$/, "")}.`;
  }, [
    template,
    thresholdDuration,
    hashrateMode,
    hashrateDropValue,
    thresholdValue,
    hashrateUnit,
    temperatureUnit,
    livePreview.summary,
  ]);
  const appliesToPreviewValue = useMemo(() => appliesToValue(scope, scopeTargetLabel), [scope, scopeTargetLabel]);
  const minerSample = useMemo(
    () =>
      getMatchingMiners({
        template,
        scope,
        thresholdValue,
        thresholdDurationSeconds: parseInt(thresholdDuration, 10) || 0,
        hashrateMode,
        hashrateUnit,
        temperatureMode,
        temperatureUnit,
        commandFailureMode,
      }),
    [
      template,
      scope,
      thresholdValue,
      thresholdDuration,
      hashrateMode,
      hashrateUnit,
      temperatureMode,
      temperatureUnit,
      commandFailureMode,
    ],
  );

  const buttons = [
    ...(onBack
      ? [
          {
            text: "Back",
            onClick: onBack,
            variant: variants.secondary,
          },
        ]
      : []),
    {
      text: isEditing ? "Save changes" : "Save rule",
      onClick: handleSave,
      variant: variants.primary,
    },
  ];

  return (
    <>
      <FullScreenTwoPaneModal
        open={open}
        title={isEditing ? "Edit rule" : "Add rule"}
        onDismiss={onDismiss}
        closeAriaLabel="Close rule editor"
        buttons={buttons}
        primaryPane={
          <section className="flex flex-col gap-10 pr-6 pb-6 laptop:pr-10 laptop:pb-10">
            {errorMsg ? <Callout intent="danger" prefixIcon={<Alert />} title={errorMsg} /> : null}

            <div className="grid gap-4">
              <SectionHeader title="Details" />
              <div className="grid grid-cols-2 gap-4">
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
                <Select
                  id="rule-template"
                  label="Type"
                  value={template}
                  options={TEMPLATE_OPTIONS}
                  onChange={handleTemplateChange}
                />
              </div>
            </div>

            <div className="grid gap-4">
              <SectionHeader title={getTriggerSectionTitle(template)} />
              {template === "hashrate" ? (
                <HashrateThresholdField
                  mode={hashrateMode}
                  onModeChange={(m) => {
                    setHashrateMode(m);
                    clearError();
                  }}
                  dropValue={hashrateDropValue}
                  onDropValueChange={(v) => {
                    setHashrateDropValue(v);
                    clearError();
                  }}
                  value={thresholdValue}
                  onValueChange={(v) => {
                    setThresholdValue(v);
                    clearError();
                  }}
                  unit={hashrateUnit}
                  onUnitChange={(nextUnit) => {
                    setHashrateUnit(nextUnit);
                    clearError();
                  }}
                  durationSeconds={thresholdDuration}
                  onDurationChange={(v) => {
                    setThresholdDuration(v);
                    clearError();
                  }}
                />
              ) : template === "offline" ? (
                <OfflineThresholdField
                  durationSeconds={thresholdDuration}
                  onDurationChange={(v) => {
                    setThresholdDuration(v);
                    clearError();
                  }}
                />
              ) : template === "temperature" ? (
                <TemperatureThresholdField
                  mode={temperatureMode}
                  onModeChange={(m) => {
                    setTemperatureMode(m);
                    clearError();
                  }}
                  reading={temperatureReading}
                  onReadingChange={setTemperatureReading}
                  value={thresholdValue}
                  onValueChange={(v) => {
                    setThresholdValue(v);
                    clearError();
                  }}
                  unit={temperatureUnit}
                  onUnitChange={(nextUnit) => {
                    setTemperatureUnit(nextUnit);
                    clearError();
                  }}
                  count={temperatureCount}
                  onCountChange={(v) => {
                    setTemperatureCount(v);
                    clearError();
                  }}
                  durationSeconds={thresholdDuration}
                  onDurationChange={(v) => {
                    setThresholdDuration(v);
                    clearError();
                  }}
                  availableModes={availableTemperatureModes(scope)}
                  resetKey={scope}
                />
              ) : template === "command_failure" ? (
                <CommandFailureThresholdField
                  mode={commandFailureMode}
                  onModeChange={(m) => {
                    setCommandFailureMode(m);
                    clearError();
                  }}
                  selectedKinds={commandKinds}
                  onToggleKind={toggleCommandKind}
                  value={thresholdValue}
                  onValueChange={(v) => {
                    setThresholdValue(v);
                    clearError();
                  }}
                  windowSeconds={commandWindow}
                  onWindowChange={setCommandWindow}
                  populationLabel={formatScopePopulation(scope)}
                />
              ) : (
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
              )}
            </div>

            <div className="grid gap-4">
              <SectionHeader title={getNotificationSectionTitle(template)} />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  id="rule-channel"
                  label="Send to"
                  options={channelOptions}
                  value={selectedChannelValue}
                  onChange={(value) => {
                    setSelectedChannelIds(value ? [value] : []);
                    setSendNotification(true);
                    clearError();
                  }}
                />
                <Select
                  id="rule-recipient"
                  label="Notify"
                  options={roleOptions}
                  value={selectedRoleValue}
                  onChange={(value) => {
                    setSelectedRoleIds(value ? [value] : []);
                    setSendNotification(true);
                    clearError();
                  }}
                />
              </div>
            </div>

            <ApplyToSection
              siteTargetIds={siteTargetIds}
              buildingTargetIds={buildingTargetIds}
              rackTargetIds={rackTargetIds}
              groupTargetIds={groupTargetIds}
              minerTargetIds={minerTargetIds}
              onSelectSites={() => setShowSiteSelectionModal(true)}
              onSelectBuildings={() => setShowBuildingSelectionModal(true)}
              onSelectRacks={() => setShowRackSelectionModal(true)}
              onSelectGroups={() => setShowGroupSelectionModal(true)}
              onSelectMiners={() => setShowMinerSelectionModal(true)}
            />
          </section>
        }
        secondaryPane={
          <RulePreviewPane
            appliesToValue={appliesToPreviewValue}
            matchingCount={minerSample.matchCount}
            matchingMiners={minerSample.sample}
            triggerSummary={triggerSummary}
          />
        }
      />

      {showSiteSelectionModal ? (
        <SiteSelectionModal
          open={showSiteSelectionModal}
          selectedSiteIds={siteTargetIds}
          scope={targetPickerScope}
          onDismiss={() => setShowSiteSelectionModal(false)}
          onSave={(ids) => {
            handleTargetSelectionSave("site", ids);
            setShowSiteSelectionModal(false);
          }}
        />
      ) : null}

      {showBuildingSelectionModal ? (
        <BuildingSelectionModal
          open={showBuildingSelectionModal}
          selectedBuildingIds={buildingTargetIds}
          scope={targetPickerScope}
          onDismiss={() => setShowBuildingSelectionModal(false)}
          onSave={(ids) => {
            handleTargetSelectionSave("building", ids);
            setShowBuildingSelectionModal(false);
          }}
        />
      ) : null}

      {showRackSelectionModal ? (
        <RackSelectionModal
          open={showRackSelectionModal}
          selectedRackIds={rackTargetIds}
          scope={targetPickerScope}
          onDismiss={() => setShowRackSelectionModal(false)}
          onSave={(ids) => {
            handleTargetSelectionSave("rack", ids);
            setShowRackSelectionModal(false);
          }}
        />
      ) : null}

      {showGroupSelectionModal ? (
        <GroupSelectionModal
          open={showGroupSelectionModal}
          selectedGroupIds={groupTargetIds}
          onDismiss={() => setShowGroupSelectionModal(false)}
          onSave={(ids) => {
            handleTargetSelectionSave("group", ids);
            setShowGroupSelectionModal(false);
          }}
        />
      ) : null}

      {showMinerSelectionModal ? (
        <MinerSelectionModal
          open={showMinerSelectionModal}
          selectedMinerIds={minerTargetIds}
          scope={targetPickerScope}
          onDismiss={() => setShowMinerSelectionModal(false)}
          onSave={(selection) => {
            handleTargetSelectionSave("devices", selection.selectedMinerIds);
            setShowMinerSelectionModal(false);
          }}
        />
      ) : null}
    </>
  );
};

export default AddRuleModal;
