import clsx from "clsx";
import { CheckIcon, ClockIcon } from "@/protoFleet/features/agent/components/icons";
import type { ActivityTaskState, ActivityTaskTreeItem } from "@/protoFleet/features/agent/types";
import ProgressCircular from "@/shared/components/ProgressCircular";

interface Props {
  items: ActivityTaskTreeItem[];
}

const StateIcon = ({ state }: { state: ActivityTaskState }) => {
  if (state === "done") return <CheckIcon size={20} className="text-text-success" />;
  if (state === "running") return <ProgressCircular size={20} indeterminate />;
  return <ClockIcon size={20} className="text-text-primary-30" />;
};

/**
 * In-flight multi-step task tree trailing a thread turn (proto-nav-chat.md
 * §6.2): left-gutter vertical rule, then done (green check) / running
 * (spinner) / pending (dimmed clock) rows with optional subtext.
 */
const TaskTree = ({ items }: Props) => (
  <div className="flex" data-testid="agent-tasktree-row">
    <div className="flex w-12 shrink-0 justify-center self-stretch">
      <div className="w-px bg-border-10" />
    </div>
    <div className="flex min-w-0 flex-1 flex-col gap-4 pt-2 pb-6">
      {items.map((item) => (
        <div key={item.text} className="flex items-start gap-3">
          <div className="flex h-6 w-5 shrink-0 items-center justify-center">
            <StateIcon state={item.state} />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className={clsx(
                "text-emphasis-300",
                item.state === "pending" ? "text-text-primary-30" : "text-text-primary",
              )}
            >
              {item.text}
            </div>
            {item.subtext ? <div className="mt-0.5 text-300 text-text-primary-70">{item.subtext}</div> : null}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default TaskTree;
