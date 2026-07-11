<script setup>
  import { computed } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { formatKHR } from '@nong-official-dev/core'

  const { t } = useI18n()

  const props = defineProps({
    modelValue: { type: Boolean, default: false },
    total: { type: Number, default: 0 },
    loading: { type: Boolean, default: false }
  })

  const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

  const model = computed({
    get: () => props.modelValue,
    set: val => emit('update:modelValue', val)
  })

  const confirm = () => emit('confirm')

  const cancel = () => {
    emit('cancel')
    model.value = false
  }
</script>

<template>
  <v-dialog v-model="model" max-width="380" persistent>
    <v-card rounded="xl" class="pa-5 text-center">
      <div class="text-h6 font-weight-black mb-1">
        {{ t('payment.scan_to_pay') }}
      </div>
      <div class="text-caption text-medium-emphasis mb-4">
        {{ t('label.total') }}: {{ formatKHR(total) }}
      </div>

      <div class="qr-placeholder mx-auto mb-6">
        <v-icon icon="mdi-qrcode" size="120" color="brown-darken-3" />
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="outlined" class="flex-grow-1" @click="cancel">
          {{ t('btn.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          class="flex-grow-1"
          :loading="loading"
          @click="confirm"
        >
          {{ t('payment.payment_received') }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
  .qr-placeholder {
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f5f2;
    border: 1px dashed #d7ccc8;
    border-radius: 16px;
  }
</style>
