<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="close"
    max-width="400"
  >
    <v-card rounded="xl" class="pa-0 overflow-hidden">
      <div class="pa-4 bg-brown-darken-3 text-white d-flex align-center">
        <v-icon icon="mdi-tag-outline" class="mr-2" />
        <span class="text-h6 font-weight-bold">{{t('discount.title')}}</span>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" color="white" @click="close" />
      </div>

      <v-card-text class="pa-5">
        <div class="section-label">{{t('discount.type')}}</div>
        <v-btn-toggle
          v-model="discountType"
          mandatory
          color="brown-darken-3"
          class="compact-toggle mb-6"
          variant="outlined"
          divided
        >
          <v-btn value="percentage" class="flex-grow-1 text-none">
            <v-icon start size="18">mdi-percent</v-icon>
            {{t('discount.percentage')}}
          </v-btn>
          <v-btn value="fixed" class="flex-grow-1 text-none">
            <v-icon start size="18">mdi-currency-usd</v-icon>
            {{t('discount.fixed')}}
          </v-btn>
        </v-btn-toggle>

        <div class="section-label">{{t('discount.enter_value')}}</div>
        <v-text-field
          v-model="discountValue"
          variant="outlined"
          rounded="lg"
          placeholder="0.00"
          type="number"
          color="brown-darken-1"
          class="discount-input mb-4"
          :prefix="discountType === 'fixed' ? '$' : ''"
          :suffix="discountType === 'percentage' ? '%' : ''"
          hide-details
          autofocus
        />

        <div class="d-flex flex-wrap gap-2 mb-6">
          <v-chip
            v-for="preset in presets"
            :key="preset"
            variant="tonal"
            color="brown-darken-1"
            class="font-weight-bold"
            @click="discountValue = preset"
          >
            {{ discountType === 'percentage' ? preset + '%' : '$' + preset }}
          </v-chip>
        </div>

        <v-alert
          variant="tonal"
          color="brown-darken-1"
          rounded="lg"
          class="py-2"
          v-if="calculatedDiscount > 0"
        >
          <template v-slot:prepend>
            <v-icon size="20">mdi-calculator</v-icon>
          </template>
          <div class="text-caption">
            {{t('discount.total_deducted')}}:
            <span class="font-weight-bold text-subtitle-2 ml-1">
              -{{ formatKHR(calculatedDiscount) }}
            </span>
          </div>
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          block
          height="52"
          rounded="xl"
          variant="flat"
          color="brown-darken-3"
          class="text-none font-weight-bold"
          @click="applyDiscount"
        >
          {{t('discount.confirm')}}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  import { ref, computed, watch } from 'vue'
  import { formatKHR } from '@nong-official-dev/core'
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const props = defineProps({
    modelValue: Boolean,
    subtotal: { type: Number, default: 0 }
  })

  const emit = defineEmits(['update:modelValue', 'apply'])

  // State
  const discountType = ref('percentage') // percentage or fixed
  const discountValue = ref('')
  const presets = computed(() => {
    return discountType.ref === 'percentage'
      ? [5, 10, 15, 20, 50]
      : [1, 2, 5, 10]
  })

  // Calculations
  const calculatedDiscount = computed(() => {
    const val = parseFloat(discountValue.value) || 0
    if (discountType.value === 'percentage') {
      return (props.subtotal * val) / 100
    }
    return val
  })

  // Methods
  const close = () => {
    emit('update:modelValue', false)
    discountValue.value = '' // Reset on close
  }

  const applyDiscount = () => {
    emit('apply', {
      type: discountType.value,
      value: parseFloat(discountValue.value) || 0,
      amount: calculatedDiscount.value
    })
    close()
  }

  // Ensure value doesn't exceed subtotal if fixed
  watch(discountValue, newVal => {
    if (discountType.value === 'fixed' && newVal > props.subtotal) {
      discountValue.value = props.subtotal
    }
  })
</script>

<style scoped>
  .section-label {
    font-size: 0.7rem;
    font-weight: 800;
    text-transform: uppercase;
    color: #8d6e63;
    margin-bottom: 8px;
    letter-spacing: 0.05em;
  }

  .compact-toggle {
    width: 100%;
    height: 44px !important;
    border-radius: 12px !important;
  }

  .discount-input :deep(.v-field__input) {
    font-size: 1.5rem !important;
    font-weight: 700;
    text-align: center;
  }

  .gap-2 {
    gap: 8px;
  }

  .cursor-pointer {
    cursor: pointer;
  }
</style>
