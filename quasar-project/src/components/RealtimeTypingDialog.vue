<template>
    <q-dialog v-model="model">
      <q-card class="real-typing-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ user ?? '' }} is typing:</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
  
        <q-card-section>
          {{ message }}
        </q-card-section>
      </q-card>
    </q-dialog>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  
  const props = defineProps<{
    modelValue: boolean
    user: string | undefined
    message: string
  }>()
  
  const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
  }>()
  
  const model = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v),
  })
  </script>
  
  <style scoped lang="scss">
  .real-typing-card {
    width: 40%;
  }
  
  @media screen and (max-width: 1024px) {
    .real-typing-card {
      width: 95%;
    }
  }
  </style>
  