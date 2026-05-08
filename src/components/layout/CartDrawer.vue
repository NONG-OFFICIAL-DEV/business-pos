<script setup>
  import { computed, ref } from 'vue'
  import { usePosStore } from '@/stores/posStore'

  import CartHeader from './cardDrawer/CartHeader.vue'
  import CartItems from './cardDrawer/CartItems.vue'
  import CartFooter from './cardDrawer/CartFooter.vue'
  import DiscountDialog from '@/components/DiscountDialog.vue'

  const emit = defineEmits(['checkout', 'print-bill', 'scan'])

  const posStore = usePosStore()
  const showDiscountModal = ref(false)

  const cartItems = computed(() => posStore.cart)
  const selectedBill = computed(() => posStore.selectedBill)
  const table = computed(() => posStore.selectedTable)

  const displayItems = computed(() => {
    // Bill pay mode — show bill items as read-only
    if (posStore.isPrintBill && selectedBill.value?.items) {
      return selectedBill.value.items.map(i => ({ ...i, editable: false }))
    }
    // Normal cart mode
    return cartItems.value.map(i => ({ ...i, editable: true }))
  })

  // ✅ Disable footer when nothing to act on
  // - Normal mode: cart must have items
  // - Bill mode:   a real bill must be selected (has order_no)
  const isFooterDisabled = computed(() => {
    if (posStore.isPrintBill) {
      return !selectedBill.value?.order_number
    }
    return !cartItems.value.length
  })

  const updateQty = (itemId, quantity) => posStore.updateQty(itemId, quantity)
  const clearCart = () => posStore.clearCart()
  const clearBill = () => posStore.clearBill()
  const selectPayment = method => posStore.setPaymentMethod(method)

  const checkout = () => {
    emit('checkout', {
      cart: posStore.cart,
      payment: posStore.paymentMethod
    })
  }
  // Inside your <script setup>
  const handleDiscount = discountData => {
    // discountData contains { type, value, amount } from the dialog
    posStore.setDiscount(discountData.amount)

    // Optional: If you want to track if it's percentage or fixed in store:
    // posStore.setDiscountDetail(discountData);

    showDiscountModal.value = false
  }

  const handlePrintBill = () => emit('print-bill')
</script>

<template>
  <div>
    <v-navigation-drawer
      location="end"
      permanent
      elevation="0"
      width="350"
      class="border-l-sm"
    >
      <div class="d-flex flex-column fill-height">
        <!-- HEADER -->
        <CartHeader
          :isHospitality="true"
          :table="table"
          :count="displayItems.length"
          :item-informations="posStore.selectedBill"
          @clear="clearCart"
          @clear-bill="clearBill"
        />

        <!-- CONTENT -->
        <div class="flex-grow-1 overflow-y-auto pa-3">
          <CartItems :items="displayItems" @update-qty="updateQty" />
        </div>

        <!-- FOOTER -->
        <CartFooter
          :subtotal="posStore.subtotal"
          :total="posStore.total"
          :discount="posStore.discount"
          :payment-method="posStore.paymentMethod"
          :payment-methods="posStore.paymentMethods"
          :disabled="isFooterDisabled"
          @select-payment="selectPayment"
          @checkout="checkout"
          @print-bill="handlePrintBill"
          @open-discount="showDiscountModal = true"
        />
      </div>
    </v-navigation-drawer>
    <DiscountDialog
      v-model="showDiscountModal"
      :subtotal="posStore.subtotal"
      @apply="handleDiscount"
    />
  </div>
</template>
