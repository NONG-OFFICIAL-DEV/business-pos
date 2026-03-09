import http from './api'

export default {
  getAllTables(params = {}) {
    return http.get('/v1/tables', { params })
  },

  getTable(id) {
    return http.get(`/v1/tables/${id}`)
  },

  createTable(data) {
    return http.post('/v1/tables', data)
  },

  updateTable(id, data) {
    return http.put(`/v1/tables/${id}`, data)
  },

  deleteTable(id) {
    return http.delete(`/v1/tables/${id}`)
  },

  // POS / KDS
  updateStatus(id, status) {
    return http.patch(`/v1/tables/${id}/status`, { status })
  },
  // POS / KDS
  getTableNumberByToken(token) {
    return http.get(`/v1/tables/table-by-token/${token}`, {
      meta: { loader: 'nothing' }
    })
  },

  showQRCode(tableId) {
    return http.get(`/tables/${tableId}/qrcode`)
  }
}
