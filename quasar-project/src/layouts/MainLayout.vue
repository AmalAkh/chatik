<template>
  <q-layout class="flex" style="flex-direction: column;" view="lHh Lpr lFf">
    <q-toolbar style="flex:none; height: auto!important;" class="bg-primary text-white row-auto">

      <q-avatar>
        <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
      </q-avatar>

      <q-toolbar-title>Chatik</q-toolbar-title>
      
     

      <q-btn 
      class="settings"
        flat 
        round 
        dense 
        icon="settings" 
        color="white"
        @click="showSettingsDialog = true"
        
      />
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
     <!-- dialog for creating new channel -->
        <q-dialog v-model="showSettingsDialog">
            <q-card style="min-width: 350px">
                <q-card-section>
                    <div class="text-h6">Create a new channel</div>
                </q-card-section>

                <!-- channel creation form -->
                <q-card-section>
                    <q-toggle
                      v-model="onlyPersonalMessagesDialog"
                      label="Deliver only messages that addressed to you"
                    />
                </q-card-section>

                
            </q-card>
        </q-dialog>
  </q-layout>
  
</template>

<script setup lang="ts">
import {ref } from "vue";
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()

const currentStatus = ref('online');
const showSettingsDialog = ref(false);

const onlyPersonalMessagesDialog = ref(false);

function logout() {
  localStorage.removeItem('user')
  $q.notify({ type: 'info', message: 'You have logged out.' })
  void router.push('/auth/login')
}
</script>
<style lang="scss">
  .q-btn.settings
  {
    margin:10px
  }
</style>
