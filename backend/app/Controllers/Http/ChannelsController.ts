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

    public async addMember({ request, auth, params }: HttpContextContract) {
        const { userId } = request.only(['userId'])

        console.log(userId)

        const user = auth.user!

        const channel = await Channel.findOrFail(params.channelId)

        if (channel.ownerId !== user.id) {
            return { error: 'You are not the owner of the channel' }
        }

        const existingMember = await ChannelMember.query()
            .where('channelId', channel.id)
            .where('userId', userId)
            .first()
        
        if (existingMember) {
            return { message: 'User is already a member of the channel' }
        }

        const newMember = await ChannelMember.create({
            channelId: channel.id,
            userId
        })

        return { message: 'User added to the channel', member: newMember }
    }
}
