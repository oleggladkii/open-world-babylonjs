/* eslint-disable no-console */

import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  onNeedRefresh() {
    console.log("New content is available; please refresh.");
  },
  onOfflineReady() {
    console.log("App ready to work offline");
  },
  onRegistered(r: ServiceWorkerRegistration | undefined) {
    console.log("Service worker has been registered.", r);
  },
  onRegisterError(error: any) {
    console.error("Error during service worker registration:", error);
  },
});

// Optional: expose updateSW globally for manual updates
(window as any).updateSW = updateSW;
