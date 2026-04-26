import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

export const usePosStore = defineStore(
  'pos',
  () => {
    /** -------------------
     * STATE
     * ------------------- */

    const cart = ref([])
    const paymentMethod = ref('cash')
    const orderId = ref(null)
    const discount = ref(0)
    const { t } = useI18n()

    const stores = [
      { id: 1, name: 'Coffee Shop', type: 'coffee' },
      { id: 2, name: 'Restaurant', type: 'hospitality' }
    ]

    const paymentMethods = [
      { id: 'cash', icon: 'mdi-cash', label: t('payment.cash') },
      { id: 'qr', icon: 'mdi-qrcode-scan', label: t('payment.qr') },
      { id: 'card', icon: 'mdi-credit-card-outline', label: t('payment.card') }
    ]

    const selectedStore = ref(stores[1])
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

    // Subtract the discount from subtotal
    const total = computed(() => {
      const result = subtotal.value - discount.value
      return result > 0 ? result : 0 // Ensure total never goes negative
    })

    /** -------------------
     * ACTIONS
     * ------------------- */
    function setDiscount(amount) {
      // Use the ref directly instead of 'this'
      discount.value = amount
    }

    function selectStore(store) {
      selectedStore.value = store
      clearCart()
      selectedTable.value = null
    }

    function selectTable(table) {
      selectedTable.value = table
    }
    const router = useRouter()

    function clearTable() {
      router.push('/pos/menu-list')
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
      discount.value = 0
      paymentMethod.value = 'cash'
    }

    function setPaymentMethod(method) {
      if (paymentMethod.value === method) return
      paymentMethod.value = method
    }

    return {
      /** state */
      cart,
      paymentMethod,
      orderId,
      stores,
      paymentMethods,
      selectedStore,
      selectedTable,
      selectedBill,
      isPrintBill,

      /** computed */
      activeItems,
      subtotal,
      total,
      discount,

      /** actions */
      selectStore,
      setDiscount,
      selectTable,
      clearTable,
      selectBill,
      addToCart,
      updateQty,
      removeFromCart,
      clearCart,
      setPaymentMethod,
      clearBill
    }
  },
  {
    persist: {
      key: 'pos-store',
      storage: localStorage,

      // only persist what matters
      paths: ['cart', 'paymentMethod', 'selectedStore', 'selectedTable']
    }
  }
)
