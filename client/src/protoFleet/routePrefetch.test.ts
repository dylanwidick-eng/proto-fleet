import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { importSettingsCurtailment, settingsRoutePrefetch } from "@/protoFleet/routePrefetch";

describe("settingsRoutePrefetch", () => {
  it("warms the URL-only curtailment settings page", () => {
    expect(settingsRoutePrefetch).toContain(importSettingsCurtailment);
  });
});

describe("globalRoutePrefetch agent gating", () => {
  // AGENT_ENABLED is read once at module load (constants/featureFlags), so
  // each case stubs the env and re-imports the module graph fresh.
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("warms the agent page chunk when the flag is on", async () => {
    vi.stubEnv("VITE_AGENT_ENABLED", "true");
    const { globalRoutePrefetch, importAgentPage } = await import("@/protoFleet/routePrefetch");
    expect(globalRoutePrefetch).toContain(importAgentPage);
  });

  it("excludes the agent page factory when the flag is off", async () => {
    vi.stubEnv("VITE_AGENT_ENABLED", "false");
    const { globalRoutePrefetch, importAgentPage } = await import("@/protoFleet/routePrefetch");
    expect(globalRoutePrefetch).not.toContain(importAgentPage);
  });

  it("excludes the agent page factory when the flag is unset", async () => {
    const { globalRoutePrefetch, importAgentPage } = await import("@/protoFleet/routePrefetch");
    expect(globalRoutePrefetch).not.toContain(importAgentPage);
  });
});
