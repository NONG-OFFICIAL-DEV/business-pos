import http from './api'

const API_BASE = '/v1/menus' // adjust according to your backend route

export const menuService = {
  fetchMenus() {
    return http.get(API_BASE, {
      meta: { loader: 'skeleton' }
    })
  },
  fetchProducts() {
    return http.get('/v1/products', {
      meta: { loader: 'skeleton' }
    })
  },
}
