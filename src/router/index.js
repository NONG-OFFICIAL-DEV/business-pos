import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue')
  },
  {
    path: '/pos',
    name: 'POS',
    component: () => import('@/views/layout/POSLayout.vue'),
    redirect: '/pos/dining-table-view',
    children: [
      {
        path: 'dining-table-view',
        component: () => import('@/views/DiningTableView.vue'),
        meta: { showDrawer: 1 }
      },
      {
        path: 'menu-list',
        component: () => import('@/views/MenuView.vue'),
        meta: { showDrawer: 2 }
      },
      {
        path: 'kds',
        component: () => import('@/views/KitchenDisplayView.vue'),
        meta: { showDrawer: 3 }
      },
      {
        path: 'cashier',
        name: 'Orders',
        component: () => import('@/views/CashierView.vue'),
        meta: { showDrawer: 4 }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()
  const token = localStorage.getItem('coffee-pos-token')

  // ── 1. No token → force Login ──────────────────────────────────────────
  if (!token) {
    if (to.name === 'Login') return next()
    return next({ name: 'Login' })
  }

  // ── 2. Fetch user if not loaded ────────────────────────────────────────
  if (!authStore.me?.id) {
    try {
      await authStore.fetchMe()
    } catch {
      localStorage.removeItem('coffee-pos-token')
      if (to.name === 'Login') return next()
      return next({ name: 'Login' })
    }
  }

  // ── 3. Logged-in user hits Login → redirect by role ───────────────────
  // if (to.name === 'Login') {
  //   return next({ name: resolveHome(authStore) })
  // }

  // ── 5. Route requires a specific permission ────────────────────────────
  if (to.meta.permission && !authStore.can(to.meta.permission)) {
    return next({ name: 'Forbidden' }) // or resolveHome(authStore)
  }

  next()
})

export default router
