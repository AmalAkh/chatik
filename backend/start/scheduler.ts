import Scheduler from '@ioc:Adonis/Addons/Scheduler'
import Channel from 'App/Models/Channel';

import { DateTime } from 'luxon'

export async function removeInactiveChannels(days = 30) {
  const threshold = DateTime.now().minus({ days }).toSQL()


  console.log("Check")
  await Channel.query()
    .where((query) => {
      // 1. Channel created more than 30 days ago OR has no messages
      query
        .where('created_at', '<', threshold)
        .whereNotExists((messagesQuery) => {
          messagesQuery
            .from('messages')
            .whereRaw('messages.channel_id = channels.id')
        })
    })
    .orWhere((query) => {
      // 2. Last message older than 30 days
      query.whereHas('lastMessage', (msgQuery) => {
        msgQuery.where('created_at', '<', threshold)
      })
    })
    .delete()
}


Scheduler.call(removeInactiveChannels).everySeconds(30);

