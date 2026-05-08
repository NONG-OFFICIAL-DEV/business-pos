// stores/cartUiStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePosStore } from '@/stores/posStore'

export const useCartUiStore = defineStore('cartUi', () => {
  const posStore = usePosStore()

  const selectedProduct = ref(null)
  const showCustomizeDialog = ref(false)

  function handleQuickAdd(product) {
    posStore.addToCart({
      id: product.id,
      product_name: product.name,
      unit_price: product.base_price,
      image_url: product.image_url,
      quantity: 1,
      customizations: {}
    })
  }

  function openCustomizer(product) {
    selectedProduct.value = product
    showCustomizeDialog.value = true
  }

  function closeCustomizer() {
    showCustomizeDialog.value = false
    selectedProduct.value = null
  }

  return {
    selectedProduct,
    showCustomizeDialog,
    handleQuickAdd,
    openCustomizer,
    closeCustomizer
  }
})