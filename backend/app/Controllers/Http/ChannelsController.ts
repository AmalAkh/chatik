import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Channel from 'App/Models/Channel'
import ChannelMember from 'App/Models/ChannelMember'

export default class ChannelsController {
    public async index({ auth }: HttpContextContract) {
        const user = auth.user!
        const channels = await Channel.query()
            .whereHas('members', (q) => q.where('user_id', user.id))
        return channels
    }

    public async create({ request, auth }: HttpContextContract) {
        const { name, isPrivate } = request.only(['name', 'isPrivate'])
        const user = auth.user!

        const channel = await Channel.create({
            name,
            isPrivate,
            ownerId: user.id,
        })

        await ChannelMember.create({
            channelId: channel.id,
            userId: user.id,
        })

        return channel
    }
}
