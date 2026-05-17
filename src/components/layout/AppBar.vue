<script setup>
  import { ref, computed, onMounted } from 'vue'
  import LanguageSwicher from '@/components/customs/LanguageSwicher.vue'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const props = defineProps({
    search: String,
    user: Object,
    roleName: String,
    branchName: String
  })

  const emit = defineEmits(['update:search', 'update:store', 'logout'])

  function getInitials(first, last, fullName) {
    // Priority 1: first + last
    if (first || last) {
      const f = first?.trim()?.[0] || ''
      const l = last?.trim()?.[0] || ''
      const result = (f + l).toUpperCase()
      return result || 'OP'
    }

    // Priority 2: fallback to full name
    if (fullName) {
      const parts = fullName.trim().split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return parts[0].slice(0, 2).toUpperCase()
    }

    return 'OP'
  }
  const initials = computed(() =>
    getInitials(
      props.user?.first_name,
      props.user?.last_name,
      props.user?.full_name
    )
  )
  // Fullscreen
  const isFullscreen = ref(false)

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', () => {
      isFullscreen.value = !!document.fullscreenElement
    })
  })
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
      <LanguageSwicher />
      <v-divider vertical inset class="mx-2 d-none d-sm-block" />
      <!-- Fullscreen toggle -->
      <v-btn
        icon
        variant="text"
        size="small"
        :color="isFullscreen ? 'primary' : 'grey-darken-1'"
        rounded="lg"
        class="mr-1"
        :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
        @click="toggleFullscreen"
      >
        <v-icon
          :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
          size="20"
        />
      </v-btn>
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
          <v-list width="220" rounded="xl" class="mt-3 pa-2">
            <!-- Profile header -->
            <v-list-item class="mb-1" density="compact">
              <template v-slot:prepend>
                <v-avatar size="32" color="brown-darken-3" rounded="lg">
                  <span class="text-caption font-weight-bold text-white">
                    {{ initials }}
                  </span>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium text-body-2">
                {{ user?.full_name }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ roleName }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider class="mb-1" />

            <!-- <v-list-item
              prepend-icon="mdi-account-circle-outline"
              title="My profile"
              rounded="lg"
            />
            <v-list-item
              prepend-icon="mdi-cog-outline"
              title="Settings"
              rounded="lg"
            /> -->
            <v-list-item
              prepend-icon="mdi-logout-variant"
              title="Log out"
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
