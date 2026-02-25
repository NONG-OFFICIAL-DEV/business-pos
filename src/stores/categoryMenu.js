import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoryMenuService } from '@/api/categoryMenu'

export const useCategoryMenuStore = defineStore('categoryMenu', () => {
  const items = ref([])

  async function fetchAllMenuCategory(loading) {
    const { data } = await categoryMenuService.getAll(loading)
    items.value = data.data || []
  }
  return {
    items,

    fetchAllMenuCategory
  }
})
