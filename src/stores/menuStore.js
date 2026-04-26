import { defineStore } from 'pinia'
import { ref } from 'vue'
import { menuService } from '@/api/menu'

export const useMenuStore = defineStore('menu', () => {
  const menus = ref([])
  const loading = ref(false)
  const products = ref([])

  async function fetchMenus() {
    const res = await menuService.fetchMenus()
    menus.value = res.data.data.data || []
  }
  async function getProducts(params) {
    loading.value = true
    const res = await menuService.fetchProducts(params)
    products.value = res.data.data.data || []
    loading.value = false
  }

  return { loading,menus, products, fetchMenus, getProducts }
})
