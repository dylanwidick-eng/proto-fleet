import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { ChevronDown } from "@/shared/assets/icons";
import Checkbox from "@/shared/components/Checkbox";
import Popover, { PopoverProvider, usePopover } from "@/shared/components/Popover";
import { minimalMargin } from "@/shared/components/Popover/constants";
import { type Position, positions } from "@/shared/constants";

export interface MultiSelectItem {
  id: string;
  name: string;
}

interface RuleMultiSelectFieldProps {
  id?: string;
  /** Floating label, e.g. "Send to". Also used as the listbox aria-label. */
  label: string;
  /** Shown (muted) when nothing is selected, e.g. "Pick a channel". */
  placeholder: string;
  /** Shown when there are no items to pick from. */
  emptyMessage: string;
  items: MultiSelectItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

const popoverViewportPadding = minimalMargin * 2;
// Only flip the popover above the trigger when the space below truly can't
// fit a reasonable list. Mirrors RuleScopeTargetField.
const minOpenBelowHeight = 240;

const summarize = (items: MultiSelectItem[], selectedIds: string[], placeholder: string): string => {
  const selected = items.filter((i) => selectedIds.includes(i.id));
  if (selected.length === 0) return placeholder;
  if (selected.length === 1) return selected[0].name;
  return `${selected[0].name} + ${selected.length - 1} more`;
};

const RuleMultiSelectFieldContent = ({
  id = "rule-multiselect",
  label,
  placeholder,
  emptyMessage,
  items,
  selectedIds,
  onToggle,
}: RuleMultiSelectFieldProps) => {
  const [open, setOpen] = useState(false);
  const { triggerRef, setPopoverRenderMode } = usePopover();
  const listboxRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<Position>(positions["bottom right"]);
  const [triggerWidth, setTriggerWidth] = useState<number | undefined>();
  const [popoverMaxHeight, setPopoverMaxHeight] = useState<number | undefined>();

  const hasValue = selectedIds.length > 0;
  const selectedLabel = summarize(items, selectedIds, placeholder);

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
          aria-label={label}
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
            <span className="absolute top-[7px] text-200 text-text-primary-50">{label}</span>
            <span className={clsx("truncate text-300", hasValue ? "text-text-primary" : "text-text-primary-50")}>
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
            aria-label={label}
            style={{ minWidth: triggerWidth, maxHeight: popoverMaxHeight }}
          >
            {items.length === 0 ? (
              <div className="rounded-xl p-3 text-text-primary-50">{emptyMessage}</div>
            ) : (
              items.map((item) => {
                const checked = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    role="option"
                    aria-selected={checked}
                    className="flex cursor-pointer items-center gap-3 rounded-xl p-3 text-left text-text-primary transition-[background-color] duration-200 ease-in-out hover:bg-core-primary-5"
                    onClick={() => onToggle(item.id)}
                  >
                    <Checkbox checked={checked} />
                    <span className="text-emphasis-300">{item.name}</span>
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

const RuleMultiSelectField = (props: RuleMultiSelectFieldProps) => (
  <PopoverProvider>
    <RuleMultiSelectFieldContent {...props} />
  </PopoverProvider>
);

export default RuleMultiSelectField;
