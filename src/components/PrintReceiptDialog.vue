<!-- components/PrintReceiptDialog.vue -->
<script setup>
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { formatKHR } from '@nong-official-dev/core'
  const props = defineProps({
    modelValue: { type: Boolean, default: false },
    receipt: { type: Object, default: null }, // full order data
    printing: { type: Boolean, default: false },
    usbSupported: { type: Boolean, default: false },
    usbConnected: { type: Boolean, default: false }
  })

  const emit = defineEmits([
    'update:modelValue',
    'print',
    'skip',
    'connect-usb'
  ])

  const { t } = useI18n()

  const isAndroid = () => /android/i.test(navigator.userAgent)
  const showUsbWarning = computed(
    () => isAndroid() && props.usbSupported && !props.usbConnected
  )
  const printDisabled = computed(() => props.printing || showUsbWarning.value)
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="400"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="lg" class="pa-2">
      <!-- ── Header ───────────────────────────────────────────────────────── -->
      <v-card-title class="text-center pt-4">
        <v-icon size="40" color="success">mdi-check-circle</v-icon>
        <div class="mt-2 text-h6">{{ t('label.order_placed') }}</div>
      </v-card-title>

      <!-- ── Order summary ────────────────────────────────────────────────── -->
      <v-card-text class="text-center text-body-2 text-grey-darken-1">
        {{ t('label.total') }}:
        <strong>{{ formatKHR(receipt?.total_amount ?? 0) }}</strong>
      </v-card-text>

      <!-- ── Queue number badge ────────────────────────────────────────────── -->
      <div v-if="receipt?.queue_number" class="text-center pb-2">
        <v-chip color="primary" size="large" label>
          <v-icon start>mdi-ticket-confirmation-outline</v-icon>
          {{ t('label.queue') }} #{{ receipt.queue_number }}
        </v-chip>
      </div>

      <!-- ── USB warning (Android only) ───────────────────────────────────── -->
      <v-alert
        v-if="showUsbWarning"
        type="warning"
        density="compact"
        variant="tonal"
        class="mx-4 mb-2"
        icon="mdi-printer-alert"
      >
        {{ t('printer.not_connected') || 'Printer not connected.' }}
        <v-btn
          size="small"
          variant="text"
          class="mt-1"
          @click="emit('connect-usb')"
        >
          {{ t('printer.connect') || 'Connect' }}
        </v-btn>
      </v-alert>

      <!-- ── Actions ──────────────────────────────────────────────────────── -->
      <v-card-actions class="ga-2 px-4 pb-4">
        <v-btn
          variant="tonal"
          rounded="lg"
          width="170px"
          :disabled="printing"
          @click="emit('skip')"
        >
          {{ t('btn.skip') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          width="170px"
          :loading="printing"
          :disabled="printDisabled"
          prepend-icon="mdi-printer"
          @click="emit('print')"
        >
          {{ t('btn.print') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
