import { type ReactNode, useCallback, useMemo, useState } from "react";
import clsx from "clsx";

import type { ActivityEntry } from "@/protoFleet/api/generated/activity/v1/activity_pb";
import ActivityDetailModal from "@/protoFleet/features/activity/components/ActivityDetailModal";
import { getActivityIcon } from "@/protoFleet/features/activity/utils/activityIcons";
import { isCompletedEvent } from "@/protoFleet/features/activity/utils/eventType";
import { formatScope } from "@/protoFleet/features/activity/utils/formatScope";
import NotificationDetailModal from "@/protoFleet/features/notifications/components/NotificationDetailModal";
import {
  type NotificationActivityItem,
  notificationIconMap,
} from "@/protoFleet/features/notifications/lib/seedNotificationActivity";
import { Alert, type IconProps } from "@/shared/assets/icons";
import { formatActivityTimestamp } from "@/shared/utils/formatTimestamp";

const defaultNoDataElement = <div className="py-10 text-center text-text-primary-50">No activity to display.</div>;

type FeedRow =
  | { kind: "activity"; key: string; entry: ActivityEntry; createdAtSec: number }
  | { kind: "notification"; key: string; item: NotificationActivityItem; createdAtSec: number };

function groupActivities(activities: ActivityEntry[]): ActivityEntry[] {
  const completedBatchIds = new Set<string>();
  for (const entry of activities) {
    if (entry.batchId && isCompletedEvent(entry.eventType)) {
      completedBatchIds.add(entry.batchId);
    }
  }
  return activities.filter((entry) => {
    if (!entry.batchId) return true;
    if (isCompletedEvent(entry.eventType)) return true;
    return !completedBatchIds.has(entry.batchId);
  });
}

interface UnifiedActivityFeedProps {
  activities: ActivityEntry[];
  notifications: NotificationActivityItem[];
  noDataElement?: ReactNode;
}

const UnifiedActivityFeed = ({ activities, notifications, noDataElement }: UnifiedActivityFeedProps) => {
  const [selectedEntry, setSelectedEntry] = useState<ActivityEntry | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationActivityItem | null>(null);
  const [readKeys, setReadKeys] = useState<Set<string>>(() => new Set());

  const markRead = useCallback((key: string) => {
    setReadKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const handleSelectActivity = useCallback(
    (entry: ActivityEntry) => {
      markRead(`a:${entry.eventId}`);
      setSelectedEntry(entry);
    },
    [markRead],
  );
  const handleSelectNotification = useCallback(
    (item: NotificationActivityItem) => {
      markRead(`n:${item.id}`);
      setSelectedNotification(item);
    },
    [markRead],
  );

  const handleDismissActivity = useCallback(() => setSelectedEntry(null), []);
  const handleDismissNotification = useCallback(() => setSelectedNotification(null), []);

  const rows = useMemo<FeedRow[]>(() => {
    const grouped = groupActivities(activities);
    const activityRows: FeedRow[] = grouped.map((entry) => ({
      kind: "activity",
      key: `a:${entry.eventId}`,
      entry,
      createdAtSec: Number(entry.createdAt?.seconds ?? 0),
    }));
    const notificationRows: FeedRow[] = notifications.map((item) => ({
      kind: "notification",
      key: `n:${item.id}`,
      item,
      createdAtSec: Math.floor(item.createdAt.getTime() / 1000),
    }));
    return [...activityRows, ...notificationRows].sort((a, b) => b.createdAtSec - a.createdAtSec);
  }, [activities, notifications]);

  return (
    <div>
      <div className="px-4 py-2 text-200 text-text-primary-50">
        {rows.length} {rows.length === 1 ? "activity" : "activities"}
      </div>
      <div className="divide-y divide-surface-10">
        {rows.length === 0 ? (noDataElement ?? defaultNoDataElement) : null}
        {rows.map((row) =>
          row.kind === "activity" ? (
            <ActivityRow
              key={row.key}
              entry={row.entry}
              isRead={readKeys.has(row.key)}
              onSelect={handleSelectActivity}
            />
          ) : (
            <NotificationRow
              key={row.key}
              item={row.item}
              isRead={readKeys.has(row.key)}
              onSelect={handleSelectNotification}
            />
          ),
        )}
      </div>

      <ActivityDetailModal entry={selectedEntry} onDismiss={handleDismissActivity} />
      <NotificationDetailModal item={selectedNotification} onDismiss={handleDismissNotification} />
    </div>
  );
};

const FeedRowShell = ({
  testId,
  isRead,
  onClick,
  children,
}: {
  testId: string;
  isRead: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <div
    role="button"
    tabIndex={0}
    data-testid={testId}
    data-read={isRead}
    className={clsx(
      "grid cursor-pointer grid-cols-[1fr_12rem_10rem_13rem] items-start gap-4 px-4 py-3 hover:bg-surface-5",
      isRead && "text-text-primary-50",
    )}
    onClick={onClick}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    }}
  >
    {children}
  </div>
);

const ActivityRow = ({
  entry,
  isRead,
  onSelect,
}: {
  entry: ActivityEntry;
  isRead: boolean;
  onSelect: (e: ActivityEntry) => void;
}) => {
  const isFailed = entry.result === "failure";
  const renderIcon: (props: IconProps) => ReactNode = isFailed ? Alert : getActivityIcon(entry.eventType);
  return (
    <FeedRowShell testId="list-row" isRead={isRead} onClick={() => onSelect(entry)}>
      <div className="flex items-start gap-2">
        <div className={clsx("shrink-0", isFailed && !isRead ? "text-intent-critical" : "")}>
          {renderIcon({ width: "w-4" })}
        </div>
        <span className="min-w-0 break-words">
          {isCompletedEvent(entry.eventType)
            ? entry.description.replace(/\s*completed\s*/i, " ").trim()
            : entry.description}
        </span>
        {isFailed ? <span className={clsx("shrink-0 text-200", !isRead && "text-intent-critical")}>Failed</span> : null}
      </div>
      <div>{formatScope(entry.scopeType, entry.scopeLabel, entry.scopeCount || undefined)}</div>
      <div>{entry.username ?? "—"}</div>
      <div>{formatActivityTimestamp(Number(entry.createdAt?.seconds))}</div>
    </FeedRowShell>
  );
};

const NotificationRow = ({
  item,
  isRead,
  onSelect,
}: {
  item: NotificationActivityItem;
  isRead: boolean;
  onSelect: (i: NotificationActivityItem) => void;
}) => {
  const Icon = notificationIconMap[item.kind];
  return (
    <FeedRowShell testId="notification-row" isRead={isRead} onClick={() => onSelect(item)}>
      <div className="flex items-start gap-2">
        <div className="shrink-0">
          <Icon width="w-4" />
        </div>
        <span className="min-w-0 break-words">{item.description}</span>
      </div>
      <div className="col-span-2">{formatScope(item.scopeType, item.scopeLabel, item.scopeCount || undefined)}</div>
      <div>{formatActivityTimestamp(Math.floor(item.createdAt.getTime() / 1000))}</div>
    </FeedRowShell>
  );
};

export default UnifiedActivityFeed;
