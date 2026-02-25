import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePosStore = defineStore(
  'pos',
  () => {
    /** -------------------
     * STATE
     * ------------------- */

    const cart = ref([])
    const paymentMethod = ref('qr')
    const orderId = ref(null)

    const stores = [
      { id: 1, name: 'Mart', type: 'retail' },
      { id: 2, name: 'Coffee Shop', type: 'coffee' },
      { id: 3, name: 'Restaurant', type: 'hospitality' }
    ]

    const paymentMethods = [
      { id: 'qr', icon: 'mdi-qrcode-scan', label: 'QR' },
      { id: 'cash', icon: 'mdi-cash', label: 'Cash' },
      { id: 'card', icon: 'mdi-credit-card-outline', label: 'Card' }
    ]

    const selectedStore = ref(stores[3])
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
      activeItems.value.reduce((sum, i) => sum + i.price * i.qty, 0)
    )

    const total = computed(() => subtotal.value)

    /** -------------------
     * ACTIONS
     * ------------------- */

    function selectStore(store) {
      selectedStore.value = store
      clearCart()
      selectedTable.value = null
    }

    function selectTable(table) {
      selectedTable.value = table
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

      const existing = cart.value.find(
        i =>
          i.id === item.id &&
          JSON.stringify(i.customizations || {}) ===
            JSON.stringify(item.customizations || {})
      )

      if (existing) {
        existing.qty += item.qty
      } else {
        cart.value.push({ ...item })
      }
    }

    function updateQty(itemId, qty) {
      const item = cart.value.find(i => i.id === itemId)
      if (!item) return

      item.qty = qty
      if (item.qty <= 0) removeFromCart(itemId)
    }

    function removeFromCart(itemId) {
      cart.value = cart.value.filter(i => i.id !== itemId)
    }

    function clearCart() {
      cart.value = []
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

      /** actions */
      selectStore,
      selectTable,
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
