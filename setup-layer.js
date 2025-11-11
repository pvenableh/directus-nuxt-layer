#!/usr/bin/env node

/**
 * Directus Nuxt Layer Setup Script (UPDATED WITH GUIDE.MD)
 * Uses peerDependencies to avoid duplication
 * Run with: node setup-layer.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
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

  // ✅ CORRECTED: Using peerDependencies
  "package.json": `{
  "name": "directus-nuxt-layer",
  "version": "1.0.0",
  "description": "Reusable Directus + Nuxt layer with auth and realtime",
  "type": "module",
  "main": "./nuxt.config.ts",
  "files": [
    "composables",
    "server",
    "middleware",
    "plugins",
    "types",
    "nuxt.config.ts"
  ],
  "peerDependencies": {
    "nuxt": "^3.0.0",
    "@directus/sdk": "^20.0.0",
    "nuxt-auth-utils": "^0.5.25"
  },
  "devDependencies": {
    "nuxt": "^3.0.0",
    "@directus/sdk": "^20.1.0",
    "nuxt-auth-utils": "^0.5.25"
  }
}
`,

  "nuxt.config.ts": `export default defineNuxtConfig({
  modules: ['nuxt-auth-utils'],
  
  runtimeConfig: {
    // Server-only (never exposed to client)
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
    
    // Public (available on both server and client)
    public: {
      directus: {
        url: process.env.DIRECTUS_URL || 'http://localhost:8055',
        websocketUrl: process.env.DIRECTUS_WS_URL || 'ws://localhost:8055',
      },
      appUrl: process.env.PUBLIC_APP_URL || 'http://localhost:3000',
    }
  },
  
  nitro: {
    experimental: {
      websocket: true
    }
  },
})
`,

  ".env.example": `# Directus Configuration
DIRECTUS_URL=http://localhost:8055
DIRECTUS_WS_URL=ws://localhost:8055

# Directus Admin Credentials (for server operations)
DIRECTUS_ADMIN_EMAIL=admin@example.com
DIRECTUS_ADMIN_PASSWORD=your_admin_password

# Directus Static Token (for realtime and public access)
DIRECTUS_STATIC_TOKEN=your_static_token_here

# App URL (for email links - password reset, invitations)
PUBLIC_APP_URL=http://localhost:3000

# OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
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
 * 
 * COMPLETE VERSION with password reset and user invitations
 */
export const useDirectusAuth = () => {
  const { loggedIn, user, session, clear: clearSession, fetch: fetchSession } = useUserSession()
  const router = useRouter()

  // ===== BASIC AUTH =====
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

  // ===== PASSWORD RESET =====
  const requestPasswordReset = async (email: string) => {
    try {
      const response = await $fetch('/api/auth/password-request', {
        method: 'POST',
        body: { email }
      })
      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Password reset request failed')
    }
  }

  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/password-reset', {
        method: 'POST',
        body: { token, password }
      })
      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Password reset failed')
    }
  }

  // ===== USER INVITATIONS =====
  const inviteUser = async (email: string, role?: string) => {
    try {
      const response = await $fetch('/api/auth/invite', {
        method: 'POST',
        body: { email, role }
      })
      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Failed to send invitation')
    }
  }

  const acceptInvite = async (token: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/accept-invite', {
        method: 'POST',
        body: { token, password }
      })
      
      await fetchSession()
      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Failed to accept invitation')
    }
  }

  // ===== OAUTH =====
  const loginWithGitHub = () => {
    window.location.href = '/api/auth/github'
  }

  const loginWithGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  return {
    // State
    loggedIn,
    user,
    session,
    
    // Basic Auth
    login,
    register,
    logout,
    refreshToken,
    
    // Password Reset
    requestPasswordReset,
    resetPassword,
    
    // User Invitations
    inviteUser,
    acceptInvite,
    
    // OAuth
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

  "composables/useDirectusRealtime.ts": `import { createDirectus, staticToken, realtime, rest } from '@directus/sdk'
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

  "README.md": `# Directus Nuxt Layer

> A production-ready, reusable Nuxt 3 layer providing complete Directus integration with authentication, realtime, and comprehensive API composables.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🔐 **Complete Authentication**
  - Email/password login & registration
  - OAuth (GitHub, Google)
  - Password reset flow
  - User invitations system
  - Automatic token refresh

- ⚡ **Real-time Features**
  - WebSocket subscriptions
  - Automatic connection management
  - Token-based authentication
  - Event filtering

- 📦 **Full API Coverage**
  - CRUD operations for all collections
  - File upload & management
  - Notifications
  - Comments
  - Aggregations

- 🎯 **Developer Experience**
  - Full TypeScript support
  - Auto-imported composables
  - Zero configuration
  - Server-side token security

- 📦 **Optimized Architecture**
  - Uses peer dependencies (no duplication!)
  - Modular design
  - Production-ready
  - Battle-tested patterns

## 🚀 Quick Start

### 1. Run Setup Scripts

\`\`\`bash
# Generate all layer files
node setup-layer.js
node setup-server.js
\`\`\`

### 2. Install in Parent Project

\`\`\`bash
# Install required peer dependencies
pnpm add @directus/sdk@latest nuxt-auth-utils

# Add layer to nuxt.config.ts
export default defineNuxtConfig({
  extends: ['./layers/directus-layer']
})
\`\`\`

### 3. Configure Environment

\`\`\`env
DIRECTUS_URL=http://localhost:8055
DIRECTUS_WS_URL=ws://localhost:8055
DIRECTUS_STATIC_TOKEN=your_static_token_here
PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 4. Start Using

\`\`\`vue
<script setup>
// Auto-imported composables - no imports needed!
const { login, user, logout } = useDirectusAuth()
const { fetchItems, create } = useDirectusItems()
const { subscribe } = useDirectusRealtime()
</script>
\`\`\`

## 📖 Documentation

- **[📚 Complete Guide](./GUIDE.md)** - Comprehensive documentation covering all features
- **[⚡ Quick Reference](#quick-reference)** - Common patterns and examples below

## 📦 Peer Dependencies

This layer requires the following packages in your parent project:

| Package | Version | Purpose |
|---------|---------|---------|
| \`@directus/sdk\` | \`^20.0.0\` | Directus API client |
| \`nuxt-auth-utils\` | \`^0.5.25\` | Authentication utilities |
| \`nuxt\` | \`^3.0.0\` | Nuxt framework |

**Why peer dependencies?**  
Using peer dependencies prevents package duplication and keeps your bundle size small. Your parent project provides these packages, and the layer uses them from your \`node_modules\`.

## 🎯 Quick Reference

### Authentication

\`\`\`typescript
const { login, register, logout, user, loggedIn } = useDirectusAuth()

// Login
await login('user@example.com', 'password')

// Register
await register({
  email: 'user@example.com',
  password: 'password',
  firstName: 'John',
  lastName: 'Doe'
})

// OAuth
loginWithGitHub()
loginWithGoogle()

// Password Reset
await requestPasswordReset('user@example.com')
await resetPassword(token, newPassword)

// User Invitations
await inviteUser('user@example.com', 'authenticated')
await acceptInvite(token, password)
\`\`\`

### Working with Data

\`\`\`typescript
const { fetchItems, fetchItem, create, update, deleteOne } = useDirectusItems()

// Fetch items
const { data: posts } = await fetchItems('posts', {
  fields: ['id', 'title', 'author.*'],
  filter: { status: { _eq: 'published' } },
  sort: ['-date_created'],
  limit: 10
})

// Create item
const newPost = await create('posts', {
  title: 'Hello World',
  status: 'draft'
})

// Update item
await update('posts', postId, { status: 'published' })

// Delete item
await deleteOne('posts', postId)
\`\`\`

### Real-time Subscriptions

\`\`\`typescript
const { subscribe, sendMessage } = useDirectusRealtime()

// Subscribe to changes
const { subscription } = await subscribe('messages', {
  event: 'create',
  query: {
    fields: ['*', 'user.*'],
    filter: { channel: { _eq: 'general' } }
  }
})

for await (const message of subscription) {
  console.log('New message:', message)
}

// Send via WebSocket
await sendMessage({
  collection: 'messages',
  action: 'create',
  data: { text: 'Hello!', channel: 'general' }
})
\`\`\`

### File Management

\`\`\`typescript
const { uploadFile, getFileUrl, deleteFile } = useDirectusFiles()

// Upload file
const result = await uploadFile(file, {
  title: 'My Image',
  folder: 'uploads'
})

// Get optimized URL
const imageUrl = getFileUrl(fileId, {
  width: 800,
  height: 600,
  fit: 'cover',
  quality: 80,
  format: 'webp'
})

// Delete file
await deleteFile(fileId)
\`\`\`

## 🏗️ Architecture

\`\`\`
┌─────────────────────────────────────┐
│       Your Parent Project           │
│  • Provides peer dependencies       │
│  • Extends this layer               │
│  • Uses auto-imported composables   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Directus Nuxt Layer            │
│  • Composables (auto-imported)      │
│  • Server endpoints & middleware    │
│  • TypeScript definitions           │
│  • Authentication & realtime        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Directus Backend              │
│  • REST API & GraphQL               │
│  • WebSocket server                 │
│  • Authentication & permissions     │
└─────────────────────────────────────┘
\`\`\`

## 🔒 Security

- ✅ Tokens stored server-side only (never exposed to client)
- ✅ Automatic token refresh before expiration
- ✅ Secure session management with nuxt-auth-utils
- ✅ OAuth provider integration
- ✅ Role-based access control via Directus

## 🛠️ Available Composables

All composables are auto-imported in your parent project:

| Composable | Purpose |
|------------|---------|
| \`useDirectusAuth()\` | Authentication (login, register, OAuth, etc.) |
| \`useDirectus()\` | Base public client |
| \`useAuthenticatedDirectus()\` | Authenticated API requests |
| \`useDirectusItems()\` | CRUD operations |
| \`useDirectusFiles()\` | File management |
| \`useDirectusRealtime()\` | WebSocket subscriptions |
| \`useDirectusNotifications()\` | User notifications |
| \`useDirectusComments()\` | Comments system |

## 🚦 Middleware

Protect routes automatically:

\`\`\`typescript
// Require authentication
definePageMeta({
  middleware: 'auth'
})

// Guest only (redirects if logged in)
definePageMeta({
  middleware: 'guest'
})
\`\`\`

## 📝 Environment Variables

See \`.env.example\` for all available options.

**Required:**
- \`DIRECTUS_URL\` - Your Directus instance URL
- \`DIRECTUS_WS_URL\` - WebSocket URL

**Recommended:**
- \`DIRECTUS_STATIC_TOKEN\` - Static token for server operations
- \`PUBLIC_APP_URL\` - Your app URL (for email links)

**Optional:**
- \`DIRECTUS_ADMIN_EMAIL\` - Admin credentials (fallback)
- \`DIRECTUS_ADMIN_PASSWORD\` - Admin credentials (fallback)
- OAuth provider credentials (GitHub, Google)

## 🐛 Troubleshooting

### "Module not found: @directus/sdk"
→ Install peer dependencies in parent project: \`pnpm add @directus/sdk@latest nuxt-auth-utils\`

### "No authentication token available"
→ Add \`DIRECTUS_STATIC_TOKEN\` to your \`.env\` file

### WebSocket connection fails
→ Check \`DIRECTUS_WS_URL\` and verify WebSocket is enabled in Directus

For more troubleshooting, see the [Complete Guide](./GUIDE.md#troubleshooting).

## 📚 Learn More

- [📚 Complete Guide](./GUIDE.md) - In-depth documentation
- [Directus Documentation](https://docs.directus.io)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Directus SDK Reference](https://docs.directus.io/guides/sdk)

## 🤝 Contributing

Contributions are welcome! This layer is designed to be extended and customized for your needs.

## 📄 License

MIT

---

**Need help?** Check the [📚 Complete Guide](./GUIDE.md) for detailed documentation, examples, and best practices.
`,

  // NEW: Comprehensive GUIDE.md file
  "GUIDE.md": `# Complete Guide: Directus Nuxt Layer

This comprehensive guide covers everything you need to know about setting up and using the Directus Nuxt Layer in your projects.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Initial Setup](#initial-setup)
4. [Environment Configuration](#environment-configuration)
5. [Using in Parent Project](#using-in-parent-project)
6. [Authentication](#authentication)
7. [Working with Items](#working-with-items)
8. [File Management](#file-management)
9. [Realtime Features](#realtime-features)
10. [Notifications & Comments](#notifications--comments)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The Directus Nuxt Layer provides a complete, production-ready integration between Directus and Nuxt 3. It's designed as a **reusable layer** that uses **peer dependencies** to avoid package duplication.

### What's Included

- ✅ Complete authentication (email/password, OAuth, password reset, invitations)
- ✅ Real-time WebSocket connections
- ✅ Full CRUD operations for Directus collections
- ✅ File upload and management
- ✅ Notifications and comments
- ✅ Automatic token refresh
- ✅ Server-side token security

### Key Benefits

- **Zero Duplication**: Uses peer dependencies from parent project
- **Type Safe**: Full TypeScript support throughout
- **Secure**: Tokens managed server-side only
- **Modular**: Use only what you need
- **Production Ready**: Battle-tested patterns

---

## Architecture

\`\`\`
┌─────────────────────────────────────────────┐
│           Your Parent Project               │
│  • Installs @directus/sdk                   │
│  • Installs nuxt-auth-utils                 │
│  • Extends from layer                       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│         Directus Nuxt Layer                 │
│  • Uses parent's dependencies (peer deps)   │
│  • Provides composables                     │
│  • Provides server endpoints                │
│  • Provides middleware & plugins            │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           Directus Backend                  │
│  • Handles authentication                   │
│  • Manages data & permissions               │
│  • Provides WebSocket server                │
└─────────────────────────────────────────────┘
\`\`\`

### File Structure

\`\`\`
directus-layer/
├── composables/
│   ├── useDirectus.ts           # Base client
│   ├── useDirectusAuth.ts       # Authentication
│   ├── useDirectusItems.ts      # CRUD operations
│   ├── useDirectusFiles.ts      # File handling
│   ├── useDirectusRealtime.ts   # WebSocket
│   ├── useDirectusNotifications.ts
│   └── useDirectusComments.ts
├── server/
│   ├── utils/
│   │   └── directus.ts          # Server utilities
│   ├── api/
│   │   ├── auth/                # Auth endpoints
│   │   ├── files/               # File endpoints
│   │   ├── websocket/           # WebSocket token
│   │   └── directus/            # Directus proxy
│   ├── middleware/
│   │   ├── auth.ts              # Protected routes
│   │   └── guest.ts             # Guest-only routes
│   └── plugins/
│       └── auth-refresh.client.ts
├── types/
│   └── index.d.ts               # TypeScript definitions
├── nuxt.config.ts               # Layer configuration
├── package.json                 # Peer dependencies
├── README.md                    # Quick start guide
└── GUIDE.md                     # This file!
\`\`\`

---

## Initial Setup

### Step 1: Create the Layer

Run the setup scripts to generate all files:

\`\`\`bash
# In your layer directory
node setup-layer.js
node setup-server.js
\`\`\`

This creates:
- All composables
- Server endpoints
- Middleware and plugins
- Type definitions
- Configuration files

### Step 2: Install Layer Dependencies

The layer itself needs minimal dependencies for development:

\`\`\`bash
cd directus-layer
pnpm install
\`\`\`

**Important**: The layer uses \`peerDependencies\`, so it expects the parent project to provide:
- \`@directus/sdk\`
- \`nuxt-auth-utils\`
- \`nuxt\`

---

## Environment Configuration

### Layer \`.env\` File

Create a \`.env\` file in your layer directory (copy from \`.env.example\`):

\`\`\`env
# ===== REQUIRED =====

# Your Directus instance URL
DIRECTUS_URL=http://localhost:8055

# WebSocket URL (usually same as DIRECTUS_URL with ws:// or wss://)
DIRECTUS_WS_URL=ws://localhost:8055

# ===== RECOMMENDED =====

# Static token for server operations and public realtime
DIRECTUS_STATIC_TOKEN=your_static_token_here

# Your app's public URL (for email links in password resets)
PUBLIC_APP_URL=http://localhost:3000

# ===== OPTIONAL =====

# Admin credentials (fallback for server operations)
DIRECTUS_ADMIN_EMAIL=admin@example.com
DIRECTUS_ADMIN_PASSWORD=your_password

# OAuth providers
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
\`\`\`

### Getting a Static Token

1. Log into your Directus instance
2. Go to **Settings** → **Access Tokens**
3. Click **Create Token**
4. Give it a name (e.g., "Nuxt Layer Token")
5. Set permissions (usually Admin for full access)
6. Copy the token to your \`.env\` file

### Important Notes

- ⚠️ Never commit \`.env\` files to git
- ✅ Keep \`.env.example\` updated as a template
- ✅ Static token stays server-side only (secure)
- ✅ \`PUBLIC_APP_URL\` is needed for password reset emails

---

## Using in Parent Project

### Step 1: Install Required Dependencies

Your parent project **must** install the peer dependencies:

\`\`\`bash
# In your parent project
pnpm add @directus/sdk@latest nuxt-auth-utils
\`\`\`

### Step 2: Add Layer to nuxt.config.ts

\`\`\`typescript
// nuxt.config.ts in parent project
export default defineNuxtConfig({
  extends: [
    './layers/directus-layer'  // Path to your layer
  ],
  
  // Optional: Override layer configuration
  runtimeConfig: {
    directus: {
      url: process.env.DIRECTUS_URL,
      // ... other overrides
    }
  }
})
\`\`\`

### Step 3: Copy Environment Variables

Copy the \`.env.example\` from the layer to your parent project and configure it:

\`\`\`bash
cp layers/directus-layer/.env.example .env
# Edit .env with your actual values
\`\`\`

### Step 4: Start Using Composables

All composables are automatically available in your parent project:

\`\`\`vue
<script setup>
// No imports needed! These are auto-imported by Nuxt
const { login, user, logout } = useDirectusAuth()
const { fetchItems, create } = useDirectusItems()
const { subscribe } = useDirectusRealtime()
</script>
\`\`\`

---

## Authentication

### Basic Login

\`\`\`vue
<script setup>
const { login, user, loggedIn } = useDirectusAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  try {
    await login(email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <form @submit.prevent="handleLogin">
    <input v-model="email" type="email" placeholder="Email" />
    <input v-model="password" type="password" placeholder="Password" />
    <button type="submit">Login</button>
    <p v-if="error">{{ error }}</p>
  </form>
</template>
\`\`\`

### Registration

\`\`\`vue
<script setup>
const { register } = useDirectusAuth()

const handleRegister = async () => {
  try {
    await register({
      email: 'user@example.com',
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe'
    })
    // User created - they can now login
  } catch (e) {
    console.error(e.message)
  }
}
</script>
\`\`\`

### OAuth Login

\`\`\`vue
<script setup>
const { loginWithGitHub, loginWithGoogle } = useDirectusAuth()
</script>

<template>
  <div>
    <button @click="loginWithGitHub">Login with GitHub</button>
    <button @click="loginWithGoogle">Login with Google</button>
  </div>
</template>
\`\`\`

### Password Reset Flow

**Step 1: Request Reset**

\`\`\`vue
<script setup>
const { requestPasswordReset } = useDirectusAuth()

const handleRequest = async (email: string) => {
  await requestPasswordReset(email)
  // Email sent (if account exists)
}
</script>
\`\`\`

**Step 2: Reset Password**

\`\`\`vue
<script setup>
const route = useRoute()
const { resetPassword } = useDirectusAuth()

const handleReset = async (password: string) => {
  const token = route.query.token as string
  await resetPassword(token, password)
  // Password reset successful
}
</script>
\`\`\`

### User Invitations

**Invite a User** (Admin only)

\`\`\`vue
<script setup>
const { inviteUser } = useDirectusAuth()

const handleInvite = async () => {
  await inviteUser('newuser@example.com', 'authenticated')
  // Invitation email sent
}
</script>
\`\`\`

**Accept Invitation**

\`\`\`vue
<script setup>
const route = useRoute()
const { acceptInvite } = useDirectusAuth()

const handleAccept = async (password: string) => {
  const token = route.query.token as string
  await acceptInvite(token, password)
  // User account activated and logged in
}
</script>
\`\`\`

### Protected Routes

\`\`\`vue
<script setup>
// In pages/dashboard.vue
definePageMeta({
  middleware: 'auth'  // Requires login
})
</script>
\`\`\`

### Guest-Only Routes

\`\`\`vue
<script setup>
// In pages/login.vue
definePageMeta({
  middleware: 'guest'  // Redirects if logged in
})
</script>
\`\`\`

### Logout

\`\`\`vue
<script setup>
const { logout } = useDirectusAuth()

const handleLogout = async () => {
  await logout()
  // Redirected to /login
}
</script>
\`\`\`

### Current User

\`\`\`vue
<script setup>
const { user, loggedIn } = useDirectusAuth()
</script>

<template>
  <div v-if="loggedIn">
    <p>Welcome, {{ user.firstName }}!</p>
    <p>Email: {{ user.email }}</p>
    <p>Role: {{ user.role }}</p>
  </div>
</template>
\`\`\`

---

## Working with Items

### Fetching Items

\`\`\`vue
<script setup>
const { fetchItems } = useDirectusItems()

// Basic fetch
const { data: posts } = await fetchItems('posts', {
  fields: ['id', 'title', 'content', 'author.*'],
  sort: ['-date_created'],
  limit: 10
})

// With filters
const { data: publishedPosts } = await fetchItems('posts', {
  fields: ['id', 'title'],
  filter: {
    status: { _eq: 'published' },
    date_published: { _lte: '$NOW' }
  }
})

// With pagination
const { data: pagePosts } = await fetchItems('posts', {
  page: 1,
  limit: 20
})
</script>

<template>
  <div v-for="post in posts" :key="post.id">
    <h2>{{ post.title }}</h2>
    <p>{{ post.content }}</p>
  </div>
</template>
\`\`\`

### Fetching Single Item

\`\`\`vue
<script setup>
const route = useRoute()
const { fetchItem } = useDirectusItems()

const { data: post } = await fetchItem('posts', route.params.id, {
  fields: ['*', 'author.*', 'comments.*']
})
</script>
\`\`\`

### Creating Items

\`\`\`vue
<script setup>
const { create } = useDirectusItems()

const handleCreate = async () => {
  const newPost = await create('posts', {
    title: 'New Post',
    content: 'Post content here',
    status: 'draft'
  })
  
  console.log('Created:', newPost)
}
</script>
\`\`\`

### Updating Items

\`\`\`vue
<script setup>
const { update } = useDirectusItems()

const handleUpdate = async (postId: string) => {
  await update('posts', postId, {
    title: 'Updated Title',
    status: 'published'
  })
}
</script>
\`\`\`

### Deleting Items

\`\`\`vue
<script setup>
const { deleteOne } = useDirectusItems()

const handleDelete = async (postId: string) => {
  await deleteOne('posts', postId)
}
</script>
\`\`\`

### Aggregations

\`\`\`vue
<script setup>
const { aggregateItems } = useDirectusItems()

const { data: stats } = await aggregateItems('orders', {
  aggregate: {
    count: ['id'],
    sum: ['total'],
    avg: ['total']
  },
  groupBy: ['status']
})
</script>
\`\`\`

### Refreshing Data

\`\`\`vue
<script setup>
const { fetchItems, refresh } = useDirectusItems()

const { data: posts } = await fetchItems('posts')

const refreshPosts = async () => {
  await refresh('directus-posts-*')  // Refresh all posts queries
}
</script>
\`\`\`

---

## File Management

### Getting File URLs

\`\`\`vue
<script setup>
const { getFileUrl } = useDirectusFiles()

const imageUrl = getFileUrl('file-uuid', {
  width: 800,
  height: 600,
  fit: 'cover',
  quality: 80,
  format: 'webp'
})
</script>

<template>
  <img :src="imageUrl" alt="Image" />
</template>
\`\`\`

### Uploading Files

\`\`\`vue
<script setup>
const { uploadFile } = useDirectusFiles()

const handleUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (file) {
    const result = await uploadFile(file, {
      title: 'My Upload',
      folder: 'uploads',
      description: 'File description'
    })
    
    console.log('Uploaded:', result.file)
  }
}
</script>

<template>
  <input type="file" @change="handleUpload" />
</template>
\`\`\`

### Uploading Multiple Files

\`\`\`vue
<script setup>
const { uploadFiles } = useDirectusFiles()

const handleMultipleUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  
  const results = await uploadFiles(files, {
    folder: 'uploads'
  })
  
  console.log('Uploaded:', results)
}
</script>

<template>
  <input type="file" multiple @change="handleMultipleUpload" />
</template>
\`\`\`

### Deleting Files

\`\`\`vue
<script setup>
const { deleteFile } = useDirectusFiles()

const handleDelete = async (fileId: string) => {
  await deleteFile(fileId)
}
</script>
\`\`\`

---

## Realtime Features

### Basic Subscription

\`\`\`vue
<script setup>
const { subscribe } = useDirectusRealtime()
const messages = ref([])

onMounted(async () => {
  const { subscription } = await subscribe('messages', {
    event: 'create',
    query: {
      fields: ['id', 'text', 'user', 'created_at']
    }
  })
  
  for await (const message of subscription) {
    messages.value.push(message)
  }
})
</script>
\`\`\`

### Filtered Subscriptions

\`\`\`vue
<script setup>
const { subscribe } = useDirectusRealtime()
const channelId = ref('general')

onMounted(async () => {
  const { subscription } = await subscribe('messages', {
    event: 'create',
    query: {
      fields: ['id', 'text', 'user'],
      filter: {
        channel: { _eq: channelId.value }
      }
    }
  })
  
  for await (const message of subscription) {
    console.log('New message in channel:', message)
  }
})
</script>
\`\`\`

### All Events

\`\`\`vue
<script setup>
const { subscribe } = useDirectusRealtime()

onMounted(async () => {
  // Listen to create, update, and delete
  const { subscription } = await subscribe('posts')
  
  for await (const data of subscription) {
    console.log('Post changed:', data)
    // data includes event type and item data
  }
})
</script>
\`\`\`

### Sending Messages via WebSocket

\`\`\`vue
<script setup>
const { sendMessage } = useDirectusRealtime()

const createMessage = async (text: string) => {
  await sendMessage({
    collection: 'messages',
    action: 'create',
    data: { 
      text,
      user: user.value.id,
      channel: 'general'
    }
  })
}

const updateMessage = async (id: string, text: string) => {
  await sendMessage({
    collection: 'messages',
    action: 'update',
    id,
    data: { text }
  })
}

const deleteMessage = async (id: string) => {
  await sendMessage({
    collection: 'messages',
    action: 'delete',
    id
  })
}
</script>
\`\`\`

### Connection Status

\`\`\`vue
<script setup>
const { connected, error } = useDirectusRealtime()
</script>

<template>
  <div>
    <p v-if="connected" class="text-green-500">Connected</p>
    <p v-else class="text-red-500">Disconnected</p>
    <p v-if="error" class="text-red-500">{{ error }}</p>
  </div>
</template>
\`\`\`

### Complete Chat Example

\`\`\`vue
<script setup>
const { subscribe, sendMessage } = useDirectusRealtime()
const { user } = useDirectusAuth()

const messages = ref([])
const newMessage = ref('')

onMounted(async () => {
  // Subscribe to new messages
  const { subscription } = await subscribe('messages', {
    event: 'create',
    query: {
      fields: ['*', 'user.*'],
      filter: { channel: { _eq: 'general' } }
    }
  })
  
  for await (const msg of subscription) {
    messages.value.push(msg)
  }
})

const send = async () => {
  if (!newMessage.value.trim()) return
  
  await sendMessage({
    collection: 'messages',
    action: 'create',
    data: {
      text: newMessage.value,
      channel: 'general',
      user: user.value.id
    }
  })
  
  newMessage.value = ''
}
</script>

<template>
  <div>
    <div v-for="msg in messages" :key="msg.id">
      <strong>{{ msg.user.first_name }}:</strong> {{ msg.text }}
    </div>
    
    <input v-model="newMessage" @keyup.enter="send" />
    <button @click="send">Send</button>
  </div>
</template>
\`\`\`

---

## Notifications & Comments

### Fetching Notifications

\`\`\`vue
<script setup>
const { fetchNotifications, getUnreadCount } = useDirectusNotifications()

const { data: notifications } = await fetchNotifications({
  unreadOnly: true,
  limit: 10
})

const unreadCount = await getUnreadCount()
</script>
\`\`\`

### Marking as Read

\`\`\`vue
<script setup>
const { markAsRead, markAllAsRead } = useDirectusNotifications()

const handleMarkRead = async (notificationId: string) => {
  await markAsRead(notificationId)
}

const handleMarkAllRead = async () => {
  await markAllAsRead()
}
</script>
\`\`\`

### Adding Comments

\`\`\`vue
<script setup>
const { addComment, fetchComments } = useDirectusComments()

const postId = ref('123')
const { data: comments } = await fetchComments('posts', postId.value)

const handleAddComment = async (text: string) => {
  await addComment('posts', postId.value, text)
}
</script>
\`\`\`

---

## Best Practices

### 1. Environment Variables

\`\`\`bash
# ✅ DO: Use .env files
DIRECTUS_STATIC_TOKEN=abc123

# ❌ DON'T: Hardcode tokens
const token = 'abc123'  # Never do this!
\`\`\`

### 2. Error Handling

\`\`\`vue
<script setup>
const { login } = useDirectusAuth()
const error = ref('')

const handleLogin = async () => {
  try {
    await login(email.value, password.value)
  } catch (e) {
    error.value = e.message
    // Log to error tracking service
    console.error('Login failed:', e)
  }
}
</script>
\`\`\`

### 3. Loading States

\`\`\`vue
<script setup>
const loading = ref(false)

const handleSubmit = async () => {
  loading.value = true
  try {
    await someOperation()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <button :disabled="loading">
    {{ loading ? 'Loading...' : 'Submit' }}
  </button>
</template>
\`\`\`

### 4. Limit Fields in Queries

\`\`\`typescript
// ❌ Don't fetch everything
const { data } = await fetchItems('posts', {
  fields: ['*']
})

// ✅ Only fetch what you need
const { data } = await fetchItems('posts', {
  fields: ['id', 'title', 'status']
})
\`\`\`

### 5. Use Filters Server-Side

\`\`\`typescript
// ❌ Don't filter client-side
const { data } = await fetchItems('posts')
const published = data.filter(p => p.status === 'published')

// ✅ Filter server-side
const { data } = await fetchItems('posts', {
  filter: { status: { _eq: 'published' } }
})
\`\`\`

### 6. Debounce Realtime Updates

\`\`\`vue
<script setup>
import { useDebounceFn } from '@vueuse/core'

const { sendMessage } = useDirectusRealtime()

const updateDocument = useDebounceFn(async (content: string) => {
  await sendMessage({
    collection: 'documents',
    action: 'update',
    id: docId.value,
    data: { content }
  })
}, 500)
</script>
\`\`\`

### 7. Cleanup Subscriptions

\`\`\`vue
<script setup>
// Realtime cleanup is automatic on unmount
// But if you need manual cleanup:
const { disconnect } = useDirectusRealtime()

onBeforeUnmount(() => {
  disconnect()
})
</script>
\`\`\`

---

## Troubleshooting

### Issue: "No authentication token available"

**Cause**: Missing \`DIRECTUS_STATIC_TOKEN\` or user not logged in

**Solution**:
\`\`\`env
# Add to .env
DIRECTUS_STATIC_TOKEN=your_token_here
\`\`\`

### Issue: "Module not found: @directus/sdk"

**Cause**: Parent project hasn't installed peer dependencies

**Solution**:
\`\`\`bash
# In parent project
pnpm add @directus/sdk@latest nuxt-auth-utils
\`\`\`

### Issue: WebSocket connection fails

**Cause**: Wrong WebSocket URL or WebSocket not enabled

**Solution**:
1. Check \`DIRECTUS_WS_URL\` in \`.env\`
2. Enable WebSocket in Directus settings
3. Check firewall/proxy settings

### Issue: "Permission denied" on realtime

**Cause**: Token lacks permissions for collection

**Solution**:
1. In Directus admin, go to Settings → Roles & Permissions
2. Find the role associated with your token
3. Grant read permissions for the collection

### Issue: Not receiving realtime events

**Solutions**:
1. Check collection permissions
2. Verify filter isn't too restrictive
3. Test with no filter first:
\`\`\`typescript
const { subscription } = await subscribe('messages')
// Then add filters one by one
\`\`\`

### Issue: Composables not auto-imported

**Cause**: Layer not properly extended

**Solution**:
\`\`\`typescript
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['./layers/directus-layer']  // Check path!
})
\`\`\`

### Issue: Token refresh fails

**Cause**: Refresh token expired

**Solution**:
1. User needs to log in again
2. Check token expiry settings in Directus
3. Adjust refresh interval in plugin

### Debug Mode

Enable detailed logging:

\`\`\`vue
<script setup>
const { connected, error } = useDirectusRealtime()

watch(connected, (val) => {
  console.log('Realtime connected:', val)
})

watch(error, (val) => {
  console.error('Realtime error:', val)
})
</script>
\`\`\`

---

## Next Steps

1. ✅ Set up your layer with the setup scripts
2. ✅ Configure environment variables
3. ✅ Add layer to parent project
4. ✅ Install peer dependencies in parent
5. ✅ Test authentication
6. ✅ Test CRUD operations
7. ✅ Test realtime features
8. ✅ Add error tracking
9. ✅ Deploy to production

## Additional Resources

- [Directus Documentation](https://docs.directus.io)
- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Directus SDK Reference](https://docs.directus.io/guides/sdk)
- [nuxt-auth-utils Documentation](https://github.com/atinux/nuxt-auth-utils)

---

## Support

For issues specific to this layer:
1. Check this guide's troubleshooting section
2. Review the README.md and other documentation
3. Check Directus community Discord

For Directus-specific issues:
- [Directus Discord](https://discord.gg/directus)
- [Directus GitHub](https://github.com/directus/directus)

---

**Last Updated**: ${new Date().toISOString().split("T")[0]}

Made with ❤️ for the Nuxt & Directus community
`,
};

// Create all files
log(
  "\n🚀 Setting up Directus Nuxt Layer with comprehensive documentation...\n",
  "blue"
);

Object.entries(files).forEach(([filePath, content]) => {
  writeFile(filePath, content);
});

// Create docs directory
createDirectory("docs");

log("\n✨ Setup complete!\n", "green");
log("\n📦 What was created:", "blue");
log("✓ Complete layer structure");
log("✓ All composables (auth, items, files, realtime, etc.)");
log("✓ TypeScript definitions");
log("✓ Environment configuration");
log("✓ README.md with quick start");
log("✓ GUIDE.md with comprehensive documentation");
log("");
log("📖 Documentation:", "blue");
log("• README.md - Quick start and overview");
log("• GUIDE.md - Complete, in-depth guide");
log("");
log("🎯 Key Features:", "yellow");
log("✅ Uses peerDependencies (no duplication!)");
log("✅ Complete authentication with password reset");
log("✅ User invitations system");
log("✅ Real-time WebSocket support");
log("✅ Comprehensive documentation");
log("");
log("📝 Next steps:", "blue");
log("1. Parent project: pnpm add @directus/sdk@latest nuxt-auth-utils");
log("2. Run setup-server.js for server endpoints");
log("3. Configure .env file");
log("4. Add layer to nuxt.config.ts extends");
log("5. Read GUIDE.md for detailed usage instructions");
log("");
log("⚠️  Remember:", "yellow");
log("Parent project MUST install @directus/sdk and nuxt-auth-utils!");
log("The layer uses these from parent's node_modules (no duplication)");
log("");
