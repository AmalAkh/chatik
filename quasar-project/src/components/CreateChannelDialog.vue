<template>
    <q-dialog v-model="model">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Create a new channel</div>
        </q-card-section>
  
        <q-card-section>
          <q-input v-model="name" label="Channel name" autofocus />
          <q-toggle v-model="priv" label="Private channel" />
        </q-card-section>
  
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="model = false" />
          <q-btn
            color="primary"
            label="Create"
            :disable="!name.trim()"
            @click="$emit('create')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  
  const props = defineProps<{
    modelValue: boolean
    channelName: string
    isPrivate: boolean
  }>()
  
  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'update:channelName', v: string): void
    (e: 'update:isPrivate', v: boolean): void
    (e: 'create'): void
  }>()
  
  const model = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v),
  })
  
  const name = computed({
    get: () => props.channelName,
    set: (v: string) => emit('update:channelName', v),
  })
  
  const priv = computed({
    get: () => props.isPrivate,
    set: (v: boolean) => emit('update:isPrivate', v),
  })
  </script>
  