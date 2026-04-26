import http from './api'

const BASE_URL = '/v1/categories'

export const categoryMenuService = {
  getAll() {
    return http.get(BASE_URL)
  },
  getCategories(filters) {
    return http.get('/v1/mart/pos/categories', {
      params: filters
    })
  }
}
