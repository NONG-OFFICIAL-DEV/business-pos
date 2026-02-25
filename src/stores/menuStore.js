import { defineStore } from 'pinia'
import { ref } from 'vue'
import { menuService } from '@/api/menu'

export const useMenuStore = defineStore('menu', () => {
  const menus = ref([])

  async function fetchMenus() {
    const res = await menuService.fetchMenus()
    menus.value = res.data.data || []
  }

  return { menus, fetchMenus }
})
