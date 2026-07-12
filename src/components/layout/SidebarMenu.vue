<template>
  <v-navigation-drawer :width="90" permanent>
    <!-- ── Main nav tiles ── -->
    <v-list nav class="pa-2 d-flex flex-column gap-2">
      <v-card
        v-for="item in menuItems"
        :key="item.value"
        :to="item.to"
        :color="isActive(item) ? 'primary' : undefined"
        :variant="isActive(item) ? 'tonal' : 'text'"
        rounded="lg"
        class="nav-tile mb-2 d-flex flex-column align-center justify-center text-center cursor-pointer"
        :ripple="true"
        flat
      >
        <v-badge
          v-if="item.value === 'Cashier' && orderCount > 0"
          :content="orderCount"
          color="error"
          floating
        >
          <v-icon :icon="item.icon" size="28" />
        </v-badge>
        <v-icon v-else :icon="item.icon" size="28" />

        <div class="nav-tile-label text-caption mt-1">
          {{ item.tooltip }}
        </div>
      </v-card>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const route = useRoute()

  const props = defineProps({
    orderCount: { type: Number, default: 0 },
    user: Object
  })

  function isActive(item) {
    return route.path === item.to
  }

  const MENU_ITEMS = [
    {
      tooltip: 'Tables',
      icon: 'mdi-table-chair',
      value: 'Dining Table',
      to: '/pos/tables',
      premium: false
    },
    {
      tooltip: 'Menu',
      icon: 'mdi-book-open-outline',
      value: 'Menu List',
      to: '/pos/menu',
      premium: false
    },
    {
      tooltip: 'Kitchen',
      icon: 'mdi-silverware-fork-knife',
      value: 'Kitchen Display',
      to: '/pos/kds',
      premium: true
    },
    {
      tooltip: 'Orders',
      icon: 'mdi-cash-register',
      value: 'Cashier',
      to: '/pos/cashier',
      premium: false
    }
  ]

  const isPremium = computed(() => authStore.plan === 'premium')

  const menuItems = computed(() =>
    MENU_ITEMS.filter(item => !item.premium || isPremium.value)
  )
</script>

<style scoped>
  .nav-tile {
    width: 70px;
    height: 70px;
    transition: background-color 0.2s;
  }

  .nav-tile-label {
    font-size: 11px;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 64px;
  }
</style>
