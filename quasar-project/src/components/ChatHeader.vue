<template>
    <div class="chat-top-area">
        <q-btn class="back-button" flat round icon="arrow_back" v-show="showBack" @click="$emit('back')" />

        <div class="channel-title">
            <p>{{ channel?.name }}</p>

            <div class="typing-users-area" v-show="isAnybodyTyping">
                <p class="typing-user fk">Typing:</p>
                <p class="typing-user" v-for="(text, nickname) in typingUsers" :key="nickname"
                    @click="$emit('show-typing', nickname)">
                    {{ nickname }}
                </p>
            </div>
        </div>

        <q-btn outline color="primary" round icon="info" @click="$emit('open-members')" />
    </div>
</template>

<script setup lang="ts">
import type { Channel } from 'src/models'

defineProps<{
    channel?: Channel | undefined
    typingUsers: Record<string, string>
    isAnybodyTyping: boolean
    showBack: boolean
}>()

defineEmits([
    'open-members',
    'show-typing',
    'back'
])
</script>