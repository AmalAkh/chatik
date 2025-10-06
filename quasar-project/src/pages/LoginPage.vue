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
            <q-form @submit="onSubmit" class="q-gutter-xs">
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
                <q-btn label="Login" type="submit" color="primary" class="full-width" />
            </q-form>

            <q-card-actions class="column q-gutter-sm full-width">
                <q-btn flat label="Register" color="secondary" @click="goToRegister"/>
            </q-card-actions>
        </q-card>
    </q-page>
</template>
  
<script setup lang="ts">
    import { ref } from 'vue'
    import { api } from 'boot/axios'
    import type { AxiosError } from 'axios'
    import { useRouter } from 'vue-router'

    /* router for navigation */
    const router = useRouter()
    
    /* reactive form fields */
    const email = ref<string>('')
    const password = ref<string>('')

    /* form submit handler */
    async function onSubmit () {
        console.log('Login attempt', email.value, password.value)
        try {
            const res = await api.post('/auth/login', {
                email: email.value,
                password: password.value,
            })

            console.log('Login success:', res.data)

            // save token to localStorage
            localStorage.setItem('token', res.data.token.token)

            localStorage.setItem('userid', res.data.user.id)

            // redirect to channels
            void router.push('/channels')
        } catch (err: unknown) {
            const e = err as AxiosError
            console.error('Login failed:', e.response?.data || e.message)
        }
    }

    /* navigate to register */
    async function goToRegister (): Promise<void> {
        await router.push('/auth/register')
    }
</script>
  