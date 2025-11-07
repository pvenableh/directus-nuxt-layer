import { ref, onUnmounted } from 'vue'

export const useDirectusRealtime = () => {
  const config = useRuntimeConfig()
  
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const authenticated = ref(false)
  const subscriptions = ref<Map<string, Set<Function>>>(new Map())

  /**
   * Connect to WebSocket
   * If requireAuth is true, fetches token from server
   * If requireAuth is false, connects without authentication (for public collections)
   */
  const connect = async (options?: {
    requireAuth?: boolean
    token?: string
  }) => {
    if (ws.value?.readyState === WebSocket.OPEN) return

    const { requireAuth = true, token: providedToken } = options || {}

    try {
      // Connect to WebSocket
      ws.value = new WebSocket(config.public.directus.websocketUrl)

      ws.value.onopen = async () => {
        connected.value = true
        console.log('WebSocket opened')

        // Handle authentication if required
        if (requireAuth) {
          try {
            // Use provided token or fetch from server
            const token = providedToken || (await $fetch('/api/websocket/token')).token
            
            ws.value?.send(JSON.stringify({
              type: 'auth',
              access_token: token
            }))
          } catch (error) {
            console.error('Failed to get auth token:', error)
            ws.value?.close()
          }
        } else {
          // Mark as authenticated for public access
          authenticated.value = true
        }
      }

      ws.value.onclose = () => {
        connected.value = false
        authenticated.value = false
        console.log('WebSocket disconnected')
        
        // Reconnect after 5 seconds
        setTimeout(() => connect(options), 5000)
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
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
    }
  }

  /**
   * Handle incoming messages
   */
  const handleMessage = (data: any) => {
    // Handle auth response
    if (data.type === 'auth') {
      if (data.status === 'ok') {
        authenticated.value = true
        console.log('WebSocket authenticated')
      } else {
        console.error('WebSocket auth failed:', data.error)
        ws.value?.close()
      }
      return
    }

    // Handle subscription messages
    if (data.type === 'subscription') {
      const { event, data: messageData } = data
      
      if (event && event !== 'init') {
        const callbacks = subscriptions.value.get(`*:${event}`)
        if (callbacks) {
          callbacks.forEach(callback => callback(messageData))
        }
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
    const subscriptionKey = `*:${event}`

    if (!subscriptions.value.has(subscriptionKey)) {
      subscriptions.value.set(subscriptionKey, new Set())
    }

    subscriptions.value.get(subscriptionKey)?.add(callback)

    // Send subscription message once authenticated
    const sendSubscription = () => {
      if (authenticated.value && ws.value?.readyState === WebSocket.OPEN) {
        ws.value.send(JSON.stringify({
          type: 'subscribe',
          collection,
          event: options?.event,
          query: options?.query,
        }))
      } else {
        // Wait for authentication
        setTimeout(sendSubscription, 100)
      }
    }

    sendSubscription()

    // Return unsubscribe function
    return () => {
      subscriptions.value.get(subscriptionKey)?.delete(callback)
      
      if (subscriptions.value.get(subscriptionKey)?.size === 0) {
        subscriptions.value.delete(subscriptionKey)
        
        // Send unsubscribe message
        if (authenticated.value && ws.value) {
          ws.value.send(JSON.stringify({
            type: 'unsubscribe',
            collection,
            event: options?.event,
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
    authenticated.value = false
    subscriptions.value.clear()
  }

  // Auto-cleanup on component unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    authenticated,
    connect,
    disconnect,
    subscribe,
  }
}
