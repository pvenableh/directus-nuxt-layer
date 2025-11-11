# Directus Nuxt Layer

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

### 1. Install in Parent Project

```bash
# Install required peer dependencies
pnpm add @directus/sdk@latest nuxt-auth-utils

# Add layer to nuxt.config.ts
export default defineNuxtConfig({
  extends: ['./layers/directus-layer']
})
```

### 2. Configure Environment

```env
DIRECTUS_URL=http://localhost:8055
DIRECTUS_WS_URL=ws://localhost:8055
DIRECTUS_STATIC_TOKEN=your_static_token_here
PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start Using

```vue
<script setup>
// Auto-imported composables - no imports needed!
const { login, user, logout } = useDirectusAuth()
const { fetchItems, create } = useDirectusItems()
const { subscribe } = useDirectusRealtime()
</script>
```

## 📖 Documentation

- **[📚 Complete Guide](./GUIDE.md)** - Comprehensive documentation covering all features
- **[⚡ Quick Reference](#quick-reference)** - Common patterns and examples below

## 📦 Peer Dependencies

This layer requires the following packages in your parent project:

| Package | Version | Purpose |
|---------|---------|---------|
| `@directus/sdk` | `^20.0.0` | Directus API client |
| `nuxt-auth-utils` | `^0.5.25` | Authentication utilities |
| `nuxt` | `^3.0.0` | Nuxt framework |

**Why peer dependencies?**  
Using peer dependencies prevents package duplication and keeps your bundle size small. Your parent project provides these packages, and the layer uses them from your `node_modules`.

## Quick Reference 🎯

### Authentication

```typescript
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
```

### Working with Data

```typescript
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
```

### Real-time Subscriptions

```typescript
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
```

### File Management

```typescript
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
```

## 🏗️ Architecture

```
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
```

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
| `useDirectusAuth()` | Authentication (login, register, OAuth, etc.) |
| `useDirectus()` | Base public client |
| `useAuthenticatedDirectus()` | Authenticated API requests |
| `useDirectusItems()` | CRUD operations |
| `useDirectusFiles()` | File management |
| `useDirectusRealtime()` | WebSocket subscriptions |
| `useDirectusNotifications()` | User notifications |
| `useDirectusComments()` | Comments system |

## 🚦 Middleware

Protect routes automatically:

```typescript
// Require authentication
definePageMeta({
  middleware: 'auth'
})

// Guest only (redirects if logged in)
definePageMeta({
  middleware: 'guest'
})
```

## 📝 Environment Variables

See `.env.example` for all available options.

**Required:**
- `DIRECTUS_URL` - Your Directus instance URL
- `DIRECTUS_WS_URL` - WebSocket URL

**Recommended:**
- `DIRECTUS_STATIC_TOKEN` - Static token for server operations
- `PUBLIC_APP_URL` - Your app URL (for email links)

**Optional:**
- `DIRECTUS_ADMIN_EMAIL` - Admin credentials (fallback)
- `DIRECTUS_ADMIN_PASSWORD` - Admin credentials (fallback)
- OAuth provider credentials (GitHub, Google)

## 🐛 Troubleshooting

### "Module not found: @directus/sdk"
→ Install peer dependencies in parent project: `pnpm add @directus/sdk@latest nuxt-auth-utils`

### "No authentication token available"
→ Add `DIRECTUS_STATIC_TOKEN` to your `.env` file

### WebSocket connection fails
→ Check `DIRECTUS_WS_URL` and verify WebSocket is enabled in Directus

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
