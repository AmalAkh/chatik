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
                        <div v-if="currentChannel">
                            <q-chat-message v-for="message in currentChannel.messages" :key="message.id"
                                :name="message.sender.nickname" avatar="https://cdn.quasar.dev/img/avatar4.jpg"
                                :text="[message.text]" :sent="message.local"
                                :stamp="message.date.toLocaleTimeString()" />
                        </div>
                    </q-scroll-area>

                    <!-- bottom message input area -->
                    <div class="bottom-message-area flex">
                        <q-btn flat round color="primary" icon="attach_file" />
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
                    <!-- кнопка добавления участника -->
                    <q-btn flat round color="primary" icon="person_add" @click="showAddUserDialog = true" />
                </q-card-section>

                <q-separator />

                <!-- list of members -->
                <q-card-section class="scroll" style="max-height: 60vh; overflow-y: auto;">
                    <q-item v-for="member in channelMembers" :key="member.id" class="q-my-xs">
                        <q-item-section avatar>
                            <q-avatar><img :src="member.avatar" /></q-avatar>
                        </q-item-section>
                        <q-item-section>
                            <q-item-label>{{ member.nickname }}</q-item-label>
                            <q-item-label caption>{{ member.email }}</q-item-label>
                        </q-item-section>

                        <q-item-section side>
                            <!-- нельзя удалить себя, только выйти -->
                            <q-btn v-if="member.id !== fakeUser.id" dense flat round color="negative"
                                icon="person_remove" @click="removeMember(member)" />
                            <q-btn v-else dense flat round color="warning" icon="logout" @click="leaveChannel" />
                        </q-item-section>
                    </q-item>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Close" color="primary" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>

        <!-- Диалог добавления нового пользователя -->
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

/* Quasar instance for notifications */
const $q = useQuasar()

/* layout controls */
const splitterModel = ref(25)
const splitterDisabled = ref(false)

/* dialog controls */
const showCreateDialog = ref(false)
const showMembersDialog = ref(false)
const showAddUserDialog = ref(false)
const newMemberNickname = ref('')
const newMemberEmail = ref('')

/* form fields */
const channelName = ref('')
const isPrivate = ref(false)
const newMessage = ref('')
const searchQuery = ref('')

/* fake user object */
const fakeUser = { id: 1, nickname: 'Kal', email: 'kal@example.com', avatar: 'https://cdn.quasar.dev/img/avatar4.jpg' }

/* fake channels data */
const channels = ref([
    {
        id: 1,
        name: 'General',
        messages: [
            { id: 2, text: 'Welcome to General!', sender: { id: 2, nickname: 'Alice', avatar: 'https://cdn.quasar.dev/img/avatar2.jpg' }, date: new Date(), local: true }
        ],
        lastMessage: {
            id: 1,
            text: 'Welcome to General!',
            local: false,
            userId: 2,
            channelId: 1,
            date: new Date(),
            sender: { id: 2, nickname: 'Alice', avatar: 'https://cdn.quasar.dev/img/avatar2.jpg' },
        }
    },
    {
        id: 2,
        name: 'Random',
        messages: [
            { id: 2, text: 'Random thoughts here', sender: { id: 3, nickname: 'Bob', avatar: 'https://cdn.quasar.dev/img/avatar3.jpg' }, date: new Date(), local: true }
        ],
        lastMessage: {
            id: 2,
            text: 'Random thoughts here',
            local: false,
            userId: 3,
            channelId: 2,
            date: new Date(),
            sender: { id: 3, nickname: 'Bob', avatar: 'https://cdn.quasar.dev/img/avatar3.jpg' },
        }
    },
    {
        id: 3,
        name: 'Developers',
        messages: [
            { id: 1, text: 'Hey, welcome!', sender: fakeUser, date: new Date(), local: true },
            { id: 2, text: 'Hello! How are you?', sender: { nickname: 'Alice' }, date: new Date(), local: false },
            { id: 3, text: 'All good!', sender: fakeUser, date: new Date(), local: true },
        ],
        lastMessage: {
            id: 3,
            text: 'Push to main?',
            local: true,
            userId: 1,
            channelId: 3,
            date: new Date(),
            sender: fakeUser,
        }
    },
])

/* currently opened channel */
const currentChannel = ref<any>(null)

/* fake members data */
const channelMembers = ref([
    fakeUser,
    { id: 2, nickname: 'Alice', email: 'alice@mail.com', avatar: 'https://cdn.quasar.dev/img/avatar2.jpg' },
    { id: 3, nickname: 'Bob', email: 'bob@mail.com', avatar: 'https://cdn.quasar.dev/img/avatar3.jpg' },
])

/* fake messages for demonstration */


/* filtering channels by search query */
const filteredChannels = computed(() => {
    if (!searchQuery.value) return channels.value
    return channels.value.filter(c => c.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

/* switch current channel */
function openChannel(channel: any) {
    currentChannel.value = channel

    if (window.innerWidth < 1024) {
        splitterModel.value = 0
        splitterDisabled.value = true
    }
}

/* create new mock channel */
function createChannel() {
    if (!channelName.value) return

    const fakeUser = {
        id: 1,
        nickname: 'Kal',
        avatar: 'https://cdn.quasar.dev/img/avatar4.jpg',
    }

    channels.value.push({
        id: Date.now(),
        name: channelName.value,
        messages: [],
        lastMessage: {
            id: Date.now(),
            text: 'Empty channel',
            local: true,
            userId: fakeUser.id,
            channelId: Date.now(),
            date: new Date(),
            sender: fakeUser,
        },
    })

    $q.notify({ type: 'positive', message: `Channel "${channelName.value}" created!` })
    channelName.value = ''
    showCreateDialog.value = false
}

/* send a new message (mock only) */
function sendMessage() {
    if (!newMessage.value.trim() || !currentChannel.value) return
    let newMessageObj = {
        id: Date.now(),
        text: newMessage.value,
        sender: fakeUser,
        date: new Date(),
        local: true,
    }
    currentChannel.value.messages.push(newMessageObj);
    currentChannel.value.lastMessage = newMessageObj;
    newMessage.value = ''
    $q.notify({ type: 'info', message: 'Message sent (mock)' })
}

function addMember() {
  if (!newMemberNickname.value.trim() || !newMemberEmail.value.trim()) {
    $q.notify({ type: 'warning', message: 'Please fill both nickname and email' })
    return
  }
  if (channelMembers.value.find(m => m.nickname === newMemberNickname.value)) {
    $q.notify({ type: 'negative', message: 'User already in the channel' })
    return
  }
  const newMember = {
    id: Date.now(),
    nickname: newMemberNickname.value,
    email: newMemberEmail.value,
    avatar: 'https://cdn.quasar.dev/img/avatar.png'
  }
  channelMembers.value.push(newMember)
  $q.notify({ type: 'positive', message: `${newMemberNickname.value} added to channel!` })
  newMemberNickname.value = ''
  newMemberEmail.value = ''
  showAddUserDialog.value = false
}

function removeMember(member: any) {
  channelMembers.value = channelMembers.value.filter(m => m.id !== member.id)
  $q.notify({ type: 'warning', message: `${member.nickname} removed from channel.` })
}

function leaveChannel() {
  if (!currentChannel.value) return
  channels.value = channels.value.filter(c => c.id !== currentChannel.value.id)
  currentChannel.value = null
  channelMembers.value = channelMembers.value.filter(m => m.id !== fakeUser.id)
  showMembersDialog.value = false
  $q.notify({ type: 'info', message: 'You left the channel.' })
}

window.addEventListener("resize", () => {
    if (window.innerWidth < 1024) {
        splitterDisabled.value = true
        splitterModel.value = 100
    } else {
        splitterDisabled.value = false
        splitterModel.value = 25
    }
})

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

/* responsive adjustments */
@media screen and (max-width:1024px) {
    .q-splitter--vertical>.q-splitter__separator>div {
        display: none;
    }

    .back-button {
        display: inline-flex;
    }
}
</style>