<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="360" rounded="xl">
    <v-card rounded="xl">
      <!-- Header -->
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-3 mb-4">
          <v-avatar color="primary" size="48" rounded="lg">
            <span class="text-body-1 font-weight-black text-white">{{ initials }}</span>
          </v-avatar>
          <div>
            <div class="font-weight-bold text-body-1">{{ user?.full_name || 'Staff' }}</div>
            <div class="text-caption text-medium-emphasis">{{ roleName }}</div>
          </div>
        </div>

        <v-divider class="mb-3" />

        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-history"
            title="Shift History"
            rounded="lg"
            @click="emit('shift-history')"
          />
          <v-list-item
            prepend-icon="mdi-account-cog-outline"
            title="My Profile"
            rounded="lg"
            @click="emit('my-profile')"
          />
        </v-list>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-3">
        <v-btn
          prepend-icon="mdi-logout-variant"
          color="error"
          variant="tonal"
          rounded="lg"
          block
          @click="emit('logout')"
        >
          Logout
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  user: Object,
  roleName: String
})

const emit = defineEmits(['update:modelValue', 'logout', 'shift-history', 'my-profile'])

const initials = computed(() => {
  const name = props.user?.full_name ?? ''
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0]?.slice(0, 2).toUpperCase() || 'OP'
})
</script>