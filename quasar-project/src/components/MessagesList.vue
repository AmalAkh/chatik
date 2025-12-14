<template>
    <q-scroll-area class="chat-scroll-area no-scrollbar" ref="scrollArea">
        <q-infinite-scroll v-if="enabled" reverse ref="infiniteScroll" @load="loadMore" style="padding: 10px">
            <template #loading>
                <div class="row justify-center q-my-md">
                    <q-spinner-dots color="primary" size="40px" />
                </div>
            </template>

            <q-chat-message v-for="message in messages" :key="message.id.toString()"
                :name="message.sender?.nickname || 'User'" :text="[message.text]" :sent="message.local"
                :stamp="message.date.toString()" :bg-color="getMessageColor(message)">
                <template #default>
                    <div v-highlight-mention>
                        {{ message.text }}
                    </div>
                </template>
            </q-chat-message>
        </q-infinite-scroll>
    </q-scroll-area>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ChannelMessage } from 'src/models'
import vHighlightMention from '../utils/highlight-mention'

defineProps<{
    messages: ChannelMessage[]
    loadMore: (index: number, done: () => void) => void
    getMessageColor: (msg: ChannelMessage) => string
    enabled: boolean
}>()

const scrollArea = ref<any>(null)
const infiniteScroll = ref<any>(null)


defineExpose({
    scrollArea,
    infiniteScroll
})
</script>