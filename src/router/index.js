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

export default createRouter({
  history: createWebHistory(),
  routes
})
