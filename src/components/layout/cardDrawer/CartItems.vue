<script setup>
  import { formatCurrency } from '@nong-official-dev/core'
  import QtyStepper from '@/components/customs/QtyStepper.vue'
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()
  const isMenuPage = computed(() => route.meta.showDrawer === 2)
  defineProps({
    items: {
      type: Array,
      required: true
    }
  })

  defineEmits(['update-qty'])
</script>

<template>
  <div v-if="!items.length" class="empty-cart pa-6 text-center">
    <v-icon icon="mdi-receipt-text-outline" size="44" color="grey-lighten-1" />

    <div class="text-body-2 font-weight-semibold text-medium-emphasis mt-3">
      {{ isMenuPage ? 'No items yet' : 'No order selected' }}
    </div>

    <div class="text-caption text-disabled mt-1">
      {{
        isMenuPage
          ? 'Tap a menu item to add it to this order'
          : 'Select an order card on the left to view its items'
      }}
    </div>
  </div>
  <v-card
    v-for="item in items"
    :key="item.id"
    flat
    rounded="lg"
    class="mb-2 border-sm"
  >
    <div class="pa-2 d-flex align-center">
      <v-avatar size="48" rounded="md" class="bg-grey-lighten-4 border">
        <v-img :src="item.image_url" cover />
      </v-avatar>

      <div class="ml-3 flex-grow-1">
        <div class="d-flex justify-space-between">
          <span class="font-weight-bold text-truncate">
            {{ item.menu_name || item.name }}
          </span>

          <span class="font-weight-black text-primary">
            {{ formatCurrency(item.price * item.qty) }}
          </span>
        </div>

        <!-- Customizations -->
        <div
          v-if="item.customizations && Object.keys(item.customizations).length"
          class="d-flex flex-wrap gap-1 mt-1"
        >
          <v-chip
            v-for="(val, key) in item.customizations"
            :key="key"
            size="x-small"
            variant="tonal"
          >
            {{ val }}
          </v-chip>
        </div>

        <!-- Qty -->
        <div class="d-flex justify-space-between align-center mt-2">
          <span class="text-caption text-grey">
            {{ formatCurrency(item.price) }}
          </span>

          <!-- Editable qty ONLY for cart -->
          <QtyStepper
            v-if="item.editable !== false"
            :modelValue="item.qty"
            :min="0"
            :max="100"
            small
            strict
            @update:modelValue="val => $emit('update-qty', item.id, val)"
          />

          <!-- Read-only qty (bill) -->
          <div v-else>
            <span class="px-2 font-weight-bold text-caption">
              × {{ item.qty }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>
<style scoped>
.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>