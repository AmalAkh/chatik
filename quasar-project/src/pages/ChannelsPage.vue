<template>
   
    <q-page  style="min-height:100%">
       
    <q-splitter
        v-model="splitterModel"
        class="full-height"
        >

      <template v-slot:before>
        
        <div class="channels-area">
            <q-input v-model="newMessage" :dense="true">
                <template v-slot:prepend>
                <q-icon name="search" style="margin: 10px;" />
                </template>
                <template v-slot:append>
                <q-icon name="close" style="margin: 10px;"  class="cursor-pointer" />
                </template>

                
            </q-input>
            <q-scroll-area class=".channels-scrollable-area" style="height: 100%;">
                <div v-for="n in 100" :key="n" class="q-py-xs">
                   
                    <channel-item/>
                </div>
            </q-scroll-area>
        </div>
      </template>

      <template v-slot:after>
        <div class="flex full-height chat-view" >
            <div class="chat-top-area">
                <img class="q-message-avatar q-message-avatar--sent" src="https://cdn.quasar.dev/img/avatar4.jpg" aria-hidden="true">
                <p>Test</p>
              
                <q-btn outline round color="primary" icon="info" />
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
                <q-chat-message
                    name="Jane"
                    avatar="https://cdn.quasar.dev/img/avatar3.jpg"
                    :text="['doing fine, how r you?']"
                    stamp="4 minutes ago"
                />
                <q-chat-message
                    name="Jane"
                    avatar="https://cdn.quasar.dev/img/avatar3.jpg"
                    :text="['doing fine, how r you?']"
                    stamp="4 minutes ago"
                />
                <q-chat-message
                    name="Jane"
                    avatar="https://cdn.quasar.dev/img/avatar3.jpg"
                    :text="['doing fine, how r you?']"
                    stamp="4 minutes ago"
                />
                <q-chat-message
                    name="Jane"
                    avatar="https://cdn.quasar.dev/img/avatar3.jpg"
                    :text="['doing fine, how r you?']"
                    stamp="4 minutes ago"
                />
                <q-chat-message
                    name="Jane"
                    avatar="https://cdn.quasar.dev/img/avatar3.jpg"
                    :text="['doing fine, how r you?']"
                    stamp="4 minutes ago"
                />
                <q-chat-message
                    name="Jane"
                    avatar="https://cdn.quasar.dev/img/avatar3.jpg"
                    :text="['doing fine, how r you?']"
                    stamp="4 minutes ago"
                />
                <q-chat-message
                    name="Jane"
                    avatar="https://cdn.quasar.dev/img/avatar3.jpg"
                    :text="['doing fine, how r you?']"
                    stamp="4 minutes ago"
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
                <q-input filled v-model="newMessage" placeholder="Message"  />
                <q-btn flat round color="primary" icon="send" />

            </div>
        </div>
      </template>

    </q-splitter>
    </q-page>
</template>
  
<script setup lang="ts">
import { ref } from 'vue';
import ChannelItem from 'src/components/ChannelItem.vue';


const splitterModel = ref(25);
const newMessage = ref("");


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
        padding: 8px;
        display: flex;
        align-items: center;
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
    
</style>
  