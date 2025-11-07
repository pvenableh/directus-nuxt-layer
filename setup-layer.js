#!/usr/bin/env node

/**
 * Directus Nuxt Layer Setup Script
 * Run with: node setup-layer.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`✓ Created directory: ${dir}`, "green");
  }
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  createDirectory(dir);
  fs.writeFileSync(filePath, content);
  log(`✓ Created file: ${filePath}`, "green");
}

// File contents
const files = {
  ".gitignore": `node_modules/
.nuxt/
.output/
dist/
.env
.env.*
!.env.example
*.log
.DS_Store
`,

  "README.md": `# Directus Nuxt Layer

Reusable Nuxt layer for Directus integration with authentication, CRUD, files, realtime, notifications, and comments.

## Installation

\`\`\`bash
pnpm install github:pvenableh/directus-nuxt-layer
\`\`\`

## Usage

\`\`\`typescript
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['directus-nuxt-layer']
})
\`\`\`

## Features

- ✅ Authentication (email/password + OAuth)
- ✅ CRUD operations
- ✅ File uploads
- ✅ Real-time subscriptions
- ✅ Notifications
- ✅ Comments
- ✅ Auto-generated TypeScript types

## Documentation

See GUIDE.md for full documentation and examples.
`,

  "package.json": `{
  "name": "directus-nuxt-layer",
  "version": "1.0.0",
  "description": "Reusable Directus + Nuxt auth layer",
  "type": "module",
  "main": "./nuxt.config.ts",
  "files": [
    "composables",
    "server",
    "middleware",
    "plugins",
    "types",
    "scripts",
    "nuxt.config.ts"
  ],
  "scripts": {
    "generate:types": "node scripts/generate-types.js"
  },
  "dependencies": {
    "nuxt-auth-utils": "^0.5.25",
    "@directus/sdk": "^20.1.0"
  },
  "peerDependencies": {
    "nuxt": "^3.0.0"
  }
}
`,

  "nuxt.config.ts": `export default defineNuxtConfig({
  modules: ['nuxt-auth-utils'],
  
  runtimeConfig: {
    // Server-only
    directus: {
      url: process.env.DIRECTUS_URL || 'http://localhost:8055',
      adminEmail: process.env.DIRECTUS_ADMIN_EMAIL,
      adminPassword: process.env.DIRECTUS_ADMIN_PASSWORD,
      staticToken: process.env.DIRECTUS_STATIC_TOKEN,
    },
    
    oauth: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    },
    
    // Public
    public: {
      directus: {
        url: process.env.DIRECTUS_URL || 'http://localhost:8055',
        websocketUrl: process.env.DIRECTUS_WS_URL || 'ws://localhost:8055',
      }
    }
  },
  
  nitro: {
    experimental: {
      websocket: true
    }
  },
})
`,

  "types/index.d.ts": `declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role?: string
    avatar?: string
    provider?: 'local' | 'github' | 'google' | string
  }

  interface UserSession {
    user: User
    loggedInAt: number
    expiresAt?: number
  }

  interface SecureSessionData {
    directusAccessToken?: string
    directusRefreshToken?: string
  }
}

export {}
`,

  "composables/useDirectus.ts": `import { createDirectus, rest } from '@directus/sdk'

/**
 * Public Directus client (read-only, unauthenticated)
 */
export const useDirectus = () => {
  const config = useRuntimeConfig()
  
  const client = createDirectus(config.public.directus.url)
    .with(rest())

  return {
    client,
  }
}

/**
 * Authenticated Directus requests via API proxy
 */
export const useAuthenticatedDirectus = () => {
  const { loggedIn } = useUserSession()
  
  const makeRequest = async <T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
      body?: any
      query?: Record<string, any>
    } = {}
  ): Promise<T> => {
    if (!loggedIn.value) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required'
      })
    }

    const { method = 'GET', body, query } = options
    
    return await $fetch(\`/api/directus/\${endpoint}\`, {
      method,
      body,
      query,
    })
  }

  return {
    request: makeRequest,
  }
}
`,

  "composables/useDirectusAuth.ts": `/**
 * Authentication composable for Directus + Nuxt Auth Utils
 */
export const useDirectusAuth = () => {
  const { loggedIn, user, session, clear: clearSession, fetch: fetchSession } = useUserSession()
  const router = useRouter()

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      await fetchSession()
      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Login failed')
    }
  }

  const register = async (data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
  }) => {
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: data
      })

      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Registration failed')
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      await clearSession()
      await router.push('/login')
    } catch (error: any) {
      console.error('Logout error:', error)
      await clearSession()
      await router.push('/login')
    }
  }

  const refreshToken = async () => {
    try {
      await $fetch('/api/auth/refresh', { method: 'POST' })
      await fetchSession()
    } catch (error: any) {
      await clearSession()
      throw new Error('Session expired')
    }
  }

  const loginWithGitHub = () => {
    window.location.href = '/api/auth/github'
  }

  const loginWithGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  return {
    loggedIn,
    user,
    session,
    login,
    register,
    logout,
    refreshToken,
    loginWithGitHub,
    loginWithGoogle,
  }
}
`,

  "composables/useDirectusItems.ts": `import { 
  readItems, 
  readItem, 
  aggregate
} from '@directus/sdk'

export const useDirectusItems = () => {
  const { client } = useDirectus()
  const { request: authRequest } = useAuthenticatedDirectus()

  /**
   * READ operations (public)
   */
  const fetchItems = async (
    collection: string,
    options: {
      fields?: string[]
      filter?: Record<string, any>
      sort?: string[]
      limit?: number
      offset?: number
      page?: number
      search?: string
      deep?: Record<string, any>
    } = {}
  ) => {
    return await useAsyncData(
      \`directus-\${collection}-\${JSON.stringify(options)}\`,
      () => client.request(
        readItems(collection, options as any)
      )
    )
  }

  const fetchItem = async (
    collection: string,
    id: string | number,
    options: {
      fields?: string[]
      deep?: Record<string, any>
    } = {}
  ) => {
    return await useAsyncData(
      \`directus-\${collection}-\${id}\`,
      () => client.request(
        readItem(collection, id, options as any)
      )
    )
  }

  const fetchItemsLazy = async (
    collection: string,
    options = {}
  ) => {
    return await useLazyAsyncData(
      \`directus-\${collection}-lazy-\${JSON.stringify(options)}\`,
      () => client.request(
        readItems(collection, options as any)
      )
    )
  }

  /**
   * AGGREGATE operations (public)
   */
  const aggregateItems = async (
    collection: string,
    options: {
      aggregate: {
        avg?: string[]
        avgDistinct?: string[]
        count?: string[]
        countDistinct?: string[]
        sum?: string[]
        sumDistinct?: string[]
        min?: string[]
        max?: string[]
      }
      groupBy?: string[]
      filter?: Record<string, any>
    }
  ) => {
    return await useAsyncData(
      \`directus-\${collection}-aggregate\`,
      () => client.request(
        aggregate(collection, options as any)
      )
    )
  }

  /**
   * CREATE operations (authenticated)
   */
  const create = async (
    collection: string,
    item: any
  ) => {
    return await authRequest(\`items/\${collection}\`, {
      method: 'POST',
      body: item,
    })
  }

  const createMany = async (
    collection: string,
    items: any[]
  ) => {
    return await authRequest(\`items/\${collection}\`, {
      method: 'POST',
      body: items,
    })
  }

  /**
   * UPDATE operations (authenticated)
   */
  const update = async (
    collection: string,
    id: string | number,
    item: any
  ) => {
    return await authRequest(\`items/\${collection}/\${id}\`, {
      method: 'PATCH',
      body: item,
    })
  }

  const updateMany = async (
    collection: string,
    ids: (string | number)[],
    item: any
  ) => {
    return await authRequest(\`items/\${collection}\`, {
      method: 'PATCH',
      body: {
        keys: ids,
        data: item,
      },
    })
  }

  const updateByQuery = async (
    collection: string,
    query: Record<string, any>,
    item: any
  ) => {
    return await authRequest(\`items/\${collection}\`, {
      method: 'PATCH',
      body: item,
      query,
    })
  }

  /**
   * DELETE operations (authenticated)
   */
  const deleteOne = async (
    collection: string,
    id: string | number
  ) => {
    return await authRequest(\`items/\${collection}/\${id}\`, {
      method: 'DELETE',
    })
  }

  const deleteMany = async (
    collection: string,
    ids: (string | number)[]
  ) => {
    return await authRequest(\`items/\${collection}\`, {
      method: 'DELETE',
      body: ids,
    })
  }

  /**
   * Utility: Refresh data
   */
  const refresh = async (key?: string) => {
    if (key) {
      await refreshNuxtData(key)
    } else {
      await refreshNuxtData()
    }
  }

  return {
    // Read
    fetchItems,
    fetchItem,
    fetchItemsLazy,
    
    // Aggregate
    aggregateItems,
    
    // Create
    create,
    createMany,
    
    // Update
    update,
    updateMany,
    updateByQuery,
    
    // Delete
    deleteOne,
    deleteMany,
    
    // Utilities
    refresh,
  }
}
`,

  "composables/useDirectusFiles.ts": `export const useDirectusFiles = () => {
  const config = useRuntimeConfig()
  const { request: authRequest } = useAuthenticatedDirectus()

  /**
   * Get file URL
   */
  const getFileUrl = (fileId: string, options?: {
    width?: number
    height?: number
    quality?: number
    fit?: 'cover' | 'contain' | 'inside' | 'outside'
    format?: 'jpg' | 'png' | 'webp' | 'tiff'
  }) => {
    const params = new URLSearchParams()
    
    if (options?.width) params.append('width', options.width.toString())
    if (options?.height) params.append('height', options.height.toString())
    if (options?.quality) params.append('quality', options.quality.toString())
    if (options?.fit) params.append('fit', options.fit)
    if (options?.format) params.append('format', options.format)

    const queryString = params.toString()
    const base = \`\${config.public.directus.url}/assets/\${fileId}\`
    
    return queryString ? \`\${base}?\${queryString}\` : base
  }

  /**
   * Upload file
   */
  const uploadFile = async (
    file: File,
    options?: {
      title?: string
      folder?: string
      description?: string
    }
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (options?.title) formData.append('title', options.title)
    if (options?.folder) formData.append('folder', options.folder)
    if (options?.description) formData.append('description', options.description)

    return await $fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    })
  }

  /**
   * Upload multiple files
   */
  const uploadFiles = async (
    files: File[],
    options?: {
      folder?: string
    }
  ) => {
    const uploads = files.map(file => 
      uploadFile(file, { 
        title: file.name,
        folder: options?.folder 
      })
    )
    
    return await Promise.all(uploads)
  }

  /**
   * Delete file
   */
  const deleteFile = async (fileId: string) => {
    return await authRequest(\`files/\${fileId}\`, {
      method: 'DELETE',
    })
  }

  /**
   * Update file metadata
   */
  const updateFile = async (
    fileId: string,
    data: any
  ) => {
    return await authRequest(\`files/\${fileId}\`, {
      method: 'PATCH',
      body: data,
    })
  }

  /**
   * Get file metadata
   */
  const getFile = async (fileId: string) => {
    return await authRequest(\`files/\${fileId}\`)
  }

  return {
    getFileUrl,
    uploadFile,
    uploadFiles,
    deleteFile,
    updateFile,
    getFile,
  }
}
`,

  "composables/useDirectusRealtime.ts": `import { ref, onUnmounted } from 'vue'

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
      ? \`\${config.public.directus.websocketUrl}?access_token=\${token}\`
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
    const subscriptionKey = \`\${collection}:\${event}\`

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
`,

  "composables/useDirectusNotifications.ts": `import { 
  readNotifications, 
  readNotification,
} from '@directus/sdk'

export const useDirectusNotifications = () => {
  const { request: authRequest } = useAuthenticatedDirectus()
  const { client } = useDirectus()
  const { user } = useUserSession()

  const fetchNotifications = async (options: {
    fields?: string[]
    filter?: Record<string, any>
    sort?: string[]
    limit?: number
    offset?: number
    unreadOnly?: boolean
  } = {}) => {
    const filter = options.unreadOnly 
      ? { 
          recipient: { _eq: user.value?.id },
          status: { _eq: 'inbox' },
          ...options.filter 
        }
      : { 
          recipient: { _eq: user.value?.id },
          ...options.filter 
        }

    return await useAsyncData(
      \`directus-notifications-\${JSON.stringify(options)}\`,
      () => client.request(
        readNotifications({
          fields: options.fields || ['*'],
          filter,
          sort: options.sort || ['-timestamp'],
          limit: options.limit,
          offset: options.offset,
        })
      )
    )
  }

  const fetchNotification = async (id: string) => {
    return await useAsyncData(
      \`directus-notification-\${id}\`,
      () => client.request(readNotification(id))
    )
  }

  const getUnreadCount = async () => {
    const { data } = await fetchNotifications({
      unreadOnly: true,
      fields: ['id'],
      limit: -1,
    })
    
    return data.value?.length || 0
  }

  const markAsRead = async (notificationId: string) => {
    return await authRequest(\`notifications/\${notificationId}\`, {
      method: 'PATCH',
      body: {
        status: 'archived',
      }
    })
  }

  const markManyAsRead = async (notificationIds: string[]) => {
    return await authRequest('notifications', {
      method: 'PATCH',
      body: {
        keys: notificationIds,
        data: {
          status: 'archived',
        }
      }
    })
  }

  const markAllAsRead = async () => {
    return await authRequest('notifications', {
      method: 'PATCH',
      body: {
        query: {
          filter: {
            recipient: { _eq: user.value?.id },
            status: { _eq: 'inbox' }
          }
        },
        data: {
          status: 'archived',
        }
      }
    })
  }

  const createNotificationItem = async (notification: {
    recipient: string
    subject: string
    message?: string
    collection?: string
    item?: string
  }) => {
    return await authRequest('notifications', {
      method: 'POST',
      body: {
        ...notification,
        status: 'inbox',
        timestamp: new Date().toISOString(),
      }
    })
  }

  const deleteNotificationItem = async (notificationId: string) => {
    return await authRequest(\`notifications/\${notificationId}\`, {
      method: 'DELETE',
    })
  }

  const deleteManyNotifications = async (notificationIds: string[]) => {
    return await authRequest('notifications', {
      method: 'DELETE',
      body: notificationIds,
    })
  }

  return {
    fetchNotifications,
    fetchNotification,
    getUnreadCount,
    markAsRead,
    markManyAsRead,
    markAllAsRead,
    createNotificationItem,
    deleteNotificationItem,
    deleteManyNotifications,
  }
}
`,

  "composables/useDirectusComments.ts": `export const useDirectusComments = () => {
  const { request: authRequest } = useAuthenticatedDirectus()
  const { user } = useUserSession()

  const fetchComments = async (
    collection: string,
    itemId: string | number,
    options: {
      fields?: string[]
      sort?: string[]
      limit?: number
    } = {}
  ) => {
    return await useAsyncData(
      \`directus-comments-\${collection}-\${itemId}\`,
      () => authRequest('activity', {
        query: {
          filter: {
            collection: { _eq: collection },
            item: { _eq: String(itemId) },
            action: { _eq: 'comment' }
          },
          fields: options.fields || ['*', 'user_created.*'],
          sort: options.sort || ['-date_created'],
          limit: options.limit,
        }
      })
    )
  }

  const addComment = async (
    collection: string,
    itemId: string | number,
    comment: string
  ) => {
    return await authRequest('activity/comment', {
      method: 'POST',
      body: {
        collection,
        item: String(itemId),
        comment,
      }
    })
  }

  const updateCommentItem = async (
    commentId: string,
    comment: string
  ) => {
    return await authRequest(\`activity/comment/\${commentId}\`, {
      method: 'PATCH',
      body: {
        comment,
      }
    })
  }

  const deleteCommentItem = async (commentId: string) => {
    return await authRequest(\`activity/comment/\${commentId}\`, {
      method: 'DELETE',
    })
  }

  const getCommentCount = async (
    collection: string,
    itemId: string | number
  ) => {
    const { data } = await fetchComments(collection, itemId, {
      fields: ['id'],
      limit: -1,
    })
    
    return data.value?.length || 0
  }

  const canEditComment = (comment: any) => {
    return comment.user_created?.id === user.value?.id
  }

  const canDeleteComment = (comment: any) => {
    return comment.user_created?.id === user.value?.id || 
           user.value?.role === 'administrator'
  }

  return {
    fetchComments,
    getCommentCount,
    addComment,
    updateCommentItem,
    deleteCommentItem,
    canEditComment,
    canDeleteComment,
  }
}
`,
};

// Create all files
log("\n🚀 Setting up Directus Nuxt Layer...\n", "blue");

Object.entries(files).forEach(([filePath, content]) => {
  writeFile(filePath, content);
});

log("\n✨ Setup complete!\n", "green");
log("Next steps:", "blue");
log("1. Run: pnpm install");
log("2. Create server files: node setup-server.js");
log("3. git add .");
log('4. git commit -m "Update layer setup"');
log("5. git push");
log("");
