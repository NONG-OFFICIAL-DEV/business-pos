<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="360" rounded="xl">
    <v-card rounded="xl">
      <v-card-title class="pa-5 pb-2 d-flex align-center ga-2">
        <v-icon icon="mdi-store-outline" color="primary" />
        <span class="text-body-1 font-weight-bold">{{ branchName }}</span>
      </v-card-title>
      <v-card-subtitle class="px-5 pb-3">{{ buName }}</v-card-subtitle>

      <v-divider />

      <v-card-text class="pa-3">
        <v-list-subheader>Switch Branch</v-list-subheader>
        <v-list density="compact" nav>
          <v-list-item
            v-for="s in stores"
            :key="s.id"
            :active="selectedStoreId === s.id"
            active-color="primary"
            rounded="lg"
            @click="emit('select-store', s)"
          >
            <template v-slot:prepend>
              <v-icon
                :icon="selectedStoreId === s.id ? 'mdi-check-circle' : 'mdi-circle-outline'"
                size="18"
              />
            </template>
            <v-list-item-title>{{ s.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions class="pa-3">
        <v-spacer />
        <v-btn variant="text" rounded="lg" @click="emit('update:modelValue', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  branchName: String,
  buName: String,
  stores: { type: Array, default: () => [] },
  selectedStoreId: [String, Number]
})

const emit = defineEmits(['update:modelValue', 'select-store'])
</script>