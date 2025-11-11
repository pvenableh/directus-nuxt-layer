# Complete Guide: Directus Nuxt Layer

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

```
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
```

### File Structure

```
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
```

---

## Initial Setup

This layer comes pre-configured with all necessary files and composables. Follow these steps to integrate it into your parent project.

### Requirements

Before using this layer, ensure you have:
- Node.js 18+ installed
- A Nuxt 3 project
- A Directus instance (local or hosted)

### Step 1: Verify Layer Structure

Your layer directory should contain:

```
directus-layer/
├── composables/          # Auto-imported composables
├── server/              # API endpoints & middleware
├── middleware/          # Route protection
├── plugins/             # Auto-refresh plugin
├── types/               # TypeScript definitions
├── nuxt.config.ts       # Layer configuration
├── package.json         # Peer dependencies
├── .env.example         # Environment template
├── README.md           # This file
└── GUIDE.md            # Complete guide
```

### Step 2: Install Layer Dependencies

The layer uses peer dependencies to avoid duplication. First, install the layer's dev dependencies:

```bash
cd directus-layer
pnpm install
```

This installs minimal development dependencies for the layer itself.

---

## Environment Configuration

### Layer `.env` File

Create a `.env` file in your layer directory (copy from `.env.example`):

```env
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
```

### Getting a Static Token

1. Log into your Directus instance
2. Go to **Settings** → **Access Tokens**
3. Click **Create Token**
4. Give it a name (e.g., "Nuxt Layer Token")
5. Set permissions (usually Admin for full access)
6. Copy the token to your `.env` file

### Important Notes

- ⚠️ Never commit `.env` files to git
- ✅ Keep `.env.example` updated as a template
- ✅ Static token stays server-side only (secure)
- ✅ `PUBLIC_APP_URL` is needed for password reset emails

---

## Using in Parent Project

### Step 1: Install Required Dependencies

Your parent project **must** install the peer dependencies:

```bash
# In your parent project
pnpm add @directus/sdk@latest nuxt-auth-utils
```

### Step 2: Add Layer to nuxt.config.ts

```typescript
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
```

### Step 3: Copy Environment Variables

Copy the `.env.example` from the layer to your parent project and configure it:

```bash
cp layers/directus-layer/.env.example .env
# Edit .env with your actual values
```

### Step 4: Start Using Composables

All composables are automatically available in your parent project:

```vue
<script setup>
// No imports needed! These are auto-imported by Nuxt
const { login, user, logout } = useDirectusAuth()
const { fetchItems, create } = useDirectusItems()
const { subscribe } = useDirectusRealtime()
</script>
```

---

## Authentication

### Basic Login

```vue
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
```

### Registration

```vue
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
```

### OAuth Login

```vue
<script setup>
const { loginWithGitHub, loginWithGoogle } = useDirectusAuth()
</script>

<template>
  <div>
    <button @click="loginWithGitHub">Login with GitHub</button>
    <button @click="loginWithGoogle">Login with Google</button>
  </div>
</template>
```

### Password Reset Flow

**Step 1: Request Reset**

```vue
<script setup>
const { requestPasswordReset } = useDirectusAuth()

const handleRequest = async (email: string) => {
  await requestPasswordReset(email)
  // Email sent (if account exists)
}
</script>
```

**Step 2: Reset Password**

```vue
<script setup>
const route = useRoute()
const { resetPassword } = useDirectusAuth()

const handleReset = async (password: string) => {
  const token = route.query.token as string
  await resetPassword(token, password)
  // Password reset successful
}
</script>
```

### User Invitations

**Invite a User** (Admin only)

```vue
<script setup>
const { inviteUser } = useDirectusAuth()

const handleInvite = async () => {
  await inviteUser('newuser@example.com', 'authenticated')
  // Invitation email sent
}
</script>
```

**Accept Invitation**

```vue
<script setup>
const route = useRoute()
const { acceptInvite } = useDirectusAuth()

const handleAccept = async (password: string) => {
  const token = route.query.token as string
  await acceptInvite(token, password)
  // User account activated and logged in
}
</script>
```

### Protected Routes

```vue
<script setup>
// In pages/dashboard.vue
definePageMeta({
  middleware: 'auth'  // Requires login
})
</script>
```

### Guest-Only Routes

```vue
<script setup>
// In pages/login.vue
definePageMeta({
  middleware: 'guest'  // Redirects if logged in
})
</script>
```

### Logout

```vue
<script setup>
const { logout } = useDirectusAuth()

const handleLogout = async () => {
  await logout()
  // Redirected to /login
}
</script>
```

### Current User

```vue
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
```

---

## Working with Items

### Fetching Items

```vue
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
```

### Fetching Single Item

```vue
<script setup>
const route = useRoute()
const { fetchItem } = useDirectusItems()

const { data: post } = await fetchItem('posts', route.params.id, {
  fields: ['*', 'author.*', 'comments.*']
})
</script>
```

### Creating Items

```vue
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
```

### Updating Items

```vue
<script setup>
const { update } = useDirectusItems()

const handleUpdate = async (postId: string) => {
  await update('posts', postId, {
    title: 'Updated Title',
    status: 'published'
  })
}
</script>
```

### Deleting Items

```vue
<script setup>
const { deleteOne } = useDirectusItems()

const handleDelete = async (postId: string) => {
  await deleteOne('posts', postId)
}
</script>
```

### Aggregations

```vue
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
```

### Refreshing Data

```vue
<script setup>
const { fetchItems, refresh } = useDirectusItems()

const { data: posts } = await fetchItems('posts')

const refreshPosts = async () => {
  await refresh('directus-posts-*')  // Refresh all posts queries
}
</script>
```

---

## File Management

### Getting File URLs

```vue
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
```

### Uploading Files

```vue
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
```

### Uploading Multiple Files

```vue
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
```

### Deleting Files

```vue
<script setup>
const { deleteFile } = useDirectusFiles()

const handleDelete = async (fileId: string) => {
  await deleteFile(fileId)
}
</script>
```

---

## Realtime Features

### Basic Subscription

```vue
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
```

### Filtered Subscriptions

```vue
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
```

### All Events

```vue
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
```

### Sending Messages via WebSocket

```vue
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
```

### Connection Status

```vue
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
```

### Complete Chat Example

```vue
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
```

---

## Notifications & Comments

### Fetching Notifications

```vue
<script setup>
const { fetchNotifications, getUnreadCount } = useDirectusNotifications()

const { data: notifications } = await fetchNotifications({
  unreadOnly: true,
  limit: 10
})

const unreadCount = await getUnreadCount()
</script>
```

### Marking as Read

```vue
<script setup>
const { markAsRead, markAllAsRead } = useDirectusNotifications()

const handleMarkRead = async (notificationId: string) => {
  await markAsRead(notificationId)
}

const handleMarkAllRead = async () => {
  await markAllAsRead()
}
</script>
```

### Adding Comments

```vue
<script setup>
const { addComment, fetchComments } = useDirectusComments()

const postId = ref('123')
const { data: comments } = await fetchComments('posts', postId.value)

const handleAddComment = async (text: string) => {
  await addComment('posts', postId.value, text)
}
</script>
```

---

## Best Practices

### 1. Environment Variables

```bash
# ✅ DO: Use .env files
DIRECTUS_STATIC_TOKEN=abc123

# ❌ DON'T: Hardcode tokens
const token = 'abc123'  # Never do this!
```

### 2. Error Handling

```vue
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
```

### 3. Loading States

```vue
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
```

### 4. Limit Fields in Queries

```typescript
// ❌ Don't fetch everything
const { data } = await fetchItems('posts', {
  fields: ['*']
})

// ✅ Only fetch what you need
const { data } = await fetchItems('posts', {
  fields: ['id', 'title', 'status']
})
```

### 5. Use Filters Server-Side

```typescript
// ❌ Don't filter client-side
const { data } = await fetchItems('posts')
const published = data.filter(p => p.status === 'published')

// ✅ Filter server-side
const { data } = await fetchItems('posts', {
  filter: { status: { _eq: 'published' } }
})
```

### 6. Debounce Realtime Updates

```vue
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
```

### 7. Cleanup Subscriptions

```vue
<script setup>
// Realtime cleanup is automatic on unmount
// But if you need manual cleanup:
const { disconnect } = useDirectusRealtime()

onBeforeUnmount(() => {
  disconnect()
})
</script>
```

---

## Troubleshooting

### Issue: "No authentication token available"

**Cause**: Missing `DIRECTUS_STATIC_TOKEN` or user not logged in

**Solution**:
```env
# Add to .env
DIRECTUS_STATIC_TOKEN=your_token_here
```

### Issue: "Module not found: @directus/sdk"

**Cause**: Parent project hasn't installed peer dependencies

**Solution**:
```bash
# In parent project
pnpm add @directus/sdk@latest nuxt-auth-utils
```

### Issue: WebSocket connection fails

**Cause**: Wrong WebSocket URL or WebSocket not enabled

**Solution**:
1. Check `DIRECTUS_WS_URL` in `.env`
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
```typescript
const { subscription } = await subscribe('messages')
// Then add filters one by one
```

### Issue: Composables not auto-imported

**Cause**: Layer not properly extended

**Solution**:
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['./layers/directus-layer']  // Check path!
})
```

### Issue: Token refresh fails

**Cause**: Refresh token expired

**Solution**:
1. User needs to log in again
2. Check token expiry settings in Directus
3. Adjust refresh interval in plugin

### Debug Mode

Enable detailed logging:

```vue
<script setup>
const { connected, error } = useDirectusRealtime()

watch(connected, (val) => {
  console.log('Realtime connected:', val)
})

watch(error, (val) => {
  console.error('Realtime error:', val)
})
</script>
```

---

## Next Steps

1. ✅ Configure environment variables
2. ✅ Add layer to parent project
3. ✅ Install peer dependencies in parent
4. ✅ Test authentication
5. ✅ Test CRUD operations
6. ✅ Test realtime features
7. ✅ Add error tracking
8. ✅ Deploy to production

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

**Last Updated**: 2025-11-11

Made with ❤️ for the Nuxt & Directus community
