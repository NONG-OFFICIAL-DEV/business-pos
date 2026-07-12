<script setup>
  import { computed } from 'vue'
  import { formatTimeAgo, formatKHR } from '@nong-official-dev/core'
  import { useI18n } from 'vue-i18n'
  import CartItems from '@/components/layout/cardDrawer/CartItems.vue'

  const { t } = useI18n()

  const props = defineProps({
    bill: { type: Object, default: null }
  })

  const emit = defineEmits(['close', 'print-bill'])

  const model = computed({
    get: () => !!props.bill,
    set: val => {
      if (!val) emit('close')
    }
  })

  const itemCount = computed(() => props.bill?.items?.length ?? 0)
  const displayItems = computed(() =>
    (props.bill?.items ?? []).map(i => ({ ...i, editable: false }))
  )
</script>

<template>
  <v-dialog v-model="model" max-width="480" scrollable>
    <v-card v-if="bill" rounded="xl" class="d-flex flex-column dialog-card">
      <!-- HEADER -->
      <div class="pa-4 bg-white border-b">
        <div class="d-flex align-center justify-space-between mb-3">
          <div class="text-subtitle-2 font-weight-black">
            {{ t('cashier.order_label') }} #{{ bill.order_number }}
          </div>
          <v-btn
            variant="tonal"
            color="error"
            size="small"
            rounded="lg"
            icon="mdi-close"
            class="tap-44"
            @click="emit('close')"
          />
        </div>

        <div class="d-flex flex-wrap" style="gap: 6px">
          <v-chip
            v-if="bill.table"
            size="small"
            variant="flat"
            color="grey-lighten-4"
            class="font-weight-bold"
          >
            <v-icon start icon="mdi-pound" size="14" />
            T-{{ bill.table }}
          </v-chip>
          <v-chip
            size="small"
            variant="flat"
            color="grey-lighten-4"
            class="font-weight-bold"
          >
            <v-icon start icon="mdi-clock-outline" size="14" />
            {{ formatTimeAgo(bill.created_at) }}
          </v-chip>
          <v-chip
            size="small"
            variant="flat"
            color="grey-lighten-4"
            class="font-weight-bold"
          >
            <v-icon start icon="mdi-package-variant-closed" size="14" />
            {{ itemCount }} {{ t('order.item') }}
          </v-chip>
        </div>
      </div>

      <!-- CONTENT -->
      <v-card-text class="flex-grow-1 pa-3">
        <CartItems :items="displayItems" />
      </v-card-text>

      <!-- FOOTER -->
      <div class="pa-4 border-t bg-white">
        <div class="summary-box mb-4 pa-3 rounded-xl bg-brown-lighten-5">
          <div class="d-flex justify-space-between align-center">
            <span class="text-subtitle-1 font-weight-bold text-brown-darken-4">
              {{ t('label.total') }}
            </span>
            <span class="text-h5 font-weight-black text-brown-darken-4">
              {{ formatKHR(bill.total_amount) }}
            </span>
          </div>
        </div>

        <v-btn
          block
          height="56"
          color="brown-darken-3"
          elevation="2"
          rounded="xl"
          class="checkout-btn text-none"
          @click="emit('print-bill')"
        >
          <v-icon size="20" class="mr-2">mdi-printer-check</v-icon>
          <span class="text-subtitle-1 font-weight-bold">
            {{ t('btn.print_bill_pay') }}
          </span>
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
  .dialog-card {
    max-height: 85vh;
  }

  .bg-brown-lighten-5 {
    background-color: #f8f5f2 !important;
  }

  .checkout-btn {
    background: #3e2723 !important;
  }
</style>
