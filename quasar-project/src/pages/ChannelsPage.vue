<template>
    <q-page style="min-height:100%">
        <q-splitter v-model="splitterModel" class="full-height" :disable="splitterDisabled" unit="%" :limits="[0, 100]">
            <!-- left panel with channels -->
            <template v-slot:before>
                <div class="channels-area">
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
                            :last-message="channel.lastMessage" :name="channel.name"
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
                        <p>{{ currentChannel?.name }}</p>
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
                        <q-input class="new-message-input" filled v-model="newMessage" placeholder="Message" />
                        <q-btn flat round color="primary" icon="send" @click="sendMessage" />
                    </div>
                </div>
            </template>
        </q-splitter>

        <!-- dialog for viewing channel members -->
        <q-dialog v-model="showMembersDialog">
            <q-card style="min-width: 350px; max-height: 80vh;">
                <q-card-section>
                    <div class="text-h6">Channel members</div>
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

                        <q-item-section side v-if="showRemoveButton(member)">
                            <q-btn flat round dense icon="remove_circle" color="negative"
                                @click="kickMember(member.id)" />
                        </q-item-section>
                    </q-item>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Add user" color="primary" @click="showInviteDialog = true" />
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
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import ChannelItem from 'src/components/ChannelItem.vue'
import { api } from 'boot/axios'
import { io } from "socket.io-client";
import { useRouter } from 'vue-router';
import type { Channel, ChannelMessage, User } from 'src/models';
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()

// Notify helpers
function showError(error: any) {
    console.error('API Error:', error)
    let message = 'Unknown error occurred'

    if (error?.response?.data?.error) message = error.response.data.error
    else if (error?.response?.data?.message) message = error.response.data.message
    else if (error?.message) message = error.message

    $q.notify({
        type: 'negative',
        message,
        position: 'top',
        timeout: 4000,
        progress: true
    })
}

function showSuccess(message: string) {
    $q.notify({
        type: 'positive',
        message: 'Channel created successfully!',
        position: 'top',
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
    const myId = Number(localStorage.getItem('userid'))

    if (!channel) return false

    if (channel.isPrivate) {
        return channel.ownerId === myId && member.id !== channel.ownerId
    }

    return member.id !== channel.ownerId
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
        const res = await api.get('/channels', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        channels.value = res.data.map((channel: any) => {
            if (channel.lastMessage && channel.lastMessage.date) {
                convertMessageDate(channel.lastMessage)
            }
            return {
                ...channel,
                isPrivate: channel.is_private,
                ownerId: channel.owner_id,
            }
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
        showSuccess(res.data.message || 'Channel created')
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
    currentSocket.value.on("connect", () => console.log("Connected!", currentSocket.value.id))
    currentSocket.value.on("disconnect", (reason: any) => console.log("Disconnected:", reason))
    currentSocket.value.on("connect_error", async (err: any) => {
        showError(err)
        await router.push("/auth/login")
    })
    currentSocket.value.on("new_message", async (msg: ChannelMessage) => {
        convertMessageDate(msg)
        if (msg.channelId == currentChannel.value?.id) {
            msg.local = msg.userId.toString() == localStorage.getItem("userid")
            messages.value?.push(msg)
            await nextTick()
            chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100)
        }
        const targetChannel = channels.value.find(channel => channel.id == msg.channelId)
        if (targetChannel) targetChannel.lastMessage = msg
    })
})

const messages = ref<ChannelMessage[]>([])
let totalMessagesAmount = 0
let currentOffset = 20

async function loadMessages(offset: number = 0) {
    try {
        const res = await api.get(`/messages/${currentChannel.value!.id}?offset=${offset}`)
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
    if (!currentChannel.value) return
    try {
        const response = await api.post(`/messages/${currentChannel.value.id}`, { text: newMessage.value })
        let newMsg = snakeToCamel(response.data)
        newMsg.local = true
        convertMessageDate(newMsg)
        messages.value?.push(newMsg as ChannelMessage)
        currentSocket.value.emit("new_message", newMsg)
        chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100)
        newMessage.value = ""
    } catch (err) {
        showError(err)
    }
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

@media screen and (max-width:1024px) {
    .q-splitter--vertical>.q-splitter__separator>div {
        display: none;
    }

    .back-button {
        display: inline-flex;
    }
}
</style>