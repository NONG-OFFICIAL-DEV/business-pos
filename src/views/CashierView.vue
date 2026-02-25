<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useOrderStore } from '@/stores/orderStore'
  import { usePosStore } from '@/stores/posStore'
  import { formatTimeAgo, formatCurrency } from '@nong-official-dev/core'
  import echo from '@/utils/echo'

  // ─────────────────────────────────────────────
  // STORES
  // ─────────────────────────────────────────────
  const orderStore = useOrderStore()
  const posStore = usePosStore()

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  const connected = ref(false)
  const newOrderIds = ref(new Set())
  const filterType = ref('all')
  const sortNewest = ref(true)

  // ─────────────────────────────────────────────
  // STATIC CONFIG
  // ─────────────────────────────────────────────
  const filterTabs = [
    { key: 'all', label: 'All', icon: 'mdi-view-grid' },
    { key: 'table', label: 'Dine-in', icon: 'mdi-table-furniture' },
    { key: 'takeaway', label: 'Takeaway', icon: 'mdi-moped' }
  ]

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
  // ─────────────────────────────────────────────
  onMounted(async () => {
    await orderStore.fetchAllOrders()
    orderStore.subscribeToOrders()

    echo
      .channel('orders')
      .listen('.order.created', e => markNewOrder(e.order_id))

    const connection = echo.connector.pusher.connection

    connection.bind('connected', () => (connected.value = true))
    connection.bind('disconnected', () => (connected.value = false))
  })

  onUnmounted(() => {
    orderStore.unsubscribeFromOrders()
  })
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- ─── STICKY HEADER ───────────────────────────────────────────── -->
    <div class="sticky-header">
      <!-- Title row -->
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center gap-2">
          <v-btn
            variant="tonal"
            color="primary"
            size="small"
            prepend-icon="mdi-arrow-left"
            class="text-none"
            rounded="lg"
            text="Back"
            @click="$router.go(-1)"
          />
          <div>
            <div class="text-subtitle-1 font-weight-black text-slate-800 lh-1">
              Unpaid Orders
            </div>
            <div class="text-caption text-grey">
              {{ orders.length }} active orders
            </div>
          </div>
        </div>

        <div class="d-flex align-center gap-2">
          <v-btn
            variant="tonal"
            size="x-small"
            rounded="lg"
            class="text-none"
            :prepend-icon="
              sortNewest ? 'mdi-sort-descending' : 'mdi-sort-ascending'
            "
            @click="sortNewest = !sortNewest"
          >
            {{ sortNewest ? 'Newest' : 'Oldest' }}
          </v-btn>

          <v-chip
            :color="connected ? 'success' : 'error'"
            variant="tonal"
            size="x-small"
            class="font-weight-bold"
          >
            <template #prepend>
              <v-icon size="8" class="mr-1">mdi-circle</v-icon>
            </template>
            {{ connected ? 'Live' : 'Reconnecting…' }}
          </v-chip>
        </div>
      </div>
      <!-- Filter Tabs -->
      <div class="d-flex gap-2 mb-1">
        <v-btn
          v-for="tab in filterTabs"
          :key="tab.key"
          :color="filterType === tab.key ? 'primary' : undefined"
          :variant="filterType === tab.key ? 'flat' : 'tonal'"
          size="x-small"
          rounded="lg"
          class="text-none"
          :prepend-icon="tab.icon"
          @click="filterType = tab.key"
        >
          {{ tab.label }}
        </v-btn>
      </div>
    </div>

    <!-- ─── LOADING ───────────────────────────────────────────── -->
    <v-row v-if="orderStore.loading" dense class="mt-1">
      <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="card" rounded="xl" />
      </v-col>
    </v-row>

    <!-- ─── EMPTY STATE ───────────────────────────────────────── -->
    <div
      v-else-if="filteredOrders.length === 0"
      class="d-flex flex-column align-center justify-center pa-16 text-grey"
    >
      <v-icon size="64" class="mb-4" color="grey-lighten-2">
        mdi-receipt-text-outline
      </v-icon>
      <div class="text-subtitle-1 font-weight-bold mb-1">No active orders</div>
      <div class="text-caption">New orders will appear here automatically</div>
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
            selectedBill?.order_id === bill.order_id && 'selected-bill',
            newOrderIds.has(bill.order_id) && 'new-order-flash'
          ]"
          elevation="0"
          border
          @click="selectBill(bill)"
        >
          <div
            :class="['type-stripe', bill.table ? 'bg-primary' : 'bg-orange']"
          />

          <v-chip
            v-if="newOrderIds.has(bill.order_id)"
            class="new-badge"
            color="success"
            size="x-small"
            label
          >
            NEW
          </v-chip>

          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-start mb-1">
              <div>
                <div
                  class="text-overline font-weight-black text-grey-darken-1 lh-1"
                >
                  ORDER #{{ bill.order_id }}
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
              {{ bill.table ? 'Table ' + bill.table : 'Takeaway' }}
            </div>

            <div
              class="d-flex align-center text-caption text-grey-darken-1 mb-3"
            >
              <v-icon size="13" class="me-1">mdi-package-variant</v-icon>
              {{ bill.item_count || 0 }} items
            </div>

            <v-divider class="mb-3" style="border-style: dashed" />

            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-caption text-grey mb-0">Total</div>
                <div class="text-h5 font-weight-black text-primary">
                  {{ formatCurrency(bill.total) }}
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
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 10px;
  }

  .stats-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .stat-chip {
    display: flex;
    align-items: center;
    background: #f8f7f6;
    border: 1px solid #ede9e6;
    border-radius: 8px;
    padding: 4px 10px;
  }

  .type-stripe {
    height: 4px;
    border-radius: 12px 12px 0 0;
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
