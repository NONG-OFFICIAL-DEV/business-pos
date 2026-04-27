<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useMenuStore } from '@/stores/menuStore'
  import { useCategoryMenuStore } from '@/stores/categoryMenu'
  import { useAuthStore } from '@/stores/auth'
  import { useBuType } from '@/composables/useBuType'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()
  import { formatKHR } from '@nong-official-dev/core'

  const { isRestaurant, isCoffeeStore } = useBuType()

  const authStore = useAuthStore()

  const props = defineProps({
    search: {
      type: String,
      default: ''
    }
  })

  const menuStore = useMenuStore()
  const menuCategoryStore = useCategoryMenuStore()

  const selectedCategory = ref('All')

  const isLoading = computed(
    () => menuStore.loading || menuCategoryStore.loading
  )

  const filteredProducts = computed(() => {
    let list = menuStore.products || []

    if (selectedCategory.value !== 'All') {
      list = list.filter(
        p =>
          p.menu_category_id === selectedCategory.value ||
          p.category_id === selectedCategory.value
      )
    }

    if (props.search) {
      const q = props.search.toLowerCase()
      list = list.filter(p => p.name?.toLowerCase().includes(q))
    }

    return list
  })

  const emit = defineEmits(['select', 'quick-add'])

  function handleProductClick(product) {
    if (!product.variants?.length) {
      emit('quick-add', product)
    } else {
      emit('select', product)
    }
  }

  onMounted(async () => {
    await Promise.all([
      menuStore.getProducts({ branch_id: authStore.branch_id }),
      menuStore.fetchMenus(),
      menuCategoryStore.fetchMenuCategories({ branch_id: authStore.branch_id })
    ])
  })
</script>

<template>
  <v-container fluid class="pos-menu-view pa-4">
    <div class="sticky-header">
      <div class="category-wrap pb-4">
        <div v-if="isLoading" class="d-flex gap-3 overflow-hidden">
          <v-skeleton-loader
            v-for="n in 6"
            :key="n"
            type="button"
            width="90"
            class="rounded-pill"
          />
        </div>

        <v-slide-group
          v-else
          v-model="selectedCategory"
          mandatory
          show-arrows
          class="category-slider"
        >
          <v-slide-group-item v-slot="{ isSelected, toggle }" value="All">
            <button
              :class="['cat-pill', { active: isSelected }]"
              @click="toggle"
            >
              <v-icon size="16">mdi-apps</v-icon>
              <span>{{ t('label.all_items') }}</span>
            </button>
          </v-slide-group-item>

          <v-slide-group-item
            v-for="cat in menuCategoryStore.categories"
            :key="cat.id"
            :value="cat.id"
            v-slot="{ isSelected, toggle }"
          >
            <button
              :class="['cat-pill', { active: isSelected }]"
              @click="toggle"
            >
              <v-icon v-if="cat.icon" size="16">{{ cat.icon }}</v-icon>
              <span>{{ cat.name }}</span>
            </button>
          </v-slide-group-item>
        </v-slide-group>
      </div>
    </div>

    <v-row v-if="isLoading" dense class="product-grid">
      <v-col v-for="n in 8" :key="n" cols="6" sm="4" md="3" lg="3">
        <div class="skeleton-card">
          <!-- Image area -->
          <div class="skeleton-img-area">
            <v-skeleton-loader type="image" :elevation="0" height="180" />
          </div>

          <!-- Info area -->
          <div class="skeleton-info">
            <!-- Product name -->
            <v-skeleton-loader type="text" width="70%" :elevation="0" />

            <!-- Price + button row -->
            <div class="skeleton-bottom-row">
              <v-skeleton-loader type="text" width="88px" :elevation="0" />
              <div class="skeleton-btn" />
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <div v-else-if="filteredProducts.length === 0" class="empty-state">
      <v-avatar color="brown-lighten-5" size="80" class="mb-4">
        <v-icon size="40" color="brown-lighten-2">
          mdi-coffee-off-outline
        </v-icon>
      </v-avatar>
      <h3 class="empty-title">No matches found</h3>
      <p class="empty-sub">
        We couldn't find anything matching your selection.
      </p>
      <v-btn
        v-if="selectedCategory !== 'All'"
        variant="flat"
        color="brown-darken-2"
        rounded="pill"
        class="mt-4"
        @click="selectedCategory = 'All'"
      >
        Clear Filter
      </v-btn>
    </div>

    <v-row v-else dense class="product-grid">
      <v-col
        v-for="product in filteredProducts"
        :key="product.id"
        cols="6"
        sm="4"
        md="3"
        lg="3"
      >
        <v-card
          :ripple="product.is_available !== false"
          flat
          :class="[
            'product-card',
            { 'is-unavailable': product.is_available === false }
          ]"
          @click="product.is_available !== false && handleProductClick(product)"
        >
          <div class="img-container">
            <v-img :src="product.image_url" cover class="product-img">
              <template #placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="brown-lighten-4" />
                </v-row>
              </template>
              <template #error>
                <div class="img-fallback">
                  <v-icon size="32" color="brown-lighten-3">
                    mdi-coffee-outline
                  </v-icon>
                </div>
              </template>
            </v-img>
            <!-- "OPTIONS" badge for variants -->
            <v-chip
              v-if="product.variants?.length > 0"
              size="x-small"
              color="white"
              variant="flat"
              class="variant-badge font-weight-black text-primary"
            >
              <v-icon icon="mdi-tune" size="10" class="mr-1" />
              {{ t('menu.options') }}
            </v-chip>
            <div v-if="product.is_available === false" class="status-overlay">
              <v-chip
                color="black"
                size="small"
                variant="flat"
                class="font-weight-bold"
              >
                SOLD OUT
              </v-chip>
            </div>

            <div v-else-if="product.has_variants" class="variant-chip">
              <v-icon size="10" class="mr-1">mdi-tune</v-icon>
              CUSTOMIZABLE
            </div>
          </div>

          <v-card-item class="pa-3">
            <div class="product-name">{{ product.name }}</div>

            <div class="d-flex align-center justify-space-between mt-2">
              <div class="price-stack">
                <span
                  v-if="product.variants.length > 0"
                  class="text-caption text-grey"
                >
                  <!-- From -->
                </span>
                <span class="price-text">
                  {{
                    formatKHR(
                      product.variants?.length > 0
                        ? parseFloat(product.variants[0].price_adjustment ?? 0)
                        : parseFloat(product.base_price ?? 0)
                    )
                  }}
                </span>
              </div>

              <v-btn
                :color="
                  product.variants.length > 0
                    ? 'brown-darken-3'
                    : 'brown-lighten-5'
                "
                :class="{
                  'text-white': product.variants.length > 0,
                  'text-brown-darken-3': !product.variants.length > 0
                }"
                size="32"
                flat
                icon
                rounded="lg"
                :disabled="product.is_available === false"
              >
                <v-icon size="18">
                  {{
                    product.variants.length > 0
                      ? 'mdi-dots-horizontal'
                      : 'mdi-plus'
                  }}
                </v-icon>
              </v-btn>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
<style>
  .v-slide-group__content {
    padding-top: 12px;
  }
</style>
<style scoped>
  .pos-menu-view {
    background: #fdfbf9;
    min-height: 100vh;
  }
  /* ── Sticky Header ── */
  .sticky-header {
    position: sticky;
    top: 0px;
    z-index: 10;
    background: linear-gradient(to bottom, #fdfbf9 80%, rgba(253, 251, 249, 0));
  }

  /* ── Category Pills ── */
  .cat-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    margin: 0 4px;
    border-radius: 100px;
    background: #fff;
    border: 1px solid #eeeae5;
    color: #6d4c41;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
  }

  .cat-pill:hover {
    background: #f5f0eb;
  }

  .cat-pill.active {
    background: #3e2723;
    color: #fff;
    border-color: #3e2723;
    box-shadow: 0 4px 12px rgba(62, 39, 35, 0.2);
  }

  /* ── Product Card ── */
  .product-card {
    border-radius: 20px !important;
    background: #ffffff !important;
    border: 1px solid #f0ece8 !important;
    transition: all 0.25s ease;
    overflow: hidden;
  }

  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(62, 39, 35, 0.08) !important;
    border-color: #e0d7cf !important;
  }

  .is-unavailable {
    filter: grayscale(0.8);
    opacity: 0.7;
  }
  .variant-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }
  /* ── Image Container ── */
  .img-container {
    position: relative;
    height: 180px;
    background: #f8f5f2;
    margin: 8px;
    border-radius: 14px;
    overflow: hidden;
  }

  .product-img {
    transition: transform 0.5s ease;
  }

  .product-card:hover .product-img {
    transform: scale(1.08);
  }

  .img-fallback {
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
  }

  /* ── Overlays & Badges ── */
  .status-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .variant-chip {
    position: absolute;
    bottom: 8px;
    left: 8px;
    background: rgba(255, 255, 255, 0.9);
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 9px;
    font-weight: 800;
    color: #3e2723;
    backdrop-filter: blur(4px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  /* ── Info Styling ── */
  .product-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #2e1d1a;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .price-stack {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }

  .price-text {
    font-size: 1.1rem;
    font-weight: 800;
    color: #5d4037;
  }

  /* ── Empty State ── */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
  }

  .empty-title {
    color: #3e2723;
    font-weight: 800;
  }

  .empty-sub {
    color: #8d6e63;
  }

  .skeleton-card {
    border-radius: 20px;
    background: #ffffff;
    border: 1px solid #f0ece8;
    overflow: hidden;
  }

  .skeleton-img-area {
    margin: 8px;
    border-radius: 14px;
    overflow: hidden;
    height: 180px;
  }

  /* Force the image bone to fill the container fully */
  .skeleton-img-area :deep(.v-skeleton-loader) {
    height: 100%;
  }
  .skeleton-img-area :deep(.v-skeleton-loader__image) {
    height: 100% !important;
    border-radius: 0;
  }

  .skeleton-info {
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .skeleton-bottom-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Square rounded button bone — matches the real add button */
  .skeleton-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #f0ece8;
    flex-shrink: 0;
  }

  :deep(.v-skeleton-loader__text),
  :deep(.v-skeleton-loader__image),
  :deep(.v-skeleton-loader__bone) {
    background: #ede8e3 !important;
    border-radius: 8px;
  }
</style>
