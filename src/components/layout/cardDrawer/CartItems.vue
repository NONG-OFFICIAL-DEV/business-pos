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
  <div v-if="!items.length" class="empty-cart-container pa-8">
    <div class="empty-visual mb-4">
      <v-icon icon="mdi-basket-outline" size="48" color="brown-lighten-4" />
    </div>
    <div class="text-subtitle-2 font-weight-bold text-brown-darken-1">
      {{ isMenuPage ? 'Your basket is empty' : 'No order selected' }}
    </div>
    <p class="text-caption text-brown-lighten-2 mt-1">
      {{
        isMenuPage
          ? 'Select coffee or treats to start an order'
          : 'Choose an active table to view items'
      }}
    </p>
  </div>

  <div class="cart-items-wrapper">
    <v-card
      v-for="item in items"
      :key="item.id"
      flat
      class="cart-item-card mb-2"
    >
      <div class="d-flex align-start pa-3">
        <v-avatar size="44" rounded="lg" class="bg-brown-lighten-5 border-subtle">
          <v-img 
            v-if="item.product?.image_url || item.image_url" 
            :src="item.product?.image_url || item.image_url" 
            cover 
          />
          <v-icon v-else color="brown-lighten-3">mdi-coffee</v-icon>
        </v-avatar>

        <div class="flex-grow-1 ml-3 overflow-hidden">
          <div class="d-flex justify-space-between align-start">
            <span class="product-title text-truncate mr-2">
              {{ item.product_name }}
            </span>
            <span class="price-total text-brown-darken-3">
              {{ formatCurrency(item.unit_price * item.quantity) }}
            </span>
          </div>

          <div 
            v-if="item.customizations && Object.keys(item.customizations).length"
            class="customization-text"
          >
            {{ Object.values(item.customizations).join(', ') }}
          </div>

          <div class="d-flex justify-space-between align-center mt-2">
            <span class="unit-price">
              {{ formatCurrency(item.unit_price) }}
            </span>

            <div v-if="item.editable !== false" class="qty-control">
              <QtyStepper
                :modelValue="item.quantity"
                :min="0"
                :max="100"
                small
                @update:modelValue="val => $emit('update-qty', item.cartKey, val)"
              />
            </div>

            <div v-else class="qty-badge">
              <span class="text-caption font-weight-black">QTY: {{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </div>
</template>

<style scoped>

.cart-item-card {
  background: white !important;
  border: 1px solid #f0ece8 !important;
  border-radius: 12px !important;
  transition: transform 0.1s ease;
}

.cart-item-card:active {
  transform: scale(0.98);
}

.border-subtle {
  border: 1px solid rgba(141, 110, 99, 0.1) !important;
}

.product-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #2e1d1a;
  letter-spacing: -0.01em;
}

.price-total {
  font-size: 0.9rem;
  font-weight: 800;
}

/* Customizations: Saved vertical space here */
.customization-text {
  font-size: 0.75rem;
  color: #8d6e63;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: -2px;
}

.unit-price {
  font-size: 0.7rem;
  color: #bcaaa4;
  font-weight: 500;
}

/* Empty State Styling */
.empty-cart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  min-height: 300px;
}

.empty-visual {
  width: 80px;
  height: 80px;
  background: #efebe9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Qty Stepper override - make it look cleaner in list */
.qty-control {
  transform: scale(0.9);
  transform-origin: right;
}

.qty-badge {
  background: #efebe9;
  padding: 2px 8px;
  border-radius: 6px;
  color: #5d4037;
}
</style>