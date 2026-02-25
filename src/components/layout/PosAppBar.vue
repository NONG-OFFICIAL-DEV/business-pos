<script setup>
  defineProps({
    search: String,
    user: Object,
    content: [String, Number],
    isCoffeeStore: Boolean
  })

  const emit = defineEmits([
    'update:search',
    'update:store',
    'logout',
    'orders'
  ])

  function handleLogout() {
    emit('logout')
  }
</script>

<template>
  <v-app-bar elevation="0" class="header-glass px-4 border-b">
    <div class="d-flex align-center brand-section mr-8">
      <div class="logo-box mr-3">
        <v-icon icon="mdi-lightning-bolt" color="white" size="24" />
      </div>
      <div class="d-flex flex-column d-none d-sm-flex">
        <span class="brand-title">
          QUICK
          <span class="text-primary">POS</span>
        </span>
        <span class="text-caption text-grey-darken-1 font-weight-bold mt-n1">
          STATION 01
        </span>
      </div>
    </div>
    <v-app-bar-title>
      <v-responsive max-width="400" class="mx-auto">
        <v-text-field
          :model-value="search"
          @update:model-value="emit('update:search', $event)"
          prepend-inner-icon="mdi-magnify"
          append-inner-icon="mdi-barcode-scan"
          placeholder="Search menu ..."
          hide-details
          density="comfortable"
          variant="solo"
          flat
          class="search-input"
          rounded="xl"
        />
      </v-responsive>
    </v-app-bar-title>

     <template v-slot:append>
       <div v-if="!isCoffeeStore">
         <v-btn icon="" variant="tonal" size="small" @click="$emit('orders')">
           <v-badge
             :content="content"
             :model-value="content > 0"
             color="success"
             location="top right"
             floating
           >
             <v-icon icon="mdi-cash-register" />
           </v-badge>
         </v-btn>
       </div>
       <v-divider
         v-if="!isCoffeeStore"
         vertical
         inset
         class="mx-4 d-none d-sm-block"
       />
   
       <div class="d-lg-flex align-center mr-6">
         <v-badge dot color="success" offset-x="3" offset-y="3">
           <v-icon icon="mdi-wifi" size="small" color="grey" />
         </v-badge>
         <span class="text-caption font-weight-bold text-grey ml-2">ONLINE</span>
       </div>
   
       <v-divider vertical inset class="mx-4 d-none d-sm-block" />
   
       <div class="user-pill d-flex align-center pa-1 pr-3 ml-2">
         <v-avatar size="36" class="elevation-2">
           <v-img
             src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
             cover
           />
         </v-avatar>
   
         <div class="ml-3 d-none d-md-block text-start" style="line-height: 1.2">
           <div class="text-subtitle-2 font-weight-black text-slate-900">
             {{ user?.username || 'Operator' }}
           </div>
           <div class="text-caption text-primary font-weight-bold">Admin Mode</div>
         </div>
   
         <v-menu location="bottom end" transition="slide-y-transition">
           <template v-slot:activator="{ props }">
             <v-btn
               icon="mdi-chevron-down"
               variant="text"
               size="small"
               color="grey-darken-1"
               v-bind="props"
               class="ml-1"
             />
           </template>
           <v-list width="200" rounded="lg" class="mt-2">
             <v-list-item prepend-icon="mdi-history" title="Shift History" />
             <v-divider class="my-2" />
             <v-list-item
               prepend-icon="mdi-logout"
               title="Logout"
               color="error"
               class="text-error"
               @click="handleLogout"
             />
           </v-list>
         </v-menu>
       </div>
     </template>
  </v-app-bar>
</template>

<style scoped>
  .header-glass {
    background: rgba(255, 255, 255, 0.9) !important;
    backdrop-filter: blur(10px);
  }

  .logo-box {
    background: #1867c0;
    height: 40px;
    width: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    box-shadow: 0 4px 10px rgba(24, 103, 192, 0.3);
  }

  .brand-title {
    font-size: 1.1rem;
    font-weight: 900;
    letter-spacing: -0.5px;
    color: #0f172a;
  }

  .search-input :deep(.v-field) {
    background-color: #f1f5f9 !important;
    border: 1px solid transparent;
    transition: all 0.2s ease;
  }

  .search-input :deep(.v-field--focused) {
    border-color: #1867c0 !important;
    background-color: white !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
  }

  .user-pill {
    background: #f8fafc;
    border-radius: 50px;
    border: 1px solid #e2e8f0;
  }

  .text-slate-900 {
    color: #0f172a;
  }

  /* For barcode icon pulse effect */
  .mdi-barcode-scan {
    color: #1867c0;
  }
</style>
