<template>
    <q-scroll-area class="channels-scrollable-area" style="height: 100%;">
        <ChannelItem v-for="channel in sortedChannels" :key="channel.id" :last-message="channel.lastMessage"
            :name="channel.isPrivate ? channel.name + ' 🔒' : channel.name"
            :class="{ selected: channel.id === currentChannelId }" @click="$emit('open-channel', channel)" />
    </q-scroll-area>
</template>

<script setup lang="ts">
import ChannelItem from 'src/components/ChannelItem.vue'
import type { Channel } from 'src/models'

defineProps<{
  sortedChannels: Channel[]
  currentChannelId: number | undefined
}>()


defineEmits<{
    (e: 'open-channel', channel: Channel): void
}>()
</script>