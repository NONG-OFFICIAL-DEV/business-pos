<script setup>
  import { formatTimeAgo } from '@nong-official-dev/core'
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { usePosStore } from '@/stores/posStore'

  const route = useRoute()
  const posStore = usePosStore()

  const isUnpaidOrderPage = computed(() => route.meta.showDrawer === 4)
  const isCoffeeStore = computed(
    () => posStore.selectedStore?.type === 'coffee'
  )
  const isRestaurant = computed(
    () => posStore.selectedStore?.type === 'hospitality'
  )

  const props = defineProps({
    isHospitality: Boolean,
    table: Object,
    count: { type: Number, default: 0 },
    itemInformations: { type: Object, default: null }
  })

  defineEmits(['clear', 'clearBill'])

  // ✅ Check order_no exists — guards against empty object {}
  const hasBill = computed(() => !!props.itemInformations?.order_no)
</script>

<template>
  <!-- MODE A — CURRENT ORDER -->
  <div
    v-if="!isUnpaidOrderPage"
    class="cart-header px-4 py-3 border-b d-flex align-center justify-space-between"
  >
    <div>
      <div class="text-subtitle-2 font-weight-black">CURRENT ORDER</div>

      <div v-if="isCoffeeStore" class="text-caption text-medium-emphasis">
        {{ count }} item{{ count !== 1 ? 's' : '' }}
      </div>

      <template v-else-if="isRestaurant">
        <div class="d-flex align-center flex-wrap" style="gap: 4px">
          <v-chip v-if="table" size="x-small" color="primary" variant="tonal">
            T-{{ table.table_number }}
          </v-chip>
          <span class="text-caption text-medium-emphasis">
            {{ count }} item{{ count !== 1 ? 's' : '' }}
          </span>
        </div>
      </template>

      <div v-else class="text-caption text-medium-emphasis">
        {{ count }} item{{ count !== 1 ? 's' : '' }}
      </div>
    </div>

    <v-btn
      :disabled="!count"
      icon="mdi-delete-sweep"
      variant="tonal"
      size="x-small"
      color="error"
      @click="$emit('clear')"
    />
  </div>

  <!-- MODE B — UNPAID BILL VIEW -->
  <template v-else>
    <!-- ✅ Bill selected and has real data -->
    <div v-if="hasBill" class="pa-4 bg-white border-b">
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="text-subtitle-2 font-weight-black">
          {{
            isHospitality
              ? `Order #${itemInformations.order_no}`
              : 'Current Order'
          }}
        </div>

        <v-btn
          variant="tonal"
          color="error"
          size="small"
          rounded="lg"
          prepend-icon="mdi-close"
          class="text-none font-weight-bold"
          @click="$emit('clearBill')"
        >
          Clear
        </v-btn>
      </div>

      <div class="d-flex flex-wrap" style="gap: 6px">
        <v-chip
          size="small"
          variant="flat"
          color="grey-lighten-4"
          class="font-weight-bold"
        >
          <v-icon start icon="mdi-pound" size="14" />
          {{ itemInformations.order_id }}
        </v-chip>
        <v-chip
          size="small"
          variant="flat"
          color="grey-lighten-4"
          class="font-weight-bold"
        >
          <v-icon start icon="mdi-clock-outline" size="14" />
          {{ formatTimeAgo(itemInformations.created_at) }}
        </v-chip>
        <v-chip
          size="small"
          variant="flat"
          color="grey-lighten-4"
          class="font-weight-bold"
        >
          <v-icon start icon="mdi-package-variant-closed" size="14" />
          {{ count }} items
        </v-chip>
      </div>
    </div>

    <!-- ✅ No bill selected -->
    <div v-else class="pa-4 border-b">
      <div class="text-subtitle-2 font-weight-black mb-1">UNPAID ORDERS</div>
      <div class="text-caption text-medium-emphasis">
        Select an order from the list to view details
      </div>
    </div>
  </template>
</template>

<style scoped>
  .cart-header {
    min-height: 56px;
  }
</style>
