<script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { usePermission } from '@/composables/usePermission'
  /* STORES */
  import { usePosStore } from '@/stores/posStore'
  import { useMenuStore } from '@/stores/menuStore'
  import { useOrderStore } from '@/stores/orderStore'
  import { useAuthStore } from '@/stores/auth'
  /* COMPONENTS */
  import PosAppBar from '@/components/layout/PosAppBar.vue'
  import SidebarMenu from '@/components/layout/SidebarMenu.vue'
  import PosCartDrawer from '@/components/layout/PosCartDrawer.vue'
  import OrderCustomizationDialog from '@/components/OrderCustomizationDialog.vue'
  import QRPaymentDialog from '@/components/QRPaymentDialog.vue'

  /* COMPOSABLES */
  import { useAppUtils } from '@/composables/useAppUtils'

  /* -------------------------
STORES / UTILITIES
--------------------------*/
  const posStore = usePosStore()
  const menuStore = useMenuStore()
  const orderStore = useOrderStore()
  const authStore = useAuthStore()
  const { isAdmin, isManager } = usePermission()
  const isCoffeeStore = computed(
    () => posStore.selectedStore?.type === 'coffee'
  )
  const isRestaurant = computed(
    () => posStore.selectedStore?.type === 'hospitality'
  )

  const router = useRouter()
  const { t } = useI18n()
  const { notif } = useAppUtils()

  /* -------------------------
LOCAL STATE
--------------------------*/
  const search = ref('')
  const selectedProduct = ref(null)
  const showCustomizeDialog = ref(false)
  const showQRDialog = ref(false)
  const user = ref(null)

  /* -------------------------
COMPUTED
--------------------------*/

  // Use POS store computed: activeItems, subtotal, total
  const activeItems = computed(() => posStore.activeItems)
  const subtotal = computed(() => posStore.subtotal)
  const total = computed(() => posStore.total)

  function handleAddProductToCart(item) {
    posStore.addToCart(item)
  }

  function handleQuickAdd(product) {
    handleAddProductToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      qty: 1,
      customizations: {}
    })
  }

  function openCustomizer(product) {
    selectedProduct.value = product
    showCustomizeDialog.value = true
  }

  function buildHospitalityPayload() {
    return {
      table_id: posStore.selectedTable?.id || 1,
      items: activeItems.value.map(i => ({
        menu_id: i.id,
        quantity: i.qty,
        price: i.price,
        note: ''
      }))
    }
  }

  function buildCoffeePayload() {
    return {
      items: activeItems.value.map(i => ({
        menu_id: i.id,
        quantity: i.qty,
        price: i.price,
        customizations: i.customizations || null, // size, milk, sugar etc.
        note: ''
      })),
      total_amount: total.value,
      payment_method: posStore.paymentMethod
    }
  }

  async function checkoutHospitality() {
    await orderStore.createOrder(buildHospitalityPayload(), 'overlay')
    await menuStore.fetchMenus()
  }

  async function checkoutCoffee() {
    await orderStore.createOrder(buildCoffeePayload(), 'overlay')
  }

  // ─── type → handler map ────────────────────────────────────────
  const checkoutHandlers = {
    hospitality: checkoutHospitality,
    coffee: checkoutCoffee
  }

  // ─── post-checkout side effects ────────────────────────────────
  async function afterCheckout() {
    if (posStore.paymentMethod === 'qr') {
      showQRDialog.value = true
    }
    posStore.clearCart()
  }

  // ─── main orchestrator ─────────────────────────────────────────
  async function handleCheckout() {
    if (!activeItems.value.length) {
      notif('Cart is empty!', { type: 'warning' })
      return
    }

    const type = posStore.selectedStore?.type
    const handler = checkoutHandlers[type]

    if (!handler) {
      notif(`Unknown store type: "${type}"`, { type: 'error' })
      return
    }

    try {
      await handler()
      await afterCheckout()
    } catch {
      notif('Checkout failed. Please try again.', { type: 'error' })
    }
  }

  async function handlePrintBill() {
    // Print the selected bill
    const selectOrderId = posStore.orderId
    // TODO print recipe here
    // if (res.status == 200) {
    //   await orderStore.fetchAllOrders()
    //   window.open(res.data.invoice_url, '_blank')
    // }
  }

  async function handleLogout() {
    await authStore.logout()
    notif(t('messages.logoutSucess'), { type: 'success', color: 'primary' })
    router.push({ name: 'Login' })
  }

  const goToOrders = () => {
    router.push({ name: 'Orders' })
  }

  /* -------------------------
ON MOUNT
--------------------------*/
  onMounted(async () => {
    try {
      await orderStore.fetchAllOrders()
      orderStore.subscribeToOrders()
      await authStore.fetchMe()
      user.value = authStore.me
    } catch {
      await authStore.logout()
      router.push({ name: 'Login' })
    }
  })

  onUnmounted(() => {
    orderStore.unsubscribeFromOrders() // 👈 clean up
  })
</script>

<template>
  <!-- APPBAR -->
  <PosAppBar
    v-model:search="search"
    :user="user"
    :content="orderStore.unpaidCount"
    :is-coffee-store="isCoffeeStore"
    @logout="handleLogout"
    @orders="goToOrders"
  />

  <!-- SIDEBAR MENU (Hospitality only) -->
  <SidebarMenu v-if="isAdmin" />

  <!-- CART DRAWER -->
  <PosCartDrawer
    :items="activeItems"
    :subtotal="subtotal"
    :total="total"
    :payment-method="posStore.paymentMethod"
    :payment-methods="posStore.paymentMethods"
    @checkout="handleCheckout"
    @print-bill="handlePrintBill"
  />

  <!-- MAIN VIEW -->
  <v-main>
    <v-container class="px-4" fluid>
      <div class="main-content-wrapper w-100">
        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <component
              :is="Component"
              @quick-add="handleQuickAdd"
              @select="openCustomizer"
            />
          </transition>
        </router-view>
      </div>
    </v-container>
  </v-main>

  <!-- DIALOGS -->
  <OrderCustomizationDialog
    v-model="showCustomizeDialog"
    :product="selectedProduct"
    @add-to-cart="handleAddProductToCart"
  />

  <QRPaymentDialog v-model="showQRDialog" :total="total" />
</template>
<style scoped>
  .cart-anchor {
    position: fixed;
    bottom: 24px; /* Space from bottom edge */
    left: 0;
    right: 0;
    z-index: 999;
    max-width: 450px; /* Optional: Keep it centered on larger screens */
    margin: 0 auto;
    margin-right: 45%;
  }

  /* The entry point (comes from the right) */
  .slide-fade-enter-from {
    opacity: 0;
    transform: translateX(20px);
  }

  /* The exit point (disappears to the left) */
  .slide-fade-leave-to {
    opacity: 0;
    transform: translateX(-20px);
  }

  /* Animation timing - POS systems should be fast (0.2s) */
  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.2s ease-out;
  }

  .main-content-wrapper {
    /* Subtract header height and footer height */
    height: calc(100vh - 70px - 32px);
    overflow-y: auto;
    scroll-behavior: smooth;
  }
</style>
