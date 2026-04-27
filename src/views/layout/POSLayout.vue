<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from 'vue-i18n'
  import { usePermission } from '@/composables/usePermission'
  import { usePosStore } from '@/stores/posStore'
  import { useMenuStore } from '@/stores/menuStore'
  import { useOrderStore } from '@/stores/orderStore'
  import { useAuthStore } from '@/stores/auth'
  import PosAppBar from '@/components/layout/PosAppBar.vue'
  import SidebarMenu from '@/components/layout/SidebarMenu.vue'
  import PosCartDrawer from '@/components/layout/PosCartDrawer.vue'
  import OrderCustomizationDialog from '@/components/OrderCustomizationDialog.vue'
  import QRPaymentDialog from '@/components/QRPaymentDialog.vue'
  import CashPaymentDialog from '@/components/CashPaymentDialog.vue'
  import PosFooter from '@/components/layout/Footer.vue'
  import PrintReceiptDialog from '@/components/PrintReceiptDialog.vue'
  import { useAppUtils } from '@/composables/useAppUtils'
  import { useBuType } from '@/composables/useBuType'
  import { useReceipt } from '@/utils/printReceipt'

  const {
    print,
    printQueue,
    printing,
    error: printError,
    connectUsb,
    usbConnected,
    usbSupported
  } = useReceipt()

  const { isRestaurant, isCoffeeStore } = useBuType()

  const posStore = usePosStore()
  const menuStore = useMenuStore()
  const orderStore = useOrderStore()
  const authStore = useAuthStore()
  const { isAdmin } = usePermission()

  const router = useRouter()
  const { t } = useI18n()
  const { notif } = useAppUtils()

  // ── Local state ────────────────────────────────────────────────────────────
  const search = ref('')
  const selectedProduct = ref(null)
  const showCustomizeDialog = ref(false)
  const showQRDialog = ref(false)
  const cashDialog = ref(false)
  const user = ref(null)

  // Print dialog state
  const printDialog = ref(false)
  const pendingPrints = ref(null) // holds prints.queue_ticket + prints.receipt
  const receipt = ref(null) // holds full order data for dialog display

  // ── Printer connection guard ───────────────────────────────────────────────
  const isAndroid = () => /android/i.test(navigator.userAgent)

  function isPrinterReady() {
    // On Android, USB must be connected before printing
    if (isAndroid() && usbSupported && !usbConnected.value) {
      notif(t('printer.not_connected') || 'Please connect the printer first.', {
        type: 'warning'
      })
      return false
    }
    return true
  }

  // ── Watch print errors ─────────────────────────────────────────────────────
  watch(printError, val => {
    if (!val) return
    if (val === 'not_connected') {
      notif(t('printer.not_connected') || 'Printer not connected.', {
        type: 'warning'
      })
    } else if (val === 'disconnected') {
      notif(t('printer.disconnected') || 'Printer disconnected.', {
        type: 'error'
      })
    } else {
      notif(val, { type: 'error' })
    }
  })

  // ── Cart helpers ───────────────────────────────────────────────────────────
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

  // ── Checkout flow ──────────────────────────────────────────────────────────
  async function handleCheckout() {
    if (!activeItems.value.length) {
      notif('Cart is empty!', { type: 'warning' })
      return
    }
    if (posStore.paymentMethod === 'cash') {
      cashDialog.value = true
      return
    }
    await submitOrder()
  }

  function buildPayload(extra = {}) {
    const type = posStore.selectedStore?.type

    if (type === 'coffee') {
      return {
        cash_tendered: extra.cash_tendered ?? 0,
        change_given: extra.change_given ?? 0,
        branch_id: authStore.branch_id,
        items: activeItems.value.map(i => ({
          product_id: i.id,
          variant_id: i.variant_id || null,
          quantity: i.quantity,
          price: i.unit_price,
          customizations: i.customizations || null,
          note: ''
        })),
        total_amount: total.value,
        payment_method: posStore.paymentMethod
      }
    }

    return {
      cash_tendered: extra.cash_tendered ?? 0,
      change_given: extra.change_given ?? 0,
      table_id: isCoffeeStore.value ? null : posStore.selectedTable?.id || null,
      branch_id: authStore.branch_id,
      payment_method: posStore.paymentMethod,
      items: activeItems.value.map(i => ({
        variant_id: i.variant_id || null,
        product_id: i.id,
        quantity: i.quantity,
        price: i.unit_price,
        note: ''
      }))
    }
  }

  async function submitOrder(extra = {}) {
    const type = posStore.selectedStore?.type

    try {
      const res = await orderStore.createOrder(buildPayload(extra))

      if (type === 'hospitality') {
        await menuStore.fetchMenus()
      }

      // if (posStore.paymentMethod === 'qr') {
      //   showQRDialog.value = true
      // }

      const data = res.data.data

      // Store for dialog display
      receipt.value = data
      pendingPrints.value = data.prints // { order_ticket, queue_ticket, receipt }

      posStore.clearCart()

      // Show print confirmation dialog
      printDialog.value = true
    } catch {
      notif('Checkout failed. Please try again.', { type: 'error' })
    }
  }

  const confirmCashPayment = async ({ cash_received, change }) => {
    cashDialog.value = false
    await submitOrder({ cash_tendered: cash_received, change_given: change })
  }

  // ── Print dialog handlers ──────────────────────────────────────────────────
  async function handlePrint() {
    // Guard: check printer connection before attempting
    if (!isPrinterReady()) return

    const prints = pendingPrints.value
    if (!prints) return

    try {
      // Queue ticket → customer takes it while waiting
      if (prints.queue_ticket) {
        await printQueue(prints.queue_ticket)
      }

      // Receipt → store/customer copy
      if (prints.receipt) {
        await print(prints.receipt)
      }

      closePrintDialog()
    } catch (e) {
      // printError watcher handles user notification
      console.error('[handlePrint]', e)
    }
  }

  function closePrintDialog() {
    printDialog.value = false
    pendingPrints.value = null
    receipt.value = null
  }

  // ── Other handlers ─────────────────────────────────────────────────────────
  async function handlePrintBill() {
    const res = await orderStore.printBillForPayment(posStore.orderId)
    if (res.status === 200) window.open(res.data.invoice_url, '_blank')
    await orderStore.fetchAllOrders()
    await posStore.clearBill()
  }

  async function handleLogout() {
    await authStore.logout()
    notif(t('messages.logoutSucess'), { type: 'success', color: 'primary' })
    router.push({ name: 'Login' })
  }

  const goToOrders = () => router.push({ name: 'Orders' })

  // ── KHR formatter ──────────────────────────────────────────────────────────
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

  <SidebarMenu v-if="isAdmin" />

  <PosCartDrawer
    :items="activeItems"
    :subtotal="subtotal"
    :total="total"
    :payment-method="posStore.paymentMethod"
    :payment-methods="posStore.paymentMethods"
    @checkout="handleCheckout"
    @print-bill="handlePrintBill"
  />

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

  <PosFooter
    :connectUsb="connectUsb"
    :usbConnected="usbConnected"
    :usbSupported="usbSupported"
  />

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

  <!-- ── Print Receipt Dialog ─────────────────────────────────────────────── -->
  <PrintReceiptDialog
    v-model="printDialog"
    :receipt="receipt"
    :printing="printing"
    :usb-supported="usbSupported"
    :usb-connected="usbConnected"
    @print="handlePrint"
    @skip="closePrintDialog"
    @connect-usb="connectUsb"
  />
</template>
