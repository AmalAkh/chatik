<script setup lang="ts">
import type{ ChannelMessage } from 'src/models';

    interface Props {
        name: string
        lastMessage?: ChannelMessage | null
    }

    defineProps<Props>()
</script>

<template>
    <q-item clickable>
        <q-item-section top avatar>
            <q-avatar color="primary" text-color="white" icon="chat" />
        </q-item-section>

        <q-item-section>
            <q-item-label>{{ name }}</q-item-label>
            <q-item-label caption lines="2">
                <div v-if="lastMessage">
                    <b class="user-badge">{{lastMessage?.sender.nickname}}:</b>
                    {{ lastMessage?.text || 'No messages yet' }}
                </div>
                <div v-else>
                    No messages yet 
                </div>
            </q-item-label>
        </q-item-section>
    </q-item>
</template>
<style lang="scss" scoped>
    .user-badge
    {
        background-color: lightgray;
        border-radius: 6px; 
        padding-left: 10px;
        padding-right: 10px;
    }
    .q-item
    {
        &.selected
        {
            background-color: #f6f6f6;
        }
    }

</style>
