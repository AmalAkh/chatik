<template>
    <q-dialog v-model="model">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Invite user by nickname</div>
        </q-card-section>
  
        <q-card-section>
          <q-input
            v-model="nick"
            label="Enter nickname"
            autofocus
            @keyup.enter="emitInvite"
          />
        </q-card-section>
  
        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="model = false" />
          <q-btn
            color="primary"
            label="Invite"
            :loading="loading"
            :disable="!nick.trim()"
            @click="emitInvite"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  
  const props = defineProps<{
    modelValue: boolean
    nickname: string
    loading: boolean
  }>()
  
  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'update:nickname', v: string): void
    (e: 'invite'): void
  }>()
  
  const model = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v),
  })
  
  const nick = computed({
    get: () => props.nickname,
    set: (v: string) => emit('update:nickname', v),
  })
  
  function emitInvite() {
    emit('invite')
  }
  </script>
  