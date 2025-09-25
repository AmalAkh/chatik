<template>
  <q-layout class="flex" style="flex-direction: column;" view="lHh Lpr lFf" >
    <q-toolbar style="flex:none; height: auto!important;" class="bg-primary text-white row-auto">
     
      <q-avatar>
        <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg">
      </q-avatar>

      <q-toolbar-title>Chatik</q-toolbar-title>

      <q-btn flat round dense icon="account_circle" />
    </q-toolbar>
      

    <q-page-container style="flex: auto;">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">

</script>
