<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useConnectionStatus } from '@/composables/useConnectionStatus'
  import LanguageSwicher from '@/components/customs/LanguageSwicher.vue'

  const { t } = useI18n()
  const { connected } = useConnectionStatus()

  const props = defineProps({
    modelValue: Boolean,
    usbSupported: Boolean,
    usbConnected: Boolean
  })

  const emit = defineEmits(['update:modelValue', 'connect-usb'])

  const model = computed({
    get: () => props.modelValue,
    set: val => emit('update:modelValue', val)
  })

  // ── Fullscreen ─────────────────────────────────
  const isFullscreen = ref(false)

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', () => {
      isFullscreen.value = !!document.fullscreenElement
    })
  })
</script>

<template>
  <v-dialog v-model="model" max-width="380">
    <v-card rounded="xl" class="pa-0 overflow-hidden">
      <div class="pa-4 bg-brown-darken-3 text-white d-flex align-center">
        <v-icon icon="mdi-cog-outline" class="mr-2" />
        <span class="text-h6 font-weight-bold">{{ t('settings.title') }}</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" color="white" @click="model = false" />
      </div>

      <v-card-text class="pa-5">
        <!-- Language -->
        <div class="section-label">{{ t('settings.language') }}</div>
        <div class="mb-5">
          <LanguageSwicher />
        </div>

        <!-- Display -->
        <div class="section-label">{{ t('settings.display') }}</div>
        <div class="d-flex align-center justify-space-between mb-5">
          <div class="d-flex align-center">
            <v-icon
              :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
              size="20"
              class="mr-2"
            />
            <span class="text-body-2 font-weight-medium">
              {{
                isFullscreen
                  ? t('appbar.exit_fullscreen')
                  : t('appbar.enter_fullscreen')
              }}
            </span>
          </div>
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            rounded="lg"
            class="tap-44"
            @click="toggleFullscreen"
          >
            {{ isFullscreen ? t('btn.exit') : t('btn.enable') }}
          </v-btn>
        </div>

        <!-- Connection -->
        <div class="section-label">{{ t('settings.connection') }}</div>
        <div class="d-flex align-center mb-5">
          <v-icon
            :icon="connected ? 'mdi-wifi' : 'mdi-wifi-alert'"
            :color="connected ? 'success' : 'warning'"
            size="20"
            class="mr-2"
          />
          <span class="text-body-2 font-weight-medium">
            {{ connected ? t('settings.connected') : t('settings.reconnecting') }}
          </span>
        </div>

        <!-- Printer -->
        <div class="section-label">{{ t('settings.printer') }}</div>
        <div
          v-if="usbSupported"
          class="d-flex align-center justify-space-between mb-1"
        >
          <div class="d-flex align-center">
            <v-icon
              :icon="usbConnected ? 'mdi-printer-check' : 'mdi-printer-off'"
              :color="usbConnected ? 'success' : 'warning'"
              size="20"
              class="mr-2"
            />
            <span class="text-body-2 font-weight-medium">
              {{ usbConnected ? t('printer.connected') : t('printer.not_connected') }}
            </span>
          </div>
          <v-btn
            v-if="!usbConnected"
            size="small"
            variant="tonal"
            color="primary"
            rounded="lg"
            class="tap-44"
            @click="emit('connect-usb')"
          >
            {{ t('printer.connect') }}
          </v-btn>
        </div>
        <div v-else class="text-caption text-medium-emphasis mb-1">
          {{ t('printer.not_connected') }}
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
  .section-label {
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #8d6e63;
    letter-spacing: 0.06em;
    margin-bottom: 8px;
  }
</style>
