import { useState } from "react";
import clsx from "clsx";
import { humanizeSchedule } from "@/protoFleet/features/agent/lib/schedule";
import type { AgentItem, Weekday, Workflow, WorkflowScope } from "@/protoFleet/features/agent/types";
import Button, { variants } from "@/shared/components/Button";

/**
 * "Create automation" in-footer editor (proto-smart-cards.md §4.4–4.5).
 *
 * All inputs are FULLY CONTROLLED plain elements (divergence F2 — the
 * prototype's semi-controlled fields wiped typed text whenever a day/scope
 * chip toggled a re-render; the named regression test "type name → toggle
 * day chip → name preserved" guards this in AgentDetailModal.test.tsx).
 *
 * The saved workflow shape is verbatim §4.5: schedule triggers store
 * `whenText = humanizeSchedule(schedule)` (including the `{Day}s` quirk —
 * "Suns"), condition triggers store the free-text When. Scope defaults to
 * "all" iff the item's site contains "all sites" (case-insensitive).
 */
const WEEKDAYS: Weekday[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const FIELD_INPUT_CLASSES =
  "w-full rounded-lg border border-border-5 bg-surface-base px-3 py-2 text-300 text-text-primary outline-hidden focus:border-border-20 focus:ring-4 focus:ring-core-primary-5";

const CHIP_CLASSES = "rounded-full border px-3.5 py-2 text-emphasis-200";
const CHIP_IDLE_CLASSES = "border-border-10 bg-surface-elevated-base text-text-primary hover:bg-surface-5";
const CHIP_SELECTED_CLASSES = "border-transparent bg-core-primary-fill text-text-contrast";

interface AutomateEditorProps {
  item: AgentItem;
  onSave: (workflow: Workflow) => void;
  onBack: () => void;
}

const AutomateEditor = ({ item, onSave, onBack }: AutomateEditorProps) => {
  const workflow = item.workflow;
  const isSchedule = workflow?.triggerType === "schedule";

  const [name, setName] = useState(workflow?.defaultName ?? "");
  const [whenText, setWhenText] = useState(workflow?.whenText ?? "");
  const [days, setDays] = useState<Weekday[]>(workflow?.schedule?.days ?? []);
  const [startTime, setStartTime] = useState(workflow?.schedule?.startTime ?? "");
  const [endTime, setEndTime] = useState(workflow?.schedule?.endTime ?? "");
  const [thenText, setThenText] = useState(workflow?.thenText ?? "");
  const [scope, setScope] = useState<WorkflowScope>(/all sites/i.test(item.site || "") ? "all" : "this");

  if (!workflow) return null;

  const toggleDay = (day: Weekday) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSave = () => {
    const schedule = isSchedule ? { days, startTime, endTime } : null;
    onSave({
      id: `wf_${Date.now().toString(36)}`,
      name: name.trim() || workflow.defaultName || "Untitled automation",
      triggerType: isSchedule ? "schedule" : "condition",
      whenText: isSchedule ? humanizeSchedule(schedule) : whenText,
      schedule,
      thenText,
      scope,
      sourceItemId: item.id,
      site: item.site || "",
      cat: item.cat || "",
      createdAt: Date.now(),
      fireCount: 0,
      lastFiredAt: null,
      paused: false,
    });
  };

  return (
    <div className="flex flex-col gap-3" data-testid="agent-detail-automate-editor">
      <div className="text-emphasis-300 text-text-primary">Create automation</div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="agent-automate-name" className="text-200 text-text-primary-50">
          Name
        </label>
        <input
          id="agent-automate-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={FIELD_INPUT_CLASSES}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {isSchedule ? (
          <span className="text-200 text-text-primary-50">When</span>
        ) : (
          <label htmlFor="agent-automate-when" className="text-200 text-text-primary-50">
            When
          </label>
        )}
        {isSchedule ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const selected = days.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDay(day)}
                    className={clsx(CHIP_CLASSES, selected ? CHIP_SELECTED_CLASSES : CHIP_IDLE_CLASSES)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="agent-automate-start" className="text-200 text-text-primary-50">
                Start
              </label>
              <input
                id="agent-automate-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={clsx(FIELD_INPUT_CLASSES, "w-auto")}
              />
              <label htmlFor="agent-automate-end" className="text-200 text-text-primary-50">
                End
              </label>
              <input
                id="agent-automate-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={clsx(FIELD_INPUT_CLASSES, "w-auto")}
              />
            </div>
          </div>
        ) : (
          <textarea
            id="agent-automate-when"
            rows={2}
            value={whenText}
            onChange={(e) => setWhenText(e.target.value)}
            className={FIELD_INPUT_CLASSES}
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="agent-automate-then" className="text-200 text-text-primary-50">
          Then
        </label>
        <textarea
          id="agent-automate-then"
          rows={2}
          value={thenText}
          onChange={(e) => setThenText(e.target.value)}
          className={FIELD_INPUT_CLASSES}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-200 text-text-primary-50">Scope</span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: "this", label: "This site only" },
              { value: "all", label: "All sites" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={scope === option.value}
              onClick={() => setScope(option.value)}
              className={clsx(CHIP_CLASSES, scope === option.value ? CHIP_SELECTED_CLASSES : CHIP_IDLE_CLASSES)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={onBack} className="py-1 text-200 text-text-primary-50 hover:text-text-primary">
          ← Back
        </button>
        <Button text="Save workflow" variant={variants.primary} onClick={handleSave} testId="agent-automate-save" />
      </div>
    </div>
  );
};

export default AutomateEditor;
