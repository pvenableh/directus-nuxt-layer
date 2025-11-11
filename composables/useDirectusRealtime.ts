import { createDirectus, staticToken, realtime, rest } from '@directus/sdk'
import type { DirectusClient } from '@directus/sdk'

let realtimeClient: DirectusClient<any> | null = null
let connectionPromise: Promise<void> | null = null

/**
 * Directus Realtime composable
 * 
 * Authentication priority:
 * 1. User token (if logged in)
 * 2. Static token (from DIRECTUS_STATIC_TOKEN env)
 * 3. No authentication (for public collections)
 */
export const useDirectusRealtime = () => {
  const config = useRuntimeConfig()
  const connected = ref(false)
  const error = ref<string | null>(null)

  /**
   * Get or create the realtime client (singleton)
   */
  const getClient = async () => {
    if (realtimeClient && connected.value) {
      return realtimeClient
    }

    try {
      const baseClient = createDirectus(config.public.directus.url)

      // Try to get a token from the server
      let token: string | null = null
      
      try {
        const tokenData = await $fetch('/api/websocket/token')
        token = tokenData.token
      } catch (tokenError) {
        console.warn('No authentication token available, connecting without auth')
      }

      // Create client with token if available
      if (token) {
        realtimeClient = baseClient
          .with(staticToken(token))
          .with(rest())
          .with(realtime())
      } 
      // Try without authentication for public collections
      else {
        realtimeClient = baseClient
          .with(rest())
          .with(realtime())
      }

      return realtimeClient
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  /**
   * Connect to Directus realtime
   */
  const connect = async () => {
    if (connectionPromise) {
      return connectionPromise
    }

    connectionPromise = (async () => {
      try {
        const client = await getClient()
        await client.connect()
        connected.value = true
        error.value = null
      } catch (err: any) {
        error.value = err.message
        connected.value = false
        throw err
      } finally {
        connectionPromise = null
      }
    })()

    return connectionPromise
  }

  /**
   * Disconnect from realtime
   */
  const disconnect = async () => {
    if (realtimeClient) {
      try {
        await realtimeClient.disconnect?.()
      } catch (err) {
        console.error('Error disconnecting:', err)
      }
      realtimeClient = null
      connected.value = false
    }
  }

  /**
   * Subscribe to collection changes
   */
  const subscribe = async <T = any>(
    collection: string,
    options?: {
      event?: 'create' | 'update' | 'delete'
      query?: {
        fields?: string[]
        filter?: Record<string, any>
        sort?: string[]
        limit?: number
      }
    }
  ) => {
    await connect()
    
    const client = await getClient()
    
    const subscription = await client.subscribe(collection, {
      event: options?.event,
      query: options?.query,
    })

    return subscription
  }

  /**
   * Send a message to create/update/delete items via WebSocket
   */
  const sendMessage = async (message: {
    collection: string
    action: 'create' | 'update' | 'delete'
    data?: any
    id?: string | number
  }) => {
    await connect()
    
    const client = await getClient()
    
    return client.sendMessage({
      type: 'items',
      ...message,
    })
  }

  /**
   * Auto-cleanup on unmount
   */
  onUnmounted(() => {
    disconnect()
  })

  return {
    connected,
    error,
    connect,
    disconnect,
    subscribe,
    sendMessage,
  }
}
