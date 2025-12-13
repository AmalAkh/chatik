<template>
    <q-dialog v-model="model">
        <q-card style="min-width: 350px; max-height: 80vh;">
            <q-card-section class="row items-center justify-between">
                <div class="text-h6">Channel members</div>

                <q-btn flat color="negative" icon="logout" label="Leave" size="sm" :disable="!channel"
                    @click="$emit('leave')" />
            </q-card-section>

            <q-separator />

            <q-card-section class="scroll" style="max-height: 60vh; overflow-y: auto;">
                <div v-if="!channel" class="text-grey text-center q-mt-md">
                    No channel selected
                </div>

                <div v-else-if="members.length === 0" class="text-grey text-center q-mt-md">
                    No members yet
                </div>

                <q-item v-else v-for="member in members" :key="member.id">
                    <q-item-section>
                        <q-item-label>{{ member.nickname }}</q-item-label>
                        <q-item-label caption>{{ member.email }}</q-item-label>
                    </q-item-section>

                    <q-item-label caption>
                        <q-badge :color="member.status === 'online'
                            ? 'positive'
                            : member.status === 'dnd'
                                ? 'orange'
                                : 'grey'" :label="member.status" />
                    </q-item-label>

                    <q-item-section side>
                        <template v-if="isOwner(member.id)">
                            <q-badge color="primary" label="Owner" />
                        </template>

                        <template v-else-if="isMe(member.id)">
                            <q-badge color="secondary" label="You" />
                        </template>

                        <template v-else-if="canRemove(member.id)">
                            <q-btn flat round dense icon="remove_circle" color="negative"
                                @click="$emit('kick', member.id)" />
                        </template>
                    </q-item-section>
                </q-item>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn v-if="canInvite" flat label="Add user" color="primary" @click="$emit('open-invite')" />
                <q-btn flat label="Close" color="primary" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Channel, User } from 'src/models'

const props = defineProps<{
    modelValue: boolean
    channel: Channel | undefined
    members: User[]
    myId: number
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'leave'): void
    (e: 'kick', userId: number): void
    (e: 'open-invite'): void
}>()

const model = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
})

const canInvite = computed(() => {
    const ch = props.channel
    if (!ch) return false
    return !ch.isPrivate || ch.ownerId === props.myId
})

function isOwner(userId: number) {
    const ch = props.channel
    if (!ch) return false
    return userId === ch.ownerId
}

function isMe(userId: number) {
    return userId === props.myId
}

function canRemove(userId: number) {
    const ch = props.channel
    if (!ch) return false
    if (ch.isPrivate) {
        return ch.ownerId === props.myId && userId !== props.myId
    }
    return userId !== ch.ownerId && userId !== props.myId
}
</script>