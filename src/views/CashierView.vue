<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useOrderStore } from '@/stores/orderStore'
  import { usePosStore } from '@/stores/posStore'
  import { formatTimeAgo, formatKHR } from '@nong-official-dev/core'
  import { useI18n } from 'vue-i18n'
  import echo from '@/utils/echo'

  const { t } = useI18n()

  // ─────────────────────────────────────────────
  // STORES
  // ─────────────────────────────────────────────
  const orderStore = useOrderStore()
  const posStore = usePosStore()

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  const newOrderIds = ref(new Set())
  const filterType = ref('all')
  const sortNewest = ref(true)

  // ─────────────────────────────────────────────
  // STATIC CONFIG
  // ─────────────────────────────────────────────
  const filterTabs = computed(() => [
    { key: 'all', label: t('cashier.all'), icon: 'mdi-view-grid' },
    { key: 'table', label: t('order_type.dine_in'), icon: 'mdi-table-furniture' },
    { key: 'takeaway', label: t('order_type.takeaway'), icon: 'mdi-moped' }
  ])

  // ─────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────
  const orders = computed(() => orderStore.orders || [])
  const selectedBill = computed(() => posStore.selectedBill)

  const filteredOrders = computed(() => {
    let list = [...orders.value]

    if (filterType.value === 'table') {
      list = list.filter(o => o.table)
    } else if (filterType.value === 'takeaway') {
      list = list.filter(o => !o.table)
    }

    return list.sort((a, b) => {
      const diff = new Date(b.created_at) - new Date(a.created_at)
      return sortNewest.value ? diff : -diff
    })
  })
  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  const selectBill = bill => {
    posStore.selectBill(bill)
    posStore.orderId = bill.order_id
  }

  const markNewOrder = id => {
    newOrderIds.value.add(id)
    newOrderIds.value = new Set(newOrderIds.value)

    setTimeout(() => {
      newOrderIds.value.delete(id)
      newOrderIds.value = new Set(newOrderIds.value)
    }, 6000)
  }

  // ─────────────────────────────────────────────
  // LIFECYCLE
  // Data fetching + the shared order subscription are owned by Layout.vue
  // (it persists for the whole session); this view only adds its own
  // presentation-only new-order flash listener.
  // ─────────────────────────────────────────────
  onMounted(() => {
    echo
      .channel('orders')
      .listen('.order.created', e => markNewOrder(e.order_id))
  })
</script>

<template>
  <v-container fluid class="pa-4">
    <!-- ─── STICKY HEADER ───────────────────────────────────────────── -->
    <div class="sticky-header">
      <!-- Filters row -->
      <div class="d-flex align-center justify-space-between flex-wrap gap-3 mb-3">
        <div class="d-flex gap-3">
          <v-btn
            v-for="tab in filterTabs"
            :key="tab.key"
            :color="filterType === tab.key ? 'primary' : undefined"
            :variant="filterType === tab.key ? 'flat' : 'tonal'"
            size="small"
            rounded="lg"
            class="text-none tap-44 px-4"
            :prepend-icon="tab.icon"
            @click="filterType = tab.key"
          >
            {{ tab.label }}
          </v-btn>
        </div>

        <div class="d-flex align-center gap-3">
          <div class="text-caption text-grey">
            {{ filteredOrders.length }} {{ t('cashier.active_orders') }}
          </div>
          <v-btn
            variant="tonal"
            size="small"
            rounded="lg"
            class="text-none tap-44 px-4"
            :prepend-icon="
              sortNewest ? 'mdi-sort-descending' : 'mdi-sort-ascending'
            "
            @click="sortNewest = !sortNewest"
          >
            {{ sortNewest ? t('cashier.sort_newest') : t('cashier.sort_oldest') }}
          </v-btn>
        </div>
      </div>
    </div>

    <!-- ─── LOADING ───────────────────────────────────────────── -->
    <v-row v-if="orderStore.loading" dense class="mt-1">
      <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="card" rounded="xl" />
      </v-col>
    </v-row>

    <!-- ─── EMPTY STATE — no orders at all ─────────────────────── -->
    <div
      v-else-if="orders.length === 0"
      class="d-flex flex-column align-center justify-center pa-16 text-grey"
    >
      <v-icon size="64" class="mb-4" color="grey-lighten-2">
        mdi-receipt-text-outline
      </v-icon>
      <div class="text-subtitle-1 font-weight-bold mb-1">
        {{ t('cashier.no_orders') }}
      </div>
      <div class="text-caption">{{ t('cashier.no_orders_sub') }}</div>
    </div>

    <!-- ─── EMPTY STATE — filter matches nothing ───────────────── -->
    <div
      v-else-if="filteredOrders.length === 0"
      class="d-flex flex-column align-center justify-center pa-16 text-grey"
    >
      <v-icon size="64" class="mb-4" color="grey-lighten-2">
        mdi-filter-off-outline
      </v-icon>
      <div class="text-subtitle-1 font-weight-bold mb-1">
        {{ t('cashier.no_matches') }}
      </div>
      <v-btn variant="tonal" size="small" class="mt-2" @click="filterType = 'all'">
        {{ t('cashier.all') }}
      </v-btn>
    </div>

    <!-- ─── ORDERS GRID ───────────────────────────────────────── -->
    <v-row v-else dense class="mt-1">
      <v-col
        v-for="bill in filteredOrders"
        :key="bill.order_id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card
          :class="[
            'order-card rounded-xl',
            selectedBill?.order_number === bill.order_number && 'selected-bill',
            newOrderIds.has(bill.order_number) && 'new-order-flash'
          ]"
          elevation="0"
          border
          @click="selectBill(bill)"
        >
          <v-chip
            v-if="newOrderIds.has(bill.order_id)"
            class="new-badge"
            color="success"
            size="x-small"
            label
          >
            {{ t('cashier.new_badge') }}
          </v-chip>

          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-start mb-1">
              <div>
                <div
                  class="text-overline font-weight-black text-grey-darken-1 lh-1"
                >
                  {{ t('cashier.order_label') }} #{{ bill.order_id }}
                </div>
                <div class="d-flex align-center text-caption text-grey mt-1">
                  <v-icon size="12" class="me-1">mdi-clock-outline</v-icon>
                  {{ formatTimeAgo(bill.created_at) }}
                </div>
              </div>
              <v-icon
                :color="bill.table ? 'primary' : 'orange'"
                :icon="bill.table ? 'mdi-table-restaurant' : 'mdi-moped'"
                size="20"
              />
            </div>

            <div class="text-h5 font-weight-black mb-2">
              {{ bill.table ? `${t('label.table')} ${bill.table}` : t('order_type.takeaway') }}
            </div>

            <div
              class="d-flex align-center text-caption text-grey-darken-1 mb-3"
            >
              <v-icon size="13" class="me-1">mdi-package-variant</v-icon>
              {{ bill.items.length || 0 }} {{ t('order.items') }}
            </div>

            <v-divider class="mb-3" style="border-style: dashed" />

            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-caption text-grey mb-0">
                  {{ t('label.total') }}
                </div>
                <div class="text-h5 font-weight-black text-primary">
                  {{ formatKHR(bill.total_amount) }}
                </div>
              </div>
              <v-btn
                icon="mdi-chevron-right"
                variant="tonal"
                color="primary"
                size="small"
                rounded="lg"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
  .sticky-header {
    position: sticky;
    top: 0px;
    z-index: 5;
    background: rgba(248, 250, 252, 0.9) !important;
    backdrop-filter: blur(8px);
    margin-bottom: 10px;
  }

  .order-card {
    position: relative;
    cursor: pointer;
    transition: 0.15s ease;
  }

  .order-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08) !important;
  }

  .selected-bill {
    border-color: rgb(var(--v-theme-primary)) !important;
    background: rgba(var(--v-theme-primary), 0.03) !important;
  }

  .new-badge {
    position: absolute;
    top: 12px;
    right: 12px;
  }

  .new-order-flash {
    animation: flash-border 1s ease-in-out 3;
    border-color: #22c55e !important;
  }

  @keyframes flash-border {
    0%,
    100% {
      box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.15);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.3);
    }
  }

  .lh-1 {
    line-height: 1;
  }
  .gap-2 {
    gap: 8px;
  }
  .gap-3 {
    gap: 12px;
  }
</style>
