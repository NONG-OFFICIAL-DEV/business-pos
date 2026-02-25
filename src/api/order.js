import http from './api'

export default {
  getAllOrder() {
    return http.get('/orders')
  },
  createOrder(payload,loading) {
    return http.post('/orders', payload, {
      meta: { loader:loading }
    })
  },
  getOrderByTable(tableNumber) {
    return http.get(`/orders/by-table/${tableNumber}`, {
      meta: { loader: 'skeleton' }
    })
  },
  async printBillForPayment(orderId) {
    const res = await http.post(`/orders/${orderId}/print-bill`)
    return res
  }
}
