<template>
  <router-view />
</template>

<script setup lang="ts">
//
import {watch} from 'vue';
import { useQuasar } from 'quasar'

const $q = useQuasar()
watch(() => $q.appVisible, val => {
    console.log(val ? 'App became visible' : 'App went in the background');
    navigator.serviceWorker.controller?.postMessage({type:"app_visibility",data:val});
})

navigator.serviceWorker.addEventListener("message", event => {

  const message = event.data;
  $q.notify({
    type: 'info',
    message: `New message from ${message.data.title}: ${message.data.body}`,
    position: 'top-right'
  })
});
</script>
