<template>
  <!-- main page -->
  <q-page class="flex flex-center">
    <!-- login card -->
    <q-card class="q-pa-lg shadow-2" style="width: 350px; max-width: 90vw;">
      
      <!-- header section -->
      <q-card-section>
        <div class="text-h6 text-center">Login</div>
      </q-card-section>

      <!-- login form -->
      <q-form @submit="onSubmit" class="q-gutter-md">
        
        <!-- email input -->
        <q-input
          filled
          v-model="email"
          label="Email"
          type="email"
          :rules="[val => !!val || 'Email is required']"
        />
        
        <!-- password input -->
        <q-input
          filled
          v-model="password"
          label="Password"
          type="password"
          :rules="[val => !!val || 'Password is required']"
        />

        <!-- submit button -->
        <q-card-actions class="row justify-center q-mt-xs">
          <q-btn label="Login" type="submit" color="primary" class="full-width" />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/* reactive form fields */
const email = ref<string>('')
const password = ref<string>('')

/* form submit handler */
function onSubmit (): void {
  console.log('Login attempt', email.value, password.value)
}
</script>
