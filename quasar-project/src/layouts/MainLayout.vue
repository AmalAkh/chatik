<template>
  <q-layout class="flex" style="flex-direction: column;" view="lHh Lpr lFf">
    <q-toolbar style="flex:none; height: auto!important;" class="bg-primary text-white row-auto">

      <q-avatar>
        <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
      </q-avatar>

      <q-toolbar-title>Chatik</q-toolbar-title>

      <q-btn 
        flat 
        round 
        dense 
        icon="logout" 
        color="white"
        @click="logout"
      />
    </q-toolbar>

    <q-page-container style="flex: auto;">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()

function logout() {
  localStorage.removeItem('user')
  $q.notify({ type: 'info', message: 'You have logged out.' })
  void router.push('/auth/login')
}
</script>
