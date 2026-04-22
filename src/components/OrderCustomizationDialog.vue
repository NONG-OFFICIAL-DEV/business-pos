<script setup>
  import { ref, computed, watch } from 'vue'
  import QtyStepper from './customs/QtyStepper.vue'

  const props = defineProps({
    modelValue: Boolean,
    product: Object
  })

  const emit = defineEmits(['update:modelValue', 'add-to-cart'])

  // --- State for selections ---
  const quantity = ref(1)
  const selectedVariant = ref(null) // Stores the actual variant object
  const selectedSugar = ref('Normal Sugar')
  const orderType = ref('Dine-in')

  // --- Options Data ---
  const sugarOptions = ['Less Sugar', 'Normal Sugar']

  // --- RESET LOGIC ---
  watch(
    () => props.modelValue,
    isOpen => {
      if (isOpen) {
        quantity.value = 1
        selectedSugar.value = 'Normal Sugar'
        orderType.value = 'Dine-in'

        // Default to the first variant (usually "Small" or the cheapest)
        if (props.product?.variants?.length > 0) {
          selectedVariant.value = props.product.variants[0]
        } else {
          selectedVariant.value = null
        }
      }
    }
  )

  // --- Calculations ---
  const currentItemPrice = computed(() => {
    // If it has variants, use the variant price. Otherwise, use base product price.
    if (props.product?.variants.length > 0 && selectedVariant.value) {
      return parseFloat(selectedVariant.value.price_adjustment)
    }
    return parseFloat(props.product?.base_price || 0)
  })

  const totalPrice = computed(() => {
    return (currentItemPrice.value * quantity.value).toFixed(2)
  })

  // --- Actions ---
  function close() {
    emit('update:modelValue', false)
  }

  function submitOrder() {
    const price =
      currentItemPrice.value ||
      selectedVariant.value?.price ||
      parseFloat(props.product.base_price) ||
      0

    const orderData = {
      id: props.product.id,
      product_name: props.product.name,
      image_url: props.product.image_url,
      unit_price: price,
      quantity: quantity.value,
      variant_id: selectedVariant.value?.id || null,
      customizations: {
        variant_name: selectedVariant.value?.name || 'Standard',
        sugar: selectedSugar.value,
        orderType: orderType.value
      }
    }

    emit('add-to-cart', orderData)
    close()
  }
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="close"
    max-width="440"
    scrollable
  >
    <v-card rounded="xl" class="pa-0 overflow-hidden">
      <div class="d-flex align-center mb-2 pa-3 rounded-xl">
        <v-avatar size="70" rounded="lg" class="border">
          <v-img :src="product?.image_url" cover />
        </v-avatar>

        <div class="ml-3 flex-grow-1">
          <div class="text-subtitle-1 font-weight-bold">
            {{ product?.name }}
          </div>
          <div class="text-h6 font-weight-black text-primary">
            ${{ currentItemPrice.toFixed(2) }}
          </div>
        </div>
        <v-btn icon="mdi-close" variant="tonal" size="small" @click="close" />
      </div>

      <v-card-text class="pa-4 pt-0">
        <div class="section-label">Order Type</div>
        <v-btn-toggle
          v-model="orderType"
          mandatory
          color="brown-darken-3"
          class="compact-toggle mb-5"
          variant="outlined"
          divided
        >
          <v-btn value="Dine-in" class="flex-grow-1 text-none">Dine-in</v-btn>
          <v-btn value="Takeaway" class="flex-grow-1 text-none">Takeaway</v-btn>
          <v-btn value="Delivery" class="flex-grow-1 text-none">Delivery</v-btn>
        </v-btn-toggle>

        <template v-if="product?.variants?.length > 0">
          <div class="section-label">Select Size</div>
          <v-row dense class="mb-4">
            <v-col v-for="v in product.variants" :key="v.id" cols="4">
              <div
                :class="[
                  'variant-box',
                  { active: selectedVariant?.id === v.id }
                ]"
                @click="selectedVariant = v"
              >
                <div class="text-caption font-weight-bold">{{ v.name }}</div>
                <div class="text-caption">+${{ v.price_adjustment }}</div>
              </div>
            </v-col>
          </v-row>
        </template>

        <v-row dense>
          <v-col cols="7">
            <div class="section-label">Sugar Level</div>
            <v-select
              v-model="selectedSugar"
              :items="sugarOptions"
              variant="outlined"
              rounded="lg"
              density="compact"
              hide-details
              bg-color="white"
            />
          </v-col>
          <v-col cols="5">
            <div class="section-label text-right">Quantity</div>
            <div class="d-flex justify-end">
              <QtyStepper v-model="quantity" :min="1" :max="100" />
            </div>
          </v-col>
        </v-row>
      </v-card-text>

      <div class="pa-4 pt-2">
        <v-btn
          block
          height="56"
          rounded="xl"
          elevation="4"
          class="bg-brown-darken-3 text-none"
          @click="submitOrder"
        >
          <div class="d-flex align-center justify-space-between w-100 px-2">
            <span class="text-subtitle-1 font-weight-bold">Add to Order</span>
            <span class="text-h6 font-weight-black">${{ totalPrice }}</span>
          </div>
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
  .section-label {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #8d6e63;
    margin-bottom: 8px;
    letter-spacing: 0.05em;
  }

  .line-height-1 {
    line-height: 1.2;
  }

  /* Compact Toggle Styling */
  .compact-toggle {
    width: 100%;
    height: 40px !important;
    border-radius: 12px !important;
    overflow: hidden;
  }

  /* Variant Grid Styling */
  .variant-box {
    border: 1px solid #e0e0e0;
    border-radius: 12px;
    padding: 8px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    background: white;
  }

  .variant-box.active {
    background: #3e2723;
    color: white;
    border-color: #3e2723;
    box-shadow: 0 4px 8px rgba(62, 39, 35, 0.2);
  }

  .variant-box:hover:not(.active) {
    background: #fdfbf9;
    border-color: #8d6e63;
  }

  /* Customizing V-Select for tablet density */
  :deep(.v-field__input) {
    padding-top: 4px !important;
    padding-bottom: 4px !important;
    min-height: 40px !important;
  }

  .bg-brown-lighten-5 {
    background-color: #efebe9 !important;
  }
  .bg-brown-darken-3 {
    background-color: #4e342e !important;
    color: white !important;
  }
</style>
