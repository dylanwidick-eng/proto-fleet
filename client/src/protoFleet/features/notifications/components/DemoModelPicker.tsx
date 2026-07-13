import { useState } from "react";
import clsx from "clsx";

import {
  NOTIFICATION_MODELS,
  setNotificationModel,
  useNotificationModel,
} from "@/protoFleet/features/notifications/lib/demoModel";

const DEMO_FLAG_KEY = "protoFleet:demoMode";

const readDemoFlag = (): boolean => {
  if (typeof window === "undefined") return false;
  if (import.meta.env.VITE_DEMO_MODE === "1") return true;
  if (import.meta.env.DEV && ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)) return true;
  if (new URLSearchParams(window.location.search).get("demoMode") === "1") {
    window.localStorage.setItem(DEMO_FLAG_KEY, "1");
    return true;
  }
  return window.localStorage.getItem(DEMO_FLAG_KEY) === "1";
};

const DemoModelPicker = () => {
  const current = useNotificationModel();
  const [open, setOpen] = useState(false);
  const [enabled] = useState(() => readDemoFlag());

  if (!enabled) return null;

  const currentMeta = NOTIFICATION_MODELS.find((m) => m.id === current) ?? NOTIFICATION_MODELS[0];

  return (
    <div className="fixed bottom-4 left-4 z-60">
      {open ? (
        <div className="flex w-72 flex-col gap-1 rounded-2xl border border-surface-10 bg-surface-elevated-base p-3 shadow-300">
          <div className="flex items-center justify-between pb-1">
            <span className="text-100 font-medium tracking-wider text-text-primary-50 uppercase">
              Notification model
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-200 text-text-primary-50 hover:text-text-primary"
            >
              Close
            </button>
          </div>
          {NOTIFICATION_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setNotificationModel(m.id)}
              className={clsx(
                "flex flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors",
                m.id === current ? "bg-core-primary-5" : "hover:bg-surface-5",
              )}
            >
              <span
                className={clsx("text-200 font-medium", m.id === current ? "text-text-primary" : "text-text-primary")}
              >
                {m.label}
              </span>
              <span className="text-100 text-text-primary-50">{m.description}</span>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-core-primary-fill px-3 py-1.5 text-200 font-medium text-text-contrast shadow-300 hover:opacity-80"
          title="Demo: switch notification model"
        >
          Model: {currentMeta.label.split(" · ")[0]}
        </button>
      )}
    </div>
  );
};

export default DemoModelPicker;
