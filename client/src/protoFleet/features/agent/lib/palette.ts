/**
 * Stable 5-way color palette for calendar/always-on automation pills.
 *
 * The hash is the prototype's exact mul-31 unsigned hash mod 5
 * (proto-automations.md §2.4.1), so a given workflow id keeps the same color
 * across renders and views. The five hues are re-expressed as `extended-*`
 * semantic-token classes instead of the prototype's inline hexes
 * (PORT_PLAN.md divergence D3) — same hash, same distribution, dark-safe.
 */
export interface AgentPillPalette {
  bg: string;
  text: string;
  border: string;
}

const PALETTES: AgentPillPalette[] = [
  { bg: "bg-extended-sky-fill/15", text: "text-extended-sky-fill", border: "border-extended-sky-fill/40" },
  { bg: "bg-extended-purple-fill/15", text: "text-extended-purple-fill", border: "border-extended-purple-fill/40" },
  { bg: "bg-extended-forest-fill/15", text: "text-extended-forest-fill", border: "border-extended-forest-fill/40" },
  { bg: "bg-extended-taupe-fill/15", text: "text-extended-taupe-fill", border: "border-extended-taupe-fill/40" },
  { bg: "bg-extended-pink-fill/15", text: "text-extended-pink-fill", border: "border-extended-pink-fill/40" },
];

/** Exact prototype hash: `h = (h*31 + charCode) >>> 0` over all chars, then `% 5`. */
export const paletteIndexFor = (id: string): number => {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h % PALETTES.length;
};

export const paletteFor = (id: string): AgentPillPalette => PALETTES[paletteIndexFor(id)];
