import type { AgentItem } from "@/protoFleet/features/agent/types";

/**
 * AGENT_ITEMS — the 14 canonical agent recommendations/insights, transcribed
 * VERBATIM from the prototype (proto-smart-cards.md §1.4). Unicode
 * punctuation (`·`, `–`, `—`, `−` minus sign, `°C`, `×`) is load-bearing;
 * agentItems.test.ts guards against accidental copy "fixes".
 *
 * `source` is dormant provenance data — no surface renders it (§2.6).
 * Array order = priority order (page-insight modules take the first 4 matches).
 */
export const AGENT_ITEMS: AgentItem[] = [
  {
    id: "energy-power-spike",
    cat: "Energy",
    title: "Power costs +35%",
    sub: "Price spike expected from 3–6 PM",
    site: "Dalton, GA",
    action: "Schedule curtailment",
    source: "ERCOT day-ahead · live",
    signal:
      "ERCOT day-ahead price hits $128/MWh from 3–6 PM (vs $42/MWh avg). 1,247 miners drop below break-even at this price.",
    plan: "Set power target to 70% on bottom-200 efficiency miners at Dalton, GA from 3:00–6:00 PM. Stagger restore 5 miners every 30s starting 6:00 PM.",
    impact: {
      devices: "1,247 miners",
      hashrate: "−9.3 PH/s during window",
      dollars: "+$1,840 net vs continuing",
      extra: "Restore complete by 6:20 PM",
    },
    viz: { type: "callout", value: "+35%", sub: "price spike" },
  },
  {
    id: "network-offline-17",
    cat: "Network",
    title: "17 miners offline",
    sub: "No auto reboot, last telemetry 3:48 AM",
    site: "Building A, Rack 12",
    action: "Reboot all",
    source: "Miner telemetry · last 4h",
    signal:
      "17 Antminer S21s on Rack 12 stopped reporting at 3:48 AM. Auto-reboot disabled because maintenance window was active until 5:00 AM.",
    plan: "Send single reboot command to all 17 miners. If any remain offline after 90s, escalate to technician dispatch with rack-walk checklist.",
    impact: { devices: "17 miners", hashrate: "+1.3 PH/s if recovered", dollars: "+$280/day" },
    viz: { type: "rack-grid", total: 25, affected: 17 },
    workflow: {
      defaultName: "Auto-reboot offline miners",
      whenText: "Any miner stops reporting telemetry for >30 min outside a maintenance window",
      thenText: "Send reboot. Escalate to technician dispatch after 90s if still offline.",
    },
  },
  {
    id: "weather-high-temp",
    cat: "Weather",
    title: "Forecasted high temps",
    sub: "39°C forecast tomorrow",
    site: "Dalton, GA",
    action: "Pre-cool",
    source: "NOAA forecast · refreshed 1h ago",
    signal:
      "NOAA forecast: 39°C peak at 14:00–17:00 tomorrow. Site PUE rises 12% above 35°C ambient based on last 90 days of data.",
    plan: "Drop building setpoint by 2°C overnight to pre-cool. Curtail bottom-100 efficiency miners during the 14:00–17:00 window.",
    impact: { devices: "100 miners curtailed", hashrate: "−4.6 PH/s during window", dollars: "+$420 vs no action" },
    viz: { type: "callout", value: "39°C", sub: "tomorrow peak" },
  },
  {
    id: "diag-hot-9",
    cat: "Diagnostics",
    title: "9 miners over 85°C",
    sub: "Sustained over 45 minutes",
    site: "Building C",
    action: "Throttle",
    source: "Hashboard sensors · last 45 min",
    signal:
      "Hashboard temps on 9 miners sustained >85°C for 47 min. PSU lifespan roughly halves every 5°C above 80°C — extended exposure compounds replacement cost.",
    plan: "Reduce power target to 75% on the 9 affected miners until hashboard temp drops below 75°C for 30 consecutive minutes, then restore to default.",
    impact: {
      devices: "9 miners",
      hashrate: "−0.18 PH/s temporarily",
      dollars: "Avoids ~$2,400 projected PSU replacement",
    },
    viz: { type: "rack-grid", total: 25, affected: 9 },
    workflow: {
      defaultName: "Auto-throttle overheating miners",
      whenText: "Any miner sustains hashboard temp >85°C for >15 min",
      thenText: "Reduce power to 75% until temp drops below 75°C for 30 min, then restore default.",
    },
  },
  {
    id: "fw-update",
    cat: "Software",
    title: "Firmware update",
    sub: "3,989 miners need update to v4.2.1",
    site: "All sites",
    action: "Stage rollout",
    source: "Bitmain release feed · CVE database",
    signal:
      "Firmware v4.2.1 released by Bitmain on 2026-04-29. Patches pool-credential leak (CVE-2026-4419). 3,989 miners still on v4.1.x.",
    plan: "Stage rollout: 200 miners overnight Tue (canary), 1,000 Wed, 2,789 Thu. Pause window 9:00–17:00 on weekdays. Auto-rollback if hashrate drop >5% in canary group.",
    impact: {
      devices: "3,989 miners",
      hashrate: "~6 min downtime per miner",
      dollars: "Closes high-severity security finding",
    },
    viz: { type: "pie", data: [3989, 1611], labels: ["v4.1.x", "v4.2.1"] },
  },
  {
    id: "inv-fans",
    cat: "Inventory",
    title: "Degrading fans",
    sub: "1,322 miners with RPM drift >10%",
    site: "Building A",
    action: "Order replacements",
    source: "Fan RPM telemetry · last 14d",
    signal:
      "1,322 miners show fan RPM drift >10% from baseline over the last 14 days. Failure prediction model: 60-day MTBF for the worst 200.",
    plan: "Generate replacement PO for 1,400 Delta AFB1212SH fans (2 per miner + 6% buffer). Schedule swap during next planned maintenance window.",
    impact: {
      devices: "1,322 miners flagged",
      hashrate: "Prevents ~12 PH/s lost to unplanned downtime",
      dollars: "~$11,200 parts vs ~$48,000 unplanned outage",
    },
    viz: { type: "bar", data: [45, 18, 37], labels: ["0–5%", "5–10%", ">10%"] },
    workflow: {
      defaultName: "Auto-order replacement fans",
      whenText: "Fan RPM drift >10% from baseline detected on any miner for >7 days",
      thenText: "Add to next replacement PO. Schedule swap during next maintenance window.",
    },
  },
  {
    id: "ops-repair-backlog",
    cat: "Operations",
    title: "400% over avg repair time",
    sub: "Maintenance backlog growing",
    site: "Building E, Zone 1",
    action: "Reassign techs",
    source: "Maintenance tickets · last 30d",
    signal:
      "Building E Zone 1 mean-time-to-repair: 4.7 days (fleet avg: 1.1 days). 23 open tickets older than 5 days. Building C is currently 30% overstaffed.",
    plan: "Reassign 2 technicians from Building C to Zone 1 for the next 7 days. Re-evaluate staffing balance at end of week.",
    impact: { devices: "23 open tickets", hashrate: "+8.2 PH/s recovered", dollars: "+$340/day until cleared" },
    viz: { type: "callout", value: "400%", sub: "over avg repair time" },
  },
  {
    id: "sec-weak-pwd",
    cat: "Security",
    title: "Weak passwords",
    sub: "27 devices share default or reused credentials",
    site: "All sites",
    action: "Rotate credentials",
    source: "Quarterly credential audit",
    signal:
      "27 miners flagged by quarterly credential audit: 14 still use vendor default, 13 reuse a password shared by 8+ devices.",
    plan: "Rotate all 27 device passwords using the fleet credential manager. Force re-auth on next pool sync. Log to security audit trail.",
    impact: { devices: "27 miners", hashrate: "No impact", dollars: "Closes 27 high-risk audit findings" },
    viz: { type: "rack-grid", total: 35, affected: 27 },
    workflow: {
      defaultName: "Auto-rotate weak passwords",
      whenText: "Default or reused passwords detected during credential audit",
      thenText: "Rotate device passwords using fleet credential manager. Log to security audit trail.",
    },
  },
  {
    id: "net-unstable-33",
    cat: "Network",
    title: "33 unstable links",
    sub: "Median dropout 6.5 min every 2 hrs",
    site: "Building B",
    action: "Inspect cabling",
    source: "Switch port counters · last 24h",
    signal:
      "33 miners on Building B drop link median 6.5 min every 2 hrs. Switch port CRC error counters 4× elevated on the affected ports.",
    plan: "Run cable certification on the 33 affected switch ports. Pre-flag 4 patch cables already failing the last quarterly test.",
    impact: { devices: "33 miners", hashrate: "+0.8% uptime", dollars: "+$140/day recovered" },
    viz: { type: "rack-grid", total: 35, affected: 33 },
  },
  {
    id: "perf-bldg-d",
    cat: "Performance",
    title: "Hashrate 16% below avg",
    sub: "High fan RPM + low hash rate across all racks",
    site: "Building D",
    action: "Inspect HVAC",
    source: "Hashrate + HVAC telemetry · last 24h",
    signal:
      "Building D running 16% below fleet avg hashrate. Fan RPM 12% above avg, suggesting thermal throttling. HVAC setpoint reads 24°C but supply temp measures 28°C.",
    plan: "Dispatch HVAC inspection: check filter clog, fan tower bearings, supply diffuser balance. Recalibrate or schedule AHU service.",
    impact: { devices: "~600 miners", hashrate: "+27 PH/s if resolved", dollars: "+$680/day" },
    viz: { type: "comparison", data: [100, 84], labels: ["Fleet avg", "Building D"] },
  },
  {
    id: "diag-racks-hot",
    cat: "Diagnostics",
    title: "4 racks running hot",
    sub: "Sustained 67°C average",
    site: "Racks 5–8",
    action: "Inspect aisle",
    source: "Rack temps + aisle airflow · last 6h",
    signal: "Racks 5–8 sustained 67°C avg over the last 6 hrs. Aisle 2 supply airflow measuring 28% below design spec.",
    plan: "Inspect Aisle 2 cooling: filter clog, fan tower, supply diffuser. Curtail rack 8 to 80% as interim until airflow restored.",
    impact: {
      devices: "~180 miners",
      hashrate: "−1.4 PH/s during interim curtail",
      dollars: "+$220/day after fix",
    },
    viz: { type: "bar", data: [62, 64, 67, 68], labels: ["R5", "R6", "R7", "R8"], threshold: 65 },
  },
  {
    id: "pools-need-pool",
    cat: "Pools",
    title: "8% of fleet need pool",
    sub: "Missing primary pool config",
    site: "Building A",
    action: "Apply default pool",
    source: "Pool config audit · live",
    signal:
      "720 miners report no primary pool config. Pattern matches incomplete onboarding batch from 2026-04-22 (Foreman import).",
    plan: "Bulk-apply default pool (stratum+tcp://us-east.pool:3333) to all 720 affected miners. Worker name template: %site%-%rack%-%slot%.",
    impact: { devices: "720 miners", hashrate: "+43 PH/s recovered", dollars: "+$1,080/day" },
    viz: { type: "callout", value: "8%", sub: "of fleet" },
    workflow: {
      defaultName: "Auto-apply default pool",
      whenText: "Any miner reports no primary pool config after onboarding",
      thenText: "Apply default pool. Worker name template: %site%-%rack%-%slot%.",
    },
  },
  // ── Pattern-detection insights ────────────────────────────────────────────
  // The agent observed operator behavior and proposes a recurring schedule.
  // workflow.triggerType "schedule" switches the Automate editor into a
  // days+time picker and persists a schedule object instead of free text.
  {
    id: "pattern-weekday-curtail",
    cat: "Pattern",
    title: "You curtail weekday afternoons",
    sub: "47 manual curtailments over 6 weeks · pattern matched",
    site: "Dalton, GA",
    action: "Schedule it",
    source: "Manual action history · last 6w",
    signal:
      "You've manually curtailed bottom-100 efficiency miners between 3:00–6:00 PM on every weekday for the last 6 weeks. 47/47 successful, 0 incidents. Pattern aligns with the ERCOT day-ahead price peak window.",
    plan: "Schedule a recurring weekday automation: 3:00–6:00 PM curtail bottom-100 efficiency miners at Dalton, GA. Stagger restore 5 miners every 30s starting 6:00 PM.",
    impact: {
      devices: "~100 miners",
      hashrate: "−4.6 PH/s during window",
      dollars: "+$1,840 net per event",
      extra: "Saves ~4 min/day of manual setup",
    },
    viz: { type: "callout", value: "47×", sub: "manual curtailments" },
    workflow: {
      defaultName: "Weekday afternoon curtailment",
      triggerType: "schedule",
      schedule: { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], startTime: "15:00", endTime: "18:00" },
      thenText:
        "Curtail bottom-100 efficiency miners at Dalton, GA. Stagger restore 5 miners every 30s starting 6:00 PM.",
    },
  },
  {
    id: "pattern-sunday-reboot",
    cat: "Pattern",
    title: "You reboot Building B every Sunday",
    sub: "8 manual reboots over 8 weeks during 4–5 AM maintenance",
    site: "Building B",
    action: "Schedule it",
    source: "Manual action history · last 8w",
    signal:
      "You've manually rebooted all of Building B between 4:00–5:00 AM every Sunday for the past 8 weeks. Every reboot completed within the maintenance window with no escalations.",
    plan: "Schedule a recurring Sunday automation: rolling reboot of Building B at 4:00 AM. Cap at 50 miners/min to prevent grid spikes.",
    impact: {
      devices: "~600 miners",
      hashrate: "Brief downtime within window",
      dollars: "~10 min operator time saved per week",
      extra: "Removes manual setup",
    },
    viz: { type: "callout", value: "8×", sub: "Sundays in a row" },
    workflow: {
      defaultName: "Sunday maintenance reboot",
      triggerType: "schedule",
      schedule: { days: ["Sun"], startTime: "04:00", endTime: "05:00" },
      thenText: "Rolling reboot of Building B. Cap at 50 miners per minute.",
    },
  },
];

const AGENT_ITEMS_BY_ID = new Map(AGENT_ITEMS.map((item) => [item.id, item]));

/** Look up a recommendation by id. Unknown ids (e.g. thread-turn card ids) return undefined. */
export const getAgentItem = (id: string): AgentItem | undefined => AGENT_ITEMS_BY_ID.get(id);
