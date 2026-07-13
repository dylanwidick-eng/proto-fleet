import type { ReactNode } from "react";
import clsx from "clsx";

import type { LivePreview } from "@/protoFleet/features/notifications/lib/livePreview";
import type { NotificationSeverity } from "@/protoFleet/features/notifications/lib/seedNotificationActivity";
import StatusCircle from "@/shared/components/StatusCircle";

interface RuleLivePreviewProps {
  preview: LivePreview;
  className?: string;
}

const SEVERITY_STATUS: Record<NotificationSeverity, "error" | "warning" | "pending" | "normal"> = {
  critical: "error",
  warning: "warning",
  info: "pending",
  resolved: "normal",
};

const SEVERITY_LABEL: Record<NotificationSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
  resolved: "Resolved",
};

const ChannelBlock = ({ channel, body, className }: { channel: string; body: ReactNode; className?: string }) => (
  <div className={clsx("flex flex-col gap-1.5", className)}>
    <div className="text-200 font-medium tracking-wider text-text-primary-50 uppercase">{channel}</div>
    <div className="rounded-lg bg-surface-5 p-3 text-200 leading-relaxed text-text-primary">{body}</div>
  </div>
);

const RuleLivePreview = ({ preview, className }: RuleLivePreviewProps) => {
  return (
    <div className={clsx("flex flex-col gap-3 rounded-xl border border-surface-10 bg-surface-base p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="text-200 font-medium tracking-wider text-text-primary-50 uppercase">Preview</div>
        <span className="inline-flex items-center gap-1.5 text-200 text-text-primary">
          <StatusCircle status={SEVERITY_STATUS[preview.severity]} variant="simple" width="w-1.5" removeMargin />
          {SEVERITY_LABEL[preview.severity]}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-200 font-medium tracking-wider text-text-primary-50 uppercase">Email</div>
        <div className="rounded-lg bg-surface-5 p-3 text-200 text-text-primary">
          <div className="font-medium">{preview.subject}</div>
          <div className="text-text-primary-50">From: Proto Fleet Alerts &lt;alerts@protofleet.io&gt;</div>
        </div>
        <iframe
          title="Email preview"
          srcDoc={preview.emailHtml}
          sandbox=""
          className="h-[440px] w-full rounded-lg border border-surface-10 bg-white"
        />
      </div>

      <ChannelBlock channel="Slack / Webhook" body={preview.slack} />

      <ChannelBlock
        channel="SMS"
        body={
          <div>
            <span className="font-mono">{preview.sms}</span>
            <span className="ml-2 text-text-primary-50">({preview.sms.length}/160)</span>
          </div>
        }
      />
    </div>
  );
};

export default RuleLivePreview;
