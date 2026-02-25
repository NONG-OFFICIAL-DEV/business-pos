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
        if (
          props.product?.has_variants &&
          props.product?.variants?.length > 0
        ) {
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
    if (props.product?.has_variants && selectedVariant.value) {
      return parseFloat(selectedVariant.value.price)
    }
    return parseFloat(props.product?.price || 0)
  })

  const totalPrice = computed(() => {
    return (currentItemPrice.value * quantity.value).toFixed(2)
  })

  // --- Actions ---
  function close() {
    emit('update:modelValue', false)
  }

  function submitOrder() {
    const orderData = {
      ...props.product,
      // If variant selected, we use variant details
      variant_id: selectedVariant.value?.id || null,
      name: selectedVariant.value
        ? `${props.product.name}`
        : props.product.name,
      price: currentItemPrice.value, // Send the specific price for this variant
      qty: quantity.value,
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
    max-width="435"
  >
    <v-card rounded="xl" class="pa-4 shadow-lg">
      <v-card-title class="d-flex justify-space-between align-center px-2">
        <div class="text-h6 font-weight-black">Customize Order</div>
        <v-btn icon="mdi-close" variant="tonal" size="small" @click="close" />
      </v-card-title>

      <v-card-text class="pa-2">
        <div class="d-flex align-center mb-5 pa-3 rounded-xl border">
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
          <QtyStepper v-model="quantity" :min="1" :max="100" />
        </div>

        <v-btn-toggle
          v-model="orderType"
          mandatory
          color="primary"
          class="d-flex mb-6"
          variant="outlined"
          density="comfortable"
        >
          <v-btn value="Dine-in" class="flex-grow-1 rounded-s-xl">
            Dine-in
          </v-btn>
          <v-btn value="Takeaway" class="flex-grow-1">Takeaway</v-btn>
          <v-btn value="Delivery" class="flex-grow-1 rounded-e-xl">
            Delivery
          </v-btn>
        </v-btn-toggle>

        <template v-if="product?.has_variants">
          <label class="text-subtitle-2 font-weight-bold d-block mb-2">
            Select Size
          </label>
          <v-radio-group v-model="selectedVariant" hide-details class="mb-4">
            <v-card
              v-for="v in product.variants"
              :key="v.id"
              flat
              border
              :class="[
                'mb-2 rounded-lg',
                selectedVariant?.id === v.id
                  ? 'border-primary border-opacity-100 bg-blue-lighten-5'
                  : ''
              ]"
              @click="selectedVariant = v"
            >
              <div class="d-flex align-center pa-2">
                <v-radio :value="v" color="primary" density="compact" />
                <span class="text-subtitle-2">{{ v.name }}</span>
                <v-spacer />
                <span class="text-subtitle-2 font-weight-black">
                  ${{ v.price }}
                </span>
              </div>
            </v-card>
          </v-radio-group>
        </template>

        <label class="text-subtitle-2 font-weight-bold d-block mb-2">
          Sugar Level
        </label>
        <v-select
          v-model="selectedSugar"
          :items="sugarOptions"
          variant="outlined"
          rounded="lg"
          density="comfortable"
        />
      </v-card-text>

      <v-card-actions class="pa-2">
        <v-btn
          block
          size="x-large"
          rounded="xl"
          class="bg-primary text-none text-white"
          @click="submitOrder"
        >
          Add to Order — ${{ totalPrice }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
