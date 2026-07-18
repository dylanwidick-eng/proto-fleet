import { describe, expect, it } from "vitest";
import { elapsedStr, formatRelTime, stripCountSuffix } from "@/protoFleet/features/agent/lib/time";

describe("formatRelTime", () => {
  const now = 1_800_000_000_000;

  it("returns '' for falsy timestamps", () => {
    expect(formatRelTime(null, now)).toBe("");
    expect(formatRelTime(undefined, now)).toBe("");
    expect(formatRelTime(0, now)).toBe("");
  });

  it("says 'just now' under a minute", () => {
    expect(formatRelTime(now - 59_000, now)).toBe("just now");
  });

  it("rounds minutes, hours, and days like the prototype", () => {
    expect(formatRelTime(now - 60_000, now)).toBe("1m ago");
    expect(formatRelTime(now - 90_000, now)).toBe("2m ago"); // Math.round, not floor
    expect(formatRelTime(now - 3_600_000, now)).toBe("1h ago");
    expect(formatRelTime(now - 5 * 3_600_000, now)).toBe("5h ago");
    expect(formatRelTime(now - 86_400_000, now)).toBe("1d ago");
    expect(formatRelTime(now - 7 * 86_400_000, now)).toBe("7d ago");
  });
});

describe("elapsedStr", () => {
  it("renders sub-minute runs as seconds only", () => {
    expect(elapsedStr(42_000)).toBe("42s");
  });

  it("renders longer runs as 'Xm Ys'", () => {
    expect(elapsedStr(125_000)).toBe("2m 5s");
    expect(elapsedStr(60_000)).toBe("1m 0s");
  });
});

describe("stripCountSuffix", () => {
  it("strips a plain trailing count", () => {
    expect(stripCountSuffix("R03–R08 only (247)")).toBe("R03–R08 only");
  });

  it("leaves comma-formatted counts alone (faithful prototype quirk)", () => {
    expect(stripCountSuffix("All v4.1.x (3,989)")).toBe("All v4.1.x (3,989)");
  });

  it("leaves labels without counts unchanged", () => {
    expect(stripCountSuffix("Exclude curtailed")).toBe("Exclude curtailed");
  });
});
