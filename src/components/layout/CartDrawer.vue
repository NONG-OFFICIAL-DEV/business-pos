<script setup>
  import { computed, ref } from 'vue'
  import { usePosStore } from '@/stores/posStore'
  import { useI18n } from 'vue-i18n'
  import { useAppUtils } from '@nong-official-dev/core'

  import CartHeader from './cardDrawer/CartHeader.vue'
  import CartItems from './cardDrawer/CartItems.vue'
  import CartFooter from './cardDrawer/CartFooter.vue'
  import DiscountDialog from '@/components/DiscountDialog.vue'

  const emit = defineEmits(['checkout'])

  const { t } = useI18n()
  const { confirm } = useAppUtils()
  const posStore = usePosStore()
  const showDiscountModal = ref(false)

  const cartItems = computed(() => posStore.cart)
  const table = computed(() => posStore.selectedTable)

  const displayItems = computed(() =>
    cartItems.value.map(i => ({ ...i, editable: true }))
  )

  const isFooterDisabled = computed(() => !cartItems.value.length)

  const updateQty = (itemId, quantity) => posStore.updateQty(itemId, quantity)

  const clearCart = () => {
    confirm({
      title: t('dialog.confirm_clear_cart'),
      message: t('dialog.cannot_undo'),
      options: { type: 'error' },
      agree: () => posStore.clearCart()
    })
  }

  const selectPayment = method => posStore.setPaymentMethod(method)

  const checkout = () => {
    emit('checkout', {
      cart: posStore.cart,
      payment: posStore.paymentMethod
    })
  }

  const handleDiscount = discountData => {
    // discountData contains { type, value, amount } from the dialog
    posStore.applyDiscount(discountData)
    showDiscountModal.value = false
  }
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
          :table="table"
          :count="displayItems.length"
          @clear="clearCart"
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
