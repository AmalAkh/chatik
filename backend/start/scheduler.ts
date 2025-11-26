import Scheduler from '@ioc:Adonis/Addons/Scheduler'
import Channel from 'App/Models/Channel';

import { DateTime } from 'luxon'


export async function removeInactiveChannels(days = 30) {
  const threshold = DateTime.now().minus({ days }).toSQL()

  console.log("Checking for inactive channels...")

  const channels = await Channel.query()
    .where((query) => {
      // Channels older than 30 days AND no messages
      query
        .where('created_at', '<', threshold)
        .whereNotExists((messagesQuery) => {
          messagesQuery
            .from('messages')
            .whereRaw('messages.channel_id = channels.id')
        })
    })
    .orWhere((query) => {
      // Channels with last message older than 30 days
      query.whereHas('lastMessage', (msgQuery) => {
        msgQuery.where('date', '<', threshold)
      })
    })

  console.log(`Found ${channels.length} channels to delete`)

  await Promise.all(channels.map((channel) => channel.delete()))
}



Scheduler.call(removeInactiveChannels).everySeconds(5);

