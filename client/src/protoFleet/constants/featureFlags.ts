/**
 * Build-time feature flags for ProtoFleet. Each flag is parsed once at
 * module load from a Vite env var; the default for any unset flag is
 * `false` so forgetting the env var is the safer failure mode.
 *
 * Flags gate nav entries and standalone UI elements — they do not gate
 * routes themselves, so direct-URL access remains available for QA and
 * dogfood while a feature is in development.
 */

/**
 * Infrastructure devices tab. When on, `/fleet/infrastructure` is
 * discoverable from the Fleet tab strip. The route stays registered so QA
 * and dogfood can still deep-link while the feature is in development.
 * Override with `VITE_INFRASTRUCTURE_DEVICES_ENABLED=true`.
 */
export const INFRASTRUCTURE_DEVICES_ENABLED = import.meta.env.VITE_INFRASTRUCTURE_DEVICES_ENABLED === "true";

/**
 * Alerts settings (webhook/Slack delivery channels). When on, the
 * `/settings/alerts` entry is discoverable in the settings subnav.
 *
 * Alerts require the Grafana sidecar, which only runs when the server is
 * started with alerts enabled (`ENABLE_BETA_ALERTS=true` →
 * `just dev-alerts`). With the sidecar absent the page can't load anything, so
 * the nav stays hidden by default. Override with `VITE_ALERTS_ENABLED=true`.
 */
export const ALERTS_ENABLED = import.meta.env.VITE_ALERTS_ENABLED === "true";

/**
 * Agent design prototype (see features/agent) — a client-only, mock-data
 * demo of the agentic fleet UI. When on, the "Agent" sidebar entry, the
 * floating FAB/Fleet-bot tile, and the agent page-insight modules are
 * discoverable. The `/agent` route stays registered either way so QA and
 * dogfood can still deep-link while the flag is off; the flag gates
 * visibility (and the route-chunk prefetch tier), never the route itself.
 * Off = "notification mode": zero AI surfaces mounted anywhere.
 * `dev.sh` defaults this on locally (a design prototype's job is to be
 * seen); real builds default off. Override with `VITE_AGENT_ENABLED=true`.
 */
export const AGENT_ENABLED = import.meta.env.VITE_AGENT_ENABLED === "true";
