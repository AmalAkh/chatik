import { urlBase64ToUint8Array } from "./util-functions";
import { api } from "src/boot/axios";

export const publicVapidKey = 'BLaWyas9eRqCcHTzs5k0UXySsPFZBjk5oXKjm70NmFxEcdyrxbIj2dRxgFdZxn7cMG9FmyOSKbnFvjtF9Yc3TK0';

export class PushNotificationsManager
{
    static async subscribeUser() {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        console.log('Push subscription:', subscription);
        if(!subscription)
        {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true, // Always show notifications
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            // Send subscription to your server
            console.log(await api.post('/push/subscribe', {
            
                body: JSON.stringify(subscription),
                headers: { 'Content-Type': 'application/json' },
            }));
        }
        
    }
    static async unsubscribeUser(backendUnsubscribe=true) {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if(subscription)
        {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true, // Always show notifications
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
            console.log('Push subscription:', subscription);
            const unsubscribed = await subscription.unsubscribe();
            console.log(unsubscribed);
        
        if (backendUnsubscribe){
            await api.post('/push/unsubscribe', {
            
                body: JSON.stringify(subscription),
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }
    
}
}