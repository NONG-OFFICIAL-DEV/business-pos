<script setup>
  import { computed } from 'vue'
  import { formatCurrency } from '@nong-official-dev/core'
  import { usePosStore } from '@/stores/posStore'
  import { useRoute } from 'vue-router'
  const emit = defineEmits(['select-payment', 'checkout', 'print-bill'])

  defineProps({
    subtotal: Number,
    total: Number,
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
    if (isUnpaidOrderPage.value) return 'PRINT BILL & PAY' // ✅ .value
    if (isRestaurant.value) return 'PLACE ORDER'
    if (isCoffeeStore.value) return 'CONFIRM PAYMENT'
    return 'CONFIRM PAYMENT'
  })

  const buttonIcon = computed(() => {
    if (isUnpaidOrderPage.value) return 'mdi-printer-check' // ✅ .value
    if (isRestaurant.value) return 'mdi-silverware-fork-knife'
    return 'mdi-credit-card-check'
  })
</script>

<template>
  <v-sheet class="pa-4 border-t bg-white">
    <!-- Payment -->
    <v-row no-gutters class="mx-n1 mb-4" v-if="!isUnpaidOrderPage || !isCoffeeStore">
      <v-col
        cols="4"
        v-for="method in paymentMethods"
        :key="method.id"
        class="pa-1"
      >
        <v-card
          flat
          class="text-center py-2 rounded-lg border-sm"
          :color="paymentMethod === method.id ? 'orange-lighten-5' : 'white'"
          @click="$emit('select-payment', method.id)"
        >
          <v-icon :icon="method.icon" size="20" />
          <div class="text-caption font-weight-bold">
            {{ method.label }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Totals -->
    <div class="mb-3">
      <div class="d-flex justify-space-between text-caption">
        <span>Subtotal</span>
        <span>{{ formatCurrency(subtotal) }}</span>
      </div>

      <div class="d-flex justify-space-between text-h6 font-weight-black">
        <span>Total</span>
        <span class="text-primary">
          {{ formatCurrency(total) }}
        </span>
      </div>
    </div>

    <!-- Action -->
    <v-btn
      block
      height="52"
      color="primary"
      flat
      rounded="lg"
      class="font-weight-black text-none"
      :disabled="disabled"
      @click="handleClick"
    >
      <v-icon start size="22" class="me-2">{{ buttonIcon }}</v-icon>
      {{ buttonLabel }}
    </v-btn>
  </v-sheet>
</template>
