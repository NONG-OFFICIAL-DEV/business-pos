import { defineStore } from 'pinia'
import authService from '../api/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    me: {},
    unread_notifications_count: 0,
    token: localStorage.getItem('coffee-pos-token') || null,
    branch_id: null,
    branch_name: null,
    roleName: null,
    bu_type: null
  }),

  actions: {
    _applyLoginResponse(data) {
      this.token = data.token
      localStorage.setItem('coffee-pos-token', data.token)

      this.user = data.user
      this.permissions = data.permissions ?? []
      this.isSuperAdmin = data.is_super_admin ?? false
      this.isOwner = data.is_owner ?? false
      this.isStaff = data.is_staff ?? false
      this.tenant_id = data.tenant_id ?? null
      this.branch_id = data.branch_id ?? null
      this.branch_name = data.branch_name ?? null
      this.bu_name = data.bu_name ?? null
      this.bu_type = data.bu_type ?? null
      this.logo_url = data.logo_url ?? null
      this.role_name = data.role_name ?? null
      this.currency = data.currency ?? null
    },
    //how to use it see in file Login.vue
    async login({ email, password }) {
      const response = await authService.userLogin(email, password)
      if (response.data.status === 'success') {
        this.token = response.data.token
        this.user = response.data.user
        localStorage.setItem('coffee-pos-token', response.data.token)
      }
      return response
    },
    // ── PIN login ──────────────────────────────────────────────────────────────
    async loginByPin(pin_code, branch_id = null) {
      const response = await authService.loginByPin(pin_code, branch_id)
      if (response.data.status === 'success') {
        this._applyLoginResponse(response.data)
      }
      return response
    },
    async logout() {
      // optional: call API to invalidate JWT on backend
      await authService.userLogout().catch(() => {})

      // remove token & user
      this.token = null
      this.user = null
      localStorage.removeItem('coffee-pos-token')
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
