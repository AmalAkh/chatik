import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ChannelMember from 'App/Models/ChannelMember'
import Message from 'App/Models/ChannelMessage'


export default class MessagesController {

    public async index({ request, auth, params, response }: HttpContextContract) {
        const offset = request.input('offset', 0)
        const maxCreatedAt = request.input('maxCreatedAt', null)

        const membership = await ChannelMember.query().where('channel_id', params.channelId).where('user_id', auth.user!.id)
        if (!membership.length) return response.unauthorized({ error: 'You are not a member of this channel.' })

        let base = Message.query().where('channel_id', params.channelId)
        if (maxCreatedAt) base = base.where('date', '<=', maxCreatedAt)

        const totalMessages = await base.clone().count('* as total')
        const messages = await base.preload('sender', q => q.select('nickname')).orderBy('id', 'desc').offset(offset).limit(20)

        return {
            total: totalMessages[0].$extras.total,
            messages: messages.reverse(),
        }
    }

    public async create({ request, auth, params }: HttpContextContract) {
        const { text } = request.only(['text'])
        const user = auth.user!
        const userId = user.id;
        let message = await Message.create({ text, channelId: params.channelId, userId })
        await message.refresh()
        await message.load('sender', (query) => {
            query.select('nickname')
        })
        return message;

    }



}
