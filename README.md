# Directus Nuxt Layer

A production-ready Nuxt 3 layer providing complete Directus integration with authentication, CRUD operations, file management, real-time subscriptions, notifications, and comments.

## ✨ Features

- 🔐 **Authentication** - Email/password + OAuth (GitHub, Google)
- 📝 **CRUD Operations** - Full create, read, update, delete support
- 📁 **File Management** - Upload, transform, and manage files
- ⚡ **Real-time** - WebSocket subscriptions for live updates
- 🔔 **Notifications** - Built-in notification system
- 💬 **Comments** - Activity/comment tracking
- 🎯 **TypeScript** - Full type safety with auto-generated types
- 🔄 **Auto-refresh** - Automatic token refresh handling
- 🛡️ **Secure** - Server-side session management

## 📦 Installation

```bash
# Using pnpm (recommended)
pnpm install github:pvenableh/directus-nuxt-layer

# Using npm
npm install git+https://github.com/pvenableh/directus-nuxt-layer.git

# Using yarn
yarn add git+https://github.com/pvenableh/directus-nuxt-layer.git
```

## 🚀 Quick Start

### 1. Extend the Layer

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['directus-nuxt-layer'],
  
  runtimeConfig: {
    directus: {
      url: process.env.DIRECTUS_URL,
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
    
    public: {
      directus: {
        url: process.env.DIRECTUS_URL,
        websocketUrl: process.env.DIRECTUS_WS_URL,
      }
    }
  },
})
```

### 2. Configure Environment

```bash
# .env
DIRECTUS_URL=http://localhost:8055
DIRECTUS_WS_URL=ws://localhost:8055
DIRECTUS_ADMIN_EMAIL=admin@example.com
DIRECTUS_ADMIN_PASSWORD=your-password
DIRECTUS_STATIC_TOKEN=your-static-token

# Optional: OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Use in Components

```vue
<template>
  <div>
    <div v-if="loggedIn">
      <p>Welcome, {{ user?.firstName }}!</p>
      <button @click="logout">Logout</button>
    </div>
    <div v-else>
      <button @click="handleLogin">Login</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { loggedIn, user, login, logout } = useDirectusAuth()

const handleLogin = async () => {
  await login('user@example.com', 'password')
}
</script>
```

## 📚 Documentation

- [Complete Guide](./GUIDE.md) - Comprehensive documentation with examples
- [Directus Documentation](https://docs.directus.io)
- [Nuxt Documentation](https://nuxt.com)

## 🎯 Available Composables

| Composable | Purpose |
|------------|---------|
| `useDirectusAuth()` | Authentication and session management |
| `useDirectus()` | Public Directus client (read-only) |
| `useAuthenticatedDirectus()` | Authenticated requests via proxy |
| `useDirectusItems()` | CRUD operations on collections |
| `useDirectusFiles()` | File upload and management |
| `useDirectusRealtime()` | WebSocket subscriptions |
| `useDirectusNotifications()` | Notification system |
| `useDirectusComments()` | Comment management |

## 🔧 Middleware

- `auth` - Protect routes requiring authentication
- `guest` - Redirect authenticated users (login/register pages)

## 🌐 API Routes

- `POST /api/auth/login` - Email/password login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/github` - GitHub OAuth
- `GET /api/auth/google` - Google OAuth
- `* /api/directus/[...path]` - Authenticated Directus proxy
- `POST /api/files/upload` - File upload

## 💡 Common Use Cases

### Protected Page

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})
</script>

<template>
  <div>
    <h1>Protected Content</h1>
  </div>
</template>
```

### Fetch Items

```vue
<script setup lang="ts">
const { fetchItems } = useDirectusItems()

const { data: posts } = await fetchItems('posts', {
  fields: ['id', 'title', 'author.name'],
  sort: ['-date_created'],
  limit: 10
})
</script>

<template>
  <div>
    <article v-for="post in posts" :key="post.id">
      <h2>{{ post.title }}</h2>
      <p>By {{ post.author?.name }}</p>
    </article>
  </div>
</template>
```

### Real-time Updates

```vue
<script setup lang="ts">
const { connect, subscribe } = useDirectusRealtime()

onMounted(() => {
  connect()
  
  const unsubscribe = subscribe('messages', (data) => {
    console.log('New message:', data)
  })
  
  onUnmounted(() => unsubscribe())
})
</script>
```

### File Upload

```vue
<script setup lang="ts">
const { uploadFile } = useDirectusFiles()

const handleUpload = async (file: File) => {
  const result = await uploadFile(file, {
    title: file.name,
    folder: 'user-uploads'
  })
  console.log('Uploaded:', result.file.id)
}
</script>
```

## 🔄 Type Generation

Generate TypeScript types from your Directus schema:

```bash
pnpm run generate:types
```

Requires:
- `DIRECTUS_URL` set in `.env`
- `DIRECTUS_STATIC_TOKEN` with admin permissions

## 🏗️ Project Structure

```
directus-nuxt-layer/
├── composables/           # Vue composables
│   ├── useDirectus.ts
│   ├── useDirectusAuth.ts
│   ├── useDirectusItems.ts
│   ├── useDirectusFiles.ts
│   ├── useDirectusRealtime.ts
│   ├── useDirectusNotifications.ts
│   └── useDirectusComments.ts
├── server/
│   ├── api/              # API routes
│   │   ├── auth/
│   │   ├── directus/
│   │   └── files/
│   └── utils/            # Server utilities
│       └── directus.ts
├── middleware/           # Route middleware
│   ├── auth.ts
│   └── guest.ts
├── plugins/              # Nuxt plugins
│   └── auth-refresh.client.ts
├── types/               # TypeScript types
│   └── index.d.ts
├── scripts/             # Utility scripts
│   └── generate-types.js
└── nuxt.config.ts       # Layer configuration
```

## 🔒 Security Features

- Server-side session storage
- Automatic token refresh
- Secure cookie handling
- Request authentication proxy
- OAuth integration
- CSRF protection via nuxt-auth-utils

## 🌟 Advanced Features

### Custom Query Filters

```typescript
const { fetchItems } = useDirectusItems()

const { data } = await fetchItems('articles', {
  filter: {
    _and: [
      { status: { _eq: 'published' } },
      { date_published: { _lte: '$NOW' } },
      {
        _or: [
          { category: { _eq: 'tech' } },
          { tags: { _contains: 'featured' } }
        ]
      }
    ]
  }
})
```

### Deep Field Selection

```typescript
const { data } = await fetchItems('posts', {
  fields: [
    'id',
    'title',
    'content',
    'author.first_name',
    'author.last_name',
    'author.avatar',
    'categories.category_id.name',
    'comments.count'
  ],
  deep: {
    comments: {
      _filter: {
        status: { _eq: 'approved' }
      },
      _sort: ['-date_created'],
      _limit: 5
    }
  }
})
```

### Aggregation

```typescript
const { aggregateItems } = useDirectusItems()

const { data } = await aggregateItems('orders', {
  aggregate: {
    count: ['id'],
    sum: ['total'],
    avg: ['total']
  },
  groupBy: ['status']
})
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](./LICENSE) file

## 🆘 Support

- [GitHub Issues](https://github.com/pvenableh/directus-nuxt-layer/issues)
- [Directus Documentation](https://docs.directus.io)
- [Nuxt Documentation](https://nuxt.com)

## 🙏 Credits

Built with:
- [Nuxt 3](https://nuxt.com) - The Intuitive Vue Framework
- [Directus SDK](https://docs.directus.io/guides/sdk/) - Directus JavaScript SDK
- [nuxt-auth-utils](https://github.com/Atinux/nuxt-auth-utils) - Authentication utilities

## 🔄 Updates

To update to the latest version:

```bash
pnpm update directus-nuxt-layer

# Or reinstall
pnpm install github:pvenableh/directus-nuxt-layer@latest
```

## 📋 Requirements

- Node.js >= 18
- Nuxt 3.x
- Directus >= 10.x
- pnpm/npm/yarn

## 🎯 Roadmap

- [ ] Additional OAuth providers
- [ ] GraphQL support
- [ ] Offline support with service workers
- [ ] Advanced caching strategies
- [ ] Admin UI components
- [ ] Migration utilities
- [ ] Testing utilities

---

Made with ❤️ for the Nuxt and Directus communities