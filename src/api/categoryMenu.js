import http from './api'

const BASE_URL = '/v1/categories'

export const categoryMenuService = {
  getAll(loading) {
    return http.get(BASE_URL, {
      meta: { loader: loading }
    })
  },
}
