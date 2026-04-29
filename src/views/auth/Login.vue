<script setup>
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { useAppUtils } from '@/composables/useAppUtils'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const { notif } = useAppUtils()
  const store = useAuthStore()
  const router = useRouter()

  const loginMode = ref('pin')
  const email = ref('')
  const password = ref('')
  const pin = ref('')
  const visible = ref(false)
  const loading = ref(false)
  const generalError = ref('')
  const form = ref(null)

  const pressKey = key => {
    if (key === '⌫') pin.value = pin.value.slice(0, -1)
    else if (key === 'CLR') pin.value = ''
    else if (pin.value.length < 4) pin.value += key

    // Auto-submit when 4 digits entered
    if (pin.value.length === 4) submitPin()
  }

  const emailRules = [
    v => !!v || t('validation.email_required'),
    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || t('validation.email_invalid')
  ]
  const passwordRules = [
    v => !!v || t('validation.password_required'),
    v => v.length >= 6 || t('validation.password_min')
  ]

  async function submitPin() {
    if (pin.value.length < 4) return

    loading.value = true
    generalError.value = ''
    try {
      const success = await store.loginByPin(pin.value)
      const path =
        success.data.bu_type === 'restaurant'
          ? '/pos/dining-table-view'
          : '/pos/menu-list'
      router.push(path)
      notif(t('messages.loginSucess'), { type: 'success', color: 'primary' })
    } catch (err) {
      generalError.value =
        err.response?.data?.message ?? 'Incorrect PIN. Please try again.'
      pin.value = ''
    } finally {
      loading.value = false
    }
  }

  const handleLogin = async () => {
    generalError.value = ''
    loading.value = true
    try {
      let success
      {
        const { valid } = await form.value.validate()
        if (!valid) {
          loading.value = false
          return
        }
        success = await store.login({
          email: email.value.trim(),
          password: password.value
        })
      }
      if (success) {
        const path =
          success.data.bu_type === 'restaurant'
            ? '/pos/dining-table-view'
            : '/pos/menu-list'
        router.push(path)
        notif(t('messages.loginSucess'), { type: 'success', color: 'primary' })
      }
    } catch (err) {
      const res = err.response?.data
      generalError.value = res?.message || t('messages.authFailed')
      if (loginMode.value === 'pin') pin.value = ''
    } finally {
      loading.value = false
    }
  }
</script>

<template>
  <div class="login-root">
    <!-- ══ LEFT PANEL — Branding ══════════════════════════════════════════ -->
    <div class="left-panel">
      <!-- Decorative rings -->
      <div class="ring ring-1" />
      <div class="ring ring-2" />
      <div class="ring ring-3" />

      <!-- Dots grid pattern -->
      <div class="dots-grid" />

      <div class="left-content">
        <div class="brand-icon">
          <v-icon icon="mdi-store-outline" size="42" color="white" />
        </div>

        <div class="brand-text">
          <h1 class="brand-title">
            Chamnaul
            <br />
            POS
          </h1>
          <div class="brand-divider" />
          <p class="brand-desc">
            Streamline your sales,
            <br />
            tables &amp; inventory — all in one place.
          </p>
        </div>

        <!-- Stats row -->
        <div class="stats-row">
          <div
            class="stat-item"
            v-for="s in [
              { icon: 'mdi-lightning-bolt', val: 'Fast', label: 'Checkout' },
              { icon: 'mdi-table-chair', val: 'Smart', label: 'Tables' },
              { icon: 'mdi-chart-line', val: 'Live', label: 'Reports' }
            ]"
            :key="s.label"
          >
            <v-icon :icon="s.icon" size="18" color="rgba(255,255,255,0.7)" />
            <span class="stat-val">{{ s.val }}</span>
            <span class="stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ RIGHT PANEL — Login form ═══════════════════════════════════════ -->
    <div class="right-panel">
      <!-- Language switcher (top-right) -->
      <div class="lang-bar">
        <button
          v-for="lang in [
            { code: 'en', label: 'EN', flag: '🇺🇸' },
            { code: 'km', label: 'ខ្មែរ', flag: '🇰🇭' }
          ]"
          :key="lang.code"
          class="lang-pill"
          :class="{ active: $i18n.locale === lang.code }"
          @click="$i18n.locale = lang.code"
        >
          {{ lang.flag }} {{ lang.label }}
        </button>
      </div>

      <!-- Card -->
      <div class="form-card">
        <!-- Greeting -->
        <div class="form-header">
          <p class="form-eyebrow">Welcome back</p>
          <h2 class="form-title">{{ t('login.title') }}</h2>
        </div>

        <!-- Mode toggle -->
        <div class="mode-toggle">
          <button
            class="mode-btn"
            :class="{ active: loginMode === 'pin' }"
            @click="loginMode = 'pin'"
          >
            <v-icon icon="mdi-numeric" size="18" />
            {{ t('login.pin_code') || 'PIN Code' }}
          </button>
          <button
            class="mode-btn"
            :class="{ active: loginMode === 'password' }"
            @click="loginMode = 'password'"
          >
            <v-icon icon="mdi-lock-open-outline" size="18" />
            {{ t('login.password') || 'Password' }}
          </button>
          <div
            class="mode-slider"
            :class="{ right: loginMode === 'password' }"
          />
        </div>

        <!-- ── PIN panel ── -->
        <div v-if="loginMode === 'pin'" class="pin-panel">
          <!-- Dot indicators -->
          <div class="pin-dots">
            <span
              v-for="i in 4"
              :key="i"
              class="pin-dot"
              :class="{ filled: pin.length >= i }"
            />
          </div>

          <!-- Numpad — landscape: 2-col layout side by side -->
          <div class="numpad">
            <button
              v-for="n in [
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '8',
                '9',
                'CLR',
                '0',
                '⌫'
              ]"
              :key="n"
              class="num-key"
              :class="{
                'key-clear': n === 'CLR',
                'key-back': n === '⌫'
              }"
              @click="pressKey(n)"
            >
              <v-icon v-if="n === '⌫'" icon="mdi-backspace-outline" size="20" />
              <span v-else>{{ n }}</span>
            </button>
          </div>
        </div>

        <!-- ── Password panel ── -->
        <div v-else class="password-panel">
          <v-form ref="form" @submit.prevent="handleLogin">
            <v-text-field
              v-model="email"
              :label="t('login.email') || 'Email Address'"
              variant="outlined"
              rounded="lg"
              prepend-inner-icon="mdi-email-outline"
              class="mb-3"
              :rules="emailRules"
            />
            <v-text-field
              v-model="password"
              :label="t('login.password') || 'Password'"
              variant="outlined"
              rounded="lg"
              prepend-inner-icon="mdi-lock-outline"
              :type="visible ? 'text' : 'password'"
              :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
              :rules="passwordRules"
              @click:append-inner="visible = !visible"
            />
          </v-form>
        </div>

        <!-- Error -->
        <v-expand-transition>
          <div v-if="generalError" class="error-bar mt-4">
            <v-icon icon="mdi-alert-circle-outline" size="16" />
            {{ generalError }}
            <button class="error-close" @click="generalError = ''">✕</button>
          </div>
        </v-expand-transition>

        <!-- Submit -->
        <v-btn
          class="bg-primary mt-4"
          block
          rounded="lg"
          size="large"
          :loading="loading"
          :disabled="loading || (loginMode === 'pin' && pin.length < 4)"
          @click="handleLogin"
        >
          <span>
            {{
              loginMode === 'pin'
                ? t('btn.verify_pin') || 'Verify PIN'
                : t('btn.sign_in') || 'Sign In'
            }}
            <v-icon icon="mdi-arrow-right" size="18" />
          </span>
        </v-btn>
      </div>
      <!-- /form-card -->
    </div>
    <!-- /right-panel -->
  </div>
</template>

<style scoped>
  /* ─────────────────────────────────────────────────────── Root ── */
  .login-root {
    display: flex;
    width: 100vw;
    height: 100vh;
    min-height: 0;
    overflow: hidden;
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    background: #0f172a;
  }

  /* ─────────────────────────────────────────────── Left Panel ── */
  .left-panel {
    position: relative;
    width: 42%;
    flex-shrink: 0;
    background: linear-gradient(145deg, #1e3a5f 0%, #0f2644 50%, #0a1929 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 48px 40px;
  }

  /* Decorative rings */
  .ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }
  .ring-1 {
    width: 420px;
    height: 420px;
    top: -80px;
    right: -80px;
  }
  .ring-2 {
    width: 280px;
    height: 280px;
    top: -20px;
    right: -20px;
  }
  .ring-3 {
    width: 360px;
    height: 360px;
    bottom: -100px;
    left: -100px;
  }

  /* Dot grid */
  .dots-grid {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.07) 1px,
      transparent 1px
    );
    background-size: 28px 28px;
  }

  .left-content {
    position: relative;
    z-index: 1;
    width: 100%;
  }

  .brand-icon {
    width: 76px;
    height: 76px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32px;
    backdrop-filter: blur(8px);
  }

  .brand-title {
    font-size: clamp(40px, 5vw, 60px);
    font-weight: 900;
    color: #fff;
    line-height: 1;
    letter-spacing: -2px;
    margin: 0 0 20px;
  }

  .brand-divider {
    width: 48px;
    height: 3px;
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
    border-radius: 2px;
    margin-bottom: 20px;
  }

  .brand-desc {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.55);
    line-height: 1.7;
    margin: 0 0 40px;
    font-weight: 400;
  }

  .stats-row {
    display: flex;
    gap: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    overflow: hidden;
    backdrop-filter: blur(8px);
    background: rgba(255, 255, 255, 0.05);
  }

  .stat-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 16px 8px;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
  }
  .stat-item:last-child {
    border-right: none;
  }

  .stat-val {
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }
  .stat-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ─────────────────────────────────────────────── Right Panel ── */
  .right-panel {
    flex: 1;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 48px;
    position: relative;
    overflow-y: auto;
  }

  /* ── Language bar ── */
  .lang-bar {
    position: absolute;
    top: 24px;
    right: 32px;
    display: flex;
    gap: 8px;
  }

  .lang-pill {
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    border: 1.5px solid #e2e8f0;
    background: white;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
  }
  .lang-pill.active {
    background: #1e3a5f;
    border-color: #1e3a5f;
    color: white;
  }
  .lang-pill:hover:not(.active) {
    border-color: #94a3b8;
    color: #1e3a5f;
  }

  /* ── Form card ── */
  .form-card {
    width: 100%;
    max-width: 420px;
  }

  .form-header {
    margin-bottom: 28px;
  }
  .form-eyebrow {
    font-size: 13px;
    font-weight: 600;
    color: #f59e0b;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 0 0 6px;
  }
  .form-title {
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    letter-spacing: -0.5px;
  }

  /* ── Mode toggle ── */
  .mode-toggle {
    position: relative;
    display: flex;
    background: #e2e8f0;
    border-radius: 12px;
    padding: 4px;
    margin-bottom: 24px;
    overflow: hidden;
  }

  .mode-slider {
    position: absolute;
    top: 4px;
    left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: white;
    border-radius: 9px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .mode-slider.right {
    transform: translateX(100%);
  }

  .mode-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 9px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: transparent;
    position: relative;
    z-index: 1;
    color: #64748b;
    transition: color 0.2s;
  }
  .mode-btn.active {
    color: #0f172a;
  }

  /* ── PIN panel ── */
  .pin-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .pin-dots {
    display: flex;
    gap: 16px;
    margin-bottom: 28px;
  }

  .pin-dot {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid #cbd5e1;
    background: transparent;
    transition: all 0.2s;
  }
  .pin-dot.filled {
    background: #1e3a5f;
    border-color: #1e3a5f;
    transform: scale(1.15);
    box-shadow: 0 0 0 4px rgba(30, 58, 95, 0.12);
  }

  /* Numpad */
  .numpad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 320px;
  }

  .num-key {
    aspect-ratio: 1.4;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    font-size: 22px;
    font-weight: 700;
    color: #0f172a;
    background: white;
    border: 1.5px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.15s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
  .num-key:hover {
    background: #1e3a5f;
    color: white;
    border-color: #1e3a5f;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 58, 95, 0.25);
  }
  .num-key:active {
    transform: scale(0.95);
  }

  .num-key.key-back:hover {
    background: #fef2f2;
    color: #ef4444;
    border-color: #fecaca;
  }
  .num-key.key-clear {
    color: #ef4444;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
  .num-key.key-clear:hover {
    background: #fef2f2;
    color: #ef4444;
    border-color: #fecaca;
  }
  /* ── Password panel ── */
  .password-panel {
    margin-bottom: 4px;
  }

  /* ── Error bar ── */
  .error-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 16px;
  }
  .error-close {
    margin-left: auto;
    background: none;
    border: none;
    color: #dc2626;
    cursor: pointer;
    font-size: 12px;
    opacity: 0.7;
  }
  .error-close:hover {
    opacity: 1;
  }

  /* ── Submit button ── */
  .submit-btn {
    width: 100%;
    padding: 16px;
    margin-top: 20px;
    background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
    box-shadow: 0 8px 20px rgba(30, 58, 95, 0.35);
    letter-spacing: 0.2px;
  }
  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(30, 58, 95, 0.45);
  }
  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .submit-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* ─────────────────────────────────── Portrait / mobile fallback ── */
  @media (orientation: portrait), (max-width: 768px) {
    .login-root {
      flex-direction: column;
    }

    .left-panel {
      width: 100%;
      height: auto;
      min-height: 200px;
      padding: 32px 24px;
      align-items: flex-start;
    }

    .brand-title {
      font-size: 36px;
    }
    .stats-row {
      display: none;
    }
    .brand-desc {
      display: none;
    }

    .right-panel {
      flex: 1;
      padding: 24px 20px;
    }

    .form-card {
      max-width: 100%;
    }

    .numpad {
      max-width: 280px;
    }
  }

  /* ─────────────────────────────────── iPad landscape tweaks ── */
  @media (min-width: 900px) and (max-width: 1200px) and (orientation: landscape) {
    .left-panel {
      width: 40%;
      padding: 36px 32px;
    }

    .brand-title {
      font-size: 48px;
    }

    .right-panel {
      padding: 24px 40px;
    }

    .form-card {
      max-width: 380px;
    }

    .num-key {
      font-size: 20px;
    }

    .numpad {
      max-width: 290px;
      gap: 8px;
    }
  }

  /* Large desktop */
  @media (min-width: 1400px) {
    .left-panel {
      width: 45%;
    }
    .brand-title {
      font-size: 64px;
    }
  }
</style>
