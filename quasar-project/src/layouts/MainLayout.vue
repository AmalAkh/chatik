<template>
  <q-layout class="flex" style="flex-direction: column;" view="lHh Lpr lFf">
    <q-toolbar style="flex:none; height:auto!important;" class="bg-primary text-white row-auto">
      

      <q-toolbar-title>Chatik</q-toolbar-title>

      <q-toggle
        label="Get only personal messages"
        color="pink"
        @update:model-value="toggleOnlyPersonalMessages"
        v-model="onlyPersonalMessages"
        style="margin-right: 40px;"
      />

      <q-btn flat round dense icon="logout" @click="logout" :title="'Logout'" />
    </q-toolbar>

    <q-page-container style="flex:auto;">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRouter, /// <reference path="" />
 } from 'vue-router'
import { useQuasar } from 'quasar'
import {ref} from 'vue';
import { urlBase64ToUint8Array } from 'src/utils/util-functions';
import { api } from 'boot/axios'
import { PushNotificationsManager } from 'src/utils/PushNotificationsManager';

const router = useRouter()
const $q = useQuasar()

async function logout() {
  await PushNotificationsManager.unsubscribeUser();
  localStorage.removeItem('token')
  localStorage.removeItem('userid')
  
  
  $q.notify({ type: 'info', message: 'Logged out', position: 'top' })
  await router.push('/auth/login')
  
  
}

const onlyPersonalMessages = ref(false);

function toggleOnlyPersonalMessages(value:any)
{
  navigator.serviceWorker.controller?.postMessage({type:"only_personal_messages", data:value});
}
</script>
