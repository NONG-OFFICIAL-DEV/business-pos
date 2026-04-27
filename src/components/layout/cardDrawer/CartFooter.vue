<script setup>
  import { computed } from 'vue'
  import { formatKHR } from '@nong-official-dev/core'
  import { usePosStore } from '@/stores/posStore'
  import { useRoute } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  // 1. Added 'open-discount' to emits
  const emit = defineEmits([
    'select-payment',
    'checkout',
    'print-bill',
    'open-discount'
  ])

  defineProps({
    subtotal: Number,
    total: Number,
    discount: { type: Number, default: 0 }, // 2. Added discount prop
    paymentMethod: String,
    paymentMethods: Array,
    disabled: Boolean
  })

  const posStore = usePosStore()
  const route = useRoute()
  const isUnpaidOrderPage = computed(() => route.meta.showDrawer === 4)
  const isRestaurant = computed(
    () => posStore.selectedStore?.type === 'hospitality'
  )
  const isCoffeeStore = computed(
    () => posStore.selectedStore?.type === 'coffee'
  )

  const handleClick = () => {
    if (posStore.isPrintBill) {
      emit('print-bill')
    } else {
      emit('checkout')
    }
  }

  const buttonLabel = computed(() => {
    if (isUnpaidOrderPage.value) return 'PRINT BILL & PAY'
    if (isRestaurant.value) return t('btn.place_order')
    return t('btn.confirm')
  })

  const buttonIcon = computed(() => {
    if (isUnpaidOrderPage.value) return 'mdi-printer-check'
    if (isRestaurant.value) return 'mdi-silverware-fork-knife'
    return 'mdi-credit-card-check'
  })
</script>
<template>
  <v-sheet class="pos-footer border-t bg-white pa-4">
    <div class="summary-box mb-4 pa-3 rounded-xl bg-brown-lighten-5">
      <div
        class="d-flex justify-space-between text-caption text-brown-darken-1 mb-1"
      >
        <span>{{t('label.subtotal')}}</span>
        <span class="font-weight-bold">{{ formatKHR(subtotal) }}</span>
      </div>

      <div class="d-flex justify-space-between align-center mb-1">
        <div
          class="discount-trigger d-flex align-center"
          @click="emit('open-discount')"
        >
          <v-icon icon="mdi-tag-outline" size="14" class="mr-1" />
          <span class="text-caption font-weight-bold underline-dashed">
            {{ discount > 0 ? t('btn.edit_discount') : t('btn.discount') }}
          </span>
        </div>
        <span
          v-if="discount > 0"
          class="text-caption font-weight-bold text-success"
        >
          -{{ formatKHR(discount) }}
        </span>
      </div>

      <v-divider class="my-2 border-dashed" />

      <div class="d-flex justify-space-between align-center">
        <span class="text-subtitle-1 font-weight-bold text-brown-darken-4">
          {{ t('label.total') }}
        </span>
        <span class="text-h5 font-weight-black text-brown-darken-4">
          {{ formatKHR(total) }}
        </span>
      </div>
    </div>

    <div v-if="!isUnpaidOrderPage || !isCoffeeStore" class="mb-4">
      <div
        class="text-caption font-weight-bold text-brown-lighten-2 mb-2 uppercase-label"
      >
        {{t('label.payment_method')}}
      </div>
      <v-row no-gutters class="mx-n1">
        <v-col
          cols="4"
          v-for="method in paymentMethods"
          :key="method.id"
          class="pa-1"
        >
          <v-card
            flat
            class="payment-card d-flex flex-column align-center justify-center py-2"
            :class="{ 'active-method': paymentMethod === method.id }"
            @click="emit('select-payment', method.id)"
          >
            <v-icon :icon="method.icon" size="18" class="mb-1" />
            <span class="payment-label">{{ method.label }}</span>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-btn
      block
      height="56"
      color="brown-darken-3"
      elevation="2"
      rounded="xl"
      class="checkout-btn text-none"
      :disabled="disabled"
      @click="handleClick"
    >
      <v-icon size="20" class="mr-2">{{ buttonIcon }}</v-icon>
      <span class="text-subtitle-1 font-weight-bold">{{ buttonLabel }}</span>
    </v-btn>
  </v-sheet>
</template>

<style scoped>
  .pos-footer {
    position: sticky;
    bottom: 0;
    z-index: 10;
  }

  .bg-brown-lighten-5 {
    background-color: #f8f5f2 !important;
  }

  /* Discount Link Interaction */
  .discount-trigger {
    cursor: pointer;
    color: #8d6e63;
    transition: opacity 0.2s;
    user-select: none;
  }

  .discount-trigger:hover {
    color: #3e2723;
  }

  .underline-dashed {
    border-bottom: 1px dashed currentColor;
  }

  /* Payment Method Cards */
  .payment-card {
    background: #fdfbf9 !important;
    border: 1px solid #efebe9 !important;
    border-radius: 12px !important;
    color: #a1887f;
    transition: all 0.2s ease;
  }

  .payment-card.active-method {
    background: #3e2723 !important;
    color: #ffffff !important;
    border-color: #3e2723 !important;
    box-shadow: 0 4px 10px rgba(62, 39, 35, 0.2) !important;
  }

  .payment-label {
    font-size: 0.7rem;
    font-weight: 700;
  }

  .uppercase-label {
    letter-spacing: 0.05em;
    font-size: 0.65rem !important;
    text-transform: uppercase;
  }

  .border-dashed {
    border-style: dashed !important;
    opacity: 0.2;
  }

  .checkout-btn {
    background: #3e2723 !important;
  }
</style>
