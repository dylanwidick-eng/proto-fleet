import { describe, expect, it } from "vitest";
import { paletteFor, paletteIndexFor } from "@/protoFleet/features/agent/lib/palette";

describe("paletteIndexFor", () => {
  it("matches the prototype's mul-31 hash for the three seed workflow ids", () => {
    expect(paletteIndexFor("wf_seed_dr")).toBe(1);
    expect(paletteIndexFor("wf_seed_firmware")).toBe(2);
    expect(paletteIndexFor("wf_seed_report")).toBe(4);
  });

  it("is stable across calls and bounded to 0–4", () => {
    for (const id of ["wf_abc123", "", "network-offline-17", "wf_seed_dr"]) {
      const first = paletteIndexFor(id);
      expect(paletteIndexFor(id)).toBe(first);
      expect(first).toBeGreaterThanOrEqual(0);
      expect(first).toBeLessThan(5);
    }
  });
});

describe("paletteFor", () => {
  it("returns semantic extended-* token classes only — no hex (divergence D3)", () => {
    const p = paletteFor("wf_seed_dr");
    for (const cls of [p.bg, p.text, p.border]) {
      expect(cls).toContain("extended-");
      expect(cls).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
    expect(p.bg.startsWith("bg-")).toBe(true);
    expect(p.text.startsWith("text-")).toBe(true);
    expect(p.border.startsWith("border-")).toBe(true);
  });
});
