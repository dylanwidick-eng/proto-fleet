import AutomationCard from "@/protoFleet/features/agent/components/automations/AutomationCard";
import type { Workflow } from "@/protoFleet/features/agent/types";

interface SubgroupProps {
  label: "Active" | "Paused";
  workflows: Workflow[];
}

const Subgroup = ({ label, workflows }: SubgroupProps) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 text-heading-50 tracking-wide text-text-primary-50 uppercase">
      <span>{label}</span>
      <span>{workflows.length}</span>
    </div>
    <div className="flex flex-col gap-2">
      {workflows.map((wf) => (
        <AutomationCard key={wf.id} workflow={wf} />
      ))}
    </div>
  </div>
);

interface AutomationsListProps {
  workflows: Workflow[];
}

/** List view: Active then Paused groups of automation cards (proto-automations.md §2.5). */
const AutomationsList = ({ workflows }: AutomationsListProps) => {
  if (workflows.length === 0) {
    return (
      <div className="py-4 text-300 text-text-primary-50">
        No automations yet — click + Add automation to set one up.
      </div>
    );
  }

  const active = workflows.filter((wf) => !wf.paused);
  const paused = workflows.filter((wf) => wf.paused);

  return (
    <div className="flex flex-col gap-4">
      {active.length > 0 ? <Subgroup label="Active" workflows={active} /> : null}
      {paused.length > 0 ? <Subgroup label="Paused" workflows={paused} /> : null}
    </div>
  );
};

export default AutomationsList;
