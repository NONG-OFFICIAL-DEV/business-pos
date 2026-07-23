import { defineStore } from 'pinia'
import orderService from '@/api/order'
import echo from '@/utils/echo'
import { useAuthStore } from '@/stores/auth'

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [],
    loading: false
  }),
  // pinia getter
  getters: {
    unpaidCount: state => state.orders.length
  },
  actions: {
    async createOrder(payload, loading) {
      const res = await orderService.createOrder(payload, loading)
      return res
    },

    async fetchOrderByTable(tableNumber) {
      const { data } = await orderService.getOrderByTable(tableNumber)
      return data
    },

    // Orders is a live working queue (items are added/removed in real time
    // via the websocket subscription below), not a browsable archive — so
    // every page is fetched up front rather than exposing "page 2" and
    // risking an unpaid order going unnoticed off-screen.
    async fetchAllOrders() {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const branchId = authStore.branch_id

        const first = await orderService.getAllOrder({ branch_id: branchId })
        const payload = first.data.data

        // API may return a plain array or a paginated { data, meta, links }
        // wrapper depending on the endpoint.
        if (Array.isArray(payload)) {
          this.orders = payload
          return
        }

        let all = payload?.data ?? []
        const lastPage = payload?.meta?.last_page ?? 1

        for (let page = 2; page <= lastPage; page++) {
          const res = await orderService.getAllOrder({ branch_id: branchId, page })
          all = all.concat(res.data.data?.data ?? [])
        }

        this.orders = all
      } finally {
        this.loading = false
      }
    },
     async printBillForPayment(orderId) {
      const res = await orderService.printBillForPayment(orderId)
      return res
    },

    // ✅ Start listening to Reverb
    subscribeToOrders() {
      echo
        .channel('orders')

        // New order placed
        .listen('.order.created', data => {
          const exists = this.orders.find(o => o.order_id === data.order_id)
          if (!exists) {
            this.orders.unshift(data)
          }
        })

        // Items added to existing order
        .listen('.order.items_added', data => {
          const index = this.orders.findIndex(o => o.order_id === data.order_id)
          if (index !== -1) {
            this.orders[index] = data
          } else {
            this.orders.unshift(data)
          }
        })

        // Order paid — remove from list
        .listen('.order.paid', data => {
          this.orders = this.orders.filter(o => o.order_id !== data.order_id)
        })
    },

    unsubscribeFromOrders() {
      echo.leaveChannel('orders')
    }
  }
})
