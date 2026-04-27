// composables/useReceipt.js

import { ref } from 'vue'

let _qz = null
async function getQz() {
  if (_qz) return _qz
  try {
    const mod = await import('qz-tray')
    _qz = mod.default ?? mod
    return _qz
  } catch (_) {
    return null
  }
}

const PAPER_WIDTH_PX = 576
const CHAR_WIDTH = 48
const QZ_PRINTER = 'Diamond'
const CURRENCY = '៛'
const LF = '\x0A'

const PAY_LABEL = {
  cash: 'សាច់ប្រាក់ / Cash',
  card: 'កាត / Card',
  qr_code: 'QR Code',
  qr: 'QR',
  online: 'ផ្ទេរប្រាក់ / Transfer',
  transfer: 'ផ្ទេរប្រាក់ / Transfer'
}

const money = v =>
  Math.round(parseFloat(v || 0)).toLocaleString('en-US') + ' ' + CURRENCY

const hasKhmer = s => /[\u1780-\u17FF]/.test(s)
const isAndroid = () => /android/i.test(navigator.userAgent)
const twoCol = (l, r, w = CHAR_WIDTH) => {
  const gap = Math.max(1, w - l.length - r.length)
  return l + ' '.repeat(gap) + r
}
const line  = () => '-'.repeat(CHAR_WIDTH) + LF
const dLine = () => '='.repeat(CHAR_WIDTH) + LF

async function autoConnectUsb() {
  try {
    const devices = await navigator.usb.getDevices()
    if (!devices.length) return false
    const dev = devices[0]
    await dev.open()
    if (dev.configuration === null) await dev.selectConfiguration(1)
    const found = findBulkOutEndpoint(dev)
    if (!found) return false
    await dev.claimInterface(found.interfaceNumber)
    usbDevice.value = { dev, ...found }
    usbConnected.value = true
    printMethod.value = 'usb'
    return true
  } catch (e) {
    console.warn('[useReceipt] autoConnectUsb failed:', e.message)
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Canvas helpers
// ─────────────────────────────────────────────────────────────────────────────
function textToEscPosImage(text, { bold = false, fontSize = 22, align = 'left' } = {}) {
  const canvas = document.createElement('canvas')
  const lineH  = fontSize + 10
  canvas.width  = PAPER_WIDTH_PX
  const fontStr = (bold ? 'bold ' : '') + `${fontSize}px Hanuman, "Noto Sans Khmer", Arial, sans-serif`
  const ctx = canvas.getContext('2d')
  ctx.font = fontStr

  const words = text.split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (ctx.measureText(test).width > PAPER_WIDTH_PX - 8) {
      if (cur) lines.push(cur)
      cur = w
    } else {
      cur = test
    }
  }
  if (cur) lines.push(cur)

  canvas.height = Math.max(1, lines.length * lineH + 4)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#000'
  ctx.font = fontStr
  ctx.textBaseline = 'top'

  lines.forEach((ln, i) => {
    const tw = ctx.measureText(ln).width
    let x = 4
    if (align === 'center') x = Math.max(0, (PAPER_WIDTH_PX - tw) / 2)
    if (align === 'right')  x = Math.max(0, PAPER_WIDTH_PX - tw - 4)
    ctx.fillText(ln, x, i * lineH + 2)
  })

  return canvasToRaster(canvas)
}

function canvasToRaster(canvas) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const imgData    = ctx.getImageData(0, 0, width, height).data
  const bytesPerRow = Math.ceil(width / 8)
  const rows = []

  for (let y = 0; y < height; y++) {
    const row = new Uint8Array(bytesPerRow)
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const lum = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2]
      if (lum < 160) row[Math.floor(x / 8)] |= 0x80 >> x % 8
    }
    rows.push(row)
  }

  const xL = bytesPerRow & 0xff, xH = (bytesPerRow >> 8) & 0xff
  const yL = height & 0xff,      yH = (height >> 8) & 0xff
  const out = [0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]
  for (const row of rows) out.push(...row)
  return out
}

function tableRowToEscPosImage(cols, { bold = false, fontSize = 20, marginTop = 10 } = {}) {
  const canvas = document.createElement('canvas')
  const ctx    = canvas.getContext('2d')
  const lineH  = fontSize + marginTop + 10
  canvas.width  = PAPER_WIDTH_PX
  canvas.height = lineH
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#000'
  ctx.font = `${bold ? 'bold ' : ''}${fontSize}px Hanuman, "Noto Sans Khmer", Arial, sans-serif`
  ctx.textBaseline = 'bottom'
  const drawY    = canvas.height - 5
  const colNameX = 4
  const colQtyX  = PAPER_WIDTH_PX * 0.52
  const colTotalX = PAPER_WIDTH_PX - 4
  ctx.textAlign = 'left';  ctx.fillText(cols[0], colNameX,  drawY)
  ctx.textAlign = 'left';  ctx.fillText(cols[1], colQtyX,   drawY)
  ctx.textAlign = 'right'; ctx.fillText(cols[2], colTotalX, drawY)
  return canvasToRaster(canvas)
}

function totalsRowToEscPosImage(label, value, { bold = false, fontSize = 20, marginTop = 8 } = {}) {
  const canvas = document.createElement('canvas')
  const ctx    = canvas.getContext('2d')
  const lineH  = fontSize + marginTop + 10
  canvas.width  = PAPER_WIDTH_PX
  canvas.height = lineH
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#000'
  ctx.font = `${bold ? 'bold ' : ''}${fontSize}px Hanuman, "Noto Sans Khmer", Arial, sans-serif`
  ctx.textBaseline = 'bottom'
  const drawY = canvas.height - 5
  ctx.textAlign = 'left';  ctx.fillText(label, 4,                   drawY)
  ctx.textAlign = 'right'; ctx.fillText(value, PAPER_WIDTH_PX - 4,  drawY)
  return canvasToRaster(canvas)
}

// ─────────────────────────────────────────────────────────────────────────────
// Big centered number for queue ticket
// ─────────────────────────────────────────────────────────────────────────────
function bigNumberToEscPosImage(text) {
  const fontSize = 120
  const canvas   = document.createElement('canvas')
  canvas.width   = PAPER_WIDTH_PX
  canvas.height  = fontSize + 40
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle    = '#000'
  ctx.font         = `bold ${fontSize}px Hanuman, Arial, sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign    = 'center'
  ctx.fillText(text, PAPER_WIDTH_PX / 2, canvas.height / 2)
  return canvasToRaster(canvas)
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD RECEIPT BYTES  (uses prints.receipt from API)
// ─────────────────────────────────────────────────────────────────────────────
function buildBytes(r) {
  // r = prints.receipt
  const items    = r.items ?? []
  const subtotal = parseFloat(r.subtotal ?? 0)
  const discount = parseFloat(r.discount ?? 0)
  const tax      = parseFloat(r.tax ?? 0)
  const sc       = parseFloat(r.service_charge ?? 0)
  const total    = parseFloat(r.total ?? 0)
  const cash     = parseFloat(r.cash_tendered ?? 0)
  const change   = parseFloat(r.change_given ?? 0)
  const payLbl   = PAY_LABEL[r.payment_method] ?? r.payment_method ?? '-'

  const bytes = []
  const b   = arr => bytes.push(...arr)
  const t   = str => { for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i) & 0xff) }
  const img = (text, opts = {}) => b(textToEscPosImage(text, opts))
  const auto = (text, opts = {}) => {
    if (/[^\x00-\x7F]/.test(text)) img(text, opts)
    else t(text)
  }

  const E = 0x1b, G = 0x1d

  // ── INIT ──
  b([E, 0x40])

  // ── HEADER ──
  b([E, 0x61, 0x01])
  if (hasKhmer(r.branch_name ?? '')) {
    img(r.branch_name ?? 'MY STORE', { bold: true, fontSize: 26, align: 'center' })
  } else {
    b([E, 0x45, 0x01, E, 0x21, 0x10])
    t((r.branch_name ?? 'MY STORE') + '\n')
    b([E, 0x21, 0x00, E, 0x45, 0x00])
  }
  if (r.branch_address) {
    auto(r.branch_address, { fontSize: 18, align: 'center' })
    if (!/[^\x00-\x7F]/.test(r.branch_address)) t('\n')
  }
  if (r.branch_phone) t('Tel: ' + r.branch_phone + '\n')

  // ── ORDER INFO ──
  b([E, 0x61, 0x00])
  t(line())
  t(twoCol('Order #:', r.order_number ?? '-') + '\n')
  t(twoCol('Queue #:', String(r.queue_number ?? '-')) + '\n')
  t(twoCol('Date:',    r.printed_at ?? new Date().toLocaleString()) + '\n')
  if (r.cashier) {
    if (hasKhmer(r.cashier)) { t('Cashier: '); img(r.cashier, { fontSize: 20 }) }
    else t(twoCol('Cashier:', r.cashier) + '\n')
  }
  t(line())

  // ── ITEMS TABLE HEADER ──
  b(tableRowToEscPosImage(['Name/ឈ្មោះ', 'Qty/ចំនួន', 'Total/សរុប'], { bold: true, fontSize: 18 }))
  t(line())

  // ── ITEMS ──
  for (const item of items) {
    const label    = (item.name ?? '') + (item.unit ? ` (${item.unit})` : '')
    const qtyStr   = `${item.qty} x ${money(item.unit_price)}`
    const totalAmt = money(item.total_price ?? item.qty * item.unit_price)

    b(tableRowToEscPosImage([label, qtyStr, totalAmt], { fontSize: 24, marginTop: 15 }))

    // ── Customizations under each item ──
    const customs = item.customizations ?? []
    for (const c of customs) {
      // { label: "sugar", value: "No Sugar" }  OR  { label: null, value: "Oat Milk" }
      const text = c.label ? `  - ${c.label}: ${c.value}` : `  - ${c.value}`
      b(textToEscPosImage(text, { fontSize: 18 }))
    }

    // Item note
    if (item.note) {
      b(textToEscPosImage(`  * ${item.note}`, { fontSize: 18 }))
    }
  }

  // ── TOTALS ──
  t(line())
  b(totalsRowToEscPosImage('Subtotal / សរុបរង:', money(subtotal)))
  if (discount > 0) b(totalsRowToEscPosImage('Discount / បញ្ចុះ:', '-' + money(discount)))
  if (tax > 0)      b(totalsRowToEscPosImage('Tax / ពន្ធ:', money(tax)))
  if (sc > 0)       b(totalsRowToEscPosImage('Service Charge:', money(sc)))
  t(dLine())
  b(totalsRowToEscPosImage('Total / សរុបទាំងអស់:', money(total), { bold: true, fontSize: 26, marginTop: 12 }))
  t(dLine())

  // ── PAYMENT ──
  b(totalsRowToEscPosImage('Payment / បង់:', payLbl))
  if (cash > 0)   b(totalsRowToEscPosImage('Cash / ទទួល:', money(cash)))
  if (change > 0) b(totalsRowToEscPosImage('Change / អាប់:', money(change), { bold: true }))
  t(line())

  // Big queue number
  b(bigNumberToEscPosImage(String(r.queue_number_display ?? '-')))

  // ── FOOTER ──
  t(line())
  b([E, 0x61, 0x01])
  t('Thank you for your purchase!\n')
  img('អរគុណសម្រាប់ការទិញ!', { fontSize: 20, align: 'center' })
  t('\n\n\n')
  b([G, 0x56, 0x41, 0x05])

  return new Uint8Array(bytes)
}

// ─────────────────────────────────────────────────────────────────────────────
// BUILD QUEUE TICKET BYTES  (uses prints.queue_ticket from API)
// ─────────────────────────────────────────────────────────────────────────────
function buildQueueBytes(q) {
  // q = prints.queue_ticket
  const bytes = []
  const b   = arr => bytes.push(...arr)
  const t   = str => { for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i) & 0xff) }
  const img = (text, opts = {}) => b(textToEscPosImage(text, opts))

  const E = 0x1b, G = 0x1d

  b([E, 0x40])                  // INIT
  b([E, 0x61, 0x01])            // center

  // Title
  b([E, 0x45, 0x01, E, 0x21, 0x10])
  t('WAITING NUMBER\n')
  b([E, 0x21, 0x00, E, 0x45, 0x00])

  t(line())

  // Big queue number
  b(bigNumberToEscPosImage(String(q.queue_number_display ?? '-')))

  t(line())

  // Order info
  b([E, 0x61, 0x00])            // left
  t(twoCol('Order #:', q.order_number ?? '-') + '\n')
  t(twoCol('Items:',   String(q.item_count ?? 0)) + '\n')
  t(twoCol('Time:',    q.time ?? '') + '\n')
  t(line())

  // Footer
  b([E, 0x61, 0x01])            // center
  t('Please wait for your number\n')
  img('សូមរង់ចាំលេខរបស់អ្នក', { fontSize: 20, align: 'center' })
  t('\n\n\n')
  b([G, 0x56, 0x41, 0x05])     // cut

  return new Uint8Array(bytes)
}

// ─────────────────────────────────────────────────────────────────────────────
// QZ helpers
// ─────────────────────────────────────────────────────────────────────────────
function uint8ToBase64(bytes) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

function buildQzJob(bytes) {
  return [{ type: 'raw', format: 'base64', data: uint8ToBase64(bytes) }]
}

// ─────────────────────────────────────────────────────────────────────────────
// WebUSB helpers
// ─────────────────────────────────────────────────────────────────────────────
function findBulkOutEndpoint(device) {
  for (const iface of device.configuration.interfaces) {
    for (const alt of iface.alternates) {
      for (const ep of alt.endpoints) {
        if (ep.direction === 'out' && ep.type === 'bulk') {
          return { interfaceNumber: iface.interfaceNumber, endpoint: ep }
        }
      }
    }
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Composable
// ─────────────────────────────────────────────────────────────────────────────
export function useReceipt() {
  const printing    = ref(false)
  const error       = ref(null)
  const printMethod = ref(null)
  const usbDevice   = ref(null)
  const usbConnected = ref(false)
  const usbSupported = 'usb' in navigator

  async function connectUsb() {
    error.value = null
    try {
      const dev = await navigator.usb.requestDevice({ filters: [] })
      await dev.open()
      if (dev.configuration === null) await dev.selectConfiguration(1)
      const found = findBulkOutEndpoint(dev)
      if (!found) throw new Error('No bulk-out USB endpoint found.')
      await dev.claimInterface(found.interfaceNumber)
      usbDevice.value    = { dev, ...found }
      usbConnected.value = true
      printMethod.value  = 'usb'
      return true
    } catch (e) {
      error.value        = e.message
      usbConnected.value = false
      return false
    }
  }

  async function disconnectUsb() {
    if (usbDevice.value) {
      try {
        await usbDevice.value.dev.releaseInterface(usbDevice.value.interfaceNumber)
        await usbDevice.value.dev.close()
      } catch (_) {}
      usbDevice.value    = null
      usbConnected.value = false
    }
  }

  // ── Internal: send raw bytes via USB ──────────────────────────────────────
  async function _sendUsb(bytes, _retry = false) {
    if (!usbConnected.value || !usbDevice.value) {
      const ok = await autoConnectUsb()
      if (!ok) { error.value = 'not_connected'; return false }
    }
    const CHUNK = 64
    try {
      for (let i = 0; i < bytes.length; i += CHUNK) {
        await usbDevice.value.dev.transferOut(
          usbDevice.value.endpoint.endpointNumber,
          bytes.slice(i, i + CHUNK)
        )
      }
      return true
    } catch (e) {
      usbConnected.value = false
      usbDevice.value    = null
      if (!_retry) {
        console.warn('[useReceipt] USB error, retrying once...', e.message)
        await new Promise(r => setTimeout(r, 600))
        return _sendUsb(bytes, true)
      }
      error.value = 'disconnected'
      return false
    }
  }

  // ── Internal: send raw bytes via QZ ──────────────────────────────────────
  async function _sendQz(bytes) {
    const qz = await getQz()
    if (!qz) throw new Error('QZ Tray not loaded.')
    if (!qz.websocket.isActive()) await qz.websocket.connect()
    const printer = await qz.printers.find(QZ_PRINTER)
    const config  = qz.configs.create(printer)
    await qz.print(config, buildQzJob(bytes))
    return true
  }

  // ── Internal: route bytes to correct transport ────────────────────────────
  async function _send(bytes) {
    if (isAndroid()) {
      printMethod.value = 'usb'
      return _sendUsb(bytes)
    } else {
      printMethod.value = 'qz'
      return _sendQz(bytes)
    }
  }

  // ── print receipt  →  pass prints.receipt ────────────────────────────────
  const print = async receipt => {
    if (!receipt) { error.value = 'No receipt data'; return false }
    printing.value = true
    error.value    = null
    try {
      return await _send(buildBytes(receipt))
    } catch (e) {
      error.value = e.message ?? 'Print failed'
      console.error('[useReceipt]', e)
      return false
    } finally {
      printing.value = false
    }
  }

  // ── printQueue  →  pass prints.queue_ticket ───────────────────────────────
  const printQueue = async queueTicket => {
    if (!queueTicket) { error.value = 'No queue ticket data'; return false }
    printing.value = true
    error.value    = null
    try {
      return await _send(buildQueueBytes(queueTicket))
    } catch (e) {
      error.value = e.message ?? 'Print failed'
      console.error('[useReceipt]', e)
      return false
    } finally {
      printing.value = false
    }
  }

  return {
    printing,
    error,
    printMethod,
    usbConnected,
    usbSupported,
    print,        // receipt
    printQueue,   // queue ticket
    connectUsb,
    disconnectUsb
  }
}