<script setup>
  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  defineProps({
    table: Object,
    count: { type: Number, default: 0 }
  })

  defineEmits(['clear'])
</script>

<template>
  <div
    class="cart-header px-4 py-3 border-b d-flex align-center justify-space-between"
  >
    <div>
      <div class="text-subtitle-2 font-weight-black">
        {{ t('order.title') }}
      </div>

      <div class="d-flex align-center flex-wrap" style="gap: 4px">
        <v-chip v-if="table" size="x-small" color="primary" variant="tonal">
          T-{{ table.table_number }}
        </v-chip>
        <span class="text-caption text-medium-emphasis">
          {{ count }} {{ t('order.item') }}{{ count !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <v-btn
      :disabled="!count"
      icon="mdi-delete-sweep"
      variant="tonal"
      size="small"
      class="tap-44"
      color="error"
      @click="$emit('clear')"
    />
  </div>
</template>

<style scoped>
  .cart-header {
    min-height: 56px;
  }
</style>
