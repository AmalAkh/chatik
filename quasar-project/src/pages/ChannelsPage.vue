<template>
    <q-page style="min-height:100%">
        <q-splitter v-model="splitterModel" class="full-height" :disable="splitterDisabled" unit="%" :limits="[0, 100]">
            <!-- left panel with channels -->
            <template v-slot:before>
                <div class="channels-area">
                    <div class="status-area row justify-center items-center q-mt-sm ">
                        <q-btn-toggle v-model="userStatus" no-caps rounded unelevated toggle-color="blue"
                            color="blue-grey-1" text-color="primary" @update:model-value="updateStatus" :options="[
                                { label: 'Online', value: 'online' },
                                { label: 'DND', value: 'dnd' },
                                { label: 'Offline', value: 'offline' }
                            ]" />
                    </div>

                    <!-- header with create button -->
                    <div class="row justify-center items-center q-mt-sm">
                        <q-btn flat round color="primary" icon="add_circle" @click="showCreateDialog = true" />
                        <span class="text-subtitle2">Channels</span>
                    </div>

                    <!-- search bar -->
                    <q-input v-model="newMessage" dense>
                        <template v-slot:prepend>
                            <q-icon name="search" style="margin: 10px;" />
                        </template>
                        <template v-slot:append>
                            <q-icon name="close" style="margin: 10px;" class="cursor-pointer" />
                        </template>
                    </q-input>

                    <!-- channels list -->
                    <q-scroll-area class="channels-scrollable-area" style="height: 100%;">
                        <channel-item v-for="channel in sortedChannels" :key="channel.id"
                            :last-message="channel.lastMessage"
                            :name="channel.isPrivate ? channel.name + ' 🔒' : channel.name"
                            :class="{ selected: channel.id == currentChannel?.id }" @click="openChannel(channel)" />
                    </q-scroll-area>
                </div>
            </template>

            <!-- right panel with chat -->
            <template v-slot:after>
                <div class="flex full-height chat-view">
                    <div class="chat-top-area">

                        <q-btn class="back-button" v-show="splitterDisabled" flat round color="primary" size="md"
                            icon="arrow_back" @click="splitterModel = 100" />
                        <img class="q-message-avatar q-message-avatar--sent"
                            src="https://cdn.quasar.dev/img/avatar4.jpg" aria-hidden="true" />
                        <div class="channel-title">
                            <p>{{ currentChannel?.name }}</p>
                            <div class="typing-users-area" v-show="isAnybodyTyping">
                                <p class="typing-user fk">Typing:</p>
                                <p class="typing-user" v-for="(user, index) in typingUsers[currentChannel?.id!]"
                                    @click="showRealtimeTypingDialog(index)" :key="index">{{ index }}</p>

                            </div>
                        </div>
                        <q-btn outline round color="primary" size="md" icon="info"
                            @click="() => { showMembersDialog = true; loadChannelMembers(); }" />

                    </div>

                    <!-- chat messages -->
                    <q-scroll-area class="chat-scroll-area no-scrollbar" ref="chatMessagesScrollArea">
                        <q-infinite-scroll v-if="currentChannel" @load="loadMoreMessages"
                            ref="chatMessagesInfiniteScroll" reverse>
                            <template v-slot:loading>
                                <div class="row justify-center q-my-md">
                                    <q-spinner-dots color="primary" size="40px" />
                                </div>
                            </template>
                            <q-chat-message v-for="message in messages" :name="message.sender?.nickname || 'User'"
                                avatar="https://cdn.quasar.dev/img/avatar4.jpg" :text="[message.text]"
                                :sent="message.local" :key="message.id.toString() + message.userId.toString()"
                                :stamp="message.date.toString()" />
                        </q-infinite-scroll>
                    </q-scroll-area>

                    <!-- input area -->
                    <div class="bottom-message-area flex">
                        <q-btn flat round color="primary" icon="attach_file" />
                        <q-input class="new-message-input" filled v-model="newMessage"
                            @update:model-value="typingMessage" placeholder="Message" />
                        <q-btn flat round color="primary" icon="send" @click="sendMessage" />
                    </div>
                </div>
            </template>
        </q-splitter>

        <!-- dialog for viewing channel members -->
        <q-dialog v-model="showMembersDialog">
            <q-card style="min-width: 350px; max-height: 80vh;">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6">Channel members</div>
                    <q-btn flat color="negative" icon="logout" label="Leave" size="sm" @click="leaveChannel" />
                </q-card-section>

                <q-separator />
                <q-card-section class="scroll" style="max-height: 60vh; overflow-y: auto;">
                    <div v-if="channelMembers.length === 0" class="text-grey text-center q-mt-md">
                        No members yet
                    </div>
                    <q-item v-for="member in channelMembers" :key="member.id">
                        <q-item-section avatar>
                            <q-avatar>
                                <img :src="member.avatar || 'https://cdn.quasar.dev/img/avatar.png'" />
                            </q-avatar>
                        </q-item-section>

                        <q-item-section>
                            <q-item-label>{{ member.nickname }}</q-item-label>
                            <q-item-label caption>{{ member.email }}</q-item-label>
                        </q-item-section>

                        <q-item-label caption>
                            <q-badge :color="member.status === 'online'
                                ? 'positive'
                                : member.status === 'dnd'
                                    ? 'orange'
                                    : 'grey'" :label="member.status" />
                        </q-item-label>


                        <q-item-section side>
                            <template v-if="isOwner(member)">
                                <q-badge color="primary" label="Owner" />
                            </template>
                            <template v-else-if="isCurrentUser(member)">
                                <q-badge color="secondary" label="You" />
                            </template>
                            <template v-else-if="showRemoveButton(member)">
                                <q-btn flat round dense icon="remove_circle" color="negative"
                                    @click="kickMember(member.id)" />
                            </template>
                        </q-item-section>

                    </q-item>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn v-if="!currentChannel?.isPrivate || currentChannel?.ownerId === myId" flat label="Add user"
                        color="primary" @click="showInviteDialog = true" />
                    <q-btn flat label="Close" color="primary" v-close-popup />
                </q-card-actions>

            </q-card>
        </q-dialog>

        <!-- dialog for inviting user -->
        <q-dialog v-model="showInviteDialog">
            <q-card style="min-width: 350px">
                <q-card-section>
                    <div class="text-h6">Invite user by nickname</div>
                </q-card-section>

                <q-card-section>
                    <q-input v-model="inviteNickname" label="Enter nickname" autofocus @keyup.enter="inviteUser" />
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancel" v-close-popup />
                    <q-btn color="primary" label="Invite" :loading="inviteLoading" @click="inviteUser" />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- dialog for creating a channel -->
        <q-dialog v-model="showCreateDialog">
            <q-card style="min-width: 350px">
                <q-card-section>
                    <div class="text-h6">Create a new channel</div>
                </q-card-section>

                <q-card-section>
                    <q-input v-model="channelName" label="Channel name" autofocus />
                    <q-toggle v-model="isPrivate" label="Private channel" />
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancel" v-close-popup />
                    <q-btn color="primary" label="Create" @click="createChannel" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>

    <q-dialog v-model="showRealtimeTyping">
        <q-card class="real-typing-card">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">{{ selectedUserToView }} is typing:</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section>
                {{ realTimeTypedMessage }}
            </q-card-section>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, reactive } from 'vue'
import ChannelItem from 'src/components/ChannelItem.vue'
import { api } from 'boot/axios'
import { io } from "socket.io-client";
import { useRouter } from 'vue-router';
import type { Channel, ChannelMessage, User, UserStatus } from 'src/models';
import { useQuasar } from 'quasar'

const offlineCutoff = ref<string | null>(localStorage.getItem('offlineCutoff') || null)

const $q = useQuasar()
const router = useRouter()

const userStatus = ref('online')

const myId = Number(localStorage.getItem('userid'))

async function updateStatus() {
    try {
        await api.put('/user/status', { status: userStatus.value }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })

        if (userStatus.value === 'offline') {
            offlineCutoff.value = new Date().toISOString()
            localStorage.setItem('offlineCutoff', offlineCutoff.value)
            if (currentSocket.value?.connected) currentSocket.value.disconnect()
            return
        }

        if (userStatus.value === 'online') {
            offlineCutoff.value = null
            localStorage.removeItem('offlineCutoff')
            if (!currentSocket.value?.connected) {
                currentSocket.value.connect()
                await new Promise(resolve => currentSocket.value.once('connect', resolve))
            }
            await loadChannels()
            if (currentChannel.value) {
                await reloadCurrentChannel()
            }
        }
    } catch (err) {
        showError(err)
    }
}





// Notify helpers
function showError(err: any) {
    console.error('API ERROR:', err)

    const status = err?.response?.status
    const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Unknown error'

    if (status === 401) {
        if (backendMessage === 'Invalid credentials' || backendMessage === 'E_INVALID_AUTH_UID') {
            void router.push('/auth/login')
            return
        }

        $q.notify({
            type: 'negative',
            message: backendMessage || 'Unauthorized (401)',
            position: 'top',
        })
        return
    }

    if (status === 403) {
        $q.notify({
            type: 'warning',
            message: backendMessage || 'Forbidden (403)',
            position: 'top',
        })
        return
    }


    if (status === 404) {
        $q.notify({
            type: 'warning',
            message: backendMessage || 'Not found (404)',
            position: 'top',
        })
        return
    }


    $q.notify({
        type: 'negative',
        message: backendMessage,
        position: 'top',
    })
}



function showSuccess(message?: string) {
    $q.notify({
        type: 'positive',
        message: message || 'Success',
        position: 'top',
        timeout: 3000
    })
}


const splitterModel = ref(25)
const splitterDisabled = ref(false)
const newMessage = ref("")
const showCreateDialog = ref(false)
const isPrivate = ref(false)

const channels = ref<Channel[]>([])
const currentChannel = ref<Channel>()
const channelName = ref("")

const chatMessagesScrollArea = ref<any>(null)
const chatMessagesInfiniteScroll = ref<any>(null)

const showMembersDialog = ref(false)
const channelMembers = ref<User[]>([])

const showInviteDialog = ref(false)
const inviteNickname = ref("")
const inviteLoading = ref(false)

window.addEventListener("resize", () => {
    if (window.innerWidth < 1024) {
        splitterDisabled.value = true
        splitterModel.value = 100
    } else {
        splitterDisabled.value = false
        splitterModel.value = 25
    }
})

async function loadChannelMembers() {
    if (!currentChannel.value) return
    try {
        const res = await api.get(`/channels/${currentChannel.value.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        channelMembers.value = res.data.members
    } catch (err) {
        showError(err)
    }
}

async function leaveChannel() {
    if (!currentChannel.value) return

    try {
        const res = await api.post(
            `/channels/${currentChannel.value.id}/leave`,
            {},
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )

        showSuccess(res.data.message)

        channels.value = channels.value.filter(c => c.id !== currentChannel.value?.id)
        currentChannel.value = undefined
        showMembersDialog.value = false

    } catch (err) {
        showError(err)
    }
}

async function kickMember(userId: number) {
    if (!currentChannel.value) return
    try {
        const res = await api.post(
            `/channels/${currentChannel.value.id}/kick`,
            { userId },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )
        showSuccess(res.data.message)
        channelMembers.value = channelMembers.value.filter(m => m.id !== userId)
    } catch (err: any) {
        showError(err)
    }
}

function showRemoveButton(member: User): boolean {
    const channel = currentChannel.value
    if (!channel) return false

    const myId = Number(localStorage.getItem('userid'))

    if (channel.isPrivate) {
        return channel.ownerId === myId && member.id !== myId
    }

    return member.id !== channel.ownerId && member.id !== myId
}

function isOwner(member: User): boolean {
    const channel = currentChannel.value
    if (!channel) return false
    return member.id === channel.ownerId
}

function isCurrentUser(member: User): boolean {
    const myId = Number(localStorage.getItem('userid') || localStorage.getItem('userId') || 0)
    return member.id === myId
}


async function inviteUser() {
    if (!currentChannel.value || !inviteNickname.value.trim()) return
    inviteLoading.value = true
    try {
        const resUser = await api.get(`/users/by-nickname/${inviteNickname.value}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        const user = resUser.data

        await api.post(
            `/channels/${currentChannel.value.id}/invite`,
            { userId: user.id },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )

        showSuccess('User invited successfully')
        showInviteDialog.value = false
        inviteNickname.value = ""
        await loadChannelMembers()
    } catch (err: any) {
        showError(err)
    } finally {
        inviteLoading.value = false
    }
}

async function loadChannels() {
    try {
        const res = await api.get('/channels', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
        channels.value = res.data.map((channel: any) => {
            if (channel.lastMessage && channel.lastMessage.date) convertMessageDate(channel.lastMessage)
            const mapped = { ...channel, isPrivate: channel.is_private, ownerId: channel.owner_id }
            if (userStatus.value === 'offline' && offlineCutoff.value && mapped.lastMessage?.date && new Date(mapped.lastMessage.date) > new Date(offlineCutoff.value)) {
                mapped.lastMessage = null
            }
            return mapped
        })
    } catch (err) {
        showError(err)
    }
}


function convertMessageDate(msg: ChannelMessage) {
    msg.date = new Date(msg.date)
}

const sortedChannels = computed(() => {
    return [...channels.value].sort((a: Channel, b: Channel) => {
        const t1 = a.lastMessage?.date ? new Date(a.lastMessage.date).getTime() : 0
        const t2 = b.lastMessage?.date ? new Date(b.lastMessage.date).getTime() : 0
        return t2 - t1
    })
})

async function createChannel() {
    if (!channelName.value) return
    try {
        const res = await api.post(
            '/channels',
            { name: channelName.value, isPrivate: isPrivate.value },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )
        showSuccess(res.data.message)
        channelName.value = ""
        isPrivate.value = false
        showCreateDialog.value = false
        await loadChannels()
    } catch (err) {
        showError(err)
    }
}

const currentSocket = ref()
onMounted(async () => {
    await loadChannels()
    currentSocket.value = io("http://localhost:3333", {
        extraHeaders: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
    })
    currentSocket.value.on("connect", async () => {
        console.log("Connected!", currentSocket.value.id)

        if (userStatus.value === "online") {
            await loadChannels()
            if (currentChannel.value) {
                const newMessages = await api.get(`/messages/${currentChannel.value.id}?offset=0`)
                messages.value.splice(0, messages.value.length, ...newMessages.data.messages)
                await nextTick()
                setTimeout(() => {
                    chatMessagesScrollArea.value?.setScrollPercentage('vertical', 200)
                }, 150)
            }

        }
    })


    currentSocket.value.on("disconnect", (reason: any) => console.log("Disconnected:", reason))
    currentSocket.value.on("connect_error", async (err: any) => {
        showError(err)
        await router.push("/auth/login")
    })
    currentSocket.value.on("new_message", async (msg: ChannelMessage) => {
        if (msg.userId.toString() === localStorage.getItem("userid")) return

        convertMessageDate(msg)

        if (msg.channelId == currentChannel.value?.id) {
            msg.local = false
            messages.value?.push(msg)
            await nextTick()
            chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100)
        }

        const targetChannel = channels.value.find(channel => channel.id == msg.channelId)
        if (targetChannel) targetChannel.lastMessage = msg

        if (userStatus.value === 'dnd') return

        if (msg.channelId !== currentChannel.value?.id && userStatus.value === 'online') {
            $q.notify({
                type: 'info',
                message: `New message from ${msg.sender.nickname}: ${msg.text}`,
                position: 'top-right'
            })
        }

    })

    currentSocket.value.on("user_status_changed", (data: { userId: number, status: UserStatus }) => {
        const member = channelMembers.value.find(m => m.id === data.userId)
        if (member) member.status = data.status
    })

    currentSocket.value.on('invited_to_channel', (channel: any) => {
        channels.value = channels.value.filter(c => c.id !== channel.id)

        channels.value.unshift({
            ...channel,
            isPrivate: channel.isPrivate ?? false,
            ownerId: channel.ownerId ?? 0,
            lastMessage: channel.lastMessage
                ? {
                    ...channel.lastMessage,
                    date: new Date(channel.lastMessage.date),
                }
                : null,
        })

        $q.notify({
            type: 'info',
            message: `You were added to channel "${channel.name}"`,
            position: 'top',
        })
    })

    currentSocket.value.on('channel_deleted', async (data: { channelId: number }) => {
        channels.value = channels.value.filter(c => c.id !== data.channelId)

        if (currentChannel.value?.id === data.channelId) {
            currentChannel.value = undefined
            messages.value = []
            $q.notify({
                type: 'warning',
                message: 'Channel was deleted by owner',
                position: 'top'
            })
        }
        await loadChannels()
    })

    currentSocket.value.on("typing", (msg: { channelId: number, text: string, user: { nickname: string } }) => {
        const { channelId, text, user } = msg
        const nickname = user.nickname

        // Ensure the channel exists as a reactive object
        if (!typingUsers[channelId]) {
            // Important: use Vue.set or assign reactive object
            typingUsers[channelId] = reactive({})
        }


        if (text.trim() == '') {
            delete typingUsers[channelId][nickname];


        } else {
            typingUsers[channelId][nickname] = text
        }




    });


})

const messages = ref<ChannelMessage[]>([])
let totalMessagesAmount = 0
let currentOffset = 20

async function loadMessages(offset: number = 0) {
    try {
        const params: any = { offset }
        if (userStatus.value === 'offline' && offlineCutoff.value) params.maxCreatedAt = offlineCutoff.value

        const res = await api.get(`/messages/${currentChannel.value!.id}`, { params })
        messages.value = [
            ...res.data.messages.map((m: ChannelMessage) => {
                let msg = snakeToCamel(m)
                msg.local = msg.userId == localStorage.getItem("userid")
                convertMessageDate(msg)
                return msg
            }),
            ...(messages.value ?? [])
        ]
        totalMessagesAmount = res.data.total
    } catch (err) {
        showError(err)
    }
}

async function reloadCurrentChannel() {
    const params: any = { offset: 0 }
    if (userStatus.value === 'offline' && offlineCutoff.value) params.maxCreatedAt = offlineCutoff.value
    const res = await api.get(`/messages/${currentChannel.value!.id}`, { params })
    const fresh = res.data.messages.map((m: any) => {
        const msg = snakeToCamel(m)
        msg.local = msg.userId == localStorage.getItem('userid')
        convertMessageDate(msg)
        return msg
    })
    messages.value.splice(0, messages.value.length, ...fresh)
    await nextTick()
    setTimeout(() => {
        chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100)
    }, 120)
}



async function loadMoreMessages(index: any, done: any) {
    if (currentOffset < totalMessagesAmount) {
        await loadMessages(currentOffset)
        currentOffset += 20
    }
    done()
}

function snakeToCamel(obj: any): any {
    const result: any = {}
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
            result[camelKey] = obj[key]
        }
    }
    return result
}

async function openChannel(channel: Channel) {
    messages.value = []
    totalMessagesAmount = 0
    currentOffset = 20
    currentChannel.value = channel
    currentSocket.value.emit("join_channel", { channelId: channel.id })
    await loadMessages()
    await nextTick()
    setTimeout(() => {
        chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100, 10)
    }, 100)
    if (window.innerWidth < 1024) {
        splitterDisabled.value = true
        splitterModel.value = 0
    }
}

async function sendMessage() {
    const text = newMessage.value.trim()
    if (!text) return

    if (text.startsWith('/')) {
        await handleCommand(text)
        newMessage.value = ''
        typingMessage('')
        return
    }

    if (!currentChannel.value) {
        $q.notify({
            type: 'warning',
            message: 'Select a channel first',
            position: 'top'
        })
        return
    }

    try {
        const response = await api.post(
            `/messages/${currentChannel.value.id}`,
            { text: newMessage.value.trim() }
        )

        let newMsg = snakeToCamel(response.data)
        newMsg.local = true
        convertMessageDate(newMsg)

        messages.value.push(newMsg as ChannelMessage)

        const ch = channels.value.find(c => c.id === currentChannel.value?.id)
        if (ch) {
            ch.lastMessage = newMsg
        }

        await nextTick()

        setTimeout(() => {
            chatMessagesScrollArea.value?.setScrollPercentage('vertical', 1)
        }, 120)

        currentSocket.value?.emit("new_message", newMsg)

        newMessage.value = ""
        typingMessage("");
    } catch (err) {
        showError(err)
    }
}

async function handleCommand(input: string) {
    const parts = input.trim().split(/\s+/)
    const cmd = parts[0]
    const args = parts.slice(1)

    try {
        switch (cmd) {
            // /join channelName [private]
            case '/join': {
                const name = args[0]
                const isPriv = args[1] === '[private]'

                if (!name) {
                    $q.notify({ type: 'warning', message: 'Usage: /join channelName [private]' })
                    break
                }

                const existing = channels.value.find(c => c.name === name)

                if (existing) {
                    await openChannel(existing)
                    break
                }

                channelName.value = name
                isPrivate.value = isPriv
                await createChannel()

                const created = channels.value.find(c => c.name === name)
                if (created) await openChannel(created)

                break
            }


            // /invite nickName
            case '/invite': {
                if (!currentChannel.value) {
                    $q.notify({ type: 'warning', message: 'No active channel selected' })
                    break
                }

                const nick = args[0]
                if (!nick) {
                    $q.notify({ type: 'warning', message: 'Usage: /invite nickName' })
                    break
                }

                inviteNickname.value = nick
                await inviteUser()
                break
            }

            // /kick nickName
            case '/kick': {
                if (!currentChannel.value) {
                    $q.notify({ type: 'warning', message: 'No active channel selected' })
                    break
                }

                const nick = args[0]
                if (!nick) {
                    $q.notify({ type: 'warning', message: 'Usage: /kick nickName' })
                    break
                }

                if (!channelMembers.value.length) {
                    await loadChannelMembers()
                }

                const member = channelMembers.value.find(m => m.nickname === nick)
                if (!member) {
                    $q.notify({ type: 'warning', message: `User ${nick} is not in this channel` })
                    break
                }

                await kickMember(member.id)
                break
            }

            // /cancel
            case '/cancel': {
                if (!currentChannel.value) {
                    $q.notify({ type: 'warning', message: 'No active channel selected' })
                    break
                }
                await leaveChannel()
                break
            }

            // /list
            case '/list': {
                if (!currentChannel.value) {
                    $q.notify({ type: 'warning', message: 'No active channel selected' })
                    break
                }
                await loadChannelMembers()
                showMembersDialog.value = true
                break
            }

            // /quit
            case '/quit': {
                if (!currentChannel.value) {
                    $q.notify({ type: 'warning', message: 'No active channel selected' })
                    break
                }

                if (currentChannel.value.ownerId !== myId) {
                    $q.notify({ type: 'negative', message: 'Only channel owner can /quit' })
                    break
                }

                await api.delete(`/channels/${currentChannel.value.id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                })

                channels.value = channels.value.filter(c => c.id !== currentChannel.value?.id)
                currentChannel.value = undefined
                messages.value = []

                showSuccess('Channel deleted')
                break
            }

            default: {
                $q.notify({
                    type: 'warning',
                    message: `Unknown command: ${cmd}`
                })
            }
        }
    } catch (err) {
        showError(err)
    }
}


const isAnybodyTyping = computed(() => {
    if (!currentChannel.value) {
        return false;
    }
    if (!typingUsers[currentChannel?.value.id]) {
        return false;
    }
    return Object.keys(typingUsers[currentChannel?.value.id]!).length > 0;
})

const realTimeTypedMessage = computed(() => {
    const channelId = currentChannel.value?.id;
    const userId = selectedUserToView.value;
    console.log(userId);
    if (!channelId || !userId) return "";

    return typingUsers[channelId]?.[userId] ?? "";
})
const typingUsers = reactive<Record<number, Record<string, string>>>({});
const showRealtimeTyping = ref(false);
const selectedUserToView = ref<string>();

function showRealtimeTypingDialog(userId: string) {
    selectedUserToView.value = userId.toString();
    showRealtimeTyping.value = true;
}

function typingMessage(value: any) {

    if (!currentChannel.value) return;

    currentSocket.value.emit("typing", {
        channelId: currentChannel.value?.id,
        text: value
    });
}

</script>

<style lang="scss">
.chat-view {
    .chat-scroll-area {
        flex: auto;
        background-color: #f6f6f6;
    }

    flex-direction: column;
}

.chat-top-area {
    flex: none;
    padding: 6px;
    display: flex;
    align-items: center;

    .q-message-avatar {
        height: 40px;
        width: 40px;
        min-width: auto;
    }

    p {
        margin-left: 10px;
        flex: auto;
    }

    .channel-title {
        margin-left: 10px;
        flex: auto;

        .typing-users-area {
            display: flex;
        }

        .typing-user {
            font-size: 0.75rem;
            color: gray;
            font-weight: bold;
            cursor: pointer;
            margin-left: 2px;
            flex: none;

            &::after {
                content: ',';
            }

            &:first-child::after {
                content: '';
            }

            &:last-child::after {
                content: '';
            }


            &.fk {
                cursor: default;
                margin-left: 10px;
                font-weight: normal;
            }
        }
    }

    .q-btn {
        margin: 4px;
    }
}

.bottom-message-area {
    flex-direction: row;
    padding: 10px;

    .q-input {
        flex: 10;

        .q-field__control {
            height: 40px;
        }
    }

    .q-button {
        flex: 2;
    }
}

.channels-scrollable-area {
    flex: auto;
}

.channels-area {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.back-button {
    display: none;
}

.real-typing-card {
    width: 40%
}

@media screen and (max-width:1024px) {
    .q-splitter--vertical>.q-splitter__separator>div {
        display: none;
    }

    .back-button {
        display: inline-flex;
    }

    .real-typing-card {
        width: 95%;
    }
}
</style>