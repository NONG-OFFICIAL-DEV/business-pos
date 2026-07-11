import { computed } from 'vue'

// Accepts a getter, e.g. useInitials(() => props.user), so the result stays reactive.
export function useInitials(getUser) {
  return computed(() => {
    const u = getUser()
    const first = u?.first_name?.trim()?.[0] || ''
    const last = u?.last_name?.trim()?.[0] || ''
    if (first || last) return (first + last).toUpperCase() || 'OP'

    const fullName = u?.full_name?.trim()
    if (fullName) {
      const parts = fullName.split(' ')
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
      return parts[0].slice(0, 2).toUpperCase()
    }

    return 'OP'
  })
}
