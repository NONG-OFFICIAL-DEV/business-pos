<script setup>
const props = defineProps({
  modelValue: Boolean,
  total: Number
})
const emit = defineEmits(['update:modelValue'])

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <v-dialog v-model="props.modelValue" max-width="450" transition="scale-transition">
    <v-card rounded="xl" class="text-center pa-6">
      <div class="text-h5 font-weight-black mb-1">Scan to Pay</div>
      <div class="text-body-2 text-grey mb-6">Total Amount: ${{ props.total.toFixed(2) }}</div>

      <v-sheet border rounded="xl" class="pa-4 mx-auto mb-6" max-width="300">
        <v-img src="https://www.masskh.com/wp-content/uploads/2023/11/photo1700496472-568x800.jpeg" rounded="lg" width="500px" />
      </v-sheet>

      <v-btn block color="primary" size="large" rounded="pill" @click="close">
        Done / Close
      </v-btn>
    </v-card>
  </v-dialog>
</template>
