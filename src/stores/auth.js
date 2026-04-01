import { defineStore } from 'pinia'
import authService from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    me: {},
    unread_notifications_count: 0,
    token: localStorage.getItem('token') || null,
    branch_id: null,
    branch_id: null,
    branch_name: null,
    roleName: null,
    bu_type: null
  }),
  getters: {
    isRestaurant: state => state.bu_type === 'restaurant',
    isRetail: state => state.bu_type === 'retail',
    isWarehouse: state => state.bu_type === 'warehouse'
    // add whatever bu_type values your backend returns
  },
  actions: {
    //how to use it see in file Login.vue
    async login({ email, password }) {
      const response = await authService.userLogin(email, password)
      if (response.data.status === 'success') {
        this.token = response.data.token
        this.user = response.data.user
        localStorage.setItem('token', response.data.token)
      }
      return response
    },
    async logout() {
      // optional: call API to invalidate JWT on backend
      await authService.userLogout().catch(() => {})

      // remove token & user
      this.token = null
      this.user = null
      localStorage.removeItem('token')
    },
    async fetchMe() {
      const res = await authService.me().catch(() => {})
      this.me = res.data.user
      this.branch_id = res.data.branch_id ?? null
      this.branch_name = res.data.branch_name ?? null
      this.bu_type = res.data.bu_type ?? null
      this.roleName = res.data.role_name ?? null
      this.unread_notifications_count = res.data.unread_notifications_count
    }
  }
})
