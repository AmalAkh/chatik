/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope &
  typeof globalThis & { skipWaiting: () => void };

import { clientsClaim } from 'workbox-core';
import {
  precacheAndRoute,
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
} from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

void self.skipWaiting();
void clientsClaim();

// Use with precache injection

void precacheAndRoute(self.__WB_MANIFEST);

void cleanupOutdatedCaches();

self.addEventListener("push", (event:PushEvent) => {
   
 console.log('Push received:', event);

  const options = {
    body: "test",
    icon:"./images/badge-icon.png",
    data: "/" // Optional: URL to open on click
  };

  event.waitUntil(
  self.registration.showNotification("title", options)
  );
})
// Non-SSR fallbacks to index.html
// Production SSR fallbacks to offline.html (except for dev)
if (process.env.MODE !== 'ssr' || process.env.PROD) {
  registerRoute(
    new NavigationRoute(
      createHandlerBoundToURL(process.env.PWA_FALLBACK_HTML),
      {
        denylist: [
          new RegExp(process.env.PWA_SERVICE_WORKER_REGEX),
          /workbox-(.)*\.js$/,
        ],
      }
    )
  );
}
