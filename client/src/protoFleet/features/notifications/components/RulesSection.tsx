import { useCallback, useMemo, useState } from "react";
import clsx from "clsx";
import AddRuleModal from "./AddRuleModal";
import AddSilenceModal from "./AddSilenceModal";
import {
  formatRuleLastFired,
  formatRuleScopeSummary,
  formatRuleThreshold,
} from "@/protoFleet/features/notifications/lib/formatRuleSummary";
import { useNotificationsStore } from "@/protoFleet/features/notifications/store/notificationsStore";
import type { Rule } from "@/protoFleet/features/notifications/types";
import { Edit, Pause, Play, Trash } from "@/shared/assets/icons";
import Button, { sizes, variants } from "@/shared/components/Button";
import Header from "@/shared/components/Header";
import List from "@/shared/components/List";
import type { ColConfig, ColTitles, ListAction } from "@/shared/components/List/types";
import { pushToast, STATUSES } from "@/shared/features/toaster";

type RuleColumns = "name" | "condition" | "status";

const colTitles: ColTitles<RuleColumns> = {
  name: "Name",
  condition: "Condition",
  status: "Status",
};

const activeCols: RuleColumns[] = ["name", "condition", "status"];

const RulesSection = () => {
  const rules = useNotificationsStore((s) => s.rules);
  const silences = useNotificationsStore((s) => s.silences);
  const removeRule = useNotificationsStore((s) => s.removeRule);
  const removeSilence = useNotificationsStore((s) => s.removeSilence);

  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [silencePrefillRuleId, setSilencePrefillRuleId] = useState<string | null>(null);
  const [showSilenceModal, setShowSilenceModal] = useState(false);

  // Map ruleId → active silence (if any) so the kebab can flip Silence ⇄ Lift silence.
  const activeSilenceByRule = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- prototype: "active now" is a render-time snapshot; drift across re-renders is acceptable here
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
    () => rules.slice().sort((a, b) => Number(activeSilenceByRule.has(a.id)) - Number(activeSilenceByRule.has(b.id))),
    [rules, activeSilenceByRule],
  );

  const openAdd = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const handleEdit = useCallback((rule: Rule) => {
    setEditingRule(rule);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback(
    (rule: Rule) => {
      removeRule(rule.id);
      pushToast({ message: "Rule removed", status: STATUSES.success });
    },
    [removeRule],
  );

  const handlePauseOrResume = useCallback(
    (rule: Rule) => {
      const activeSilenceId = activeSilenceByRule.get(rule.id);
      if (activeSilenceId) {
        removeSilence(activeSilenceId);
        pushToast({ message: `Resumed: ${rule.name}`, status: STATUSES.success });
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
        title: (rule) => (activeSilenceByRule.has(rule.id) ? "Resume" : "Pause"),
        icon: (rule) => (activeSilenceByRule.has(rule.id) ? <Play /> : <Pause />),
        actionHandler: handlePauseOrResume,
      },
      {
        title: "Delete",
        icon: <Trash />,
        variant: "destructive",
        actionHandler: handleDelete,
      },
    ],
    [handleEdit, handlePauseOrResume, handleDelete, activeSilenceByRule],
  );

  const colConfig: ColConfig<Rule, string, RuleColumns> = useMemo(
    () => ({
      name: {
        component: (rule) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-emphasis-300 text-text-primary">{rule.name}</span>
            <span className="truncate text-200 text-text-primary-70">{formatRuleScopeSummary(rule)}</span>
          </div>
        ),
        width: "w-80",
      },
      condition: {
        component: (rule) => (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="truncate text-text-primary">{formatRuleThreshold(rule)}</span>
            <span className="truncate text-200 text-text-primary-70">{formatRuleLastFired(rule)}</span>
          </div>
        ),
        width: "w-96",
      },
      status: {
        component: (rule) => {
          const paused = activeSilenceByRule.has(rule.id);
          return (
            <div className="flex items-center gap-2">
              <span
                className={clsx("h-2 w-2 rounded-full", paused ? "bg-text-primary-30" : "bg-intent-success-fill")}
              />
              <span>{paused ? "Paused" : "Active"}</span>
            </div>
          );
        },
        width: "w-80",
      },
    }),
    [activeSilenceByRule],
  );

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border-5 p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <Header title="Rules" titleSize="text-heading-200" />
          <Button variant={variants.secondary} size={sizes.compact} text="Add rule" onClick={openAdd} />
        </div>
        <p className="text-300 text-text-primary-50">
          Conditions that decide when a notification triggers and how it's scoped (site, building, rack, group, pool, or
          schedule).
        </p>
      </div>

      <List<Rule, string, RuleColumns>
        items={sortedRules}
        itemKey="id"
        activeCols={activeCols}
        colTitles={colTitles}
        colConfig={colConfig}
        total={sortedRules.length}
        hideTotal
        itemName={{ singular: "rule", plural: "rules" }}
        noDataElement={
          <div className="py-10 text-center text-text-primary-50">No rules yet — click Add rule to set one up.</div>
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
