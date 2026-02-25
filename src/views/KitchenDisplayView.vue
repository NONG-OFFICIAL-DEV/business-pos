<template>
  <v-container fluid>
    <v-row dense>
      <v-col v-for="order in activeOrders" :key="order.id">
        <v-card>
          <v-toolbar :color="getTimeColor(order.minutes)" density="compact">
            <v-toolbar-title class="text-subtitle-2 font-weight-bold">
              TABLE {{ order.table_no }} • #{{ order.id }}
            </v-toolbar-title>
            <v-spacer />
            <span class="me-2">{{ order.minutes }}m</span>
          </v-toolbar>

          <v-list class="flex-grow-1 pa-0" density="comfortable">
            <v-list-item
              v-for="item in order.items"
              :key="item.id"
              border="bottom"
            >
              <template v-slot:prepend>
                <span class="font-weight-black text-h6 me-3">
                  {{ item.qty }}x
                </span>
              </template>
              <v-list-item-title class="font-weight-bold">
                {{ item.name }}
              </v-list-item-title>
              <v-list-item-subtitle
                v-if="item.note"
                class="text-error font-italic"
              >
                * {{ item.note }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-btn
            block
            color="success"
            class="rounded-0"
            @click="completeOrder(order.id)"
          >
            DONE / SERVED
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { ref } from 'vue'

  const getTimeColor = minutes => {
    if (minutes <= 10) return 'green darken-1'
    if (minutes <= 20) return 'orange darken-1'
    return 'red darken-1'
  }

  const completeOrder = orderId => {
    alert(`Order #${orderId} marked as completed!`)
    // Here you would typically update the order status in your store or backend
  }
  const activeOrders = ref([
    {
      id: 101,
      table_no: 'T1',
      minutes: 12,
      items: [
        { id: 1, name: 'Cappuccino', qty: 2, note: '' },
        { id: 2, name: 'Blueberry Muffin', qty: 1, note: 'No sugar' }
      ]
    },
    {
      id: 102,
      table_no: 'T3',
      minutes: 5,
      items: [
        { id: 3, name: 'Espresso', qty: 1, note: '' },
        { id: 4, name: 'Croissant', qty: 2, note: '' }
      ]
    },
    {
      id: 103,
      table_no: 'T5',
      minutes: 20,
      items: [
        { id: 5, name: 'Latte', qty: 1, note: 'Extra hot' },
        { id: 6, name: 'Ham Sandwich', qty: 1, note: 'No mayo' },
        { id: 7, name: 'Orange Juice', qty: 2, note: '' }
      ]
    },
    {
      id: 104,
      table_no: 'T2',
      minutes: 8,
      items: [
        { id: 8, name: 'Americano', qty: 1, note: '' },
        { id: 9, name: 'Bagel', qty: 1, note: 'With cream cheese' }
      ]
    }
  ])
</script>
