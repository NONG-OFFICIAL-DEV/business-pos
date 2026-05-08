import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { BU_TYPES } from '@/constants/buTypes'

export function useBuType() {
  const authStore = useAuthStore()

  const buType = computed(() => authStore.bu_type)

  const isCoffeeShop = computed(() => buType.value === BU_TYPES.COFFEE_SHOP)
  const isRestaurant = computed(() => buType.value === BU_TYPES.RESTAURANT)

  return {
    buType,
    isCoffeeShop,
    isRestaurant,
  }
}