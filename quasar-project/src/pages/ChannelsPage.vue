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

                    <!-- channels list -->
                    <ChannelsList :sorted-channels="sortedChannels" :current-channel-id="currentChannel?.id"
                        @open-channel="openChannel" />

                    <div class="mobile-command-entry">
                        <q-input v-model="mobileCommand" placeholder="Type command" />
                        <q-btn flat round color="primary" icon="send" @click="handleMobileCommand" />
                    </div>
                </div>
            </template>

            <!-- right panel with chat -->
            <template v-slot:after>
                <div class="flex full-height chat-view">
                    <ChatHeader :channel="currentChannel" :typing-users="currentTypingUsers"
                        :is-anybody-typing="isAnybodyTyping" :show-back="splitterDisabled"
                        @open-members="() => { showMembersDialog = true; loadChannelMembers() }"
                        @show-typing="showRealtimeTypingDialog" @back="splitterModel = 100" />


                    <!-- chat messages -->
                    <MessagesList ref="messagesList" :messages="messages" :load-more="loadMoreMessages"
                        :get-message-color="getMessageColor" :enabled="!!currentChannel" />


                    <!-- input area -->
                    <MessageInput v-model="newMessage" :disabled="false" @typing="typingMessage"
                        @send="sendMessage" />

                </div>
            </template>
        </q-splitter>

        <!-- dialog for viewing channel members -->
        <ChannelMembersDialog v-model="showMembersDialog" :channel="currentChannel" :members="channelMembers"
            :my-id="myId" @leave="leaveChannel" @kick="kickMember" @open-invite="showInviteDialog = true" />


        <!-- dialog for inviting user -->
        <InviteUserDialog v-model="showInviteDialog" v-model:nickname="inviteNickname" :loading="inviteLoading"
            @invite="inviteUser" />


        <!-- dialog for creating a channel -->
        <CreateChannelDialog v-model="showCreateDialog" v-model:channelName="channelName" v-model:isPrivate="isPrivate"
            @create="createChannel" />

    </q-page>

    <RealtimeTypingDialog v-model="showRealtimeTyping" :user="selectedUserToView" :message="realTimeTypedMessage" />

</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, reactive, watch } from 'vue'
import { api } from 'boot/axios'
import { io } from "socket.io-client";
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar'
import type { Channel, ChannelMessage, User, UserStatus } from 'src/models';
import { PushNotificationsManager } from 'src/utils/PushNotificationsManager';
import ChannelsList from 'src/components/ChannelsList.vue'
import ChatHeader from 'src/components/ChatHeader.vue'
import MessagesList from 'src/components/MessagesList.vue'
import MessageInput from 'src/components/MessageInput.vue'
import ChannelMembersDialog from 'src/components/ChannelMembersDialog.vue'
import InviteUserDialog from 'src/components/InviteUserDialog.vue'
import CreateChannelDialog from 'src/components/CreateChannelDialog.vue'
import RealtimeTypingDialog from 'src/components/RealtimeTypingDialog.vue'
import { useChatSocket } from 'src/composables/useChatSocket'
import type { QNotifyCreateOptions } from 'quasar'
import { fasBedPulse } from '@quasar/extras/fontawesome-v6';


const currentTypingUsers = computed<Record<string, string>>(() => {
    const channelId = currentChannel.value?.id
    if (channelId === undefined) return {}
    return typingUsers[channelId] ?? {}
})

const channels = ref<Channel[]>([])
const currentChannel = ref<Channel>()

const messages = ref<ChannelMessage[]>([])
let totalMessagesAmount = 0
let currentOffset = 20
const channelMembers = ref<User[]>([])
const typingUsers = reactive<Record<number, Record<string, string>>>({})

type Status = 'online' | 'offline' | 'dnd'
const userStatus = ref<Status>('online')

const myId = Number(localStorage.getItem('userid'))


const offlineCutoff = ref<string | null>(localStorage.getItem('offlineCutoff') || null)

const $q = useQuasar()
const router = useRouter()

const showRealtimeTyping = ref(false);
const selectedUserToView = ref<string>();

const splitterModel = ref(25)
const splitterDisabled = ref(false)
const newMessage = ref("")
const showCreateDialog = ref(false)
const isPrivate = ref(false)

const channelName = ref("")

const chatMessagesScrollArea = ref<any>(null)

const showMembersDialog = ref(false)

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

const messagesList = ref<any>(null)

function scrollToBottom() {
    messagesList.value?.scrollArea?.setScrollPercentage('vertical', 100)
}

const { connectSocket, disconnectSocket, joinChannel, emitTyping, emitNewMessage } = useChatSocket({
    url: 'http://localhost:3333',
    token: () => localStorage.getItem('token'),
    myId,

    userStatus,

    channels,
    currentChannel,
    messages,
    typingUsers,
    channelMembers,

    loadChannels,

    showError,
    notify: (o: QNotifyCreateOptions) => $q.notify(o),
    onAuthRedirect: () => { void router.push('/auth/login') },

    scrollToBottom,
})


async function updateStatus() {
    try {
        await api.put(
            '/user/status',
            { status: userStatus.value },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )

        navigator.serviceWorker.controller?.postMessage({ type: "user_status", data: userStatus.value })

        if (userStatus.value === 'offline') {
            offlineCutoff.value = new Date().toISOString()
            localStorage.setItem('offlineCutoff', offlineCutoff.value)
            disconnectSocket()
            return
        }

        if (userStatus.value === 'online') {
            offlineCutoff.value = null
            localStorage.removeItem('offlineCutoff')

            await connectSocket()
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

async function revokeMember(userId: number) {
    if (!currentChannel.value) return
    try {
        const res = await api.post(
            `/channels/${currentChannel.value.id}/revoke`,
            { userId },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )

        showSuccess(res.data.message)

        channelMembers.value = channelMembers.value.filter(m => m.id !== userId)
    } catch (err: any) {
        showError(err)
    }
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
    if (window.innerWidth < 1024) {
        splitterDisabled.value = true
        splitterModel.value = 100
    } else {
        splitterDisabled.value = false
        splitterModel.value = 25
    }

    await loadChannels()
    await connectSocket()

    await navigator.serviceWorker.ready;
    const res = await api.get(`/user/mynickname`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    nickName = res.data
    navigator.serviceWorker.controller?.postMessage({ type: "user_nickname", data: res.data })

    await askNotificationPermission()
    await PushNotificationsManager.subscribeUser()
})

let nickName = "";
async function askNotificationPermission() {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') { throw new Error('Notification permission denied'); }
}

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
    console.log(fresh);
    messages.value = fresh;
    await nextTick()
    setTimeout(() => {
        scrollToBottom()
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
    joinChannel(channel.id)
    await loadMessages()
    await nextTick()
    setTimeout(() => {
        scrollToBottom()
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
            scrollToBottom()
        }, 120)

        emitNewMessage(newMsg)

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
                    $q.notify({ type: 'warning', message: 'Usage: /join channelName [private]', position: "top" })
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
                    $q.notify({ type: 'warning', message: 'No active channel selected', position: "top" })
                    break
                }

                const nick = args[0]
                if (!nick) {
                    $q.notify({ type: 'warning', message: 'Usage: /invite nickName', position: "top" })
                    break
                }

                inviteNickname.value = nick
                await inviteUser()
                break
            }

            // /kick nickName
            case '/kick': {
                if (!currentChannel.value) {
                    $q.notify({ type: 'warning', message: 'No active channel selected', position: "top" })
                    break
                }

                const nick = args[0]
                if (!nick) {
                    $q.notify({ type: 'warning', message: 'Usage: /kick nickName', position: "top" })
                    break
                }

                if (!channelMembers.value.length) {
                    await loadChannelMembers()
                }

                const member = channelMembers.value.find(m => m.nickname === nick)
                if (!member) {
                    $q.notify({ type: 'warning', message: `User ${nick} is not in this channel`, position: "top" })
                    break
                }

                await kickMember(member.id)
                break
            }

            case '/revoke': {
                if (!currentChannel.value) {
                    $q.notify({ type: 'warning', message: 'No active channel selected', position: 'top' })
                    break
                }

                if (!currentChannel.value.isPrivate) {
                    $q.notify({ type: 'negative', message: 'Command /revoke works only in private channels', position: 'top' })
                    break
                }

                if (currentChannel.value.ownerId !== myId) {
                    $q.notify({ type: 'negative', message: 'Only channel owner can /revoke', position: 'top' })
                    break
                }

                const nick = args[0]
                if (!nick) {
                    $q.notify({ type: 'warning', message: 'Usage: /revoke nickName', position: 'top' })
                    break
                }

                if (!channelMembers.value.length) {
                    await loadChannelMembers()
                }

                const member = channelMembers.value.find(m => m.nickname === nick)
                if (!member) {
                    $q.notify({ type: 'warning', message: `User ${nick} is not in this channel`, position: 'top' })
                    break
                }

                if (member.id === myId) {
                    $q.notify({ type: 'warning', message: `You can't /revoke yourself`, position: 'top' })
                    break
                }

                await revokeMember(member.id)
                break
            }


            // /cancel
            case '/cancel': {
                if (!currentChannel.value) {
                    $q.notify({ type: 'warning', message: 'No active channel selected', position: "top" })
                    break
                }
                await leaveChannel()
                break
            }

            // /list
            case '/list': {
                if (!currentChannel.value) {
                    $q.notify({ type: 'warning', message: 'No active channel selected', position: "top" })
                    break
                }
                await loadChannelMembers()
                showMembersDialog.value = true
                break
            }

            // /quit
            case '/quit': {
                if (!currentChannel.value) {
                    $q.notify({ type: 'warning', message: 'No active channel selected', position: "top" })
                    break
                }

                if (currentChannel.value.ownerId !== myId) {
                    $q.notify({ type: 'negative', message: 'Only channel owner can /quit', position: "top" })
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
                    message: `Unknown command: ${cmd}`,
                    position: "top"
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

function showRealtimeTypingDialog(userId: string) {
    selectedUserToView.value = userId.toString();
    showRealtimeTyping.value = true;
}

function typingMessage(value: any) {
    if (!currentChannel.value) return
    emitTyping(currentChannel.value.id, value)
}

function getMessageColor(message: any): string {
    const text = message.text ?? ''

    // highlight if mentions current user (case-insensitive in data)
    if (text.includes(`@${nickName.toLowerCase()}`)) {
        return 'amber-7' // mention highlight
    }

    if (message.local) {
        return 'green-4' // sent by me
    }

    return 'grey-3' // others
}

const mobileCommand = ref("");
async function handleMobileCommand() {
    await handleCommand(mobileCommand.value);
    mobileCommand.value = "";
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

.mention {
    color: blue;
}

.mobile-command-entry {
    display: none;
    background-color: #f6f6f6;
    padding: 10px;

    .q-input {
        flex: auto;

        .q-field__control {
            height: 40px;
        }
    }

    .q-btn {
        flex: none;
    }
}

@media screen and (max-width:1024px) {
    .mobile-command-entry {
        display: flex;
    }

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