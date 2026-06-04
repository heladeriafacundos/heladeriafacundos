"use client";

import { useEffect } from "react";

const DESKTOP_PWA_CLEANUP_KEY = "caja-desktop-pwa-cleanup-v1";

export function PwaRegister() {
  useEffect(() => {
    const desktopBridge = (
      window as Window & { cajaDesktop?: { isElectron?: boolean } }
    ).cajaDesktop;
    const isElectronDesktop = Boolean(desktopBridge?.isElectron);

    if (!("serviceWorker" in navigator)) return;

    if (isElectronDesktop) {
      if (window.localStorage.getItem(DESKTOP_PWA_CLEANUP_KEY)) {
        return;
      }

      const cleanupServiceWorkers = navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          Promise.all(registrations.map((registration) => registration.unregister())),
        );

      const cleanupCaches =
        "caches" in window
          ? window.caches
              .keys()
              .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))))
          : Promise.resolve();

      Promise.all([cleanupServiceWorkers, cleanupCaches])
        .then(() => {
          window.localStorage.setItem(DESKTOP_PWA_CLEANUP_KEY, "1");
        })
        .catch(() => undefined);

      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // La app sigue funcionando aunque el navegador bloquee el service worker.
    });
  }, []);

  return null;
}
