import { useEffect, useState } from "react";
import FleetActionTiles from "@/protoFleet/features/agent/components/actions/FleetActionTiles";
import AlwaysOnStrip from "@/protoFleet/features/agent/components/automations/AlwaysOnStrip";
import AutomationsList from "@/protoFleet/features/agent/components/automations/AutomationsList";
import MonthCalendar from "@/protoFleet/features/agent/components/automations/MonthCalendar";
import MonthToolbar from "@/protoFleet/features/agent/components/automations/MonthToolbar";
import NewAutomationModal from "@/protoFleet/features/agent/components/automations/NewAutomationModal";
import { PlusIcon } from "@/protoFleet/features/agent/components/icons";
import { useAgentStore, useWorkflowsList } from "@/protoFleet/features/agent/store/agentStore";
import Button, { variants } from "@/shared/components/Button";
import SegmentedControl from "@/shared/components/SegmentedControl";

type AutomationsViewMode = "calendar" | "list";

/** Anchor for the month calendar: 1st of the current month, midnight local. */
const firstOfCurrentMonth = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
};

/**
 * Automations section of the /agent screen (proto-automations.md §2).
 * Calendar is the default view; the month anchor starts at the 1st of the
 * current month. Neither is persisted (faithful — prototype module state).
 */
const AutomationsView = () => {
  const workflows = useWorkflowsList();
  const seedWorkflowsIfEmpty = useAgentStore((s) => s.seedWorkflowsIfEmpty);

  const [view, setView] = useState<AutomationsViewMode>("calendar");
  const [monthAnchor, setMonthAnchor] = useState(firstOfCurrentMonth);
  const [modalOpen, setModalOpen] = useState(false);

  // Faithful re-seed-after-revoke-all: seeding runs on every Automations
  // mount and only fills an empty map (proto-automations.md §1.4).
  useEffect(() => {
    seedWorkflowsIfEmpty();
  }, [seedWorkflowsIfEmpty]);

  // Data split per §2.4: schedules need a truthy schedule; everything else
  // (any non-schedule triggerType, including missing schedule) is "always on".
  const schedules = workflows.filter((wf) => wf.triggerType === "schedule" && wf.schedule !== null);
  const conditions = workflows.filter((wf) => !(wf.triggerType === "schedule" && wf.schedule !== null));

  const shiftMonth = (delta: number) => {
    setMonthAnchor((anchor) => new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1));
  };

  return (
    <div className="flex max-w-[1280px] flex-col gap-5 px-10 pt-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-heading-300 text-text-primary">Automations</h1>
        <div className="flex items-center gap-3">
          <SegmentedControl
            segments={[
              { key: "calendar", title: "Calendar" },
              { key: "list", title: "List" },
            ]}
            initialSegmentKey={view}
            onSelect={(key) => setView(key as AutomationsViewMode)}
          />
          <Button
            variant={variants.primary}
            prefixIcon={<PlusIcon />}
            text="Add automation"
            onClick={() => setModalOpen(true)}
          />
        </div>
      </div>

      <FleetActionTiles />

      {view === "calendar" ? (
        workflows.length === 0 ? (
          <div className="py-4 text-300 text-text-primary-50">
            No automations yet — click + Add automation to set one up.
          </div>
        ) : (
          <div className="flex flex-col">
            <AlwaysOnStrip conditions={conditions} />
            <MonthToolbar
              anchor={monthAnchor}
              onShift={shiftMonth}
              onToday={() => setMonthAnchor(firstOfCurrentMonth())}
            />
            <MonthCalendar anchor={monthAnchor} schedules={schedules} />
          </div>
        )
      ) : (
        <AutomationsList workflows={workflows} />
      )}

      <NewAutomationModal open={modalOpen} onDismiss={() => setModalOpen(false)} />
    </div>
  );
};

export default AutomationsView;
