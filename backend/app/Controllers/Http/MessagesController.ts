import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Channel from 'App/Models/Channel'
import Message from 'App/Models/ChannelMessage'


export default class MessagesController {

    public async index({ request, auth, params }: HttpContextContract) {

        let messages = await Message.query().where("channel_id", params.channelId);
      
        return messages;
        
    }
    public async create({ request, auth, params }: HttpContextContract) {
        const { text } = request.only(['text'])
        const user = auth.user!
        const userId = user.id;
        let message = await Message.create({text, channelId:params.channelId , userId })

        return message;
        
    }

    

}
