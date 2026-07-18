import { CheckIcon } from "@/protoFleet/features/agent/components/icons";
import { pushToast, STATUSES } from "@/shared/features/toaster";

interface Props {
  count: number;
  time: string;
}

/**
 * Compact task summary trailing a thread turn (proto-nav-chat.md §6.2):
 * left-gutter vertical rule aligned under the avatar, green check,
 * "{n} tasks", Review / Chat about this toast stubs (exact prototype copy),
 * and a right-aligned relative time. Followed by a 24px spacer.
 */
const TaskListRow = ({ count, time }: Props) => (
  <>
    <div className="flex" data-testid="agent-tasklist-row">
      <div className="flex w-12 shrink-0 justify-center self-stretch">
        <div className="w-px bg-border-10" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-3 py-1">
        <CheckIcon size={20} className="shrink-0 text-text-success" />
        <span className="text-200 text-text-primary-70">{count} tasks</span>
        <button
          type="button"
          className="cursor-pointer text-200 text-text-primary-70 underline hover:text-text-primary"
          onClick={() => pushToast({ message: "Task review — coming next iteration", status: STATUSES.success })}
        >
          Review
        </button>
        <button
          type="button"
          className="cursor-pointer text-200 text-text-primary-70 underline hover:text-text-primary"
          onClick={() => pushToast({ message: "New chat — coming next iteration", status: STATUSES.success })}
        >
          Chat about this
        </button>
        <span className="ml-auto text-200 text-text-primary-50">{time}</span>
      </div>
    </div>
    <div className="h-6" />
  </>
);

export default TaskListRow;
