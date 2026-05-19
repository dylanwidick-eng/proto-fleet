import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { Channel } from "@/protoFleet/features/notifications/types";
import { ChevronDown } from "@/shared/assets/icons";
import Checkbox from "@/shared/components/Checkbox";
import Popover, { PopoverProvider, usePopover } from "@/shared/components/Popover";
import { minimalMargin } from "@/shared/components/Popover/constants";
import { type Position, positions } from "@/shared/constants";

interface RuleChannelsFieldProps {
  id?: string;
  channels: Channel[];
  selectedIds: string[];
  onToggle: (channelId: string) => void;
}

const popoverViewportPadding = minimalMargin * 2;
// Only flip the popover above the trigger when the space below truly can't
// fit a reasonable list. Mirrors RuleScopeTargetField.
const minOpenBelowHeight = 240;

const summarize = (channels: Channel[], selectedIds: string[]): string => {
  const selected = channels.filter((c) => selectedIds.includes(c.id));
  if (selected.length === 0) return "Pick a channel";
  if (selected.length === 1) return selected[0].name;
  return `${selected[0].name} + ${selected.length - 1} more`;
};

const RuleChannelsFieldContent = ({
  id = "rule-channels",
  channels,
  selectedIds,
  onToggle,
}: RuleChannelsFieldProps) => {
  const [open, setOpen] = useState(false);
  const { triggerRef, setPopoverRenderMode } = usePopover();
  const listboxRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<Position>(positions["bottom right"]);
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>();
  const [popoverMaxHeight, setPopoverMaxHeight] = useState<number | undefined>();

  const hasValue = selectedIds.length > 0;
  const selectedLabel = summarize(channels, selectedIds);

  useEffect(() => {
    setPopoverRenderMode("portal-scrolling");
  }, [setPopoverRenderMode]);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const update = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const spaceAbove = rect.top - popoverViewportPadding;
      const spaceBelow = viewportHeight - rect.bottom - popoverViewportPadding;
      const openAbove = spaceBelow < minOpenBelowHeight && spaceAbove > spaceBelow;
      setTriggerWidth(rect.width);
      setPopoverPosition(openAbove ? positions["top right"] : positions["bottom right"]);
      setPopoverMaxHeight(Math.max(Math.floor(openAbove ? spaceAbove : spaceBelow), 0));
    };
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [open, triggerRef]);

  return (
    <div className="relative">
      <div ref={triggerRef}>
        <button
          id={id}
          type="button"
          aria-label="Send to"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={clsx(
            "peer flex h-14 w-full items-center justify-between rounded-lg pr-4 pl-4 text-left outline-hidden",
            "transition duration-200 ease-in-out",
            "bg-surface-base",
            { "border border-border-5": !open },
            { "border border-border-20 ring-4 ring-core-primary-5": open },
          )}
        >
          <div className="flex min-w-0 flex-col pt-[18px]">
            <span className="absolute top-[7px] text-200 text-text-primary-50">Send to</span>
            <span
              className={clsx(
                "truncate text-300",
                hasValue ? "text-text-primary" : "text-text-primary-50",
              )}
            >
              {selectedLabel}
            </span>
          </div>
          <ChevronDown
            width="w-3"
            className={clsx("shrink-0 text-text-primary-70 transition-transform", {
              "rotate-180": open,
            })}
          />
        </button>
      </div>

      {open ? (
        <Popover
          position={popoverPosition}
          className="!w-auto !space-y-0 !rounded-xl border border-border-5 !bg-surface-elevated-base !p-0 !shadow-300 !backdrop-blur-none"
          closePopover={() => setOpen(false)}
          closeIgnoreSelectors={[`#${id}`]}
        >
          <div
            ref={listboxRef}
            className="max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain p-1.5"
            role="listbox"
            aria-label="Channels"
            style={{ minWidth: triggerWidth, maxHeight: popoverMaxHeight }}
          >
            {channels.length === 0 ? (
              <div className="rounded-xl p-3 text-text-primary-50">
                No channels yet — add one first.
              </div>
            ) : (
              channels.map((channel) => {
                const checked = selectedIds.includes(channel.id);
                return (
                  <div
                    key={channel.id}
                    role="option"
                    aria-selected={checked}
                    className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-left text-text-primary transition-[background-color] duration-200 ease-in-out hover:bg-core-primary-5"
                    onClick={() => onToggle(channel.id)}
                  >
                    <Checkbox checked={checked} />
                    <span className="text-emphasis-300">{channel.name}</span>
                  </div>
                );
              })
            )}
          </div>
        </Popover>
      ) : null}
    </div>
  );
};

const RuleChannelsField = (props: RuleChannelsFieldProps) => (
  <PopoverProvider>
    <RuleChannelsFieldContent {...props} />
  </PopoverProvider>
);

export default RuleChannelsField;
