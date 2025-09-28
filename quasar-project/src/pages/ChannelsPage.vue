<template>
   
    <q-page  style="min-height:100%">
       
    <q-splitter
        v-model="splitterModel"
        class="full-height"
        :disable="splitterDisabled"
        unit="%"
        :limits="[0,100]"
        >

      <template v-slot:before>
        
        <div class="channels-area">
            <div class="row justify-center items-center q-mt-sm">
            <q-btn 
                flat 
                round 
                color="primary" 
                icon="add_circle" 
                @click="showCreateDialog = true" 
            />
                <span class="text-subtitle2">Channels</span>
            </div>


            <q-input v-model="newMessage" dense>
                <template v-slot:prepend>
                    <q-icon name="search" style="margin: 10px;" />
                </template>
                <template v-slot:append>
                    <q-icon name="close" style="margin: 10px;"  class="cursor-pointer" />
                </template>
            </q-input>

            <q-scroll-area class="channels-scrollable-area" style="height: 100%;">
                <channel-item
                    v-for="channel in channels"
                    :key="channel.id"
                    :name="channel.name"
                    @click="openChannel"
                />
            </q-scroll-area>
        </div>
      </template>

      <template v-slot:after>
        <div class="flex full-height chat-view" >
            <div class="chat-top-area">
                <q-btn class="back-button" flat round color="primary" size="md" icon="arrow_back" @click="splitterModel = 100" />
                <img class="q-message-avatar q-message-avatar--sent" src="https://cdn.quasar.dev/img/avatar4.jpg" aria-hidden="true">
                <p>Test</p>
              
                <q-btn outline round color="primary" size="md" icon="info" />
            </div>
            
            <q-scroll-area class="chat-scroll-area no-scrollbar">
                <q-chat-message
                    label="Sunday, 19th"
                />

                <q-chat-message
                    name="me"
                    avatar="https://cdn.quasar.dev/img/avatar4.jpg"
                    :text="['hey, how are you?']"
                    sent
                    stamp="7 minutes ago"
                />
                <q-chat-message
                    name="Jane"
                    avatar="https://cdn.quasar.dev/img/avatar3.jpg"
                    :text="['doing fine, how r you?']"
                    stamp="4 minutes ago"
                />
            </q-scroll-area>
            <div class="bottom-message-area flex">
                <q-btn flat round color="primary" icon="attach_file" />
                <q-input class="new-message-input" filled v-model="newMessage" placeholder="Message"  />
                <q-btn flat round color="primary" icon="send" />
            </div>
        </div>
      </template>

    </q-splitter>
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
    import { ref, onMounted } from 'vue';
    import ChannelItem from 'src/components/ChannelItem.vue';
    import { api } from 'boot/axios'; // changed: using axios instance

    interface Channel {
        id: number
        name: string
        isPrivate: boolean
        ownerId: number
    }

    interface Props {
        name: string
        lastMessage?: string
    }

    defineProps<Props>()

    const splitterModel = ref(25);
    const splitterDisabled = ref(false);
    const newMessage = ref("");
    const showCreateDialog = ref(false);
    const isPrivate = ref(false)

    // changed: added for channels
    const channels = ref<Channel[]>([]);
    const channelName = ref("");

    if(window.screen.width < 1024)
    {
        splitterDisabled.value = true;
        splitterModel.value = 100;
    }

    function openChannel()
    {
        splitterModel.value = -10;
    }

    // changed: load channels from backend
    async function loadChannels() {
        try {
            const res = await api.get('/channels');
            channels.value = res.data;
        } catch (err) {
            console.error(err);
        }
    }

    // changed: create channel
    async function createChannel() {
        if (!channelName.value) return;
        try {
            await api.post('/channels', { name: channelName.value, isPrivate: isPrivate.value }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
            channelName.value = ""
            isPrivate.value = false
            showCreateDialog.value = false
            await loadChannels()
        } catch (err) {
            console.error(err);
        }
    }

    onMounted(async () => {
        await loadChannels();
    });
</script>

<style lang="scss">

    .chat-view
    {
        .chat-scroll-area
        {
            flex:auto;
            background-color: #f6f6f6;
        }
        flex-direction: column;
    }
    .chat-top-area
    {
        flex:none;
        padding: 6px;
        display: flex;
        align-items: center;
        .q-message-avatar
        {
            height: 40px;
            width: 40px;
            min-width: auto;
        }
        p
        {
            margin-left: 10px;
            flex:auto;
        }
        .q-btn
        {
            margin: 4px;
        }
    }
    .bottom-message-area
    {
        flex-direction: row;
        padding: 10px;
        
        .q-input
        {
            flex:10;
            .q-field__control
            {
                height: 40px;
            }
        }
        .q-button
        {
            flex:2;
        }
    }
    .channels-scrollable-area
    {
        flex:auto;
    }
    .channels-area
    {
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    
    .back-button
    {
        display: none;
    }
    @media screen and (max-width:1024px)
    {
        .q-splitter--vertical > .q-splitter__separator > div
        {
            display: none;
        }
        .back-button
        {
            display: inline-flex;
        }
    }
    
</style>
  