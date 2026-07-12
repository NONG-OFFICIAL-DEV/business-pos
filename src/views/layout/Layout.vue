<script setup>
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { useAppUtils } from '@nong-official-dev/core'
  import { usePosStore } from '@/stores/posStore'
  import { useMenuStore } from '@/stores/menuStore'
  import { useOrderStore } from '@/stores/orderStore'
  import { useAuthStore } from '@/stores/auth'
  import { useCartUiStore } from '@/stores/cartUiStore'
  import { useReceipt } from '@/utils/printReceipt'
  import { useConnectionStatus } from '@/composables/useConnectionStatus'
  import PosAppBar from '@/components/layout/AppBar.vue'
  import SidebarMenu from '@/components/layout/SidebarMenu.vue'
  import PosCartDrawer from '@/components/layout/CartDrawer.vue'
  import OrderCustomizationDialog from '@/components/OrderCustomizationDialog.vue'
  import QRPaymentDialog from '@/components/QRPaymentDialog.vue'
  import CashPaymentDialog from '@/components/CashPaymentDialog.vue'
  import PrintReceiptDialog from '@/components/PrintReceiptDialog.vue'
  import SettingsDialog from '@/components/common/SettingsDialog.vue'

  // ── Composables ────────────────────────────────────────────────────────────
  const { t } = useI18n()
  const { notif } = useAppUtils()
  const router = useRouter()
  const { connected } = useConnectionStatus()

  // ── Stores ─────────────────────────────────────────────────────────────────
  const posStore = usePosStore()
  const menuStore = useMenuStore()
  const orderStore = useOrderStore()
  const authStore = useAuthStore()
  const cartUi = useCartUiStore()

  // ── Printer ────────────────────────────────────────────────────────────────
  const {
    print,
    printQueue,
    printing,
    error: printError,
    connectUsb,
    usbConnected,
    usbSupported
  } = useReceipt()

  const isAndroid = () => /android/i.test(navigator.userAgent)

  function isPrinterReady() {
    if (isAndroid() && usbSupported && !usbConnected.value) {
      notif(t('printer.not_connected'), { type: 'warning' })
      return false
    }
    return true
  }

  watch(printError, val => {
    if (!val) return
    const msgMap = {
      not_connected: t('printer.not_connected'),
      disconnected: t('printer.disconnected')
    }
    notif(msgMap[val] ?? val, {
      type: val === 'disconnected' ? 'error' : 'warning'
    })
  })

  // ── Local state ────────────────────────────────────────────────────────────
  const search = ref('')
  const user = ref(null)
  const showQRDialog = ref(false)
  const cashDialog = ref(false)
  const printDialog = ref(false)
  const pendingPrints = ref(null)
  const receipt = ref(null)
  const settingsDialog = ref(false)

  // ── Cart ───────────────────────────────────────────────────────────────────
  const activeItems = computed(() => posStore.activeItems)
  const total = computed(() => posStore.total)

  // ── Order payload builder ──────────────────────────────────────────────────
  function buildPayload(extra = {}) {
    const payLater = posStore.paymentTiming === 'later'

    return {
      cash_tendered: extra.cash_tendered ?? 0,
      change_given: extra.change_given ?? 0,
      table_id: posStore.selectedTable?.id ?? null,
      branch_id: authStore.branch_id,
      payment_method: payLater ? null : posStore.paymentMethod,
      total_amount: total.value,
      items: activeItems.value.map(i => ({
        product_id: i.id,
        variant_id: i.variant_id || null,
        quantity: i.quantity,
        price: i.unit_price,
        customizations: i.customizations || null,
        note: ''
      }))
    }
  }
  // ── Checkout ───────────────────────────────────────────────────────────────
  async function handleCheckout() {
    if (!activeItems.value.length) {
      notif(t('cart.empty'), { type: 'warning' })
      return
    }
    if (posStore.paymentTiming === 'later') {
      await submitOrder()
      return
    }
    if (posStore.paymentMethod === 'cash') {
      cashDialog.value = true
      return
    }
    if (posStore.paymentMethod === 'qr') {
      showQRDialog.value = true
      return
    }
    await submitOrder()
  }

  async function confirmQrPayment() {
    showQRDialog.value = false
    await submitOrder()
  }

  async function submitOrder(extra = {}) {
    try {
      const res = await orderStore.createOrder(buildPayload(extra))
      const data = res.data.data

      if (posStore.selectedTable) {
        await menuStore.fetchMenus()
      }

      receipt.value = data
      pendingPrints.value = data.prints

      posStore.clearCart()
      printDialog.value = true
    } catch {
      notif(t('checkout.failed'), { type: 'error' })
    }
  }

  async function confirmCashPayment({ cash_received, change }) {
    cashDialog.value = false
    await submitOrder({ cash_tendered: cash_received, change_given: change })
  }

  // ── Print ──────────────────────────────────────────────────────────────────
  async function handlePrint() {
    if (!isPrinterReady()) return

    const prints = pendingPrints.value
    if (!prints) return

    try {
      if (prints.queue_ticket) await printQueue(prints.queue_ticket)
      if (prints.receipt) await print(prints.receipt)
      resetPrintState()
    } catch (e) {
      console.error('[handlePrint]', e)
    }
  }

  // Skip print — no success notif, order was already placed
  function skipPrint() {
    resetPrintState()
  }

  function resetPrintState() {
    printDialog.value = false
    pendingPrints.value = null
    receipt.value = null
    notif(t('notification.orderPlaced'), { type: 'success', timeout: 2000 })
  }

  // ── Bill & Auth ────────────────────────────────────────────────────────────
  async function handlePrintBill() {
    const res = await orderStore.printBillForPayment(posStore.orderId)
    if (res.status === 200) window.open(res.data.invoice_url, '_blank')
    await Promise.all([orderStore.fetchAllOrders(), posStore.clearBill()])
  }

  async function handleLogout() {
    await authStore.logout()
    notif(t('messages.logoutSuccess'), { type: 'success', color: 'primary' })
    router.push({ name: 'login' })
  }

  const goToOrders = () => router.push({ name: 'Orders' })

  // ── Mount ──────────────────────────────────────────────────────────────────
  onMounted(async () => {
    try {
      await orderStore.fetchAllOrders()
      orderStore.subscribeToOrders()
      user.value = authStore.me
    } catch {
      await authStore.logout()
      router.push({ name: 'login' })
    }
  })

  onUnmounted(() => {
    orderStore.unsubscribeFromOrders()
  })
</script>

<template>
  <PosAppBar
    v-model:search="search"
    :user="user"
    :roleName="authStore.roleName"
    :branchName="authStore.branch_name"
    @logout="handleLogout"
    @orders="goToOrders"
    @open-settings="settingsDialog = true"
    />

  <SidebarMenu :order-count="orderStore.orders.length" />

  <PosCartDrawer @checkout="handleCheckout" @print-bill="handlePrintBill" />

  <v-main>
    <v-container class="pa-0" fluid>
      <div class="mart-content">
        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <component :is="Component" v-if="Component" :search="search"/>
          </transition>
        </router-view>
      </div>
    </v-container>
  </v-main>

  <!-- Only surface connectivity to staff when it's actually a problem -->
  <!-- <v-snackbar
    :model-value="!connected"
    color="warning"
    location="bottom"
    :timeout="-1"
    rounded="lg"
  >
    <v-icon icon="mdi-wifi-alert" class="mr-2" />
    {{ t('connection.lost') }}
  </v-snackbar> -->

  <!-- ── Dialogs ─────────────────────────────────────────────────────────── -->
  <OrderCustomizationDialog
    v-model="cartUi.showCustomizeDialog"
    :product="cartUi.selectedProduct"
    @add-to-cart="posStore.addToCart"
    @close="cartUi.closeCustomizer"
  />

  <CashPaymentDialog
    v-model="cashDialog"
    :total="total"
    @confirm="confirmCashPayment"
    @cancel="cashDialog = false"
  />

  <QRPaymentDialog
    v-model="showQRDialog"
    :total="total"
    @confirm="confirmQrPayment"
    @cancel="showQRDialog = false"
  />

  <PrintReceiptDialog
    v-model="printDialog"
    :receipt="receipt"
    :printing="printing"
    :usb-supported="usbSupported"
    :usb-connected="usbConnected"
    @print="handlePrint"
    @skip="skipPrint"
    @connect-usb="connectUsb"
  />

  <SettingsDialog
    v-model="settingsDialog"
    :usb-supported="usbSupported"
    :usb-connected="usbConnected"
    @connect-usb="connectUsb"
  />
</template>

<style scoped>
  .mart-content {
    height: calc(100vh - 60px);
    overflow-y: auto;
    scroll-behavior: smooth;
  }
  .mart-content::-webkit-scrollbar {
    width: 6px;
  }
  .mart-content::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
</style>
