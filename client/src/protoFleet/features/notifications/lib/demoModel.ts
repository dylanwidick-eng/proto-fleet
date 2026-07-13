import { useSyncExternalStore } from "react";

export type NotificationModel = "m1" | "m2" | "m3";

export const NOTIFICATION_MODELS: { id: NotificationModel; label: string; description: string }[] = [
  { id: "m1", label: "M1 · Unified feed", description: "Notifications as a type of activity, filterable." },
  { id: "m2", label: "M2 · Bell modal", description: "Modal opened from the bell with recent notifications." },
  { id: "m3", label: "M3 · Own top-level tab", description: "Notifications as a dedicated nav destination." },
];

const STORAGE_KEY = "protoFleet:demoNotificationModel";
const EXPLICIT_SELECTION_KEY = "protoFleet:demoNotificationModel:explicitSelection";
const DEFAULT_MODEL: NotificationModel = "m2";

// Legacy migration: an older picker numbered Bell modal as "m3" and Own tab as "m4".
const LEGACY_MAP: Record<string, NotificationModel> = {
  m3_legacy: "m2",
  m4_legacy: "m3",
};

const isModel = (v: string | null): v is NotificationModel => v === "m1" || v === "m2" || v === "m3";

const listeners = new Set<() => void>();

function read(): NotificationModel {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (isModel(v)) {
    // Older local sessions inherited m1 from the original default. Keep m1
    // available, but only after someone explicitly selects it in the picker.
    if (v === "m1" && window.localStorage.getItem(EXPLICIT_SELECTION_KEY) !== "1") return DEFAULT_MODEL;
    return v;
  }
  // Migrate legacy values written under the old numbering.
  if (v === "m3") return LEGACY_MAP.m3_legacy;
  if (v === "m4") return LEGACY_MAP.m4_legacy;
  return DEFAULT_MODEL;
}

export function setNotificationModel(next: NotificationModel) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, next);
  window.localStorage.setItem(EXPLICIT_SELECTION_KEY, "1");
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNotificationModel(): NotificationModel {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_MODEL);
}
