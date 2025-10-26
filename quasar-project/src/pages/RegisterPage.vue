<template>
    <!-- main page -->
    <q-page class="flex flex-center">
        <!-- register card -->
        <q-card class="q-pa-lg shadow-2" style="width: 350px; max-width: 90vw;">

            <!-- header -->
            <q-card-section>
                <div class="text-h6 text-center">Register</div>
            </q-card-section>

            <!-- registration form -->
            <q-form @submit.prevent="onSubmit" class="q-gutter-xs">
                <!-- first name input -->
                <q-input filled v-model="firstName" label="First name"
                    :rules="[val => !!val || 'First name is required']" />

                <!-- last name input -->
                <q-input filled v-model="lastName" label="Last name"
                    :rules="[val => !!val || 'Last name is required']" />

                <!-- nickname input -->
                <q-input filled v-model="nickname" label="Nickname" :rules="[val => !!val || 'Nickname is required']" />

                <!-- email input -->
                <q-input filled v-model="email" label="Email" type="email"
                    :rules="[val => !!val || 'Email is required']" />

                <!-- password input -->
                <q-input filled v-model="password" label="Password" type="password"
                    :rules="[val => !!val || 'Password is required']" />

                <!-- confirm password input -->
                <q-input filled v-model="confirmPassword" label="Confirm password" type="password"
                    :rules="[val => val === password || 'Passwords must match']" />

                <!-- submit button -->
                <q-btn label="Register" type="submit" color="primary" class="full-width" />
            </q-form>

            <!-- link to login -->
            <q-card-actions class="column q-gutter-sm full-width">
                <q-btn flat label="Login" color="secondary" @click="goToLogin" />
            </q-card-actions>
        </q-card>
    </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

/* router for navigation */
const router = useRouter()

/* reactive form fields */
const email = ref('')
const password = ref('')
const firstName = ref('')
const lastName = ref('')
const nickname = ref('')
const confirmPassword = ref('')

/* mock register function (no API calls) */
function onSubmit() {
    console.log('Mock registration:', {
        firstName: firstName.value,
        lastName: lastName.value,
        nickname: nickname.value,
        email: email.value,
    })

    // save mock user data
    localStorage.setItem('mock_registered_user', JSON.stringify({
        firstName: firstName.value,
        lastName: lastName.value,
        nickname: nickname.value,
        email: email.value,
    }))

    // mock success message and redirect
    alert('Registration successful (mock)')
    void router.push('/auth/login')
}

/* navigate to login page */
function goToLogin() {
    void router.push('/auth/login')
}
</script>