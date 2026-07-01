"use client";

import { useEffect, useState } from "react";

/**
 * Registers the app-shell service worker so the app opens fast and offline, and
 * surfaces a "tap to reload" prompt when a new build is ready. Without this,
 * installed iOS home-screen apps can get stranded on an old cached build.
 */
export function RegisterSW() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // When the freshly-activated worker takes control, reload once so the page
    // is running the new build. Guarded so it can't loop.
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // An update may already be installed and waiting from a prior visit.
          if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);

          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              // "installed" + an existing controller == an update is ready.
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                setWaiting(reg.waiting ?? installing);
              }
            });
          });
        })
        .catch(() => {
          /* registration is best-effort */
        });
    };
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waiting) return null;

  return (
    <button
      className="cal-sw-update"
      onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}
    >
      Update available — tap to reload
    </button>
  );
}
