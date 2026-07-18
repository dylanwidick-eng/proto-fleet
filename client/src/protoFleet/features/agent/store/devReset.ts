import { AGENT_STORE_KEY, useAgentStore } from "@/protoFleet/features/agent/store/agentStore";

declare global {
  interface Window {
    /** Dev-only: wipe `protoFleet:agentPrototype:v1` and reload. */
    __agentReset?: () => void;
  }
}

/**
 * Installs `window.__agentReset()` in dev builds only — the QA escape hatch
 * for stale persisted demo state (PORT_PLAN.md fidelity R11 / risk #12).
 * Call once from the agent page module (P7 wires it); no-ops in prod.
 */
export const installAgentDevReset = (): void => {
  if (!import.meta.env.DEV) return;
  window.__agentReset = () => {
    useAgentStore.persist.clearStorage();
    window.localStorage.removeItem(AGENT_STORE_KEY);
    window.location.reload();
  };
};
