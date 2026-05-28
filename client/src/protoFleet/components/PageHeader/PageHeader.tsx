import { useState } from "react";
import clsx from "clsx";
import LocationSelector from "./LocationSelector";
import SchedulePill from "./SchedulePill";
import type { UseSchedulePillDataResult } from "./useSchedulePillData";
import { usePageBackground } from "@/protoFleet/hooks/usePageBackground";
import NotificationDrawer from "@/protoFleet/features/notifications/components/NotificationDrawer";
import { useNotificationModel } from "@/protoFleet/features/notifications/lib/demoModel";
import { Notification, Pause } from "@/shared/assets/icons";
import Button, { sizes, variants } from "@/shared/components/Button";
import { useReactiveLocalStorage } from "@/shared/hooks/useReactiveLocalStorage";
import { useWindowDimensions } from "@/shared/hooks/useWindowDimensions";
interface PageHeaderProps {
  isMenuOpen?: boolean;
  openMenu?: () => void;
  schedulePillData: UseSchedulePillDataResult;
}

const headerWidgetEnabled = true;

const HeaderWidgets = ({
  className,
  dismissedSetup,
  onContinueSetup,
  schedulePillData,
  onBellClick,
}: {
  className?: string;
  dismissedSetup: boolean;
  onContinueSetup: () => void;
  schedulePillData: UseSchedulePillDataResult;
  onBellClick: () => void;
}) => {
  const { pillSchedule, sections, pendingScheduleId, onToggleScheduleStatus } = schedulePillData;

  return (
    <div className={clsx("flex space-x-3", className)}>
      {pillSchedule ? (
        <SchedulePill
          pillSchedule={pillSchedule}
          sections={sections}
          pendingScheduleId={pendingScheduleId}
          onToggleScheduleStatus={onToggleScheduleStatus}
        />
      ) : null}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-core-primary-5 text-text-primary hover:opacity-80">
        <button type="button" aria-label="Notifications" className="flex items-center" onClick={onBellClick}>
          <Notification width="w-4" />
        </button>
      </div>
      {dismissedSetup ? (
        <Button variant={variants.secondary} size={sizes.compact} text="Continue setup" onClick={onContinueSetup} />
      ) : null}
    </div>
  );
};

const PageHeader = ({ isMenuOpen, openMenu, schedulePillData }: PageHeaderProps) => {
  const { isPhone, isTablet } = useWindowDimensions();
  const { bgClass } = usePageBackground();
  const [dismissedSetup, setDismissedSetup] = useReactiveLocalStorage<boolean>("completeSetupDismissed");
  const hasDismissedSetup = Boolean(dismissedSetup);
  const notificationModel = useNotificationModel();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleCompleteSetup = () => {
    setDismissedSetup(false);
  };

  const handleBellClick = () => {
    if (notificationModel === "m2") setDrawerOpen(true);
  };

  const headerWidgetsProps = {
    dismissedSetup: hasDismissedSetup,
    onContinueSetup: handleCompleteSetup,
    schedulePillData,
    onBellClick: handleBellClick,
  };
  const showPhoneWidgets = isPhone && (hasDismissedSetup || schedulePillData.hasVisibleSchedules);

  return (
    <>
      <div className="flex h-12 items-center laptop:h-15">
        <div className="flex grow items-center px-4">
          <div className="flex grow items-center">
            {isPhone || isTablet ? (
              <Pause
                ariaExpanded={isMenuOpen}
                ariaLabel="Open navigation menu"
                className="mr-2 text-text-primary"
                onClick={openMenu}
                testId="navigation-menu-button"
              />
            ) : null}
            <LocationSelector />
          </div>
          {!isPhone && headerWidgetEnabled ? <HeaderWidgets {...headerWidgetsProps} /> : null}
        </div>
      </div>
      {showPhoneWidgets ? (
        <div className={clsx("flex h-[57px] items-center", bgClass)}>
          <HeaderWidgets className="ml-5" {...headerWidgetsProps} />
        </div>
      ) : null}
      <NotificationDrawer open={drawerOpen} onDismiss={() => setDrawerOpen(false)} />
    </>
  );
};

export default PageHeader;
