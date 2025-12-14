import { ref, reactive, nextTick, type Ref } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { api } from 'boot/axios'
import type { Channel, ChannelMessage, User, UserStatus } from 'src/models'
import type { QNotifyCreateOptions } from 'quasar'

type AnyRecord = Record<string, any>

type TypingUsersMap = Record<number, Record<string, string> | undefined>

type UseChatSocketOptions = {
    url: string
    token: () => string | null
    myId: number

    userStatus: Ref<'online' | 'dnd' | 'offline'>

    channels: Ref<Channel[]>
    currentChannel: Ref<Channel | undefined>
    messages: Ref<ChannelMessage[]>
    typingUsers: TypingUsersMap
    channelMembers: Ref<User[]>

    loadChannels: () => Promise<void>

    showError: (err: any) => void
    notify: (o: QNotifyCreateOptions) => void
    onAuthRedirect: () => void

    scrollToBottom: () => void
}

export function useChatSocket(opts: UseChatSocketOptions) {
    const socket = ref<Socket | null>(null)

    function convertMessageDate(msg: any) {
        if (msg?.date) msg.date = new Date(msg.date)
    }

    function ensureTypingBucket(channelId: number) {
        if (!opts.typingUsers[channelId]) {
            opts.typingUsers[channelId] = reactive({})
        }
    }


    function initSocketOnce() {
        if (socket.value) return

        socket.value = io(opts.url, {
            autoConnect: false,
            extraHeaders: {
                Authorization: `Bearer ${opts.token() ?? ''}`,
            },
        })

        socket.value.on('connect', async () => {
            try {
                if (opts.userStatus.value === 'online') {
                    await opts.loadChannels()

                    if (opts.currentChannel.value) {
                        const chId = opts.currentChannel.value.id
                        const newMessages = await api.get(`/messages/${chId}?offset=0`)
                        opts.messages.value.splice(
                            0,
                            opts.messages.value.length,
                            ...(newMessages.data.messages ?? [])
                        )

                        opts.messages.value.forEach((m: any) => convertMessageDate(m))

                        await nextTick()
                        setTimeout(() => opts.scrollToBottom(), 150)
                    }
                }
            } catch (err) {
                opts.showError(err)
            }
        })

        socket.value.on('disconnect', (reason: any) => {
            console.log('Disconnected:', reason)
        })

        socket.value.on('connect_error', (err: any) => {
            opts.showError(err)
            opts.onAuthRedirect()
        })


        socket.value.on('new_message', async (msg: ChannelMessage) => {
            if ((msg as any).userId?.toString() === opts.myId.toString()) return

            convertMessageDate(msg)

            if ((msg as any).channelId === opts.currentChannel.value?.id) {
                ; (msg as any).local = false
                opts.messages.value.push(msg)
                await nextTick()
                opts.scrollToBottom()
            }

            const targetChannel = opts.channels.value.find(c => c.id === (msg as any).channelId)
            if (targetChannel) (targetChannel as any).lastMessage = msg

            if (opts.userStatus.value === 'dnd') return

        })

        socket.value.on('user_status_changed', (data: { userId: number; status: UserStatus }) => {
            const member = opts.channelMembers.value.find(m => m.id === data.userId)
            if (member) member.status = data.status
        })

        socket.value.on('invited_to_channel', (channel: AnyRecord) => {
            opts.channels.value = opts.channels.value.filter(c => c.id !== channel.id)

            opts.channels.value.unshift({
                ...channel,
                isPrivate: channel.isPrivate ?? false,
                ownerId: channel.ownerId ?? 0,
                lastMessage: channel.lastMessage
                    ? {
                        ...channel.lastMessage,
                        date: new Date(channel.lastMessage.date),
                    }
                    : null,
            } as any)

            opts.notify({
                type: 'info',
                message: `You were added to channel "${channel.name}"`,
                position: 'top',
            })
        })

        socket.value.on('channel_deleted', async (data: { channelId: number }) => {
            opts.channels.value = opts.channels.value.filter(c => c.id !== data.channelId)

            if (opts.currentChannel.value?.id === data.channelId) {
                opts.currentChannel.value = undefined
                opts.messages.value = []
                opts.notify({
                    type: 'warning',
                    message: 'Channel was deleted by owner',
                    position: 'top',
                })
            }

            await opts.loadChannels()
        })

        socket.value.on('typing', (msg) => {
            const { channelId, text, user } = msg
            ensureTypingBucket(channelId)

            const bucket = opts.typingUsers[channelId]!
            if (text.trim() === '') delete bucket[user.nickname]
            else bucket[user.nickname] = text
        })

    }

    async function connectSocket(): Promise<void> {
        initSocketOnce()
        if (!socket.value) return
        if (socket.value.connected) return

        socket.value.io.opts.extraHeaders = {
            Authorization: `Bearer ${opts.token() ?? ''}`,
        }

        socket.value.connect()

        await new Promise<void>((resolve) => {
            socket.value?.once('connect', () => resolve())
        })
    }

    function disconnectSocket() {
        if (!socket.value) return
        if (socket.value.connected) socket.value.disconnect()
    }

    function joinChannel(channelId: number) {
        socket.value?.emit('join_channel', { channelId })
    }

    function emitTyping(channelId: number, text: string) {
        socket.value?.emit('typing', { channelId, text })
    }

    function emitNewMessage(msg: ChannelMessage) {
        socket.value?.emit('new_message', msg)
    }

    return {
        socket,
        connectSocket,
        disconnectSocket,
        joinChannel,
        emitTyping,
        emitNewMessage,
    }
}
