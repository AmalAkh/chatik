<script setup lang="ts">
    interface Props {
        name: string
        lastMessage?: string
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
                {{ lastMessage || 'No messages yet' }}
            </q-item-label>
        </q-item-section>
    </q-item>
</template>
