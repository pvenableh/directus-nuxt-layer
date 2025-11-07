import { ref, onUnmounted } from 'vue'

export const useDirectusRealtime = () => {
  const config = useRuntimeConfig()
  const { session } = useUserSession()
  
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const subscriptions = ref<Map<string, Set<Function>>>(new Map())

  /**
   * Connect to WebSocket
   */
  const connect = () => {
    if (ws.value?.readyState === WebSocket.OPEN) return

    const token = session.value?.secure?.directusAccessToken
    const wsUrl = token 
      ? `${config.public.directus.websocketUrl}?access_token=${token}`
      : config.public.directus.websocketUrl

    ws.value = new WebSocket(wsUrl)

    ws.value.onopen = () => {
      connected.value = true
      console.log('WebSocket connected')
    }

    ws.value.onclose = () => {
      connected.value = false
      console.log('WebSocket disconnected')
      
      // Reconnect after 5 seconds
      setTimeout(() => connect(), 5000)
    }

    ws.value.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handleMessage(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }
  }

  /**
   * Handle incoming messages
   */
  const handleMessage = (data: any) => {
    const { type, event, data: messageData } = data

    if (type === 'subscription' && event) {
      const callbacks = subscriptions.value.get(event)
      if (callbacks) {
        callbacks.forEach(callback => callback(messageData))
      }
    }
  }

  /**
   * Subscribe to collection changes
   */
  const subscribe = <T = any>(
    collection: string,
    callback: (data: T) => void,
    options?: {
      event?: 'create' | 'update' | 'delete'
      query?: Record<string, any>
    }
  ) => {
    const event = options?.event || '*'
    const subscriptionKey = `${collection}:${event}`

    if (!subscriptions.value.has(subscriptionKey)) {
      subscriptions.value.set(subscriptionKey, new Set())
    }

    subscriptions.value.get(subscriptionKey)?.add(callback)

    // Send subscription message
    if (connected.value && ws.value) {
      ws.value.send(JSON.stringify({
        type: 'subscribe',
        collection,
        event,
        query: options?.query,
      }))
    }

    // Return unsubscribe function
    return () => {
      subscriptions.value.get(subscriptionKey)?.delete(callback)
      
      if (subscriptions.value.get(subscriptionKey)?.size === 0) {
        subscriptions.value.delete(subscriptionKey)
        
        // Send unsubscribe message
        if (connected.value && ws.value) {
          ws.value.send(JSON.stringify({
            type: 'unsubscribe',
            collection,
            event,
          }))
        }
      }
    }
  }

  /**
   * Disconnect WebSocket
   */
  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    connected.value = false
    subscriptions.value.clear()
  }

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    connect,
    disconnect,
    subscribe,
  }
}
