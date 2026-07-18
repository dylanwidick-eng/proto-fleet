import { type ReactNode, useState } from "react";
import clsx from "clsx";
import { DAY_NAMES } from "@/protoFleet/features/agent/lib/calendar";
import { humanizeSchedule } from "@/protoFleet/features/agent/lib/schedule";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import type { Weekday, Workflow, WorkflowTriggerType } from "@/protoFleet/features/agent/types";
import { variants } from "@/shared/components/Button";
import Modal from "@/shared/components/Modal";
import SegmentedControl from "@/shared/components/SegmentedControl";
import { pushToast, STATUSES } from "@/shared/features/toaster";

const DEFAULT_DAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const DEFAULT_START = "14:00";
const DEFAULT_END = "17:00";

const inputClassName =
  "w-full rounded-lg border border-border-10 bg-surface-base px-3 py-2.5 text-300 text-text-primary outline-none placeholder:text-text-primary-30 focus:border-border-primary";

const Field = ({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={htmlFor} className="text-heading-50 tracking-wide text-text-primary-50 uppercase">
      {label}
    </label>
    {children}
  </div>
);

interface NewAutomationModalProps {
  open: boolean;
  onDismiss: () => void;
}

/**
 * "+ Add automation" modal (proto-automations.md §6). The primary CTA lives
 * in the modal HEADER with `dismissModalOnClick: false` — the modal only
 * dismisses after validation passes (shared-Modal gotcha protocol, §6
 * PORT_PLAN.md). All text inputs are FULLY CONTROLLED, fixing the
 * prototype's documented bug where toggling a day chip or trigger tab wiped
 * uncommitted typed text (divergence F2). Validation is name + then only —
 * empty days and start > end are allowed (faithful).
 */
const NewAutomationModal = ({ open, onDismiss }: NewAutomationModalProps) => {
  const saveWorkflow = useAgentStore((s) => s.saveWorkflow);

  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>("schedule");
  const [days, setDays] = useState<Weekday[]>(DEFAULT_DAYS);
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [endTime, setEndTime] = useState(DEFAULT_END);
  const [whenText, setWhenText] = useState("");
  const [thenText, setThenText] = useState("");

  // Reset to the prototype's defaults on every open (§6.1); `session` also
  // remounts the semi-controlled SegmentedControl so its tab resets.
  const [session, setSession] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSession((s) => s + 1);
      setName("");
      setTriggerType("schedule");
      setDays(DEFAULT_DAYS);
      setStartTime(DEFAULT_START);
      setEndTime(DEFAULT_END);
      setWhenText("");
      setThenText("");
    }
  }

  const toggleDay = (day: Weekday) => {
    setDays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      pushToast({ message: "Add a name for this automation", status: STATUSES.error });
      return;
    }
    const trimmedThen = thenText.trim();
    if (!trimmedThen) {
      pushToast({ message: "Describe what should happen", status: STATUSES.error });
      return;
    }
    const schedule =
      triggerType === "schedule"
        ? { days, startTime: startTime || DEFAULT_START, endTime: endTime || DEFAULT_END }
        : null;
    const workflow: Workflow = {
      id: `wf_${Date.now().toString(36)}`,
      name: trimmedName,
      triggerType,
      whenText: triggerType === "schedule" ? humanizeSchedule(schedule) : whenText.trim() || "Custom condition",
      schedule,
      thenText: trimmedThen,
      scope: "all",
      sourceItemId: null,
      site: "all",
      cat: "Settings",
      createdAt: Date.now(),
      lastFiredAt: null,
      fireCount: 0,
      paused: false,
    };
    // The store fires the single save toast; copy is the prototype's
    // verbatim New-automation string (app.js:3219, divergence F8).
    saveWorkflow(workflow, `Saved: ${trimmedName}`);
    onDismiss();
  };

  return (
    <Modal
      open={open}
      onDismiss={onDismiss}
      title="New automation"
      description="Schedules fire at fixed times. Triggers fire when a condition becomes true."
      buttons={[
        {
          text: "Save automation",
          variant: variants.primary,
          dismissModalOnClick: false,
          onClick: handleSave,
        },
      ]}
      divider={false}
    >
      <div className="flex flex-col gap-4">
        <Field label="Name" htmlFor="new-automation-name">
          <input
            id="new-automation-name"
            type="text"
            className={inputClassName}
            placeholder="e.g. Off-peak firmware updates"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-heading-50 tracking-wide text-text-primary-50 uppercase">Trigger</span>
          <SegmentedControl
            key={session}
            segments={[
              { key: "schedule", title: "Schedule" },
              { key: "condition", title: "Condition" },
            ]}
            initialSegmentKey={triggerType}
            onSelect={(key) => setTriggerType(key as WorkflowTriggerType)}
          />
        </div>

        {triggerType === "schedule" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-heading-50 tracking-wide text-text-primary-50 uppercase">Days</span>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((day) => {
                  const active = days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      data-active={active}
                      className={clsx(
                        "rounded-full border px-3 py-1.5 text-emphasis-200",
                        active
                          ? "border-core-primary-fill bg-core-primary-fill text-text-contrast"
                          : "border-border-10 bg-surface-base text-text-primary hover:bg-surface-5",
                      )}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" htmlFor="new-auto-start">
                <input
                  id="new-auto-start"
                  type="time"
                  className={inputClassName}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </Field>
              <Field label="End" htmlFor="new-auto-end">
                <input
                  id="new-auto-end"
                  type="time"
                  className={inputClassName}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </Field>
            </div>
          </>
        ) : (
          <Field label="When" htmlFor="new-auto-when-text">
            <textarea
              id="new-auto-when-text"
              rows={2}
              className={inputClassName}
              placeholder="e.g. Miners are in pool-warning for >2h"
              value={whenText}
              onChange={(e) => setWhenText(e.target.value)}
            />
          </Field>
        )}

        <Field label="Then" htmlFor="new-automation-then">
          <textarea
            id="new-automation-then"
            rows={2}
            className={inputClassName}
            placeholder="e.g. Reboot in batches of 50, hold 1m between batches"
            value={thenText}
            onChange={(e) => setThenText(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
};

export default NewAutomationModal;
