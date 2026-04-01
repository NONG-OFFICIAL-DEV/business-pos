// composables/useBuType.js
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useBuType() {
  const auth = useAuthStore()

  return {
    buType:       computed(() => auth.bu_type),
    isRestaurant: computed(() => auth.bu_type === 'restaurant'),
    isCoffeeStore: computed(() => auth.bu_type === 'cafe'),
    isRetail:     computed(() => auth.bu_type === 'retail'),
  }
}