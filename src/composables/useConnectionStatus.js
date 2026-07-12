import { ref, onMounted, onUnmounted } from 'vue'
import echo from '@/utils/echo'

export function useConnectionStatus() {
  const connected = ref(false)

  const onConnected = () => (connected.value = true)
  const onDisconnected = () => (connected.value = false)

  onMounted(() => {
    const connection = echo.connector.pusher.connection
    connected.value = connection.state === 'connected'
    connection.bind('connected', onConnected)
    connection.bind('disconnected', onDisconnected)
  })

  onUnmounted(() => {
    const connection = echo.connector.pusher.connection
    connection.unbind('connected', onConnected)
    connection.unbind('disconnected', onDisconnected)
  })

  return { connected }
}
