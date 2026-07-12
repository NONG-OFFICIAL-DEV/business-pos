<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDiningTableStore } from '@/stores/diningTableStore'
  import { usePosStore } from '@/stores/posStore'
  import { useAppUtils } from '@/composables/useAppUtils'
  import { useI18n } from 'vue-i18n'

  const { t } = useI18n()
  const router = useRouter()
  const { notif, confirm } = useAppUtils()
  const posStore = usePosStore()
  const tableStore = useDiningTableStore()

  // ── State ──────────────────────────────────────
  const loading = ref(false)
  const error = ref(null)
  const statusFilter = ref('all')

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
  // Occupied tables are tappable too (staff need to add more items to an
  // already-seated table's order) — only reserved warns before opening,
  // since seating the wrong party over a reservation is the real risk.
  function goToTable(table) {
    posStore.selectTable(table)
    notif(t('messages.tableSelected', { tableNumber: table.table_number }), {
      type: 'success',
      color: 'primary'
    })
    router.push('/pos/menu')
  }

  function openTable(table) {
    if (table.status === 'reserved') {
      confirm({
        title: t('dialog.confirm_open_reserved_table'),
        options: { type: 'warning' },
        agree: () => goToTable(table)
      })
      return
    }
    goToTable(table)
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

  // ── Filter + group by area ──────────────────────
  const filteredTables = computed(() => {
    if (statusFilter.value === 'all') return tableStore.tables
    return tableStore.tables.filter(tb => tb.status === statusFilter.value)
  })

  const groupedTables = computed(() => {
    const groups = new Map()
    for (const table of filteredTables.value) {
      const area = table.area || t('table.no_area')
      if (!groups.has(area)) groups.set(area, [])
      groups.get(area).push(table)
    }
    return Array.from(groups, ([area, tables]) => ({ area, tables }))
  })

  // Only worth a heading per group when there's more than one area —
  // otherwise it's just one pointless wrapper around the whole grid.
  const showAreaHeadings = computed(() => groupedTables.value.length > 1)

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
</script>

<template>
  <v-container fluid class="pa-4">
    <div class="d-flex ga-3 flex-wrap mb-4">
      <v-chip
        :variant="statusFilter === 'all' ? 'flat' : 'tonal'"
        color="primary"
        size="large"
        class="font-weight-bold cursor-pointer tap-44 px-4"
        @click="statusFilter = 'all'"
      >
        {{ t('table.all') }} ({{ tableStore.tables.length }})
      </v-chip>
      <v-chip
        :variant="statusFilter === 'available' ? 'flat' : 'tonal'"
        color="success"
        size="large"
        class="font-weight-bold cursor-pointer tap-44 px-4"
        @click="statusFilter = 'available'"
      >
        {{ t('table.available') }} ({{ availableCount }})
      </v-chip>
      <v-chip
        :variant="statusFilter === 'occupied' ? 'flat' : 'tonal'"
        color="error"
        size="large"
        class="font-weight-bold cursor-pointer tap-44 px-4"
        @click="statusFilter = 'occupied'"
      >
        {{ t('table.occupied') }} ({{ occupiedCount }})
      </v-chip>
      <v-chip
        :variant="statusFilter === 'reserved' ? 'flat' : 'tonal'"
        color="warning"
        size="large"
        class="font-weight-bold cursor-pointer tap-44 px-4"
        @click="statusFilter = 'reserved'"
      >
        {{ t('table.reserved') }} ({{ reservedCount }})
      </v-chip>
    </div>

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
        <v-btn variant="text" size="small" @click="fetchTables">
          {{ t('btn.retry') }}
        </v-btn>
      </template>
    </v-alert>

    <!-- Loading skeleton -->
    <v-row v-if="loading" dense class="pa-2">
      <v-col v-for="n in 12" :key="n" cols="6" sm="4" md="3" lg="3">
        <v-skeleton-loader type="card" rounded="xl" />
      </v-col>
    </v-row>

    <!-- Empty state — no tables at all -->
    <div
      v-else-if="!loading && tableStore.tables.length === 0 && !error"
      class="empty-state"
    >
      <v-icon size="64" color="grey-lighten-1">mdi-table-off</v-icon>
      <p class="text-grey mt-3">{{ t('table.no_tables_found') }}</p>
      <v-btn variant="tonal" class="mt-2" @click="fetchTables">
        {{ t('table.refresh') }}
      </v-btn>
    </div>

    <!-- Empty state — filter matches nothing -->
    <div
      v-else-if="!loading && groupedTables.length === 0"
      class="empty-state"
    >
      <v-icon size="64" color="grey-lighten-1">mdi-filter-off-outline</v-icon>
      <p class="text-grey mt-3">{{ t('table.no_matches') }}</p>
      <v-btn variant="tonal" class="mt-2" @click="statusFilter = 'all'">
        {{ t('table.all') }}
      </v-btn>
    </div>

    <!-- Tables grid, grouped by area -->
    <template v-else-if="!loading">
      <div
        v-for="group in groupedTables"
        :key="group.area"
        class="area-group mb-6"
      >
        <div v-if="showAreaHeadings" class="area-heading d-flex align-center mb-3">
          <v-icon size="16" color="brown-darken-2" class="mr-1">
            mdi-map-marker-outline
          </v-icon>
          <span class="area-title">{{ group.area }}</span>
          <v-chip size="x-small" variant="tonal" class="ml-2">
            {{ group.tables.length }}
          </v-chip>
        </div>

        <v-row dense>
          <v-col
            v-for="table in group.tables"
            :key="table.id"
            cols="6"
            sm="4"
            md="3"
            lg="3"
          >
            <v-tooltip
              :text="`${t('table.seats')} ${table.capacity} · ${table.area}`"
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
                  @click="openTable(table)"
                >
                  <div
                    :class="['status-ribbon', `bg-${statusColor(table.status)}`]"
                  />

                  <v-card-text class="pa-4 text-center">
                    <div class="text-h4 font-weight-black mb-2 text-grey-darken-4">
                      T-{{ table.table_number }}
                    </div>

                    <div class="d-flex align-center justify-center ga-2">
                      <v-chip
                        size="small"
                        variant="tonal"
                        density="compact"
                        prepend-icon="mdi-account"
                      >
                        {{ table.capacity }}
                      </v-chip>
                      <v-chip
                        size="small"
                        variant="flat"
                        density="compact"
                        :color="statusColor(table.status)"
                        class="font-weight-bold text-white"
                      >
                        <v-icon start size="12">{{ statusIcon(table.status) }}</v-icon>
                        {{ t(`table.${table.status}`) }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </template>
            </v-tooltip>
          </v-col>
        </v-row>
      </div>
    </template>
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

  .table-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.07) !important;
    border-color: rgb(var(--v-theme-primary)) !important;
  }

  /* Occupied — still fully tappable (adding to an open tab), just a tint */
  .table-card--occupied {
    border-color: #ffcdd2 !important;
  }

  /* Reserved — tappable via confirm, warning tint */
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

  .area-heading {
    padding-left: 4px;
  }

  .area-title {
    font-size: 0.8rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #5d4037;
  }

  .cursor-pointer {
    cursor: pointer;
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
