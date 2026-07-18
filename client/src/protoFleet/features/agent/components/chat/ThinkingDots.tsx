import { motion } from "motion/react";

/**
 * Three bouncing "thinking" dots shown while an agent reply is pending.
 * Motion re-expression of the prototype's `agent-thinking-bounce` keyframes
 * (proto-nav-chat.md §5.5): 1.1s ease-in-out loop, dots staggered 0.15s,
 * low (opacity .3) at 0%/80%/100% and high (opacity 1, -3px) at 40%.
 */
const ThinkingDots = () => (
  <div className="flex items-center gap-1 py-1.5" data-testid="agent-thinking-dots" aria-label="Fleet bot is thinking">
    {[0, 1, 2].map((index) => (
      <motion.span
        key={index}
        className="h-1.5 w-1.5 rounded-full bg-text-primary-50"
        animate={{ opacity: [0.3, 1, 0.3, 0.3], y: [0, -3, 0, 0] }}
        transition={{
          duration: 1.1,
          ease: "easeInOut",
          repeat: Infinity,
          delay: index * 0.15,
          times: [0, 0.4, 0.8, 1],
        }}
      />
    ))}
  </div>
);

export default ThinkingDots;
