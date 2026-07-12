<script setup>
  import { useInitials } from '@/composables/useInitials'
  import { useConnectionStatus } from '@/composables/useConnectionStatus'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const props = defineProps({
    search: String,
    user: Object,
    roleName: String,
    branchName: String
  })

  const emit = defineEmits([
    'update:search',
    'update:store',
    'logout',
    'open-settings'
  ])

  const initials = useInitials(() => props.user)
  const { connected } = useConnectionStatus()

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
          Nexstack
          <span class="brand-accent">POS</span>
        </span>
        <div class="d-flex align-center mt-n1">
          <v-chip
            size="x-small"
            variant="flat"
            color="brown-lighten-5"
            class="font-weight-bold text-brown"
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
          variant="solo"
          flat
          class="search-input"
          rounded="lg"
          clearable
        >
        </v-text-field>
      </v-responsive>
    </v-app-bar-title>

    <template v-slot:append>
      <!-- Settings: language, fullscreen, connection & printer all live here -->
      <v-badge
        :model-value="!connected"
        color="warning"
        dot
        location="top end"
        offset-x="6"
        offset-y="6"
      >
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          rounded="lg"
          class="mr-1 tap-44"
          :title="t('nav.settings')"
          @click="emit('open-settings')"
        >
          <v-icon icon="mdi-cog-outline" size="20" />
        </v-btn>
      </v-badge>
      <v-divider vertical inset class="mx-2 d-none d-sm-block" />
      <div class="user-profile-section d-flex align-center pl-2">
        <div class="text-right d-none d-md-block mr-3" style="line-height: 1.1">
          <div class="user-name">{{ user?.full_name || t('label.staff') }}</div>
          <div class="user-role">{{ roleName }}</div>
        </div>

        <v-menu location="bottom end" transition="slide-y-transition">
          <template v-slot:activator="{ props }">
            <v-avatar
              v-bind="props"
              rounded="lg"
              size="34"
              color="primary"
              class="op-avatar cursor-pointer"
            >
              <span class="text-body-2 font-weight-black text-white">
                {{ initials }}
              </span>
            </v-avatar>
          </template>
          <v-list width="240" rounded="xl" class="mt-3 pa-2">
            <!-- Profile header -->
            <div class="profile-header pa-2 mb-1">
              <div class="d-flex align-center ga-3 mb-2">
                <v-avatar size="40" color="brown-darken-3" rounded="lg">
                  <span class="text-body-2 font-weight-bold text-white">
                    {{ initials }}
                  </span>
                </v-avatar>
                <div class="min-width-0">
                  <div class="font-weight-medium text-body-2 text-truncate">
                    {{ user?.full_name || t('label.staff') }}
                  </div>
                  <div class="text-caption text-medium-emphasis text-truncate">
                    {{ branchName }}
                  </div>
                </div>
              </div>
              <v-chip
                v-if="roleName"
                size="x-small"
                variant="tonal"
                color="primary"
                class="font-weight-bold"
              >
                {{ roleName }}
              </v-chip>
            </div>

            <v-divider class="mb-1" />

            <v-list-item
              prepend-icon="mdi-logout-variant"
              :title="t('btn.logout')"
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

  .profile-header {
    border-radius: 12px;
  }

  .min-width-0 {
    min-width: 0;
  }

  /* ── Avatar ── */
  .op-avatar {
    border: 2px solid #e2e8f0;
    transition: border-color 0.15s;
    cursor: pointer;
    flex-shrink: 0;
  }
  .op-avatar:hover {
    border-color: rgb(var(--v-theme-primary));
  }
</style>
