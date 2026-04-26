<script setup>
  import LanguageSwicher from '@/components/customs/LanguageSwicher.vue'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  defineProps({
    search: String,
    user: Object,
    roleName: String,
    branchName: String,
    content: [String, Number],
    isCoffeeStore: Boolean
  })

  const emit = defineEmits([
    'update:search',
    'update:store',
    'logout',
    'orders'
  ])

  function handleLogout() {
    emit('logout')
  }
</script>

<template>
  <v-app-bar elevation="0" class="header-glass px-4 border-b">
    <div class="d-flex align-center brand-section mr-6">
      <div class="logo-box mr-3">
        <v-icon icon="mdi-coffee" color="white" size="22" />
      </div>
      <div class="d-flex flex-column d-none d-sm-flex">
        <span class="brand-title">
          QUICK
          <span class="brand-accent">POS</span>
        </span>
        <div class="d-flex align-center mt-n1">
          <span class="station-label">STATION 01</span>
          <v-chip
            size="x-small"
            variant="flat"
            color="brown-lighten-5"
            class="ml-2 font-weight-bold text-brown"
          >
            {{ branchName }}
          </v-chip>
        </div>
      </div>
    </div>

    <v-app-bar-title>
      <v-responsive max-width="440" class="mx-auto">
        <v-text-field
          :model-value="search"
          @update:model-value="emit('update:search', $event)"
          prepend-inner-icon="mdi-magnify"
          :placeholder="t('menu.search_placeholder')"
          hide-details
          density="compact"
          variant="solo"
          flat
          class="search-input"
          rounded="lg"
        >
          <template v-slot:append-inner>
            <v-icon size="20" color="brown-lighten-3" class="cursor-pointer">
              mdi-barcode-scan
            </v-icon>
          </template>
        </v-text-field>
      </v-responsive>
    </v-app-bar-title>

    <template v-slot:append>
      <div v-if="!isCoffeeStore" class="mr-2">
        <v-btn
          icon
          variant="text"
          size="small"
          @click="$emit('orders')"
          class="action-btn"
        >
          <v-badge
            :content="content"
            :model-value="content > 0"
            color="orange-darken-3"
            offset-x="2"
            offset-y="2"
          >
            <v-icon icon="mdi-tray-full" color="brown-darken-2" size="24" />
          </v-badge>
        </v-btn>
      </div>
      <v-divider
        vertical
        class="border-opacity-20 mx-2"
        style="height: 24px; align-self: center"
      />
      <LanguageSwicher />
      <v-divider vertical inset class="mx-2 d-none d-sm-block" />

      <div class="user-profile-section d-flex align-center pl-2">
        <div class="text-right d-none d-md-block mr-3" style="line-height: 1.1">
          <div class="user-name">{{ user?.full_name || 'Barista' }}</div>
          <div class="user-role">{{ roleName }}</div>
        </div>

        <v-menu location="bottom end" transition="slide-y-transition">
          <template v-slot:activator="{ props }">
            <v-avatar
              v-bind="props"
              size="38"
              class="cursor-pointer user-avatar"
            >
              <v-img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                cover
              />
            </v-avatar>
          </template>

          <v-list width="200" rounded="xl" class="mt-3 pa-2 shadow-xl">
            <v-list-item
              prepend-icon="mdi-logout-variant"
              title="Logout"
              base-color="error"
              rounded="lg"
              @click="handleLogout"
            />
          </v-list>
        </v-menu>
      </div>
    </template>
  </v-app-bar>
</template>

<style scoped>
  /* ── Container ── */
  .header-glass {
    background: rgba(255, 255, 255, 0.8) !important;
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(141, 110, 99, 0.1) !important;
  }

  /* ── Branding ── */
  .logo-box {
    background: #3e2723; /* Espresso */
    height: 38px;
    width: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(62, 39, 35, 0.2);
  }

  .brand-title {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: #2e1d1a;
  }

  .brand-accent {
    color: #8d6e63; /* Latte color */
    margin-left: 2px;
  }

  .station-label {
    font-size: 0.65rem;
    font-weight: 900;
    color: #a1887f;
    letter-spacing: 0.05em;
  }

  /* ── Search Bar ── */
  .search-input :deep(.v-field) {
    background-color: #f5f0eb !important; /* Warm Cream */
    border-radius: 12px !important;
    transition: all 0.25s ease;
  }

  .search-input :deep(.v-field--focused) {
    background-color: #ffffff !important;
    box-shadow: 0 8px 20px rgba(62, 39, 35, 0.08) !important;
    border: 1px solid #d7ccc8 !important;
  }

  /* ── User & Actions ── */
  .user-name {
    font-size: 0.85rem;
    font-weight: 700;
    color: #3e2723;
  }

  .user-role {
    font-size: 0.7rem;
    font-weight: 600;
    color: #a1887f;
    text-transform: uppercase;
  }

  .user-avatar {
    border: 2px solid #efebe9;
    transition: transform 0.2s ease;
  }

  .user-avatar:hover {
    transform: scale(1.05);
  }

  .action-btn {
    background: #fdfbf9;
    border: 1px solid #efebe9;
  }

  .shadow-xl {
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
  }
</style>
