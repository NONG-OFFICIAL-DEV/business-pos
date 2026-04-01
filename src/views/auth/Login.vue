<script setup>
  import { ref, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { useAppUtils } from '@/composables/useAppUtils'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const { notif } = useAppUtils()
  const store = useAuthStore()
  const router = useRouter()

  const email = ref('')
  const password = ref('')
  const visible = ref(false)
  const loading = ref(false)
  const generalError = ref('')
  const form = ref(null) // v-form ref

  // ── Validation Rules ───────────────────────────────────────────
  const emailRules = [
    v => !!v || 'Email is required',
    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Enter a valid email address',
    v => v.length <= 255 || 'Email is too long'
  ]

  const passwordRules = [
    v => !!v || 'Password is required',
    v => v.length >= 6 || 'Password must be at least 6 characters',
    v => v.length <= 128 || 'Password is too long'
  ]

  // ── Submit ─────────────────────────────────────────────────────
  const login = async () => {
    generalError.value = ''

    // Run Vuetify form validation first
    const { valid } = await form.value.validate()
    if (!valid) return

    loading.value = true

    try {
      const success = await store.login({
        email: email.value.trim(),
        password: password.value
      })

      if (success) {
        console.log(success);
        if(success.data.bu_type === 'restaurant') {
          router.push('/dining-table-view')
        } else {
          router.push('/pos/menu-list')
        }
        notif(t('messages.loginSucess'), { type: 'success', color: 'primary' })
      }
    } catch (err) {
      const res = err.response?.data

      if (res?.status === 'validation_error') {
        // Push server errors into Vuetify fields via error-messages
        if (res.errors?.email) {
          form.value.items.find(i => i.id?.includes('email'))?.reset?.()
          emailServerError.value = res.errors.email.join(', ')
        }
        if (res.errors?.password) {
          passwordServerError.value = res.errors.password.join(', ')
        }
      }

      if (res?.status === 'invalid_credentials') {
        generalError.value = res.message || 'Invalid email or password.'
      }

      if (!res) {
        generalError.value = 'Network error. Please try again.'
      }
    } finally {
      loading.value = false
    }
  }

  // Server-side error strings (appended to field rules)
  const emailServerError = ref('')
  const passwordServerError = ref('')

  // Clear server errors when user starts typing again
  const onEmailInput = () => {
    emailServerError.value = ''
    generalError.value = ''
  }
  const onPasswordInput = () => {
    passwordServerError.value = ''
    generalError.value = ''
  }

  const fullEmailRules = [...emailRules, () => emailServerError.value || true]
  const fullPasswordRules = [
    ...passwordRules,
    () => passwordServerError.value || true
  ]
</script>

<template>
  <v-container fluid class="login-page d-flex align-center justify-center pa-0">
    <div class="bg-shape shape-1" />
    <div class="bg-shape shape-2" />

    <v-card
      class="glass-card pa-10"
      width="100%"
      max-width="450"
      border="1px solid rgba(255,255,255,0.3)"
    >
      <!-- Logo & Title -->
      <div class="text-center mb-10">
        <div class="logo-wrapper mb-4">
          <v-icon icon="mdi-lightning-bolt" color="amber-darken-2" size="40" />
        </div>
        <h1 class="text-h4 font-weight-black tracking-tight text-slate-900">
          Nexus POS
        </h1>
        <p class="text-body-2 text-grey-darken-1 mt-2">
          Enter credentials to access your station
        </p>
      </div>

      <!-- Form -->
      <v-form ref="form" @submit.prevent="login" validate-on="blur">
        <!-- Email -->
        <v-text-field
          v-model="email"
          label="Email"
          variant="outlined"
          rounded="lg"
          prepend-inner-icon="mdi-email-outline"
          class="mb-3"
          density="comfortable"
          type="email"
          autocomplete="email"
          :rules="fullEmailRules"
          @input="onEmailInput"
          required
        />

        <!-- Password -->
        <v-text-field
          v-model="password"
          label="Password"
          variant="outlined"
          rounded="lg"
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          prepend-inner-icon="mdi-lock-outline"
          density="comfortable"
          autocomplete="current-password"
          :rules="fullPasswordRules"
          @input="onPasswordInput"
          @click:append-inner="visible = !visible"
          required
        />

        <!-- General / credentials error -->
        <v-expand-transition>
          <v-alert
            v-if="generalError"
            type="error"
            density="compact"
            variant="tonal"
            rounded="lg"
            class="mt-2"
            closable
            @click:close="generalError = ''"
          >
            {{ generalError }}
          </v-alert>
        </v-expand-transition>

        <!-- Submit -->
        <v-btn
          type="submit"
          block
          height="56"
          elevation="0"
          class="login-gradient-btn mt-8 text-none text-subtitle-1 font-weight-bold bg-primary"
          :loading="loading"
          :disabled="loading"
        >
          Authorize Access
          <v-icon icon="mdi-arrow-right" end class="ml-2" />
        </v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>

<style scoped>
  .login-page {
    height: 100vh;
    background-color: #f8fafc;
    position: relative;
    overflow: hidden;
  }

  .bg-shape {
    position: absolute;
    filter: blur(80px);
    z-index: 0;
    border-radius: 50%;
  }

  .shape-1 {
    width: 400px;
    height: 400px;
    background: rgba(24, 103, 192, 0.15);
    top: -100px;
    right: -50px;
  }

  .shape-2 {
    width: 300px;
    height: 300px;
    background: rgba(92, 187, 255, 0.2);
    bottom: -50px;
    left: -50px;
  }

  .glass-card {
    background: rgba(255, 255, 255, 0.7) !important;
    backdrop-filter: blur(20px);
    border-radius: 24px !important;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05) !important;
    z-index: 1;
  }

  .tracking-tight {
    letter-spacing: -0.05em;
  }

  .login-gradient-btn {
    color: white !important;
    border-radius: 12px !important;
    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .login-gradient-btn:hover {
    transform: scale(1.02);
  }

  .logo-wrapper {
    width: 64px;
    height: 64px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    border-radius: 16px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  }
</style>
