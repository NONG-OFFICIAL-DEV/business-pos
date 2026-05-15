import http from './api'

export default {
  getAllTables(params = {}) {
    return http.get('/v1/tables', { params })
  },
  // POS / KDS
  updateStatus(id, status) {
    return http.patch(`/v1/tables/${id}/status`, { status })
  }
}
