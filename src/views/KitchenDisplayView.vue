<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useOrderStore } from '@/stores/orderStore'
  import { formatTimeAgo, useAppUtils } from '@nong-official-dev/core'
  import { useI18n } from 'vue-i18n'
  import { useConnectionStatus } from '@/composables/useConnectionStatus'

  const { t } = useI18n()
  const { confirm } = useAppUtils()
  const orderStore = useOrderStore()
  const { connected } = useConnectionStatus()

  // Local-only: no backend endpoint exists yet to persist a "served" status
  // (src/api/order.js only has getAllOrder/createOrder/getOrderByTable/printBillForPayment),
  // so marking a ticket done just hides it from this KDS session.
  const servedIds = ref(new Set())
  let tickTimer = null
  const tick = ref(0)

  const orders = computed(() => orderStore.orders || [])

  const activeOrders = computed(() => {
    tick.value
    return orders.value
      .filter(o => !servedIds.value.has(o.order_id))
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  })

  function elapsedMinutes(createdAt) {
    return Math.max(0, Math.floor((Date.now() - new Date(createdAt)) / 60000))
  }

  function urgencyColor(createdAt) {
    const mins = elapsedMinutes(createdAt)
    if (mins <= 10) return 'success'
    if (mins <= 20) return 'warning'
    return 'error'
  }

  function markServed(order) {
    confirm({
      title: t('dialog.confirm_mark_served'),
      options: { type: 'info' },
      agree: () => {
        servedIds.value = new Set(servedIds.value).add(order.order_id)
      }
    })
  }

  // Order fetching + the shared subscription are owned by Layout.vue (it
  // persists for the whole session); this view only reads orderStore.orders.
  onMounted(() => {
    tickTimer = setInterval(() => tick.value++, 30000)
  })

  onUnmounted(() => {
    clearInterval(tickTimer)
  })
</script>

<template>
  <v-container fluid class="pa-4">
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="text-subtitle-1 font-weight-black">
        {{ t('kitchen.title') }}
      </div>
      <div class="d-flex align-center gap-2">
        <div class="text-caption text-grey">
          {{ activeOrders.length }} {{ t('kitchen.active_orders') }}
        </div>
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

    <!-- Loading -->
    <v-row v-if="orderStore.loading" dense>
      <v-col v-for="n in 4" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="card" rounded="xl" />
      </v-col>
    </v-row>

    <!-- Empty state -->
    <div
      v-else-if="activeOrders.length === 0"
      class="d-flex flex-column align-center justify-center pa-16 text-grey"
    >
      <v-icon size="64" class="mb-4" color="grey-lighten-2">
        mdi-food-outline
      </v-icon>
      <div class="text-subtitle-1 font-weight-bold mb-1">
        {{ t('kitchen.no_orders') }}
      </div>
      <div class="text-caption">{{ t('kitchen.no_orders_sub') }}</div>
    </div>

    <!-- Tickets -->
    <v-row v-else dense>
      <v-col
        v-for="order in activeOrders"
        :key="order.order_id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card rounded="xl" border elevation="0" class="d-flex flex-column">
          <v-toolbar
            :color="urgencyColor(order.created_at)"
            density="compact"
          >
            <v-toolbar-title class="text-subtitle-2 font-weight-bold">
              {{ order.table ? `T-${order.table}` : t('order_type.takeaway') }}
              • #{{ order.order_id }}
            </v-toolbar-title>
            <v-spacer />
            <span class="me-2 text-caption font-weight-bold">
              {{ formatTimeAgo(order.created_at) }}
            </span>
          </v-toolbar>

          <v-list class="flex-grow-1 pa-0" density="comfortable">
            <v-list-item
              v-for="item in order.items"
              :key="item.id"
              border="bottom"
            >
              <template #prepend>
                <span class="font-weight-black text-h6 me-3">
                  {{ item.quantity }}x
                </span>
              </template>
              <v-list-item-title class="font-weight-bold">
                {{ item.product_name }}
              </v-list-item-title>
              <v-list-item-subtitle
                v-if="item.customizations && Object.keys(item.customizations).length"
                class="text-brown-darken-1 font-italic"
              >
                {{ Object.values(item.customizations).join(', ') }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-btn
            block
            color="primary"
            class="rounded-0 rounded-b-xl"
            height="48"
            @click="markServed(order)"
          >
            {{ t('kitchen.done') }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
  .gap-2 {
    gap: 8px;
  }
</style>
