import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Channel from 'App/Models/Channel'
import ChannelMember from 'App/Models/ChannelMember'

export default class ChannelsController {
    public async index({ auth }: HttpContextContract) {
        const user = auth.user!
        const channels = await Channel.query()
            .whereHas('members', (q) => q.where('user_id', user.id))
            .preload('lastMessage', (q) =>
                q.preload('sender', (s) => s.select(['nickname']))
            )
            .select(['id', 'name', 'is_private', 'owner_id'])

        return channels.map((channel) => ({
            ...channel.serialize(),
            lastMessage: channel.lastMessage || null,
        }))
    }

    public async leave({ auth, params, response }: HttpContextContract) {
        const user = auth.user!
        const channel = await Channel.findOrFail(params.channelId)

        if (channel.owner_id === user.id) {
            return response.status(403).json({
                error: 'Owner cannot leave their own channel. You can delete it instead.',
            })
        }

        const member = await ChannelMember
            .query()
            .where('channelId', channel.id)
            .where('userId', user.id)
            .first()

        if (!member) {
            return { message: 'You are not a member of this channel' }
        }

        await member.delete()
        return { message: 'You have left the channel' }
    }

    public async create({ request, auth, response }: HttpContextContract) {
        try {
            const { name, isPrivate } = request.only(['name', 'isPrivate'])
            const user = auth.user!

            let channel = await Channel.query().where('name', name).first()

            if (channel) {
                if (channel.is_private) {
                    return response.status(403).json({
                        error: 'This channel is private. You cannot join it directly.',
                    })
                }

                const existingMember = await ChannelMember.query()
                    .where('channelId', channel.id)
                    .where('userId', user.id)
                    .first()

                if (existingMember) {
                    return response.json({
                        message: 'You are already a member of this channel',
                        channel,
                    })
                }

                await ChannelMember.create({
                    channelId: channel.id,
                    userId: user.id,
                })

                return response.json({
                    message: 'Joined existing channel',
                    channel,
                })
            }

            channel = await Channel.create({
                name,
                is_private: isPrivate,
                owner_id: user.id,
            })

            await ChannelMember.create({
                channelId: channel.id,
                userId: user.id,
            })

            return response.json({
                message: 'Channel created',
                channel,
            })
        } catch (error) {
            console.error('Error creating/joining channel:', error)
            return response.status(500).json({ error: error.message })
        }
    }


    public async invite({ request, auth, params }: HttpContextContract) {
        const { userId } = request.only(['userId'])

        const user = auth.user!

        const channel = await Channel.findOrFail(params.channelId)

        if (channel.owner_id !== user.id) {
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

    public async kick({ request, auth, params }: HttpContextContract) {
        const { userId } = request.only(['userId'])

        const user = auth.user!

        const channel = await Channel.findOrFail(params.channelId)

        if (channel.is_private && channel.owner_id !== user.id) {
            return { error: 'Only the owner can remove members from a private channel' }
        }

        const memberToRemove = await ChannelMember.query()
            .where('channelId', channel.id)
            .where('userId', userId)
            .first()

        if (!memberToRemove) {
            return { message: 'User is not a member of the channel' }
        }

        await memberToRemove.delete()

        return { message: 'User removed from the channel' }
    }

    public async show({ params }: HttpContextContract) {
        const channel = await Channel.query()
            .where('id', params.channelId)
            .preload('members', (membersQuery) => {
                membersQuery.preload('user', (userQuery) => {
                    userQuery.select(['id', 'nickname', 'email', 'status'])
                })
            })
            .firstOrFail()

        const channelInfo = {
            id: channel.id,
            name: channel.name,
            isPrivate: channel.is_private,
            ownerId: channel.owner_id,
            members: channel.members.map((member) => ({
                id: member.user.id,
                nickname: member.user.nickname,
                email: member.user.email,
                status: member.user.status,
            })),
        }

        return channelInfo
    }



    public async destroy({ params, auth }: HttpContextContract) {
        const user = auth.user!

        const channel = await Channel.findOrFail(params.channelId)

        if (channel.owner_id !== user.id) {
            return { error: 'You are not the owner of this channel' }
        }

        await channel.delete()

        return { message: 'Channel deleted successfully' }
    }

}
