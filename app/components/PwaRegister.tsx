"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Registers the service worker and offers a gentle update that keeps
 * localStorage collection progress intact.
 */
export function PwaRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let cancelled = false;
    let pollId = 0;

    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        if (cancelled) return;

        const activateWaiting = (worker: ServiceWorker | null | undefined) => {
          if (!worker) return;
          worker.postMessage({ type: "SKIP_WAITING" });
        };

        const noteUpdate = (worker: ServiceWorker | null | undefined) => {
          if (!worker) return;
          setWaitingWorker(worker);
          setUpdateReady(true);
        };

        // First visit: activate immediately so offline cache engages
        if (reg.waiting && !navigator.serviceWorker.controller) {
          activateWaiting(reg.waiting);
        } else if (reg.waiting && navigator.serviceWorker.controller) {
          noteUpdate(reg.waiting);
        }

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state !== "installed") return;
            if (navigator.serviceWorker.controller) {
              noteUpdate(reg.waiting || installing);
            } else {
              activateWaiting(reg.waiting || installing);
            }
          });
        });

        pollId = window.setInterval(() => {
          void reg.update();
        }, 60 * 60 * 1000);
      })
      .catch(() => {
        /* optional on unsupported hosts */
      });

    return () => {
      cancelled = true;
      if (pollId) window.clearInterval(pollId);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      setUpdateReady(false);
      return;
    }
    window.location.reload();
  }, [waitingWorker]);

  if (!updateReady) return null;

  return (
    <div className="pwa-update-banner" role="status">
      <p>
        A new garden version is ready. Aria&apos;s friends stay saved.
        <br />
        <span>Hay una versión nueva. Los amigos de Aria se guardan.</span>
      </p>
      <button type="button" className="play mini" onClick={applyUpdate}>
        Update • Actualizar
      </button>
    </div>
  );
}
