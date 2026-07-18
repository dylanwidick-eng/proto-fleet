import { describe, expect, it } from "vitest";
import { rackGridHotSet, rackGridSeedFrom, seededShuffledIndices } from "@/protoFleet/features/agent/lib/rackGridSeed";

describe("rackGridSeedFrom", () => {
  it("sums char codes, matching the prototype for the reboot card id", () => {
    expect(rackGridSeedFrom("network-offline-17")).toBe(1711);
  });

  it("falls back to 1 for an empty id", () => {
    expect(rackGridSeedFrom("")).toBe(1);
  });
});

describe("seededShuffledIndices", () => {
  it("reproduces the prototype LCG shuffle exactly for network-offline-17", () => {
    expect(seededShuffledIndices(25, "network-offline-17").slice(0, 5)).toEqual([2, 3, 8, 21, 15]);
  });

  it("is a permutation and deterministic", () => {
    const a = seededShuffledIndices(35, "sec-weak-pwd");
    const b = seededShuffledIndices(35, "sec-weak-pwd");
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual(Array.from({ length: 35 }, (_, i) => i));
  });

  it("differs between ids (different seeds, different hot patterns)", () => {
    expect(seededShuffledIndices(25, "network-offline-17")).not.toEqual(seededShuffledIndices(25, "diag-hot-9"));
  });
});

describe("rackGridHotSet", () => {
  it("marks exactly `affected` cells hot, matching the precomputed prototype set", () => {
    const hot = rackGridHotSet("network-offline-17", 25, 17);
    expect(hot.size).toBe(17);
    expect([...hot].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4, 5, 7, 8, 9, 12, 13, 15, 18, 19, 21, 23, 24]);
  });

  it("clamps affected to [0, total]", () => {
    expect(rackGridHotSet("x", 10, 99).size).toBe(10);
    expect(rackGridHotSet("x", 10, -3).size).toBe(0);
  });
});
