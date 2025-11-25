import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Channel from 'App/Models/Channel'
import ChannelMember from 'App/Models/ChannelMember'
import ChannelBan from 'App/Models/ChannelBan'
import Ws from 'App/Services/Ws'

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

        const channel = await Channel.find(params.channelId)
        if (!channel) {
            return response.status(404).json({ error: 'Channel not found' })
        }

        if (channel.owner_id === user.id) {
            await channel.delete()
            Ws.io.to(`channel:${channel.id}`).emit('channel_deleted', {
                channelId: channel.id
            })
            return response.json({ message: 'Channel deleted because the owner left' })
        }

        const member = await ChannelMember
            .query()
            .where('channelId', channel.id)
            .where('userId', user.id)
            .first()

        if (!member) {
            return response.status(403).json({
                error: 'You are not a member of this channel',
            })
        }

        await member.delete()
        return response.json({ message: 'You have left the channel' })
    }


    public async create({ request, auth, response }: HttpContextContract) {
        try {
            const { name, isPrivate } = request.only(['name', 'isPrivate'])
            const user = auth.user!

            let channel = await Channel.query().where('name', name).first()

            if (channel) {
                const ban = await ChannelBan
                    .query()
                    .where('channel_id', channel.id)
                    .where('user_id', user.id)
                    .first()

                if (ban) {
                    return response.status(403).json({
                        error: 'You cannot join this channel because you are banned.'
                    })
                }
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


    public async invite({ request, auth, params, response }: HttpContextContract) {
        const { userId } = request.only(['userId'])
        const user = auth.user!
        const channel = await Channel.findOrFail(params.channelId)

        if (channel.is_private && channel.owner_id !== user.id) {
            return response.status(403).json({
                error: 'Only the owner can invite members to a private channel',
            })
        }

        const member = await ChannelMember
            .query()
            .where('channelId', channel.id)
            .where('userId', user.id)
            .first()

        if (!member) {
            return response.status(403).json({
                error: 'You are not a member of this channel',
            })
        }

        const existingMember = await ChannelMember
            .query()
            .where('channelId', channel.id)
            .where('userId', userId)
            .first()

        if (existingMember) {
            return { message: 'User is already a member of the channel' }
        }

        const ban = await ChannelBan.query()
            .where('channel_id', channel.id)
            .where('user_id', userId)
            .first()

        if (ban) {
            if (user.id !== channel.owner_id) {
                return response.status(403).json({
                    error: 'This user is banned from this channel and can only be invited by the owner.'
                })
            }
            await ban.delete()
        }

        const newMember = await ChannelMember.create({
            channelId: channel.id,
            userId,
        })

        Ws.io.to(`user:${userId}`).emit('invited_to_channel', {
            id: channel.id,
            name: channel.name,
            isPrivate: channel.is_private,
            ownerId: channel.owner_id,
            lastMessage: await channel
                .related('lastMessage')
                .query()
                .preload('sender', q => q.select(['nickname']))
                .first(),
        })

        Ws.io.to(`user:${userId}`).socketsJoin(`channel:${channel.id}`)

        return { message: 'User added to the channel', member: newMember }
    }



    public async kick({ request, auth, params, response }: HttpContextContract) {
        const { userId } = request.only(['userId'])
        const user = auth.user!
        const channel = await Channel.findOrFail(params.channelId)

        if (!userId) {
            return response.status(400).json({ error: 'Missing userId' })
        }


        if (userId === channel.owner_id) {
            return response.status(403).json({
                error: "You cannot remove the channel owner."
            })
        }

        const memberToKick = await ChannelMember
            .query()
            .where('channel_id', channel.id)
            .where('user_id', userId)
            .first()

        if (!memberToKick) {
            return response.status(404).json({ error: 'User is not in the channel' })
        }

        if (channel.owner_id === user.id) {
            let ban = await ChannelBan.query()
                .where('channel_id', channel.id)
                .where('user_id', userId)
                .first()

            if (!ban) {
                ban = await ChannelBan.create({
                    channelId: channel.id,
                    userId,
                    votes: 3,
                    permanent: true,
                })
            } else {
                ban.permanent = true
                ban.votes = 3
                await ban.save()
            }

            await memberToKick.delete()

            return { message: 'User permanently banned by owner' }
        }

        if (channel.is_private) {
            return response.status(403).json({ error: 'Only the owner can kick in a private channel' })
        }

        let ban = await ChannelBan.query()
            .where('channel_id', channel.id)
            .where('user_id', userId)
            .first()

        if (!ban) {
            ban = await ChannelBan.create({
                channelId: channel.id,
                userId,
                votes: 1,
            })
        } else {
            ban.votes += 1
            await ban.save()
        }

        if (ban.votes >= 3) {
            await memberToKick.delete()
            return { message: 'User has been banned from this channel (3 votes reached)' }
        }

        return { message: `Kick vote added (${ban.votes}/3)` }
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



    public async destroy({ params, auth, response }: HttpContextContract) {
        const user = auth.user!

        const channel = await Channel.find(params.channelId)
        if (!channel) {
            return response.status(404).json({ error: 'Channel not found' })
        }

        if (channel.owner_id !== user.id) {
            return response.status(403).json({ error: 'You are not the owner of this channel' })
        }

        const channelId = channel.id

        await channel.delete()

        Ws.io.to(`channel:${channelId}`).emit('channel_deleted', { channelId })

        return response.json({ message: 'Channel deleted successfully' })
    }



}
