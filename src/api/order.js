import http from './api'

export default {
  getAllOrder() {
    return http.get('/v1/orders')
  },
  createOrder(payload,loading) {
    return http.post('/v1/orders', payload, {
      meta: { loader:loading }
    })
  },
  getOrderByTable(tableNumber) {
    return http.get(`/v1/orders/by-table/${tableNumber}`, {
      meta: { loader: 'skeleton' }
    })
  },
  async printBillForPayment(orderId) {
    const res = await http.post(`/v1/orders/${orderId}/print-bill`)
    return res
  }
}
