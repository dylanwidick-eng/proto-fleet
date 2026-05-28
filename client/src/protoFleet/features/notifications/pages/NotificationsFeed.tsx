import { useMemo } from "react";

import UnifiedActivityFeed from "@/protoFleet/features/notifications/components/UnifiedActivityFeed";
import { getSeedNotificationActivity } from "@/protoFleet/features/notifications/lib/seedNotificationActivity";
import Header from "@/shared/components/Header";

const NotificationsFeed = () => {
  const notifications = useMemo(() => getSeedNotificationActivity(), []);

  return (
    <>
      <div className="sticky left-0 z-3 px-6 pt-6 laptop:px-10 laptop:pt-10">
        <div className="flex items-center justify-between pb-4">
          <Header title="Notifications" titleSize="text-heading-300" />
        </div>
      </div>

      <div className="p-6 pt-0 laptop:p-10 laptop:pt-0">
        <UnifiedActivityFeed activities={[]} notifications={notifications} />
      </div>
    </>
  );
};

export default NotificationsFeed;
