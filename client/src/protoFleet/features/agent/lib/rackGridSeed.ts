/**
 * Deterministic seeded shuffle for the rack-grid viz, ported EXACTLY from
 * the prototype (proto-smart-cards.md §2.3): seed = sum of the item id's
 * char codes (fallback 1); LCG step `seed = (seed*9301 + 49297) % 233280`;
 * Fisher–Yates with `j = floor((seed/233280)*(i+1))`. Same id ⇒ same hot
 * pattern on every render — pixel-stable demos.
 */

/** Sum of char codes of the id, falling back to 1 (empty ids included). */
export const rackGridSeedFrom = (id: string): number => id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) || 1;

/** Indices 0..total-1 shuffled with the exact prototype LCG Fisher–Yates. */
export const seededShuffledIndices = (total: number, id: string): number[] => {
  let seed = rackGridSeedFrom(id);
  const indices = Array.from({ length: total }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
};

/** The first `affected` shuffled indices become "hot" cells (clamped to total). */
export const rackGridHotSet = (id: string, total: number, affected: number): Set<number> => {
  const clamped = Math.min(Math.max(affected, 0), total);
  return new Set(seededShuffledIndices(total, id).slice(0, clamped));
};
