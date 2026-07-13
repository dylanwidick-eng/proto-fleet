import { type ReactNode } from "react";
import clsx from "clsx";

import { formatRuleChannels, formatRuleCondition } from "@/protoFleet/features/notifications/lib/formatRuleSummary";
import {
  selectChannels,
  selectSilences,
  useNotificationsStore,
} from "@/protoFleet/features/notifications/store/notificationsStore";
import type { Rule } from "@/protoFleet/features/notifications/types";
import { variants } from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";

interface RuleDetailModalProps {
  rule: Rule | null;
  onDismiss: () => void;
  onEdit?: (rule: Rule) => void;
  onPauseOrResume?: (rule: Rule) => void;
}

const SummaryRow = ({ label, children, className }: { label: string; children: ReactNode; className?: string }) => (
  <div className="flex items-baseline justify-between gap-4 py-3">
    <span className="shrink-0 text-text-primary-50">{label}</span>
    <span className={clsx("text-right text-text-primary", className)}>{children}</span>
  </div>
);

const formatWhen = (d: Date | null) => {
  if (!d) return "—";
  const date = d.toLocaleDateString(undefined, { year: "2-digit", month: "2-digit", day: "2-digit" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} ${time}`;
};

const RuleDetailModal = ({ rule, onDismiss, onEdit, onPauseOrResume }: RuleDetailModalProps) => {
  const channels = useNotificationsStore(selectChannels);
  const silences = useNotificationsStore(selectSilences);

  if (!rule) return null;

  const activeSilence = silences.find((s) => {
    if (s.scope.kind !== "rule" || s.scope.rule_id !== rule.id) return false;
    // eslint-disable-next-line react-hooks/purity -- prototype: "active now" is a render-time snapshot; drift across re-renders is acceptable here
    const now = Date.now();
    const start = new Date(s.starts_at).getTime();
    const end = s.ends_at ? new Date(s.ends_at).getTime() : Infinity;
    return now >= start && now < end;
  });

  const lastFired = rule.last_fired_at ? new Date(rule.last_fired_at) : null;

  const headerButtons = [
    {
      text: "Edit",
      variant: variants.secondary,
      dismissModalOnClick: false,
      onClick: () => onEdit?.(rule),
    },
    {
      text: activeSilence ? "Resume" : "Pause",
      variant: variants.secondary,
      dismissModalOnClick: false,
      onClick: () => onPauseOrResume?.(rule),
    },
  ];

  return (
    <Modal open onDismiss={onDismiss} title={rule.name} buttons={headerButtons} divider={false}>
      <div className="flex flex-col gap-4">
        <div className="divide-y divide-surface-10">
          <SummaryRow label="When">{formatRuleCondition(rule)}</SummaryRow>
          <SummaryRow label="Delivers to">{formatRuleChannels(rule, channels)}</SummaryRow>
          <SummaryRow label="Status">
            {activeSilence ? (
              <span className="inline-flex items-center gap-2">
                Paused
                {activeSilence.ends_at ? (
                  <span className="text-text-primary-50">until {formatWhen(new Date(activeSilence.ends_at))}</span>
                ) : (
                  <span className="text-text-primary-50">indefinitely</span>
                )}
              </span>
            ) : (
              "Active"
            )}
          </SummaryRow>
          <SummaryRow label="Last triggered">{formatWhen(lastFired)}</SummaryRow>
          <SummaryRow label="Fire count">{rule.fire_count}</SummaryRow>
        </div>
      </div>
    </Modal>
  );
};

export default RuleDetailModal;
