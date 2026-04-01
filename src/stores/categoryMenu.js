import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoryMenuService } from '@/api/categoryMenu'

export const useCategoryMenuStore = defineStore('categoryMenu', () => {
  const items = ref([])
  const categories = ref([])

  async function fetchAllMenuCategory(loading) {
    const { data } = await categoryMenuService.getAll(loading)
    items.value = data.data.data || []
  }
  async function fetchMenuCategories(parmap) {
    const { data } = await categoryMenuService.getCategories(parmap)
    categories.value = data.data || []
  }
  return {
    items,
    categories,
    fetchAllMenuCategory,
    fetchMenuCategories
  }
})
