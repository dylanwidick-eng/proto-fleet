import { useCallback, useMemo, useState } from "react";
import AddRuleModal from "./AddRuleModal";
import AddSilenceModal from "./AddSilenceModal";
import {
  formatRuleChannels,
  formatRuleCondition,
} from "@/protoFleet/features/notifications/lib/formatRuleSummary";
import { useNotificationsStore } from "@/protoFleet/features/notifications/store/notificationsStore";
import type { Rule } from "@/protoFleet/features/notifications/types";
import { Edit, Pause, Play, Stop, Trash } from "@/shared/assets/icons";
import Button, { sizes, variants } from "@/shared/components/Button";
import Header from "@/shared/components/Header";
import List from "@/shared/components/List";
import type { ColConfig, ColTitles, ListAction } from "@/shared/components/List/types";
import { pushToast, STATUSES } from "@/shared/features/toaster";

type RuleColumns = "name" | "when" | "then";

const colTitles: ColTitles<RuleColumns> = {
  name: "Name",
  when: "When",
  then: "Then",
};

const activeCols: RuleColumns[] = ["name", "when", "then"];

const RulesSection = () => {
  const rules = useNotificationsStore((s) => s.rules);
  const channels = useNotificationsStore((s) => s.channels);
  const silences = useNotificationsStore((s) => s.silences);
  const updateRule = useNotificationsStore((s) => s.updateRule);
  const removeRule = useNotificationsStore((s) => s.removeRule);
  const removeSilence = useNotificationsStore((s) => s.removeSilence);

  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [silencePrefillRuleId, setSilencePrefillRuleId] = useState<string | null>(null);
  const [showSilenceModal, setShowSilenceModal] = useState(false);

  // Map ruleId → active silence (if any) so the kebab can flip Silence ⇄ Lift silence.
  const activeSilenceByRule = useMemo(() => {
    const now = Date.now();
    const map = new Map<string, string>();
    silences.forEach((sil) => {
      const start = new Date(sil.starts_at).getTime();
      const end = sil.ends_at ? new Date(sil.ends_at).getTime() : Infinity;
      const isActive = now >= start && now < end;
      if (isActive && sil.scope.kind === "rule" && sil.scope.rule_id) {
        map.set(sil.scope.rule_id, sil.id);
      }
    });
    return map;
  }, [silences]);

  // Enabled rules first, paused at the bottom. Preserves store order within each group.
  const sortedRules = useMemo(
    () => rules.slice().sort((a, b) => Number(!a.enabled) - Number(!b.enabled)),
    [rules],
  );

  const openAdd = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const handleEdit = useCallback((rule: Rule) => {
    setEditingRule(rule);
    setShowModal(true);
  }, []);

  const handleTogglePause = useCallback(
    (rule: Rule) => {
      updateRule(rule.id, (prev) => ({
        ...prev,
        enabled: !prev.enabled,
        updated_at: new Date().toISOString(),
      }));
      pushToast({
        message: rule.enabled ? `Paused: ${rule.name}` : `Resumed: ${rule.name}`,
        status: STATUSES.success,
      });
    },
    [updateRule],
  );

  const handleDelete = useCallback(
    (rule: Rule) => {
      removeRule(rule.id);
      pushToast({ message: "Rule removed", status: STATUSES.success });
    },
    [removeRule],
  );

  const handleSilenceOrLift = useCallback(
    (rule: Rule) => {
      const activeSilenceId = activeSilenceByRule.get(rule.id);
      if (activeSilenceId) {
        removeSilence(activeSilenceId);
        pushToast({ message: "Silence lifted", status: STATUSES.success });
      } else {
        setSilencePrefillRuleId(rule.id);
        setShowSilenceModal(true);
      }
    },
    [activeSilenceByRule, removeSilence],
  );

  const actions: ListAction<Rule>[] = useMemo(
    () => [
      {
        title: "Edit",
        icon: <Edit />,
        actionHandler: handleEdit,
      },
      {
        title: (rule) => (rule.enabled ? "Pause" : "Resume"),
        icon: (rule) => (rule.enabled ? <Pause /> : <Play />),
        actionHandler: handleTogglePause,
      },
      {
        title: (rule) => (activeSilenceByRule.has(rule.id) ? "Lift silence" : "Silence"),
        icon: <Stop />,
        actionHandler: handleSilenceOrLift,
      },
      {
        title: "Delete",
        icon: <Trash />,
        variant: "destructive",
        actionHandler: handleDelete,
      },
    ],
    [handleEdit, handleTogglePause, handleSilenceOrLift, handleDelete, activeSilenceByRule],
  );

  const colConfig: ColConfig<Rule, string, RuleColumns> = useMemo(
    () => ({
      name: {
        component: (rule) => (
          <span className="flex items-center gap-2">
            <span className="text-emphasis-300 text-text-primary">{rule.name}</span>
            {!rule.enabled ? (
              <span className="rounded bg-surface-5 px-2 py-0.5 text-200 text-text-primary-50">
                Paused
              </span>
            ) : null}
          </span>
        ),
        width: "w-80",
      },
      when: {
        component: (rule) => (
          <span className="text-text-primary-50">{formatRuleCondition(rule)}</span>
        ),
        width: "w-96",
        allowWrap: true,
      },
      then: {
        component: (rule) => (
          <span className="text-text-primary-50">{formatRuleChannels(rule, channels)}</span>
        ),
        width: "w-80",
        allowWrap: true,
      },
    }),
    [channels],
  );

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border-5 p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <Header title="Rules" titleSize="text-heading-200" />
          <Button
            variant={variants.secondary}
            size={sizes.compact}
            text="Add rule"
            onClick={openAdd}
          />
        </div>
        <p className="text-300 text-text-primary-50">
          Conditions that decide when a notification fires and how it's scoped (site, building, rack,
          group, pool, or schedule).
        </p>
      </div>

      <List<Rule, string, RuleColumns>
        items={sortedRules}
        itemKey="id"
        activeCols={activeCols}
        colTitles={colTitles}
        colConfig={colConfig}
        total={sortedRules.length}
        itemName={{ singular: "rule", plural: "rules" }}
        noDataElement={
          <div className="py-10 text-center text-text-primary-50">
            No rules yet — click Add rule to set one up.
          </div>
        }
        actions={actions}
        applyColumnWidthsToCells
        tableClassName="mb-6 [&_td]:!border-x-0 [&_th]:!border-x-0 [&_td[data-testid='action']>div]:!ml-auto"
      />

      <AddRuleModal
        open={showModal}
        editingRule={editingRule}
        onDismiss={() => {
          setShowModal(false);
          setEditingRule(null);
        }}
      />

      <AddSilenceModal
        open={showSilenceModal}
        editingSilence={null}
        prefillRuleId={silencePrefillRuleId}
        onDismiss={() => {
          setShowSilenceModal(false);
          setSilencePrefillRuleId(null);
        }}
      />
    </section>
  );
};

export default RulesSection;
