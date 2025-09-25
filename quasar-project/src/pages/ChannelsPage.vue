<template>
   
    <q-page  style="min-height:100%">
       
    <q-splitter
        v-model="splitterModel"
        class="full-height"
        >

      <template v-slot:before>
        <q-scroll-area>
            
        </q-scroll-area>
      </template>

      <template v-slot:after>
        <q-scroll-area>
            
        </q-scroll-area>
      </template>

    </q-splitter>
    </q-page>
</template>
  
<script setup lang="ts">
import { ref } from 'vue';



const splitterModel = ref(25);
</script>
<style lang="scss">
    .chat-view
    {
        height:100vh;
        flex-direction: column;
    }
    .message-bottom-bar
    {
      
        padding: 10px
    }
</style>
  