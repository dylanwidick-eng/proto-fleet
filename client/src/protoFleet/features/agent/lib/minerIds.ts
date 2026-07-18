/**
 * Synthetic miner-id pool for fleet-action execution events.
 *
 * The prototype generated racks R03–R08 × slots 1–42 (252 ids) and returned
 * `undefined` beyond that — firmware's 3,989-miner run printed
 * "undefined on v4.2.1". The port cycles rack numbers R01…R99 so ANY cohort
 * size yields real ids (PORT_PLAN.md divergence F4). The first 252 ids are
 * identical to the prototype's (M-R03-1 … M-R08-42).
 */

const SLOTS_PER_RACK = 42;
const FIRST_RACK = 3;
const RACK_WRAP = 99;

/** `total` miner ids in the prototype's `M-R{rr}-{n}` format. */
export const minerIdPool = (total: number): string[] => {
  const ids: string[] = [];
  for (let i = 0; i < total; i++) {
    const rawRack = FIRST_RACK + Math.floor(i / SLOTS_PER_RACK);
    const rack = ((rawRack - 1) % RACK_WRAP) + 1;
    const slot = (i % SLOTS_PER_RACK) + 1;
    ids.push(`M-R${String(rack).padStart(2, "0")}-${slot}`);
  }
  return ids;
};
