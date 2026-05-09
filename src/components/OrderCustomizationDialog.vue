<script setup>
  import { ref, computed, watch } from 'vue'
  import QtyStepper from './customs/QtyStepper.vue'
  import { useI18n } from 'vue-i18n'
  import { formatKHR, useAppUtils } from '@nong-official-dev/core'

  const { notif } = useAppUtils()
  const props = defineProps({ modelValue: Boolean, product: Object })
  const emit = defineEmits(['update:modelValue', 'add-to-cart'])

  const quantity = ref(1)
  const selectedVariant = ref(null)
  const selectedSugar = ref(0)
  const isCustomSugar = ref(false)
  const customSugar = ref(80)
  const orderType = ref('Dine-in')
  const { t } = useI18n()

  const sugarOptions = [
    { label: t('label.no_sugar'), value: 0 },
    { label: '25%', value: 25 },
    { label: '50%', value: 50 },
    { label: '70%', value: 70 },
    { label: '100%', value: 100 },
    { label: t('order.custom_sugar'), value: 'custom' }
  ]

  const selectedSugarDisplay = computed(() => {
    if (isCustomSugar.value) return `${customSugar.value}%`
    return selectedSugar.value === 0
      ? t('label.no_sugar')
      : `${selectedSugar.value}%`
  })

  function selectSugar(opt) {
    if (opt.value === 'custom') {
      isCustomSugar.value = true
    } else {
      isCustomSugar.value = false
      selectedSugar.value = opt.value
    }
  }

  watch(
    () => props.modelValue,
    isOpen => {
      if (isOpen) {
        quantity.value = 1
        selectedSugar.value = 0
        isCustomSugar.value = false
        customSugar.value = 80
        orderType.value = 'Dine-in'
        selectedVariant.value =
          props.product?.variants?.length > 0 ? props.product.variants[0] : null
      }
    }
  )

  const currentItemPrice = computed(() => {
    if (props.product?.variants?.length > 0 && selectedVariant.value) {
      return parseFloat(selectedVariant.value.price_adjustment)
    }
    return parseFloat(props.product?.base_price || 0)
  })

  const totalPrice = computed(() => currentItemPrice.value * quantity.value)

  function close() {
    emit('update:modelValue', false)
  }

  function submitOrder() {
    emit('add-to-cart', {
      id: props.product.id,
      product_name: props.product.name,
      image_url: props.product.image_url,
      unit_price: currentItemPrice.value,
      quantity: quantity.value,
      variant_id: selectedVariant.value?.id || null,
      customizations: {
        variant_name: selectedVariant.value?.name || 'Standard',
        sugar: isCustomSugar.value
          ? `${customSugar.value}%`
          : selectedSugar.value === 0
            ? 'No Sugar'
            : `${selectedSugar.value}%`,
        orderType: orderType.value
      }
    })
    notif(t('notification.addedToCart'), {
      type: 'success',
      color: 'primary',
      timeout: 900
    })
    close()
  }
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="close"
    max-width="400"
    scrollable
  >
    <v-card rounded="xl" class="overflow-hidden dialog-card">
      <!-- ── Header ── -->
      <div class="d-flex align-center gap-3 pa-3 pb-2">
        <v-avatar size="56" rounded="lg" class="flex-shrink-0">
          <v-img :src="product?.image_url" cover />
        </v-avatar>
        <div class="flex-grow-1 min-width-0 ms-4">
          <div class="product-name">{{ product?.name }}</div>
          <div class="product-price">{{ formatKHR(currentItemPrice) }}</div>
        </div>
        <v-btn
          icon="mdi-close"
          variant="tonal"
          size="small"
          density="comfortable"
          @click="close"
        />
      </div>

      <v-divider />

      <v-card-text class="pa-3">
        <!-- ── Order Type ── -->
        <div class="section-label">{{ t('label.order_type') }}</div>
        <v-btn-toggle
          v-model="orderType"
          mandatory
          color="brown-darken-3"
          class="compact-toggle mb-4"
          variant="outlined"
          divided
        >
          <v-btn value="Dine-in" class="flex-grow-1 text-none" size="small">
            {{ t('order_type.dine_in') }}
          </v-btn>
          <v-btn value="Takeaway" class="flex-grow-1 text-none" size="small">
            {{ t('order_type.takeaway') }}
          </v-btn>
          <v-btn value="Delivery" class="flex-grow-1 text-none" size="small">
            {{ t('order_type.delivery') }}
          </v-btn>
        </v-btn-toggle>

        <!-- ── Size ── -->
        <template v-if="product?.variants?.length > 0">
          <div class="section-label">{{ t('label.size') }}</div>
          <div class="variant-row mb-4">
            <div
              v-for="v in [...product.variants].sort(
                (a, b) => a.price_adjustment - b.price_adjustment
              )"
              :key="v.id"
              :class="['variant-box', { active: selectedVariant?.id === v.id }]"
              @click="selectedVariant = v"
            >
              <div class="v-name">{{ v.name }}</div>
              <div class="v-price">{{ formatKHR(v.price_adjustment) }}</div>
            </div>
          </div>
        </template>

        <!-- ── Sugar Level ── -->
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="section-label mb-0">{{ t('label.sugar_level') }}</div>
          <span class="sugar-badge">{{ selectedSugarDisplay }}</span>
        </div>

        <div class="sugar-row mb-2">
          <button
            v-for="opt in sugarOptions"
            :key="opt.value"
            :class="[
              'sugar-chip',
              {
                active:
                  opt.value === 'custom'
                    ? isCustomSugar
                    : !isCustomSugar && selectedSugar === opt.value
              }
            ]"
            @click="selectSugar(opt)"
          >
            {{ opt.label }}
          </button>
        </div>

        <v-expand-transition>
          <div v-if="isCustomSugar" class="mb-3">
            <v-text-field
              v-model.number="customSugar"
              type="number"
              suffix="%"
              :min="0"
              :max="100"
              density="compact"
              variant="outlined"
              rounded="lg"
              hide-details
              @update:model-value="
                v => (customSugar = Math.min(100, Math.max(0, Number(v))))
              "
            />
          </div>
        </v-expand-transition>

        <!-- ── Quantity ── -->
        <div class="d-flex align-center justify-space-between mt-4">
          <div class="section-label mb-0">{{ t('label.quantity') }}</div>
          <QtyStepper v-model="quantity" :min="1" :max="100" />
        </div>
      </v-card-text>

      <!-- ── CTA ── -->
      <div class="pa-3 pt-0">
        <v-btn
          block
          height="50"
          rounded="xl"
          elevation="0"
          class="add-btn text-none"
          @click="submitOrder"
        >
          <div class="d-flex align-center justify-space-between w-100 px-1">
            <span class="text-subtitle-2 font-weight-bold">
              {{ t('btn.add_to_order') }}
            </span>
            <span class="text-subtitle-1 font-weight-black ms-3">
              {{ formatKHR(totalPrice) }}
            </span>
          </div>
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
  .dialog-card {
    background: #fdfbf9 !important;
  }

  .product-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #2e1d1a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .product-price {
    font-size: 1.1rem;
    font-weight: 900;
    color: #5d4037;
  }

  .section-label {
    font-size: 0.68rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #8d6e63;
    letter-spacing: 0.06em;
    margin-bottom: 8px;
  }

  .compact-toggle {
    width: 100%;
    height: 36px !important;
    border-radius: 10px !important;
    overflow: hidden;
  }

  /* ── Variants ── */
  .variant-row {
    display: flex;
    gap: 8px;
  }
  .variant-box {
    flex: 1;
    border: 1px solid #e0e0e0;
    border-radius: 10px;
    padding: 7px 4px;
    text-align: center;
    cursor: pointer;
    transition: all 0.18s ease;
    background: white;
  }
  .variant-box.active {
    background: #3e2723;
    color: white;
    border-color: #3e2723;
  }
  .variant-box:hover:not(.active) {
    background: #f5f0eb;
    border-color: #bcaaa4;
  }
  .v-name {
    font-size: 0.78rem;
    font-weight: 700;
  }
  .v-price {
    font-size: 0.72rem;
    opacity: 0.8;
  }

  /* ── Sugar ── */
  .sugar-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .sugar-chip {
    flex: 1;
    min-width: calc(33% - 6px);
    padding: 8px 4px;
    border-radius: 10px;
    border: 1px solid #e0d7cf;
    background: #fff;
    color: #6d4c41;
    font-size: 0.78rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.18s ease;
    text-align: center;
  }
  .sugar-chip:hover:not(.active) {
    background: #f5f0eb;
  }
  .sugar-chip.active {
    background: #3e2723;
    color: #fff;
    border-color: #3e2723;
  }
  .sugar-badge {
    font-size: 0.72rem;
    font-weight: 700;
    color: #6d4c41;
    background: #f0ebe6;
    border-radius: 20px;
    padding: 2px 10px;
  }

  /* ── CTA ── */
  .add-btn {
    background: #3e2723 !important;
    color: white !important;
  }
</style>
