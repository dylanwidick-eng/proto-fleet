import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAgentChat } from "@/protoFleet/features/agent/components/chat/useAgentChat";
import { SparkFilledIcon } from "@/protoFleet/features/agent/components/icons";
import { SUGGESTION_CHIPS } from "@/protoFleet/features/agent/lib/suggestionChips";
import { useAgentStore } from "@/protoFleet/features/agent/store/agentStore";
import Button from "@/shared/components/Button";

/** Prototype cap: the textarea grows to 200px, then scrolls internally. */
const MAX_INPUT_HEIGHT_PX = 200;

/**
 * Chat composer (proto-nav-chat.md §4): auto-grow textarea + Send pill +
 * sparkle-prefixed suggestion-chip strip.
 *
 * - NO Enter-to-send — there is deliberately no keydown handler; Enter
 *   inserts a newline (checklist §11.6, normative).
 * - Chips SEED the input and focus it; they never auto-send (§11.5).
 * - Empty/whitespace Send is a strict no-op and the input is NOT cleared
 *   (§11.1); a real send clears + collapses the textarea immediately (§11.2).
 * - Consumes `pendingComposerSeed` on mount (floating tile's Ask input
 *   navigates here with a seed — PORT_PLAN.md §3.6).
 */
const Composer = () => {
  // A pending seed becomes the initial value; the effect below then consumes
  // (clears) it and focuses — keeping setState out of the effect body.
  const [value, setValue] = useState(() => useAgentStore.getState().pendingComposerSeed ?? "");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { send } = useAgentChat();

  useEffect(() => {
    if (useAgentStore.getState().pendingComposerSeed !== null) {
      useAgentStore.getState().consumeComposerSeed();
      inputRef.current?.focus();
    }
  }, []);

  // Auto-grow on every value change (typing, seeding, clearing): reset to
  // auto, then track scrollHeight — the prototype's oninput resize.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, MAX_INPUT_HEIGHT_PX)}px`;
  }, [value]);

  const handleSend = () => {
    if (!send(value)) return;
    setValue("");
  };

  const seedPrompt = (text: string) => {
    setValue(text);
    inputRef.current?.focus();
  };

  return (
    <div className="flex shrink-0 flex-col gap-4 border-t border-border-10 bg-surface-base px-10 pt-6 pb-10">
      <div className="flex items-center gap-4 pb-3">
        <textarea
          ref={inputRef}
          rows={1}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="How can I help you?"
          aria-label="Message Fleet bot"
          data-testid="agent-composer-input"
          className="max-h-[200px] min-w-0 flex-1 resize-none overflow-y-auto bg-transparent p-0 text-heading-200 text-text-primary outline-none placeholder:text-text-primary-50"
        />
        <Button variant="primary" text="Send" onClick={handleSend} testId="agent-composer-send" />
      </div>
      <div className="flex items-center gap-1 overflow-x-auto">
        <SparkFilledIcon size={20} className="shrink-0 text-text-primary" />
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => seedPrompt(chip)}
            className="shrink-0 cursor-pointer rounded-full bg-surface-5 px-3 py-0.5 text-emphasis-300 whitespace-nowrap text-text-primary transition-colors hover:bg-surface-10"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Composer;
