import User from 'App/Models/User'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import PushSubscription from 'App/Models/PushSubscription';

const webpush = require('web-push');

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;



export default class PushController {
 
  
  public async subscribe({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    const body = JSON.parse(request.body().body);
    console.log(body);

    await PushSubscription.create({userId:user.id, endPoint:body.endpoint, p256dh:body.keys.p256dh, auth:body.keys.auth});

  }
  
  public async test({ auth, request, response }: HttpContextContract) {
    const user = auth.user!
    console.log(publicVapidKey);
    console.log(privateVapidKey);

    webpush.setVapidDetails(
      process.env.PUSH_MAILTO,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    const subObjs = (await PushSubscription.query().where("user_id", user.id).select());
  
    for(let subObj of subObjs)
    {
      try
      {
        const subscription = {endpoint:subObj.endPoint, keys:{p256dh:subObj.p256dh, auth:subObj.auth}};
        const payload = JSON.stringify({ title: 'Hello!', body: 'This is a push notificat ion', url: '/' });

        await webpush.sendNotification(subscription, payload)
      }catch(err:any)
      {
        await subObj.delete();
      }
    }
  
    

  }
  
  
}
