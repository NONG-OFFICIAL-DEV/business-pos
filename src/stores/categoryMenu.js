import { defineStore } from 'pinia'
import { ref } from 'vue'
import { categoryMenuService } from '@/api/categoryMenu'

export const useCategoryMenuStore = defineStore('categoryMenu', () => {
  const items = ref([])
  const categories = ref([])
  const loading = ref(false)

  async function fetchAllMenuCategory() {
    loading.value = true
    try {
      const { data } = await categoryMenuService.getAll()
      items.value = data.data.data || []
    } finally {
      loading.value = false
    }
  }
  async function fetchMenuCategories(parmap) {
    loading.value = true
    try {
      const { data } = await categoryMenuService.getCategories(parmap)
      categories.value = data.data || []
    } finally {
      loading.value = false
    }
  }
  return {
    loading,
    items,
    categories,
    fetchAllMenuCategory,
    fetchMenuCategories
  }
})
