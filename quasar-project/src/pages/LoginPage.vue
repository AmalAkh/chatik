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
            <q-form @submit.prevent="onSubmit" class="q-gutter-xs">
                <!-- email input -->
                <q-input filled v-model="email" label="Email" type="email"
                    :rules="[val => !!val || 'Email is required']" />

                <!-- password input -->
                <q-input filled v-model="password" label="Password" type="password"
                    :rules="[val => !!val || 'Password is required']" />

                <!-- login button -->
                <q-btn label="Login" type="submit" color="primary" class="full-width" />
            </q-form>

            <!-- link to registration -->
            <q-card-actions class="column q-gutter-sm full-width">
                <q-btn flat label="Register" color="secondary" @click="goToRegister" />
            </q-card-actions>
        </q-card>
    </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

/* router instance for navigation */
const router = useRouter()

/* reactive form fields */
const email = ref('')
const password = ref('')

/* mock login function (no API calls) */
function onSubmit() {
    console.log('Mock login attempt:', email.value, password.value)

    // save mock login info
    localStorage.setItem('mock_user_email', email.value)
    localStorage.setItem('mock_logged_in', 'true')

    // navigate to channels page
    void router.push('/channels')
}

/* go to registration page */
function goToRegister() {
    void router.push('/auth/register')
}
</script>