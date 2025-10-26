<template>
    <q-page style="min-height:100%">
        <!-- main splitter layout -->
        <q-splitter v-model="splitterModel" class="full-height" :disable="splitterDisabled" unit="%" :limits="[0, 100]">

            <!-- left panel with channels list -->
            <template v-slot:before>
                <div class="channels-area">

                    <!-- header with create button -->
                    <div class="row justify-center items-center q-mt-sm">
                        <q-btn flat round color="primary" icon="add_circle" @click="showCreateDialog = true" />
                        <span class="text-subtitle2">Channels</span>
                    </div>

                    <!-- user status buttons -->
                    <div class="status-area row justify-center items-center q-mt-sm ">
                        <q-btn-toggle v-model="currentStatus" no-caps rounded unelevated toggle-color="blue"
                            color="blue-grey-1" text-color="primary" :options="[
                                { label: 'Online', value: 'online' },
                                { label: 'DND', value: 'dnd' },
                                { label: 'Offline', value: 'offline' }
                            ]" />
                    </div>

                    <!-- search bar -->
                    <q-input v-model="searchQuery" dense>
                        <template v-slot:prepend>
                            <q-icon name="search" style="margin: 10px;" />
                        </template>
                        <template v-slot:append>
                            <q-icon name="close" style="margin: 10px;" class="cursor-pointer"
                                @click="searchQuery = ''" />
                        </template>
                    </q-input>

                    <!-- scrollable list of channels -->
                    <q-scroll-area class="channels-scrollable-area" style="height: 100%;">
                        <channel-item v-for="channel in filteredChannels" :key="channel.id" :name="channel.name"
                            :last-message="channel.lastMessage" :class="{ selected: channel.id === currentChannel?.id }"
                            @click="openChannel(channel)" />
                    </q-scroll-area>
                </div>
            </template>

            <!-- right panel with chat view -->
            <template v-slot:after>
                <div class="flex full-height chat-view">

                    <!-- top chat header -->
                    <div class="chat-top-area">
                        <q-btn class="back-button" v-show="splitterDisabled" flat round color="primary" size="md"
                            icon="arrow_back" @click="splitterModel = 100" />
                        <img class="q-message-avatar q-message-avatar--sent"
                            src="https://cdn.quasar.dev/img/avatar4.jpg" />
                        <p>{{ currentChannel?.name || 'Select channel' }}</p>
                        <q-btn outline round color="primary" size="md" icon="info" @click="showMembersDialog = true" />
                    </div>

                    <!-- messages area -->
                    <q-scroll-area class="chat-scroll-area no-scrollbar" ref="chatMessagesScrollArea">
                        <q-infinite-scroll v-if="currentChannel" @load="onLoad" reverse>
                            <!-- loading spinner -->
                            <template v-slot:loading>
                                <div class="row justify-center q-my-md">
                                    <q-spinner-dots color="primary" size="40px" />
                                </div>
                            </template>

                            <!-- messages list -->
                            <div v-if="currentChannel">
                                <q-chat-message v-for="message in currentChannel.messages"
                                    :key="`${currentChannel.id}-${message.id}`" :name="message.sender.nickname"
                                    avatar="https://cdn.quasar.dev/img/avatar4.jpg" :text="[message.text]"
                                    :sent="message.local" :stamp="message.date.toLocaleTimeString()"
                                    :bg-color="getMessageColor(message)">
                                    <template #default>
                                        <div v-highlight-mention>{{ message.text }}</div>
                                    </template>
                                </q-chat-message>
                            </div>
                        </q-infinite-scroll>
                    </q-scroll-area>

                    <!-- bottom message input area -->
                    <div class="bottom-message-area flex">
                        <q-input class="new-message-input" filled v-model="newMessage" placeholder="Message" />
                        <q-btn flat round color="primary" icon="send" @click="sendMessage" />
                    </div>
                </div>
            </template>
        </q-splitter>

        <!-- dialog showing channel members -->
        <q-dialog v-model="showMembersDialog">
            <q-card style="min-width: 350px; max-height: 80vh;">
                <q-card-section class="row items-center justify-between">
                    <div class="text-h6">Channel members</div>
                    <!-- add member button -->
                    <q-btn flat round color="primary" icon="person_add" @click="showAddUserDialog = true" />
                </q-card-section>

                <q-separator />

                <!-- members list -->
                <q-card-section class="scroll" style="max-height: 60vh; overflow-y: auto;">
                    <q-item v-for="memberId in currentChannel?.members" :key="memberId" class="q-my-xs">
                        <q-item-section avatar>
                            <q-avatar><img :src="getUser(memberId).avatar" /></q-avatar>
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>{{ getUser(memberId).nickname }}</q-item-label>
                            <q-item-label caption>{{ getUser(memberId).email }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <q-btn v-if="memberId !== fakeUser.id" dense flat round color="negative"
                                icon="person_remove" @click="removeMember(memberId)" />
                            <q-btn v-else dense flat round color="warning" icon="logout" @click="leaveChannel" />
                        </q-item-section>
                    </q-item>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Close" color="primary" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- dialog for adding user -->
        <q-dialog v-model="showAddUserDialog">
            <q-card style="min-width: 300px;">
                <q-card-section>
                    <div class="text-h6">Add new member</div>
                </q-card-section>

                <q-card-section>
                    <q-input v-model="newMemberNickname" label="Nickname" autofocus />
                    <q-input v-model="newMemberEmail" label="Email" />
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancel" color="primary" v-close-popup />
                    <q-btn flat color="positive" label="Add" @click="addMember" />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- dialog for creating new channel -->
        <q-dialog v-model="showCreateDialog">
            <q-card style="min-width: 350px">
                <q-card-section>
                    <div class="text-h6">Create a new channel</div>
                </q-card-section>

                <!-- channel creation form -->
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
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import ChannelItem from 'src/components/ChannelItem.vue'
import vHighlightMention from "../utils/highlight-mention";
import { Channel } from 'src/models';

/* Quasar instance for notifications */
const $q = useQuasar()

/* layout controls */
const splitterModel = ref(25)
const splitterDisabled = ref(false)
const chatMessagesScrollArea = ref<any>(null)

/* dialogs */
const showCreateDialog = ref(false)
const showMembersDialog = ref(false)
const showAddUserDialog = ref(false)

/* new member inputs */
const newMemberNickname = ref('')
const newMemberEmail = ref('')

/* form fields */
const channelName = ref('')
const isPrivate = ref(false)
const newMessage = ref('')
const searchQuery = ref('')

/* responsive setup for mobile view */
if (window.innerWidth < 1024) {
    splitterDisabled.value = true
    splitterModel.value = 100
} else {
    splitterDisabled.value = false
    splitterModel.value = 25
}

/* choose bg color for each message */
function getMessageColor(message: any): string {
    const text = message.text ?? ''
    if (text.includes(`@${fakeUser.nickname.toLowerCase()}`)) {
        return 'amber-7' // mention highlight
    }
    if (message.local) {
        return 'green-4' // local user message
    }
    return 'grey-3' // others
}

/* mock user */
const fakeUser = { id: 1, nickname: 'Kal', email: 'kal@example.com', avatar: 'https://cdn.quasar.dev/img/avatar4.jpg' }

/* mock channels */
const channels = ref([
    {
        id: 1,
        name: 'General',
        members: [1, 2, 3],
        messages: [
            { id: 2, text: 'Welcome to General! @kal', sender: { id: 2, nickname: 'Alice' }, date: new Date(), local: true }
        ],
        lastMessage: {
            id: 1,
            text: 'Welcome to General!',
            local: false,
            userId: 2,
            channelId: 1,
            date: new Date(),
            sender: { id: 2, nickname: 'Alice' }
        }
    },
    {
        id: 3,
        name: 'Developers',
        members: [1, 2],
        messages: [
            { id: 1, text: 'Hey, welcome!', sender: fakeUser, date: new Date(), local: true },
            { id: 2, text: 'Hello! How are you? @kal', sender: { nickname: 'Alice' }, date: new Date(), local: false },
            { id: 3, text: 'All good!', sender: fakeUser, date: new Date(), local: true },
            { id: 4, text: 'Nice to hear', sender: { nickname: 'Alice' }, date: new Date(), local: false },
        ],
        lastMessage: { id: 4, channelId: 1, text: 'Nice to hear', userId: 2, sender: { id: 2, nickname: 'Alice' }, date: new Date(), local: false },
    },
])

/* current opened channel */
const currentChannel = ref<any>(null)

/* search filter */
const filteredChannels = computed(() => {
    return channels.value
        .filter(c => c.members.includes(fakeUser.id))
        .filter(c => c.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
        .sort((a: any, b: any) => (b.lastMessage?.date?.getTime() ?? 0) - (a.lastMessage?.date?.getTime() ?? 0))
})

/* open channel */
function openChannel(channel: any) {
    currentChannel.value = channel
    setTimeout(() => {
        chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100, 10)
    }, 100)
    if (window.innerWidth < 1024) {
        splitterModel.value = 0
        splitterDisabled.value = true
    }
}

/* create new channel */
function createChannel() {
    if (!channelName.value.trim()) return
    const id = Date.now()
    const newChannel = {
        id,
        name: channelName.value,
        members: [fakeUser.id],
        messages: [],
        lastMessage: {
            id,
            text: 'Empty channel',
            local: true,
            userId: fakeUser.id,
            channelId: id,
            date: new Date(),
            sender: fakeUser
        }
    }
    channels.value.push(newChannel)
    $q.notify({ type: 'positive', message: `Channel "${channelName.value}" created!` })
    channelName.value = ''
    showCreateDialog.value = false
}

/* fake users list */
const allUsers = ref([
    fakeUser,
    { id: 2, nickname: 'Alice', email: 'alice@mail.com', avatar: 'https://cdn.quasar.dev/img/avatar2.jpg' },
    { id: 3, nickname: 'Bob', email: 'bob@mail.com', avatar: 'https://cdn.quasar.dev/img/avatar3.jpg' },
])

/* get user by id */
function getUser(id: number) {
    return allUsers.value.find(u => u.id === id) || { nickname: 'Unknown', email: '', avatar: '' }
}

/* load older messages (mock) */
function onLoad(idx: number, done: (stop: boolean) => void) {
    if (currentChannel.value.id === 4) {
        setTimeout(() => {
            const olderMessages = [
                { id: 0, text: 'This is an older message', sender: { nickname: 'Alice' }, date: new Date(Date.now() - 600000), local: false },
                { id: -1, text: 'Even older message', sender: fakeUser, date: new Date(Date.now() - 900000), local: true },
            ];
            currentChannel.value = {
                ...currentChannel.value,
                messages: [...olderMessages, ...currentChannel.value.messages]
            };
            done(true)
        }, 2500)
    } else done(true)
}

/* send message */
function sendMessage() {
    if (!newMessage.value.trim() || !currentChannel.value) return
    const msg = {
        id: Date.now(),
        text: newMessage.value,
        sender: fakeUser,
        date: new Date(),
        local: true,
    }
    currentChannel.value.messages.push(msg)
    currentChannel.value.lastMessage = msg
    newMessage.value = ''
    $q.notify({ type: 'info', message: 'Message sent (mock)' })
    chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100)
}

/* add member to channel */
function addMember() {
    if (!newMemberNickname.value.trim() || !newMemberEmail.value.trim() || !currentChannel.value) {
        $q.notify({ type: 'warning', message: 'Please fill both nickname and email' })
        return
    }
    const existing = allUsers.value.find(u => u.nickname === newMemberNickname.value)
    let user = existing || {
        id: Date.now(),
        nickname: newMemberNickname.value,
        email: newMemberEmail.value,
        avatar: 'https://cdn.quasar.dev/img/avatar.png'
    }
    if (!existing) allUsers.value.push(user)
    if (currentChannel.value.members.includes(user.id)) {
        $q.notify({ type: 'negative', message: 'User already in channel' })
        return
    }
    currentChannel.value.members.push(user.id)
    $q.notify({ type: 'positive', message: `${user.nickname} added to channel!` })
    newMemberNickname.value = ''
    newMemberEmail.value = ''
    showAddUserDialog.value = false
}

/* remove member */
function removeMember(id: number) {
    if (!currentChannel.value) return
    currentChannel.value.members = currentChannel.value.members.filter((m: number) => m !== id)
    const user = getUser(id)
    $q.notify({ type: 'warning', message: `${user.nickname} removed from channel.` })
}

/* leave channel */
function leaveChannel() {
    if (!currentChannel.value) return
    currentChannel.value.members = currentChannel.value.members.filter((id: number) => id !== fakeUser.id)
    channels.value = channels.value.filter(c => c.members.includes(fakeUser.id))
    currentChannel.value = null
    showMembersDialog.value = false
    $q.notify({ type: 'info', message: 'You left the channel.' })
}

/* handle responsive resize */
window.addEventListener("resize", () => {
    if (window.innerWidth < 1024) {
        splitterDisabled.value = true
        splitterModel.value = 100
    } else {
        splitterDisabled.value = false
        splitterModel.value = 25
    }
})

/* status (online/offline/DND) */
const currentStatus = ref('online');
</script>
