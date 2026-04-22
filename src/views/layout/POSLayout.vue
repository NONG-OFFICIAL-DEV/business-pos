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
  import CashPaymentDialog from '@/components/CashPaymentDialog.vue'

  /* COMPOSABLES */
  import { useAppUtils } from '@/composables/useAppUtils'
  import { useBuType } from '@/composables/useBuType'
  const { isRestaurant, isCoffeeStore } = useBuType()

  /* -------------------------
STORES / UTILITIES
--------------------------*/
  const posStore = usePosStore()
  const menuStore = useMenuStore()
  const orderStore = useOrderStore()
  const authStore = useAuthStore()
  const { isAdmin, isManager } = usePermission()

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
  const cashDialog = ref(false)

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
      product_name: product.name,
      unit_price: product.base_price,
      image_url: product.image_url,
      quantity: 1,
      customizations: {}
    })
  }

  function openCustomizer(product) {
    selectedProduct.value = product
    showCustomizeDialog.value = true
  }

  // In PosCartDrawer, emit cash details up on checkout
  // ─── Step 1: Checkout button clicked ──────────────────────────
  async function handleCheckout() {
    if (!activeItems.value.length) {
      notif('Cart is empty!', { type: 'warning' })
      return
    }

    // For cash: show dialog FIRST, order created after confirmation
    if (posStore.paymentMethod === 'cash') {
      cashDialog.value = true
      return
    }

    // For QR and others: create order immediately
    await submitOrder()
  }

  // ─── Step 2: Build payload by store type ──────────────────────
  function buildPayload(extra = {}) {
    const type = posStore.selectedStore?.type

    if (type === 'coffee') {
      return {
        cash_tendered: extra.cash_tendered ?? 0,
        change_given: extra.change_given ?? 0,
        items: activeItems.value.map(i => ({
          menu_id: i.id,
          quantity: i.quantity,
          price: i.unit_price,
          customizations: i.customizations || null,
          note: ''
        })),
        total_amount: total.value,
        payment_method: posStore.paymentMethod
      }
    }

    // default: hospitality
    return {
      cash_tendered: extra.cash_tendered ?? 0,
      change_given: extra.change_given ?? 0,
      table_id: isCoffeeStore.value ? null : posStore.selectedTable?.id || null,
      branch_id: authStore.branch_id,
      payment_method: posStore.paymentMethod,
      items: activeItems.value.map(i => ({
        product_id: i.id,
        quantity: i.quantity,
        price: i.unit_price,
        note: ''
      }))
    }
  }

  // ─── Step 3: Actually create the order ────────────────────────
  async function submitOrder(extra = {}) {
    const type = posStore.selectedStore?.type

    try {
      await orderStore.createOrder(buildPayload(extra))

      if (type === 'hospitality') {
        await menuStore.fetchMenus()
      }

      if (posStore.paymentMethod === 'qr') {
        showQRDialog.value = true
      }

      posStore.clearCart()
    } catch {
      notif('Checkout failed. Please try again.', { type: 'error' })
    }
  }

  // ─── Step 4: Cash confirmed → now create order ────────────────
  const confirmCashPayment = async ({ cash_received, change }) => {
    cashDialog.value = false
    await submitOrder({
      cash_tendered: cash_received,
      change_given: change
    })
  }

  async function handlePrintBill() {
    const selectOrderId = posStore.orderId
    const res = await orderStore.printBillForPayment(selectOrderId)
    if (res.status == 200) {
      window.open(res.data.invoice_url, '_blank')
    }

    await orderStore.fetchAllOrders()
    await posStore.clearBill()
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
      user.value = authStore.me
    } catch {
      await authStore.logout()
      router.push({ name: 'Login' })
    }
  })
</script>

<template>
  <!-- APPBAR -->
  <PosAppBar
    v-model:search="search"
    :user="user"
    :roleName="authStore.roleName"
    :branchName="authStore.branch_name"
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
    <v-container class="pa-0" fluid>
      <div class="main-content-wrapper w-100">
        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <component
              :is="Component"
              v-if="Component"
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
  <CashPaymentDialog
    v-model="cashDialog"
    :total="total"
    @confirm="confirmCashPayment"
    @cancel="cashDialog = false"
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
