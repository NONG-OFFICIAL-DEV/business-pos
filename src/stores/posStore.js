import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

export const usePosStore = defineStore('pos', () => {
  /** -------------------
   * STATE
   * ------------------- */

  const cart = ref([])
  const paymentMethod = ref('cash')
  const paymentTiming = ref('now') // 'now' | 'later'
  const orderId = ref(null)
  const discountType = ref('fixed') // 'percentage' | 'fixed'
  const discountValue = ref(0)
  const { t } = useI18n()

  const paymentMethods = computed(() => [
    { id: 'cash', icon: 'mdi-cash', label: t('payment.cash') },
    { id: 'qr', icon: 'mdi-qrcode-scan', label: t('payment.qr') },
    { id: 'card', icon: 'mdi-credit-card-outline', label: t('payment.card') }
  ])

  const selectedTable = ref(null)

  const selectedBill = ref([])
  const isPrintBill = ref(false)

  /** -------------------
   * COMPUTED
   * ------------------- */

  const activeItems = computed(() =>
    isPrintBill.value ? selectedBill.value.items : cart.value
  )

  const subtotal = computed(() =>
    activeItems.value.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
  )

  // Recomputed from type/value so it stays correct as the cart changes
  const discount = computed(() => {
    if (!discountValue.value) return 0
    if (discountType.value === 'percentage') {
      return (subtotal.value * discountValue.value) / 100
    }
    return discountValue.value
  })

  // Subtract the discount from subtotal
  const total = computed(() => {
    const result = subtotal.value - discount.value
    return result > 0 ? result : 0 // Ensure total never goes negative
  })

  /** -------------------
   * ACTIONS
   * ------------------- */
  function applyDiscount({ type, value }) {
    discountType.value = type
    discountValue.value = value
  }

  function clearDiscount() {
    discountType.value = 'fixed'
    discountValue.value = 0
  }

  function selectTable(table) {
    selectedTable.value = table
  }

  function setPaymentTiming(timing) {
    paymentTiming.value = timing
  }
  const router = useRouter()

  function clearTable() {
    router.push('/pos/menu')
    selectedTable.value = null
    clearCart()
  }
  function selectBill(bill) {
    isPrintBill.value = true
    selectedBill.value = bill

    selectedTable.value = null
    clearCart()
  }
  function clearBill() {
    selectedBill.value = null
    isPrintBill.value = false
  }

  function addToCart(item) {
    isPrintBill.value = false
    selectedBill.value = []

    const cartKey = `${item.id}_${JSON.stringify(item.customizations || {})}`

    const existing = cart.value.find(i => i.cartKey === cartKey)

    if (existing) {
      existing.quantity += item.quantity
    } else {
      cart.value.push({ ...item, cartKey })
    }
  }

  function updateQty(cartKey, qty) {
    const item = cart.value.find(i => i.cartKey === cartKey)
    if (!item) return

    item.quantity = qty
    if (item.quantity <= 0) removeFromCart(cartKey)
  }

  function removeFromCart(cartKey) {
    cart.value = cart.value.filter(i => i.cartKey !== cartKey)
  }

  function clearCart() {
    cart.value = []
    clearDiscount()
    paymentMethod.value = 'cash'
    paymentTiming.value = 'now'
  }

  function setPaymentMethod(method) {
    if (paymentMethod.value === method) return
    paymentMethod.value = method
  }

  return {
    /** state */
    cart,
    paymentMethod,
    paymentTiming,
    orderId,
    discountType,
    discountValue,
    paymentMethods,
    selectedTable,
    selectedBill,
    isPrintBill,

    /** computed */
    activeItems,
    subtotal,
    total,
    discount,

    /** actions */
    applyDiscount,
    clearDiscount,
    selectTable,
    clearTable,
    selectBill,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    setPaymentMethod,
    setPaymentTiming,
    clearBill
  }
})
