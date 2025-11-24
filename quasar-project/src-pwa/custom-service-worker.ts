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
    const data = event?.data?.json();
    if(userStatus == 'dnd' || userStatus == "offline")
    {
      console.log("Push wont be shown - users status");

      return;
    }
    console.log(userStatus);
    if(isAppVisible)
    {
      
      if(onlyPersonalMessages && !data.body.includes(`@${nickname}`))
      {
        return; 
      }
      void self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: "notification", data: data});
        });
      });
    }else
    { 
      if(onlyPersonalMessages && !data.body.includes(`@${nickname}`))
      {
        return; 
      }
      console.log("Push is to be shown");
      const options = {
        body:data.body,
        icon:"./icons/favicon-96x96.png",
        badge:"./icons/favicon-96x96.png",
        data: "/" // Optional: URL to open on click
      };

      event.waitUntil(
      self.registration.showNotification(data.title, options)
      );
    }
    
})

let isAppVisible = true;
let userStatus = 'online';
let onlyPersonalMessages = false;
let nickname = "";

self.addEventListener("message", event => {

  const message = event.data;
  if(message.type == "app_visibility")
  {
    isAppVisible = message.data;
    
  }else if(message.type == "user_status")
  {
    userStatus = message.data;
   
  }
  else if(message.type == "only_personal_messages")
  {
    onlyPersonalMessages = message.data;
   
  }
  else if(message.type == "user_nickname")
  {
    nickname = message.data;
    console.log(nickname);
  }
});
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
