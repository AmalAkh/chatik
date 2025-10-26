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

                    <!-- quick status switch (just UI state) -->
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
                        <!-- each item is clickable channel shortcut -->
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
                        <!-- for mobile: back to list -->
                        <q-btn class="back-button" v-show="splitterDisabled" flat round color="primary" size="md"
                            icon="arrow_back" @click="splitterModel = 100" />
                        <!-- simple avatar -->
                        <img class="q-message-avatar q-message-avatar--sent"
                            src="https://cdn.quasar.dev/img/avatar4.jpg" />
                        <!-- channel name (fallback if none) -->
                        <p>{{ currentChannel?.name || 'Select channel' }}</p>
                        <!-- opens members dialog -->
                        <q-btn outline round color="primary" size="md" icon="info" @click="showMembersDialog = true" />
                    </div>

                    <!-- messages area -->
                    <!-- sticky container with infinite scroll, loads older on top -->
                    <q-scroll-area class="chat-scroll-area no-scrollbar" ref="chatMessagesScrollArea">
                        <q-infinite-scroll v-if="currentChannel" @load="onLoad" reverse>
                            <template v-slot:loading>
                                <div class="row justify-center q-my-md">
                                    <q-spinner-dots color="primary" size="40px" />
                                </div>
                            </template>

                            <!-- render chat bubbles -->
                            <div v-if="currentChannel">
                                <q-chat-message v-for="message in currentChannel.messages"
                                    :key="`${currentChannel.id}-${message.id}`" :name="message.sender.nickname"
                                    avatar="https://cdn.quasar.dev/img/avatar4.jpg" :text="[message.text]"
                                    :sent="message.local" :stamp="message.date.toLocaleTimeString()"
                                    :bg-color="getMessageColor(message)">
                                    <!-- custom slot to highlight @mentions -->
                                    <template #default>
                                        <div v-highlight-mention>{{ message.text }}</div>
                                    </template>
                                </q-chat-message>
                            </div>
                        </q-infinite-scroll>
                    </q-scroll-area>

                    <!-- bottom message input area -->
                    <div class="bottom-message-area flex">
                        <!-- user types message here -->
                        <q-input class="new-message-input" filled v-model="newMessage" placeholder="Message" />
                        <!-- mock send (no backend) -->
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
                    <!-- add new member (mock) -->
                    <q-btn flat round color="primary" icon="person_add" @click="showAddUserDialog = true" />
                </q-card-section>

                <q-separator />

                <!-- list of members -->
                <q-card-section class="scroll" style="max-height: 60vh; overflow-y: auto;">
                    <!-- member row -->
                    <q-item v-for="memberId in currentChannel?.members" :key="memberId" class="q-my-xs">
                        <q-item-section avatar>
                            <q-avatar><img :src="getUser(memberId).avatar" /></q-avatar>
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>{{ getUser(memberId).nickname }}</q-item-label>
                            <q-item-label caption>{{ getUser(memberId).email }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                            <!-- remove other users -->
                            <q-btn v-if="memberId !== fakeUser.id" dense flat round color="negative"
                                icon="person_remove" @click="removeMember(memberId)" />
                            <!-- self leave shortcut -->
                            <q-btn v-else dense flat round color="warning" icon="logout" @click="leaveChannel" />
                        </q-item-section>
                    </q-item>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Close" color="primary" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- dialog: add user by nickname+email -->
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
import vHighlightMention from '../utils/highlight-mention'
import { Channel } from 'src/models' // type import (optional)

/* Quasar instance for notifications */
const $q = useQuasar()

/* layout controls */
const splitterModel = ref(25)            // left/right ratio in %
const splitterDisabled = ref(false)      // mobile: hide left pane
const chatMessagesScrollArea = ref<any>(null) // ref to scroll API

/* dialog controls */
const showCreateDialog = ref(false)      // create channel modal
const showMembersDialog = ref(false)     // members list modal
const showAddUserDialog = ref(false)     // add member modal
const newMemberNickname = ref('')        // form: nickname
const newMemberEmail = ref('')           // form: email

/* form fields */
const channelName = ref('')              // new channel name
const isPrivate = ref(false)             // flag only (UI)
const newMessage = ref('')               // input message text
const searchQuery = ref('')              // channels filter

// quick responsive init (no SSR here)
if (window.innerWidth < 1024) {
    splitterDisabled.value = true
    splitterModel.value = 100 // show chat only
} else {
    splitterDisabled.value = false
    splitterModel.value = 25  // show list + chat
}

// decide message bubble color (simple rules)
function getMessageColor(message: any): string {
    const text = message.text ?? ''

    // highlight if mentions current user (case-insensitive in data)
    if (text.includes(`@${fakeUser.nickname.toLowerCase()}`)) {
        return 'amber-7' // mention highlight
    }

    if (message.local) {
        return 'green-4' // sent by me
    }

    return 'grey-3' // others
}

/* fake user object */
const fakeUser = { id: 1, nickname: 'Kal', email: 'kal@example.com', avatar: 'https://cdn.quasar.dev/img/avatar4.jpg' }

/* fake channels data (mock dataset) */
const channels = ref([
    {
        id: 1,
        name: 'General',
        members: [1, 2, 3],
        messages: [
            { id: 2, text: 'Welcome to General! @kal', sender: { id: 2, nickname: 'Alice', avatar: 'https://cdn.quasar.dev/img/avatar2.jpg' }, date: new Date(), local: true }
        ],
        lastMessage: {
            id: 1,
            text: 'Welcome to General!',
            local: false,
            userId: 2,
            channelId: 1,
            date: new Date(),
            sender: { id: 2, nickname: 'Alice', avatar: 'https://cdn.quasar.dev/img/avatar2.jpg' }
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
        lastMessage: { id: 4, channelId: 1, text: 'Nice to hear', userId: 2, sender: { id: 2, nickname: 'Alice', avatar: 'https://cdn.quasar.dev/img/avatar2.jpg' }, date: new Date(), local: false },
    },
    {
        id: 4,
        name: 'Long chat',
        members: [1, 2],
        messages: [
            { id: 1, text: 'Hey, welcome!', sender: fakeUser, date: new Date(), local: true },
            { id: 2, text: 'Hello! How are you? @kal', sender: { nickname: 'Alice' }, date: new Date(), local: false },
            { id: 3, text: 'All good!', sender: fakeUser, date: new Date(), local: true },
            { id: 4, text: 'Nice to hear', sender: { nickname: 'Alice' }, date: new Date(), local: false },
            { id: 5, text: 'What are you up to today?', sender: fakeUser, date: new Date(), local: true },
            { id: 6, text: 'Just working on a project.', sender: { nickname: 'Alice' }, date: new Date(), local: false },
            { id: 7, text: 'Sounds fun!', sender: fakeUser, date: new Date(), local: true },
            { id: 8, text: 'Yeah, learning Vue.js is quite interesting.', sender: { nickname: 'Alice' }, date: new Date(), local: false },
            { id: 9, text: 'I love Quasar components too!', sender: fakeUser, date: new Date(), local: true },
            { id: 10, text: 'We should collaborate on something.', sender: { nickname: 'Alice' }, date: new Date(), local: false },
            { id: 11, text: 'Absolutely! Let’s plan it.', sender: fakeUser, date: new Date(), local: true },
            { id: 12, text: 'Great! I’ll draft an idea.', sender: { nickname: 'Alice' }, date: new Date(), local: false },
            { id: 13, text: 'Looking forward to it.', sender: fakeUser, date: new Date(), local: true },
        ],
        lastMessage: {
            id: 13,
            channelId: 4,
            text: 'Looking forward to it.',
            userId: 1,
            sender: fakeUser,
            date: new Date(),
            local: true
        },
    }
])

/* currently opened channel */
const currentChannel = ref<any>(null)

/* filtering channels by search query */
const filteredChannels = computed(() => {
    // only channels where I am a member + name matches filter
    return channels.value
        .filter(c => c.members.includes(fakeUser.id))
        .filter(c => c.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
        .sort((channel1: any, channel2: any) => {
            const t1 = channel1.lastMessage?.date?.getTime() ?? 0
            const t2 = channel2.lastMessage?.date?.getTime() ?? 0
            return t2 - t1 // newest first
        })
})

/* switch current channel */
function openChannel(channel: any) {
    currentChannel.value = channel
    // small delay -> ensures DOM exists before scrolling
    setTimeout(() => {
        chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100, 10)
    }, 100)

    // on mobile: collapse list
    if (window.innerWidth < 1024) {
        splitterModel.value = 0
        splitterDisabled.value = true
    }
}

/* create new mock channel */
function createChannel() {
    if (!channelName.value.trim()) return

    const id = Date.now()
    const newChannel = {
        id,
        name: channelName.value,
        members: [fakeUser.id],   // only me inside for now
        messages: [],             // empty chat
        lastMessage: {            // placeholder last item
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

/* fake users list (for dialogs) */
const allUsers = ref([
    fakeUser,
    { id: 2, nickname: 'Alice', email: 'alice@mail.com', avatar: 'https://cdn.quasar.dev/img/avatar2.jpg' },
    { id: 3, nickname: 'Bob', email: 'bob@mail.com', avatar: 'https://cdn.quasar.dev/img/avatar3.jpg' },
])

/* small helper to get user data */
function getUser(id: number) {
    return allUsers.value.find(u => u.id === id) || { nickname: 'Unknown', email: '', avatar: '' }
}

/* infinite loader (prepends older messages) */
function onLoad(idx: number, done: (stop: boolean) => void) {
    if (currentChannel.value.id === 4) {
        // Simulate network delay
        setTimeout(() => {
            const olderMessages = [
                { id: 0, text: 'This is an older message', sender: { nickname: 'Alice' }, date: new Date(Date.now() - 1000 * 60 * 10), local: false },
                { id: -1, text: 'Even older message', sender: fakeUser, date: new Date(Date.now() - 1000 * 60 * 15), local: true },
                { id: -2, text: 'Oldest message in this batch', sender: { nickname: 'Alice' }, date: new Date(Date.now() - 1000 * 60 * 20), local: false },
            ]

            // prepend to keep order (older first)
            currentChannel.value = {
                ...currentChannel.value,
                messages: [...olderMessages, ...currentChannel.value.messages]
            }

            // tell InfiniteScroll we are done
            done(true) // true = stop loading more
        }, 2500) // fake delay
    } else {
        done(true) // other channels: nothing to load
    }
}

/* send a new message (mock only) */
function sendMessage() {
    if (!newMessage.value.trim() || !currentChannel.value) return

    const newMessageObj = {
        id: Date.now(),
        text: newMessage.value,
        sender: fakeUser,
        date: new Date(),
        local: true, // marks "sent by me"
    }

    currentChannel.value.messages.push(newMessageObj)
    currentChannel.value.lastMessage = newMessageObj
    newMessage.value = ''
    $q.notify({ type: 'info', message: 'Message sent (mock)' })
    // stick to bottom after send
    chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100)
}

/* add member to current channel (by nick/email) */
function addMember() {
    if (!newMemberNickname.value.trim() || !newMemberEmail.value.trim() || !currentChannel.value) {
        $q.notify({ type: 'warning', message: 'Please fill both nickname and email' })
        return
    }

    // reuse existing or create new mock user
    const existing = allUsers.value.find(u => u.nickname === newMemberNickname.value)
    let user
    if (existing) {
        user = existing
    } else {
        user = {
            id: Date.now(),
            nickname: newMemberNickname.value,
            email: newMemberEmail.value,
            avatar: 'https://cdn.quasar.dev/img/avatar.png'
        }
        allUsers.value.push(user)
    }

    // guard against duplicates
    if (currentChannel.value.members.includes(user.id)) {
        $q.notify({ type: 'negative', message: 'User already in channel' })
        return
    }

    currentChannel.value.members.push(user.id)
    $q.notify({ type: 'positive', message: `${user.nickname} added to channel!` })
    // reset form + close modal
    newMemberNickname.value = ''
    newMemberEmail.value = ''
    showAddUserDialog.value = false
}

/* remove member (simple filter) */
function removeMember(id: number) {
    if (!currentChannel.value) return
    currentChannel.value.members = currentChannel.value.members.filter((m: number) => m !== id)
    const user = getUser(id)
    $q.notify({ type: 'warning', message: `${user.nickname} removed from channel.` })
}

/* current user leaves channel */
function leaveChannel() {
    if (!currentChannel.value) return
    // remove me from members
    currentChannel.value.members = currentChannel.value.members.filter((id: number) => id !== fakeUser.id)
    // hide channels where I'm no longer a member
    channels.value = channels.value.filter(c => c.members.includes(fakeUser.id))
    // reset current view
    currentChannel.value = null
    showMembersDialog.value = false
    $q.notify({ type: 'info', message: 'You left the channel.' })
}

/* small responsive handler on window resize */
window.addEventListener('resize', () => {
    if (window.innerWidth < 1024) {
        splitterDisabled.value = true
        splitterModel.value = 100
    } else {
        splitterDisabled.value = false
        splitterModel.value = 25
    }
})

/* presence selector (UI-only) */
const currentStatus = ref('online')
</script>

<style lang="scss">
/* main chat layout */
.chat-view {
    flex-direction: column;

    .chat-scroll-area {
        flex: auto;
        background-color: #f6f6f6;
    }
}

.mention {
    color: blue;
}

/* chat header area */
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

/* input section at bottom */
.bottom-message-area {
    flex-direction: row;
    padding: 10px;

    .q-input {
        flex: 10;

        .q-field__control {
            height: 40px;
        }
    }
}

/* left sidebar with channels */
.channels-area {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.status-area {
    display: flex;
    align-items: center;
    justify-content: center;

    .q-btn-group.row.no-wrap.q-btn-group--unelevated.q-btn-group--rounded.inline.q-btn-toggle {
        flex-wrap: wrap !important;
        /* allow wrap on narrow screens */
    }

    padding: 10px;
}

/* responsive adjustments */
@media screen and (max-width: 1024px) {
    .q-splitter--vertical>.q-splitter__separator>div {
        display: none;
        /* hide separator handle on mobile */
    }

    .back-button {
        display: inline-flex;
        /* show back button on mobile */
    }
}
</style>