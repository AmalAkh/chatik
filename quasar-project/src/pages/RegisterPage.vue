<template>
    <!-- main page -->
    <q-page class="flex flex-center">
        <!-- login card -->
        <q-card class="q-pa-lg shadow-2" style="width: 350px; max-width: 90vw;">
        
            <!-- header section -->
            <q-card-section>
                <div class="text-h6 text-center">Register</div>
            </q-card-section>

            <!-- login form -->
            <q-form @submit="onSubmit" class="q-gutter-xs">
                <!-- First Name input -->
                <q-input 
                    filled 
                    v-model="firstName" 
                    type="text" 
                    label="First name" 
                    :rules="[val => !!val || 'First name is required']"
                />

                <!-- Last Name input -->
                <q-input 
                    filled 
                    v-model="lastName" 
                    type="text" 
                    label="Last name" 
                    :rules="[val => !!val || 'Last name is required']"
                />

                <!-- nickname -->
                <q-input
                    filled
                    v-model="nickname"
                    label="Nickname"
                    :rules="[val => !!val || 'Nickname is required']"
                />

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

                <!-- confirm password -->
                <q-input
                    filled
                    v-model="confirmPassword"
                    label="Confirm password"
                    type="password"
                    :rules="[val => val === password || 'Passwords must match']"
                />
            </q-form>

            <!-- buttons -->
            <q-card-actions class="column q-gutter-sm full-width">
                <q-btn label="Register" type="submit" color="primary" class="full-width" />
                <q-btn flat label="Login" color="secondary" @click="goToLogin"/>
            </q-card-actions>
        </q-card>
    </q-page>
</template>
  
<script setup lang="ts">
    import { ref } from 'vue'
    import { useRouter } from 'vue-router'

    const router = useRouter()

    /* reactive form fields */
    const email = ref<string>('')
    const password = ref<string>('')
    const firstName = ref<string>('')
    const lastName = ref<string>('')
    const nickname = ref<string>('')
    const confirmPassword = ref<string>('')

    /* form submit handler */
    async function onSubmit (): Promise<void> {
        console.log('Register attempt', {
            firstName: firstName.value,
            lastName: lastName.value,
            nickname: nickname.value,
            email: email.value,
            password: password.value,
        })
        await router.push('/auth/login')
    }

    async function goToLogin (): Promise<void> {
        await router.push('/auth/login')
    }
</script>
