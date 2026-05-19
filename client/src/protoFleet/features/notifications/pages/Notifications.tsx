import ChannelsSection from "@/protoFleet/features/notifications/components/ChannelsSection";
import RulesSection from "@/protoFleet/features/notifications/components/RulesSection";
import SilencesSection from "@/protoFleet/features/notifications/components/SilencesSection";
import Header from "@/shared/components/Header";

const Notifications = () => (
  <div className="flex flex-col gap-6">
    <Header title="Notifications" titleSize="text-heading-300" />
    <div className="flex flex-col gap-4">
      <ChannelsSection />
      <RulesSection />
      <SilencesSection />
    </div>
  </div>
);

export default Notifications;
