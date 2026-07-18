import { useState } from "react";
import clsx from "clsx";
import { FunnelIcon } from "@/protoFleet/features/agent/components/icons";
import Button, { sizes, variants } from "@/shared/components/Button";
import Popover, { PopoverProvider, usePopover } from "@/shared/components/Popover";
import { positions } from "@/shared/constants";
import { classNameToSelectors } from "@/shared/utils/cssUtils";

export interface CategoryFilterProps {
  /** Derived at runtime from ALL visible items so every category stays selectable while filters are active. */
  categories: string[];
  /** Multi-select; empty selection = all categories. */
  selected: string[];
  onToggle: (cat: string) => void;
  onClear: () => void;
}

// Clicks on the trigger toggle the popover themselves; without ignoring them
// the outside-click close would fire first and the button would re-open it.
const TRIGGER_CLASSNAME = "agent-tasks-filter-trigger";

const CategoryFilterContent = ({ categories, selected, onToggle, onClear }: CategoryFilterProps) => {
  const [open, setOpen] = useState(false);
  const { triggerRef } = usePopover();

  return (
    <div ref={triggerRef} className={clsx("relative ml-1", TRIGGER_CLASSNAME)}>
      <Button
        variant={variants.secondary}
        size={sizes.compact}
        ariaLabel="Filter by category"
        ariaExpanded={open}
        ariaHasPopup
        prefixIcon={<FunnelIcon />}
        onClick={() => setOpen((prev) => !prev)}
        testId="agent-tasks-filter-button"
      />
      {selected.length > 0 ? (
        <span
          data-testid="agent-tasks-filter-dot"
          className="absolute top-0 right-0 size-1.5 rounded-full bg-core-primary-fill"
        />
      ) : null}
      {open ? (
        <Popover
          position={positions.bottom}
          testId="agent-tasks-cat-popover"
          closePopover={() => setOpen(false)}
          closeIgnoreSelectors={classNameToSelectors(TRIGGER_CLASSNAME)}
          className="max-w-[560px]"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-heading-50 tracking-wide text-text-primary-50 uppercase">Category</span>
              {selected.length > 0 ? (
                <Button
                  variant={variants.textOnly}
                  textColor="text-text-primary-50"
                  text="Clear"
                  onClick={onClear}
                  testId="agent-tasks-cat-clear"
                />
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = selected.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onToggle(cat)}
                    className={clsx(
                      "rounded-full border px-3.5 py-2 text-200 transition-colors",
                      active
                        ? "border-transparent bg-core-primary-fill text-text-contrast"
                        : "border-border-10 bg-surface-base text-text-primary-70 hover:bg-surface-5",
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </Popover>
      ) : null}
    </div>
  );
};

/**
 * Tasks category filter — 32px funnel icon button at the end of the
 * state-chip row, with a 6px active dot when a selection exists and a
 * multi-select chip popover (proto-smart-cards.md §6.1). Hidden entirely
 * when no categories exist.
 */
const CategoryFilter = (props: CategoryFilterProps) =>
  props.categories.length === 0 ? null : (
    <PopoverProvider>
      <CategoryFilterContent {...props} />
    </PopoverProvider>
  );

export default CategoryFilter;
