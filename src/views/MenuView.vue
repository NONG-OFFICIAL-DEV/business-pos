<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useMenuStore } from '@/stores/menuStore'
  import { useCategoryMenuStore } from '@/stores/categoryMenu'
  import { usePosStore } from '@/stores/posStore'
  const posStore = usePosStore()
  const isCoffeeStore = computed(
    () => posStore.selectedStore?.type === 'coffee'
  )
  const isRestaurant = computed(
    () => posStore.selectedStore?.type === 'hospitality'
  )

  const props = defineProps({
    search: {
      type: String,
      default: ''
    }
  })

  const menuStore = useMenuStore()
  const menuCategoryStore = useCategoryMenuStore()

  const selectedCategory = ref('All')

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────────────────────────────────────
  const isLoading = computed(
    () => menuStore.loading || menuCategoryStore.loading
  )

  const filteredProducts = computed(() => {
    let list = menuStore.menus || []

    // Filter by category
    if (selectedCategory.value !== 'All') {
      list = list.filter(
        p =>
          p.menu_category_id === selectedCategory.value ||
          p.category_id === selectedCategory.value
      )
    }

    // Filter by search (driven by parent prop)
    if (props.search) {
      const q = props.search.toLowerCase()
      list = list.filter(p => p.name?.toLowerCase().includes(q))
    }

    return list
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // EMITS
  // ─────────────────────────────────────────────────────────────────────────────
  const emit = defineEmits(['select', 'quick-add'])

  function handleProductClick(product) {
    if (!product.has_variants) {
      emit('quick-add', product)
    } else {
      emit('select', product)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────────────────────────────────────
  onMounted(async () => {
    await Promise.all([
      menuStore.fetchMenus(),
      menuCategoryStore.fetchAllMenuCategory()
    ])
  })
</script>

<template>
  <v-container fluid class="pos-menu-view pa-0">
    <div class="sticky-header">
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center gap-2" v-if="!isCoffeeStore">
          <!-- Back to floor plan -->
          <v-btn
            variant="tonal"
            color="primary"
            size="small"
            prepend-icon="mdi-arrow-left"
            rounded="lg"
            class="text-none"
            @click="$router.push('/pos/dining-table-view')"
          >
            Back
          </v-btn>

          <v-icon size="16" color="grey-lighten-1">mdi-chevron-right</v-icon>

          <span class="text-subtitle-2 font-weight-bold text-slate-800">
            Menu
          </span>
        </div>
        <div class="d-flex align-center gap-2" v-else>
          <span class="text-subtitle-2 font-weight-bold text-slate-800">
            Menu
          </span>
        </div>
        <!-- Item count -->
        <v-chip
          size="x-small"
          variant="flat"
          color="grey-lighten-4"
          class="font-weight-bold text-grey-darken-2"
        >
          {{ filteredProducts.length }} ITEMS
        </v-chip>
      </div>

      <div class="mb-4">
        <!-- Loading skeletons — only while fetching -->
        <div v-if="isLoading" class="d-flex gap-2">
          <v-skeleton-loader
            v-for="n in 6"
            :key="n"
            type="chip"
            width="80"
            class="rounded-xl"
          />
        </div>

        <!-- Actual category tabs -->
        <v-slide-group
          v-else
          v-model="selectedCategory"
          mandatory
          show-arrows
          class="category-slider"
        >
          <!-- All -->
          <v-slide-group-item v-slot="{ isSelected, toggle }" value="All">
            <v-btn
              :color="isSelected ? 'primary' : 'grey-lighten-3'"
              :variant="isSelected ? 'flat' : 'flat'"
              class="me-2 text-none"
              rounded="xl"
              size="small"
              prepend-icon="mdi-view-grid"
              @click="toggle"
            >
              All
            </v-btn>
          </v-slide-group-item>

          <!-- Dynamic categories -->
          <v-slide-group-item
            v-for="cat in menuCategoryStore.items"
            :key="cat.id"
            :value="cat.id"
            v-slot="{ isSelected, toggle }"
          >
            <v-btn
              :color="isSelected ? 'primary' : 'grey-lighten-3'"
              :variant="isSelected ? 'flat' : 'flat'"
              class="me-2 text-none"
              rounded="xl"
              size="small"
              prepend-icon="mdi-food-croissant"
              @click="toggle"
            >
              {{ cat.name }}
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
      </div>
    </div>

    <!-- Loading state -->
    <v-row v-if="isLoading" dense>
      <v-col v-for="n in 8" :key="n" cols="12" sm="6" md="4" lg="3">
        <v-skeleton-loader type="card" rounded="xl" />
      </v-col>
    </v-row>

    <!-- Empty state — no results after filter/search -->
    <div
      v-else-if="filteredProducts.length === 0"
      class="d-flex flex-column align-center justify-center pa-16 text-grey"
    >
      <v-icon size="64" class="mb-4" color="grey-lighten-2">
        mdi-food-off
      </v-icon>
      <div class="text-subtitle-1 font-weight-bold mb-1">No items found</div>
      <div class="text-caption text-grey">
        Try a different category or clear your search
      </div>
      <v-btn
        v-if="selectedCategory !== 'All' || props.search"
        variant="tonal"
        color="primary"
        size="small"
        class="mt-4 text-none"
        @click="selectedCategory = 'All'"
      >
        Clear filters
      </v-btn>
    </div>

    <!-- Products -->
    <v-row v-else dense>
      <v-col
        v-for="product in filteredProducts"
        :key="product.id"
        cols="12"
        sm="6"
        md="3"
        lg="3"
      >
        <v-card
          flat
          class="product-card rounded-xl overflow-hidden"
          @click="handleProductClick(product)"
        >
          <!-- Image -->
          <div class="position-relative">
            <v-img
              :src="product.image_url"
              height="150"
              cover
              class="bg-grey-lighten-2"
            >
              <!-- Fallback icon when no image -->
              <template #error>
                <div
                  class="d-flex align-center justify-center fill-height bg-grey-lighten-3"
                >
                  <v-icon size="40" color="grey-lighten-1">mdi-food</v-icon>
                </div>
              </template>
            </v-img>

            <!-- "OPTIONS" badge for variants -->
            <v-chip
              v-if="product.has_variants"
              size="x-small"
              color="white"
              variant="flat"
              class="variant-badge font-weight-black text-primary"
            >
              <v-icon icon="mdi-tune" size="10" class="mr-1" />
              OPTIONS
            </v-chip>

            <!-- "SOLD OUT" overlay -->
            <div v-if="product.is_available === false" class="sold-out-overlay">
              <span class="text-caption font-weight-black text-white">
                SOLD OUT
              </span>
            </div>
          </div>

          <!-- Info -->
          <v-card-text class="pa-3">
            <div
              class="text-body-2 font-weight-bold text-truncate mb-1 text-slate-900"
            >
              {{ product.name }}
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-subtitle-1 font-weight-black text-primary">
                ${{
                  product.has_variants
                    ? product.variants?.[0]?.price
                    : product.price
                }}
              </span>

              <v-btn
                :color="product.is_available === false ? 'grey' : 'primary'"
                :disabled="product.is_available === false"
                :icon="product.has_variants ? 'mdi-tune' : 'mdi-plus'"
                size="x-small"
                elevation="0"
                variant="tonal"
                class="add-btn"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
  .pos-menu-view {
    position: relative;
  }
  .product-card {
    transition: all 0.18s ease;
    border: 1.5px solid #f1f5f9 !important;
    cursor: pointer;
  }
  .product-card:hover {
    transform: translateY(-3px);
    border-color: rgb(var(--v-theme-primary)) !important;
    box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.1) !important;
  }

  .variant-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .sold-out-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .add-btn {
    border-radius: 8px !important;
  }

  .text-slate-900 {
    color: #0f172a;
  }
  .text-slate-800 {
    color: #1e293b;
  }

  .category-slider {
    background: transparent;
  }

  .gap-2 {
    gap: 8px;
  }

  .sticky-header {
    position: sticky;
    top: 0px;
    z-index: 5;
    background: rgba(248, 250, 252, 0.9) !important;
    backdrop-filter: blur(8px);
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 10px;
  }
</style>
