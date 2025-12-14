<template>
    <div class="bottom-message-area flex">
        <q-input class="new-message-input" filled v-model="model" placeholder="Message" :disable="disabled"
            @keyup.enter="emitSend" />
        <q-btn flat round color="primary" icon="send" :disable="disabled" @click="emitSend" />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    modelValue: string
    disabled: boolean
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: string): void
    (e: 'send'): void
    (e: 'typing', v: string): void
}>()

const model = computed({
    get: () => props.modelValue,
    set: (v: string) => {
        emit('update:modelValue', v)
        emit('typing', v) // сохраняем поведение @update:model-value="typingMessage"
    }
})

function emitSend() {
    emit('send')
}
</script>