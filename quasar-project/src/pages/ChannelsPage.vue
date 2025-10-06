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
                        <channel-item v-for="channel in sortedChannels"  :key="channel.id" :last-message="channel.lastMessage"  :name="channel.name" 
                        :class="{'selected':channel.id == currentChannel?.id}"
                            @click="openChannel(channel)" />
                    </q-scroll-area>
                </div>
            </template>

            <!-- right panel with chat -->
            <template v-slot:after>
                <div class="flex full-height chat-view">
                    <div class="chat-top-area">
                        <q-btn class="back-button" v-show="splitterDisabled" flat round color="primary" size="md" icon="arrow_back"
                            @click="splitterModel = 100" />
                        <img class="q-message-avatar q-message-avatar--sent"
                            src="https://cdn.quasar.dev/img/avatar4.jpg" aria-hidden="true">
                        <p>{{ currentChannel?.name }}</p>
                        <q-btn outline round color="primary" size="md" icon="info" />
                    </div>

                    <!-- chat messages -->
                    <q-scroll-area class="chat-scroll-area no-scrollbar" ref="chatMessagesScrollArea">
                        <q-chat-message label="Sunday, 19th" />
                        <q-chat-message v-for="message in messages" :name="message.sender.nickname" avatar="https://cdn.quasar.dev/img/avatar4.jpg"
                            :text="[message.text]" :sent="message.local" :key="message.id.toString()+message.userId.toString()" :stamp="message.date.toString()" />
                            
                        
                       
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

const router = useRouter();



const splitterModel = ref(25)
const splitterDisabled = ref(false)
const newMessage = ref("")
const showCreateDialog = ref(false)
const isPrivate = ref(false)

// list of channels
const channels = ref<Channel[]>([])
const currentChannel = ref<Channel>();
const channelName = ref("")
const chatMessagesScrollArea = ref<any>(null);

// handle responsive view
window.addEventListener("resize", ()=>
{
    if (window.innerWidth < 1024) {
        splitterDisabled.value = true
        splitterModel.value = 100
    }else
    {
        splitterDisabled.value = false;
        splitterModel.value = 25;
    }
})

// open channel (mobile: switches view)


// load channels from backend
async function loadChannels() {
    try {
        const res = await api.get('/channels')
        channels.value = res.data.map((channel:Channel)=>
        {
            if(channel.lastMessage)
                convertMessageDate(channel.lastMessage);
            return channel;
        })
    } catch (err) {
        console.error(err)
    }
}
function convertMessageDate(msg:ChannelMessage)
{
    msg.date = new Date(msg.date);
}
const sortedChannels = computed(()=>
{
    return [...channels.value].sort((channel1:Channel, channel2:Channel)=>
    {
        

        const t1 = channel1.lastMessage ? channel1.lastMessage.date.getTime() : 0;
        const t2 = channel2.lastMessage ? channel2.lastMessage.date.getTime() : 0;
        return -1*(t1-t2);

    })
})
// create new channel
async function createChannel() {
    if (!channelName.value) return
    try {
        await api.post(
            '/channels',
            { name: channelName.value, isPrivate: isPrivate.value },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        )
        channelName.value = ""
        isPrivate.value = false
        showCreateDialog.value = false
        await loadChannels()
    } catch (err) {
        console.error(err)
    }
}
const currentSocket = ref()
// load channels on page mount
onMounted(async () => {
    await loadChannels();
    currentSocket.value = io("http://localhost:3333", 
    {
        extraHeaders: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
        }
    })
    currentSocket.value.on("connect", () => {
        console.log("Connected!", currentSocket.value.id);
    });

    currentSocket.value.on("disconnect", (reason:any) => {
        console.log("Disconnected:", reason);
    });

    currentSocket.value.on("connect_error", async (err:any) => {
        
        console.log("Connection error:", err.message); // <-- will fire if auth fails
        await router.push("/auth/login");
    });

    currentSocket.value.on("new_message", async (msg:ChannelMessage)=>
    {
        convertMessageDate(msg);
        if(msg.channelId == currentChannel.value?.id)
        {
            msg.local = msg.userId.toString() == localStorage.getItem("userid");
            messages.value?.push(msg);
            await nextTick();
            chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100)

        }
        const targetChannel = channels.value.find((channel)=>
        {
            return channel.id == msg.channelId;
        })
        
        if(targetChannel)
            targetChannel.lastMessage = msg;
    })
    
    
})

const messages = ref<ChannelMessage[]>();
async function loadMessages()
{
    const res = await api.get(`/messages/${currentChannel.value!.id}`)
    
    messages.value = res.data.map((message:ChannelMessage)=>
    {
       
        let msg = snakeToCamel(message)
        msg.local = msg.userId == localStorage.getItem("userid")
        convertMessageDate(msg);
        return msg;
    }) as ChannelMessage[]
    
    
    
}
function snakeToCamel(obj: any): any {
    const result: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            // Convert snake_case to camelCase
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            result[camelKey] = obj[key];
        }
    }
    return result;
}
async function openChannel(channel:Channel) {
    currentChannel.value = channel;
    void loadMessages()
    await nextTick();
    setTimeout(()=>
    {
        chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100,10)

    },100)

     if (window.innerWidth < 1024) {
        splitterDisabled.value = true
        splitterModel.value = 0
    }
    
}
async function sendMessage()
{
    if(currentChannel.value)
    {
        let response = await api.post(`/messages/${currentChannel.value.id}`, {text:newMessage.value});
        let newMsg = snakeToCamel(response.data)
        newMsg.local = true;
        messages.value?.push(newMsg as ChannelMessage);
        currentSocket.value.emit("new_message", newMsg);
        await nextTick();
        convertMessageDate(newMsg);
        chatMessagesScrollArea.value?.setScrollPercentage('vertical', 100)
        
        const targetChannel = channels.value.find((channel)=>
        {
            return channel.id == newMsg.channelId;
        })
        
        if(targetChannel)
            targetChannel.lastMessage = newMsg;

        newMessage.value = "";

        
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