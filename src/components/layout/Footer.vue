<template>
  <v-footer app color="white" border height="32" class="px-4">
    <div class="d-flex w-100 justify-space-between align-center">

      <!-- Left: DB status -->
      <div class="d-flex align-center gap-1">
        <v-icon
          :icon="connected ? 'mdi-database-check' : 'mdi-database-alert-outline'"
          size="14"
          :color="connected ? 'success' : 'warning'"
        />
        <span class="footer-text">
          {{ connected ? $t('footer.connected') : $t('footer.disconnected') }}
        </span>
      </div>

      <!-- Center: USB printer status (Android only) -->
      <div v-if="usbSupported" class="d-flex align-center gap-1">
        <template v-if="usbConnected">
          <v-icon icon="mdi-printer-check" size="14" color="success" />
          <span class="footer-text">{{ $t('footer.ready') }}</span>
        </template>
        <template v-else>
          <v-icon icon="mdi-printer-off" size="14" color="warning" />
          <span
            class="footer-text footer-link"
            @click="connectUsb"
          >{{ $t('footer.printer') }}</span>
        </template>
      </div>

      <!-- Right: Version -->
      <div class="footer-text">V.2.4.0 © {{ year }}</div>

    </div>
  </v-footer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import echo from '@/utils/echo'

defineProps({
  connectUsb:   { type: Function, default: null },
  usbConnected: { type: Boolean,  default: false },
  usbSupported: { type: Boolean,  default: false },
})

const year = new Date().getFullYear()

const connected = ref(false)

onMounted(() => {
  const connection = echo.connector.pusher.connection
  connected.value = connection.state === 'connected'
  connection.bind('connected', () => (connected.value = true))
  connection.bind('disconnected', () => (connected.value = false))
})
</script>

<style scoped>
.footer-text {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #94a3b8;
}
.footer-link {
  color: #8d6e63;
  cursor: pointer;
  text-decoration: underline;
}
.footer-link:hover {
  color: #3e2723;
}
.gap-1 {
  gap: 4px;
}
</style>