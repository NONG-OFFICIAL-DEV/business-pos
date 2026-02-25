<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { usePermission } from '@/composables/usePermission'
  import { useDiningTableStore } from '@/stores/diningTableStore'
  import { usePosStore } from '@/stores/posStore'
  import { useAppUtils } from '@/composables/useAppUtils'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const router = useRouter()
  const { isAdmin, isManager } = usePermission()
  const { notif } = useAppUtils()
  const posStore = usePosStore()
  const tableStore = useDiningTableStore()

  // ── State ──────────────────────────────────────
  const loading = ref(false)
  const error = ref(null)

  // ── Fetch ──────────────────────────────────────
  onMounted(async () => {
    await fetchTables()
  })

  async function fetchTables() {
    loading.value = true
    error.value = null
    try {
      await tableStore.fetchTables()
    } catch (err) {
      error.value =
        err?.response?.data?.message ||
        t(
          'messages.failedToLoadTables',
          'Failed to load tables. Please try again.'
        )
    } finally {
      loading.value = false
    }
  }

  // ── Open table ─────────────────────────────────
  function openTable(table) {
    posStore.selectTable(table)
    notif(t('messages.tableSelected', { tableNumber: table.table_number }), {
      type: 'success',
      color: 'primary'
    })
    router.push('/pos/menu-list')
  }

  // ── Counters ───────────────────────────────────
  const availableCount = computed(
    () => tableStore.tables.filter(t => t.status === 'available').length
  )
  const occupiedCount = computed(
    () => tableStore.tables.filter(t => t.status === 'occupied').length
  )
  const reservedCount = computed(
    () => tableStore.tables.filter(t => t.status === 'reserved').length
  )

  // ── UI helpers ─────────────────────────────────
  const statusIcon = status =>
    ({
      occupied: 'mdi-account-group',
      reserved: 'mdi-clock-outline'
    })[status] ?? 'mdi-table-chair'

  const statusColor = status =>
    ({
      occupied: 'error',
      reserved: 'warning'
    })[status] ?? 'success'

  // A table is clickable unless occupied
  // Reserved is allowed but warns the user
  const isDisabled = table => table.status === 'occupied'
</script>

<template>
  <v-container fluid class="pa-0">
    <custom-title icon="mdi-table-chair">
      Floor Plan

      <template #right>
        <v-chip color="success" class="me-2">
          Available: {{ availableCount }}
        </v-chip>
        <v-chip color="error" class="me-2">
          Occupied: {{ occupiedCount }}
        </v-chip>
        <v-chip color="warning">Reserved: {{ reservedCount }}</v-chip>
      </template>
    </custom-title>

    <!-- Error state -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="ma-4"
      closable
      @click:close="error = null"
    >
      {{ error }}
      <template #append>
        <v-btn variant="text" size="small" @click="fetchTables">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Loading skeleton -->
    <v-row v-if="loading" dense class="pa-2">
      <v-col v-for="n in 12" :key="n" cols="6" sm="4" md="3" lg="2">
        <v-skeleton-loader type="card" rounded="xl" />
      </v-col>
    </v-row>

    <!-- Empty state -->
    <div
      v-else-if="!loading && tableStore.tables.length === 0 && !error"
      class="empty-state"
    >
      <v-icon size="64" color="grey-lighten-1">mdi-table-off</v-icon>
      <p class="text-grey mt-3">No tables found</p>
      <v-btn variant="tonal" class="mt-2" @click="fetchTables">Refresh</v-btn>
    </div>

    <!-- Tables grid -->
    <v-row v-else-if="!loading" dense>
      <v-col
        v-for="table in tableStore.tables"
        :key="table.id"
        cols="6"
        sm="4"
        md="3"
        lg="2"
      >
        <v-tooltip
          :text="
            isDisabled(table)
              ? 'Table is occupied'
              : `Seats ${table.capacity} · ${table.area}`
          "
          location="top"
        >
          <template #activator="{ props }">
            <v-card
              v-bind="props"
              class="table-card rounded-xl overflow-hidden"
              :class="{
                'table-card--occupied': table.status === 'occupied',
                'table-card--reserved': table.status === 'reserved'
              }"
              elevation="0"
              :disabled="isDisabled(table)"
              @click="openTable(table)"
            >
              <div
                :class="['status-ribbon', `bg-${statusColor(table.status)}`]"
              />

              <v-card-text class="pa-4 text-center">
                <div class="d-flex justify-space-between align-start">
                  <v-icon :color="statusColor(table.status)" size="28">
                    {{ statusIcon(table.status) }}
                  </v-icon>
                  <v-chip
                    size="small"
                    variant="tonal"
                    density="compact"
                    prepend-icon="mdi-account"
                  >
                    {{ table.capacity }}
                  </v-chip>
                </div>

                <div class="text-h4 font-weight-black my-2 text-grey-darken-4">
                  T-{{ table.table_number }}
                </div>

                <div
                  class="text-overline font-weight-bold text-grey-darken-1 line-height-1"
                >
                  {{ table.area }}
                </div>
              </v-card-text>

              <div
                :class="[
                  'py-1 text-center text-caption font-weight-black text-white',
                  `bg-${statusColor(table.status)}`
                ]"
              >
                {{ table.status.toUpperCase() }}
              </div>
            </v-card>
          </template>
        </v-tooltip>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
  :deep(.v-skeleton-loader__image) {
    height: 100px !important;
  }
  .table-card {
    position: relative;
    background: white;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid #edf2f7 !important;
    cursor: pointer;
  }

  .table-card:not(.v-card--disabled):hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.07) !important;
    border-color: rgb(var(--v-theme-primary)) !important;
  }

  /* Occupied — no pointer, muted */
  .table-card--occupied {
    cursor: not-allowed;
    opacity: 0.75;
  }

  /* Reserved — pointer with warning tint */
  .table-card--reserved {
    border-color: #fb8c00 !important;
  }

  .status-ribbon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
  }

  .line-height-1 {
    line-height: 1;
  }

  .bg-success {
    background-color: #4caf50 !important;
  }
  .bg-error {
    background-color: #ff5252 !important;
  }
  .bg-warning {
    background-color: #fb8c00 !important;
  }

  /* Empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    text-align: center;
  }
</style>
