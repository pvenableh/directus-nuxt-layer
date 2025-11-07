# Directus Nuxt Layer - Complete Guide

Comprehensive guide for building applications with the Directus Nuxt Layer.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Authentication](#authentication)
3. [CRUD Operations](#crud-operations)
4. [File Management](#file-management)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Notifications](#notifications)
7. [Comments](#comments)
8. [Advanced Usage](#advanced-usage)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Installation & Setup

### Step 1: Install the Layer

```bash
pnpm install github:pvenableh/directus-nuxt-layer
```

### Step 2: Configure Nuxt

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  extends: ['directus-nuxt-layer'],
  
  runtimeConfig: {
    // Server-only secrets
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
    
    // Public config
    public: {
      directus: {
        url: process.env.DIRECTUS_URL,
        websocketUrl: process.env.DIRECTUS_WS_URL,
      }
    }
  },
})
```

### Step 3: Environment Variables

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

### Step 4: Configure OAuth (Optional)

#### GitHub OAuth Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/github`
4. Copy Client ID and Client Secret to `.env`

#### Google OAuth Setup

1. Go to Google Cloud Console
2. Create OAuth 2.0 Client ID
3. Set Authorized redirect URI: `http://localhost:3000/api/auth/google`
4. Copy Client ID and Client Secret to `.env`

---

## Authentication

### Basic Login Page

```vue
<!-- pages/login.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold text-center mb-8">Welcome Back</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Password</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        
        <div v-if="error" class="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {{ error }}
        </div>
      </form>
      
      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        
        <div class="mt-6 grid grid-cols-2 gap-3">
          <button
            @click="loginWithGitHub"
            class="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd" />
            </svg>
            GitHub
          </button>
          
          <button
            @click="loginWithGoogle"
            class="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
        </div>
      </div>
      
      <p class="mt-6 text-center text-sm text-gray-600">
        Don't have an account?
        <NuxtLink to="/register" class="text-blue-600 hover:underline font-medium">
          Sign up
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
  layout: false
})

const { login, loginWithGitHub, loginWithGoogle } = useDirectusAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await login(email.value, password.value)
    await router.push('/')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
```

### Registration Page

```vue
<!-- pages/register.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <h1 class="text-3xl font-bold text-center mb-8">Create Account</h1>
      
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">First Name</label>
            <input
              v-model="form.firstName"
              required
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Last Name</label>
            <input
              v-model="form.lastName"
              required
              class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-2">Password</label>
          <input
            v-model="form.password"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p class="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
        </div>
        
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Creating account...' : 'Create Account' }}
        </button>
        
        <div v-if="error" class="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {{ error }}
        </div>
      </form>
      
      <p class="mt-6 text-center text-sm text-gray-600">
        Already have an account?
        <NuxtLink to="/login" class="text-blue-600 hover:underline font-medium">
          Sign in
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
  layout: false
})

const { register, login } = useDirectusAuth()
const router = useRouter()

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await register(form.value)
    await login(form.value.email, form.value.password)
    await router.push('/')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
```

### User Profile Component

```vue
<!-- components/UserProfile.vue -->
<template>
  <div v-if="loggedIn" class="flex items-center gap-3">
    <img
      v-if="user?.avatar"
      :src="user.avatar"
      :alt="`${user.firstName} ${user.lastName}`"
      class="w-10 h-10 rounded-full object-cover"
    />
    <div
      v-else
      class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium"
    >
      {{ getInitials(user) }}
    </div>
    
    <div class="flex-1">
      <p class="font-medium text-sm">
        {{ user?.firstName }} {{ user?.lastName }}
      </p>
      <p class="text-xs text-gray-600">
        {{ user?.email }}
      </p>
    </div>
    
    <button
      @click="logout"
      class="text-sm text-red-600 hover:text-red-700 font-medium"
    >
      Logout
    </button>
  </div>
</template>

<script setup lang="ts">
const { loggedIn, user, logout } = useDirectusAuth()

const getInitials = (user: any) => {
  if (!user) return '?'
  const first = user.firstName?.[0] || ''
  const last = user.lastName?.[0] || ''
  return (first + last).toUpperCase() || '?'
}
</script>
```

### Protected Route Example

```vue
<!-- pages/dashboard.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

const { user } = useUserSession()
</script>

<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold mb-4">
      Welcome, {{ user?.firstName }}!
    </h1>
    <p class="text-gray-600">
      This page is only accessible to authenticated users.
    </p>
  </div>
</template>
```

---

## CRUD Operations

### Fetching Items with Filters

```vue
<!-- pages/posts/index.vue -->
<template>
  <div class="container mx-auto p-8">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-3xl font-bold">Blog Posts</h1>
      <NuxtLink
        to="/posts/create"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Create Post
      </NuxtLink>
    </div>
    
    <!-- Filters -->
    <div class="mb-6 flex gap-4">
      <select
        v-model="filters.category"
        class="px-4 py-2 border rounded-lg"
      >
        <option value="">All Categories</option>
        <option value="tech">Tech</option>
        <option value="design">Design</option>
        <option value="business">Business</option>
      </select>
      
      <input
        v-model="filters.search"
        type="text"
        placeholder="Search posts..."
        class="flex-1 px-4 py-2 border rounded-lg"
      />
      
      <button
        @click="applyFilters"
        class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
      >
        Filter
      </button>
    </div>
    
    <div v-if="pending" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
    
    <div v-else-if="error" class="p-4 bg-red-50 text-red-600 rounded-lg">
      Error loading posts. Please try again.
    </div>
    
    <div v-else-if="!data?.length" class="text-center py-12 text-gray-600">
      No posts found.
    </div>
    
    <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="post in data"
        :key="post.id"
        class="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
      >
        <img
          v-if="post.featured_image"
          :src="getFileUrl(post.featured_image, { width: 400, height: 250, fit: 'cover' })"
          :alt="post.title"
          class="w-full h-48 object-cover"
        />
        
        <div class="p-6">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {{ post.category }}
            </span>
            <span class="text-xs text-gray-500">
              {{ formatDate(post.date_created) }}
            </span>
          </div>
          
          <h2 class="text-xl font-semibold mb-2">{{ post.title }}</h2>
          <p class="text-gray-600 text-sm mb-4">{{ post.excerpt }}</p>
          
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <img
                v-if="post.author?.avatar"
                :src="getFileUrl(post.author.avatar, { width: 32, height: 32 })"
                :alt="post.author.name"
                class="w-8 h-8 rounded-full"
              />
              <span class="text-sm text-gray-600">{{ post.author?.name }}</span>
            </div>
            
            <NuxtLink
              :to="`/posts/${post.slug}`"
              class="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Read more →
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>
    
    <!-- Pagination -->
    <div v-if="data?.length" class="mt-8 flex justify-center gap-2">
      <button
        v-for="page in totalPages"
        :key="page"
        @click="currentPage = page"
        class="px-4 py-2 rounded-lg"
        :class="page === currentPage 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-200 hover:bg-gray-300'"
      >
        {{ page }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const { fetchItems } = useDirectusItems()
const { getFileUrl } = useDirectusFiles()

const filters = ref({
  category: '',
  search: ''
})

const currentPage = ref(1)
const itemsPerPage = 9

const queryFilter = computed(() => {
  const filter: any = {
    status: { _eq: 'published' }
  }
  
  if (filters.value.category) {
    filter.category = { _eq: filters.value.category }
  }
  
  if (filters.value.search) {
    filter.title = { _icontains: filters.value.search }
  }
  
  return filter
})

const { data, pending, error, refresh } = await fetchItems('posts', {
  fields: [
    'id',
    'title',
    'slug',
    'excerpt',
    'category',
    'featured_image',
    'date_created',
    'author.name',
    'author.avatar'
  ],
  filter: queryFilter.value,
  sort: ['-date_created'],
  limit: itemsPerPage,
  offset: computed(() => (currentPage.value - 1) * itemsPerPage)
})

const totalPages = computed(() => 
  Math.ceil((data.value?.length || 0) / itemsPerPage)
)

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const applyFilters = () => {
  currentPage.value = 1
  refresh()
}
</script>
```

### Single Item Detail Page

```vue
<!-- pages/posts/[slug].vue -->
<template>
  <article v-if="post" class="max-w-4xl mx-auto p-8">
    <div class="mb-8">
      <NuxtLink
        to="/posts"
        class="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4"
      >
        ← Back to posts
      </NuxtLink>
      
      <h1 class="text-4xl md:text-5xl font-bold mb-4">
        {{ post.title }}
      </h1>
      
      <div class="flex items-center gap-4 text-gray-600 mb-6">
        <img
          v-if="post.author?.avatar"
          :src="getFileUrl(post.author.avatar, { width: 48, height: 48 })"
          :alt="post.author.name"
          class="w-12 h-12 rounded-full"
        />
        <div>
          <p class="font-medium text-gray-900">{{ post.author?.name }}</p>
          <p class="text-sm">{{ formatDate(post.date_created) }}</p>
        </div>
      </div>
      
      <img
        v-if="post.featured_image"
        :src="getFileUrl(post.featured_image, { width: 1200, quality: 90 })"
        :alt="post.title"
        class="w-full rounded-lg shadow-lg mb-8"
      />
    </div>
    
    <div class="prose prose-lg max-w-none" v-html="post.content"></div>
    
    <!-- Tags -->
    <div v-if="post.tags?.length" class="mt-8 flex flex-wrap gap-2">
      <span
        v-for="tag in post.tags"
        :key="tag"
        class="px-3 py-1 bg-gray-100 rounded-full text-sm"
      >
        #{{ tag }}
      </span>
    </div>
    
    <!-- Comments Section -->
    <div class="mt-12 border-t pt-8">
      <CommentThread :collection="'posts'" :item-id="post.id" />
    </div>
  </article>
  
  <div v-else-if="pending" class="max-w-4xl mx-auto p-8">
    <div class="animate-pulse">
      <div class="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div class="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
      <div class="h-64 bg-gray-200 rounded mb-8"></div>
      <div class="space-y-3">
        <div class="h-4 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  </div>
  
  <div v-else class="max-w-4xl mx-auto p-8">
    <div class="text-center py-12">
      <h2 class="text-2xl font-bold mb-4">Post Not Found</h2>
      <NuxtLink to="/posts" class="text-blue-600 hover:underline">
        Return to posts
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { fetchItems } = useDirectusItems()
const { getFileUrl } = useDirectusFiles()

const { data, pending } = await fetchItems('posts', {
  fields: [
    'id',
    'title',
    'content',
    'excerpt',
    'featured_image',
    'tags',
    'date_created',
    'author.name',
    'author.avatar'
  ],
  filter: {
    slug: { _eq: route.params.slug },
    status: { _eq: 'published' }
  },
  limit: 1
})

const post = computed(() => data.value?.[0])

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// SEO
useHead({
  title: () => post.value?.title || 'Post',
  meta: [
    {
      name: 'description',
      content: () => post.value?.excerpt || ''
    },
    {
      property: 'og:title',
      content: () => post.value?.title || ''
    },
    {
      property: 'og:image',
      content: () => post.value?.featured_image 
        ? getFileUrl(post.value.featured_image, { width: 1200 })
        : ''
    }
  ]
})
</script>
```

### Create/Edit Form

```vue
<!-- pages/posts/create.vue -->
<template>
  <div class="max-w-3xl mx-auto p-8">
    <h1 class="text-3xl font-bold mb-8">Create New Post</h1>
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div>
        <label class="block text-sm font-medium mb-2">Title</label>
        <input
          v-model="form.title"
          required
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">Slug</label>
        <input
          v-model="form.slug"
          required
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p class="mt-1 text-xs text-gray-500">
          URL-friendly version of the title
        </p>
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">Excerpt</label>
        <textarea
          v-model="form.excerpt"
          rows="3"
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">Content</label>
        <textarea
          v-model="form.content"
          rows="15"
          required
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        ></textarea>
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">Category</label>
        <select
          v-model="form.category"
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a category</option>
          <option value="tech">Tech</option>
          <option value="design">Design</option>
          <option value="business">Business</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">Tags</label>
        <input
          v-model="tagsInput"
          placeholder="tag1, tag2, tag3"
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p class="mt-1 text-xs text-gray-500">
          Separate tags with commas
        </p>
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">Featured Image</label>
        <FileUpload @uploaded="handleImageUpload" />
      </div>
      
      <div>
        <label class="block text-sm font-medium mb-2">Status</label>
        <select
          v-model="form.status"
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      
      <div class="flex gap-4">
        <button
          type="submit"
          :disabled="loading"
          class="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Creating...' : 'Create Post' }}
        </button>
        
        <NuxtLink
          to="/posts"
          class="px-6 py-3 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </NuxtLink>
      </div>
      
      <div v-if="error" class="p-4 bg-red-50 text-red-600 rounded-lg">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

const { create } = useDirectusItems()
const { user } = useUserSession()
const router = useRouter()

const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  featured_image: null as string | null,
  status: 'draft'
})

const tagsInput = ref('')
const loading = ref(false)
const error = ref('')

// Auto-generate slug from title
watch(() => form.value.title, (title) => {
  if (!title) return
  form.value.slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
})

const handleImageUpload = (fileIds: string[]) => {
  if (fileIds.length > 0) {
    form.value.featured_image = fileIds[0]
  }
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
    
    const post = await create('posts', {
      ...form.value,
      tags,
      author: user.value?.id,
      date_created: new Date().toISOString()
    })
    
    await router.push(`/posts/${post.slug}`)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
```

### Bulk Operations

```vue
<script setup lang="ts">
const { updateMany, deleteMany } = useDirectusItems()

// Update multiple items
const publishPosts = async (postIds: string[]) => {
  await updateMany('posts', postIds, {
    status: 'published',
    date_published: new Date().toISOString()
  })
}

// Delete multiple items
const deletePosts = async (postIds: string[]) => {
  if (confirm(`Delete ${postIds.length} posts?`)) {
    await deleteMany('posts', postIds)
  }
}

// Update by query
const { updateByQuery } = useDirectusItems()

const archiveOldPosts = async () => {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  await updateByQuery(
    'posts',
    {
      filter: {
        date_created: { _lt: oneYearAgo.toISOString() },
        status: { _eq: 'published' }
      }
    },
    {
      status: 'archived'
    }
  )
}
</script>
```

---

## File Management

### File Upload Component

```vue
<!-- components/FileUpload.vue -->
<template>
  <div class="space-y-4">
    <div
      class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors"
      :class="{ 'border-blue-500 bg-blue-50': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :multiple="multiple"
        :accept="accept"
        @change="handleFileSelect"
        class="hidden"
      />
      
      <div class="flex flex-col items-center gap-2">
        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <button
          type="button"
          @click="fileInput?.click()"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Choose Files
        </button>
        
        <p class="text-sm text-gray-600">or drag and drop</p>
        <p class="text-xs text-gray-500">{{ acceptLabel }}</p>
      </div>
    </div>
    
    <div v-if="files.length" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="(file, index) in files"
        :key="index"
        class="relative group"
      >
        <div class="relative border rounded-lg p-2 bg-white">
          <img
            v-if="file.preview"
            :src="file.preview"
            :alt="file.name"
            class="w-full h-32 object-cover rounded"
          />
          <div
            v-else
            class="w-full h-32 flex items-center justify-center bg-gray-100 rounded"
          >
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          
          <p class="text-xs truncate mt-2" :title="file.name">
            {{ file.name }}
          </p>
          <p class="text-xs text-gray-500">
            {{ formatFileSize(file.file.size) }}
          </p>
          
          <button
            type="button"
            @click="removeFile(index)"
            class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
          
          <div
            v-if="file.uploading"
            class="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg"
          >
            <div class="text-white text-xs">{{ file.progress }}%</div>
          </div>
        </div>
      </div>
    </div>
    
    <button
      v-if="files.length && !uploading"
      type="button"
      @click="uploadAll"
      class="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
    >
      Upload {{ files.length }} file(s)
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  multiple?: boolean
  accept?: string
  folder?: string
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  accept: 'image/*'
})

const emit = defineEmits<{
  uploaded: [fileIds: string[]]
}>()

const { uploadFile } = useDirectusFiles()

interface FileWithPreview {
  file: File
  name: string
  preview: string | null
  uploading: boolean
  progress: number
}

const fileInput = ref<HTMLInputElement>()
const files = ref<FileWithPreview[]>([])
const uploading = ref(false)
const isDragging = ref(false)

const acceptLabel = computed(() => {
  if (props.accept === 'image/*') return 'PNG, JPG, GIF up to 10MB'
  if (props.accept === 'video/*') return 'MP4, MOV up to 100MB'
  return 'Any file type'
})

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    addFiles(Array.from(input.files))
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const droppedFiles = Array.from(event.dataTransfer?.files || [])
  addFiles(droppedFiles)
}

const addFiles = (newFiles: File[]) => {
  newFiles.forEach(file => {
    let preview: string | null = null
    
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file)
    }
    
    files.value.push({
      file,
      name: file.name,
      preview,
      uploading: false,
      progress: 0
    })
  })
}

const removeFile = (index: number) => {
  if (files.value[index].preview) {
    URL.revokeObjectURL(files.value[index].preview!)
  }
  files.value.splice(index, 1)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const uploadAll = async () => {
  uploading.value = true
  const uploadedIds: string[] = []
  
  try {
    for (const item of files.value) {
      item.uploading = true
      item.progress = 0
      
      // Simulate progress (in real app, use actual upload progress)
      const progressInterval = setInterval(() => {
        if (item.progress < 90) {
          item.progress += 10
        }
      }, 100)
      
      const result = await uploadFile(item.file, {
        title: item.name,
        folder: props.folder
      })
      
      clearInterval(progressInterval)
      item.progress = 100
      uploadedIds.push(result.file.id)
      item.uploading = false
    }
    
    emit('uploaded', uploadedIds)
    files.value = []
  } catch (error) {
    console.error('Upload failed:', error)
  } finally {
    uploading.value = false
  }
}

onUnmounted(() => {
  files.value.forEach(file => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
  })
})
</script>
```

### Image Gallery with Lightbox

```vue
<!-- components/ImageGallery.vue -->
<template>
  <div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div
        v-for="image in images"
        :key="image.id"
        class="relative group cursor-pointer"
        @click="openLightbox(image)"
      >
        <img
          :src="getFileUrl(image.id, { width: 400, height: 400, fit: 'cover' })"
          :alt="image.title"
          class="w-full h-48 object-cover rounded-lg"
        />
        
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
          <button
            @click.stop="downloadFile(image)"
            class="bg-white text-black p-2 rounded-full hover:bg-gray-100"
            title="Download"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          
          <button
            v-if="canDelete"
            @click.stop="deleteImage(image.id)"
            class="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
            title="Delete"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        
        <div class="mt-2">
          <p class="text-sm font-medium truncate">{{ image.title }}</p>
          <p class="text-xs text-gray-500">{{ formatFileSize(image.filesize) }}</p>
        </div>
      </div>
    </div>
    
    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="lightboxImage"
        class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        @click="closeLightbox"
      >
        <button
          @click="closeLightbox"
          class="absolute top-4 right-4 text-white text-4xl hover:text-gray-300"
        >
          ×
        </button>
        
        <button
          v-if="currentIndex > 0"
          @click.stop="previousImage"
          class="absolute left-4 text-white text-4xl hover:text-gray-300"
        >
          ‹
        </button>
        
        <img
          :src="getFileUrl(lightboxImage.id)"
          :alt="lightboxImage.title"
          class="max-w-full max-h-full object-contain"
          @click.stop
        />
        
        <button
          v-if="currentIndex < images.length - 1"
          @click.stop="nextImage"
          class="absolute right-4 text-white text-4xl hover:text-gray-300"
        >
          ›
        </button>
        
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg">
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface Props {
  images: any[]
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canDelete: false
})

const emit = defineEmits<{
  deleted: [id: string]
}>()

const { getFileUrl, deleteFile } = useDirectusFiles()

const lightboxImage = ref<any>(null)
const currentIndex = ref(0)

const openLightbox = (image: any) => {
  lightboxImage.value = image
  currentIndex.value = props.images.findIndex(img => img.id === image.id)
}

const closeLightbox = () => {
  lightboxImage.value = null
}

const previousImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    lightboxImage.value = props.images[currentIndex.value]
  }
}

const nextImage = () => {
  if (currentIndex.value < props.images.length - 1) {
    currentIndex.value++
    lightboxImage.value = props.images[currentIndex.value]
  }
}

const downloadFile = (image: any) => {
  const link = document.createElement('a')
  link.href = getFileUrl(image.id)
  link.download = image.filename_download || image.title
  link.click()
}

const deleteImage = async (id: string) => {
  if (!confirm('Delete this image?')) return
  
  try {
    await deleteFile(id)
    emit('deleted', id)
    if (lightboxImage.value?.id === id) {
      closeLightbox()
    }
  } catch (error) {
    console.error('Delete failed:', error)
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// Keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!lightboxImage.value) return
  
  if (event.key === 'Escape') closeLightbox()
  if (event.key === 'ArrowLeft') previousImage()
  if (event.key === 'ArrowRight') nextImage()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
```

---

## Real-time Subscriptions

### Live Chat Component

```vue
<!-- components/LiveChat.vue -->
<template>
  <div class="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b">
      <div class="flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full"
          :class="connected ? 'bg-green-500' : 'bg-gray-300'"
        ></div>
        <h3 class="font-semibold">Live Chat</h3>
        <span class="text-sm text-gray-600">
          ({{ onlineUsers.length }} online)
        </span>
      </div>
      
      <button
        @click="toggleSettings"
        class="text-gray-600 hover:text-gray-900"
      >
        ⚙️
      </button>
    </div>
    
    <!-- Messages -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <div
        v-for="message in messages"
        :key="message.id"
        class="flex gap-3"
        :class="{ 'justify-end': message.user_created?.id === currentUserId }"
      >
        <img
          v-if="message.user_created?.id !== currentUserId"
          :src="getUserAvatar(message.user_created)"
          :alt="getUserName(message.user_created)"
          class="w-8 h-8 rounded-full"
        />
        
        <div
          class="max-w-md"
          :class="message.user_created?.id === currentUserId 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100'"
          class="px-4 py-2 rounded-lg"
        >
          <p
            v-if="message.user_created?.id !== currentUserId"
            class="text-xs font-medium mb-1"
            :class="message.user_created?.id === currentUserId 
              ? 'text-blue-100' 
              : 'text-gray-600'"
          >
            {{ getUserName(message.user_created) }}
          </p>
          <p>{{ message.text }}</p>
          <p
            class="text-xs mt-1 opacity-75"
          >
            {{ formatTime(message.date_created) }}
          </p>
        </div>
        
        <img
          v-if="message.user_created?.id === currentUserId"
          :src="getUserAvatar(message.user_created)"
          :alt="getUserName(message.user_created)"
          class="w-8 h-8 rounded-full"
        />
      </div>
      
      <!-- Typing indicator -->
      <div v-if="usersTyping.length" class="flex items-center gap-2 text-sm text-gray-600">
        <div class="flex gap-1">
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
        </div>
        <span>{{ usersTyping.join(', ') }} typing...</span>
      </div>
    </div>
    
    <!-- Input -->
    <div class="border-t p-4">
      <form @submit.prevent="sendMessage" class="flex gap-2">
        <input
          v-model="newMessage"
          @input="handleTyping"
          placeholder="Type a message..."
          class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          :disabled="!newMessage.trim() || sending"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  channelId: string
}

const props = defineProps<Props>()

const { user } = useUserSession()
const { connected, connect, subscribe } = useDirectusRealtime()
const { fetchItems, create } = useDirectusItems()
const { getFileUrl } = useDirectusFiles()

const messages = ref<any[]>([])
const newMessage = ref('')
const sending = ref(false)
const messagesContainer = ref<HTMLElement>()
const onlineUsers = ref<any[]>([])
const usersTyping = ref<string[]>([])
const typingTimeout = ref<NodeJS.Timeout>()

const currentUserId = computed(() => user.value?.id)

// Load initial messages
const { data: initialMessages } = await fetchItems('messages', {
  fields: ['*', 'user_created.*'],
  filter: {
    channel: { _eq: props.channelId }
  },
  sort: ['date_created'],
  limit: 50
})

messages.value = initialMessages.value || []

// Scroll to bottom on mount
onMounted(() => {
  scrollToBottom()
  connect()
  
  // Subscribe to new messages
  const unsubMessages = subscribe(
    'messages',
    (data) => {
      if (data.event === 'create' && data.payload?.channel === props.channelId) {
        messages.value.push(data.payload)
        nextTick(() => scrollToBottom())
      }
    },
    {
      query: {
        filter: {
          channel: { _eq: props.channelId }
        }
      }
    }
  )
  
  // Subscribe to typing events
  const unsubTyping = subscribe('typing', (data) => {
    if (data.channel === props.channelId && data.user !== currentUserId.value) {
      handleUserTyping(data.user, data.username)
    }
  })
  
  // Subscribe to presence
  const unsubPresence = subscribe('presence', (data) => {
    if (data.channel === props.channelId) {
      onlineUsers.value = data.users
    }
  })
  
  onUnmounted(() => {
    unsubMessages()
    unsubTyping()
    unsubPresence()
  })
})

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  
  sending.value = true
  
  try {
    await create('messages', {
      channel: props.channelId,
      text: newMessage.value,
      user_created: currentUserId.value
    })
    
    newMessage.value = ''
  } catch (error) {
    console.error('Failed to send message:', error)
  } finally {
    sending.value = false
  }
}

const handleTyping = () => {
  // Emit typing event (would need WebSocket emit support)
  // For now, just clear timeout
  clearTimeout(typingTimeout.value)
  typingTimeout.value = setTimeout(() => {
    // Emit stopped typing
  }, 1000)
}

const handleUserTyping = (userId: string, username: string) => {
  if (!usersTyping.value.includes(username)) {
    usersTyping.value.push(username)
    
    setTimeout(() => {
      usersTyping.value = usersTyping.value.filter(u => u !== username)
    }, 3000)
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const getUserName = (user: any) => {
  if (!user) return 'Unknown'
  return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
}

const getUserAvatar = (user: any) => {
  if (user?.avatar) {
    return getFileUrl(user.avatar, { width: 32, height: 32 })
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName(user))}&size=32`
}

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const toggleSettings = () => {
  // Implement settings modal
}
</script>
```

### Live Dashboard with Real-time Updates

```vue
<!-- pages/dashboard/live.vue -->
<template>
  <div class="p-8 space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">Live Dashboard</h1>
      <div class="flex items-center gap-2">
        <div
          class="w-3 h-3 rounded-full"
          :class="connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'"
        ></div>
        <span class="text-sm text-gray-600">
          {{ connected ? 'Connected' : 'Disconnected' }}
        </span>
      </div>
    </div>
    
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-gray-600 text-sm font-medium">Active Users</h3>
          <span class="text-2xl">👥</span>
        </div>
        <p class="text-3xl font-bold">{{ stats.activeUsers }}</p>
        <p class="text-sm text-green-600 mt-1">
          +{{ stats.activeUsersChange }} from yesterday
        </p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-gray-600 text-sm font-medium">Total Orders</h3>
          <span class="text-2xl">📦</span>
        </div>
        <p class="text-3xl font-bold">{{ stats.totalOrders }}</p>
        <p class="text-sm text-green-600 mt-1">
          +{{ stats.ordersToday }} today
        </p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-gray-600 text-sm font-medium">Revenue</h3>
          <span class="text-2xl">💰</span>
        </div>
        <p class="text-3xl font-bold">${{ formatNumber(stats.revenue) }}</p>
        <p class="text-sm text-green-600 mt-1">
          +{{ stats.revenueGrowth }}% this month
        </p>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-gray-600 text-sm font-medium">Conversion Rate</h3>
          <span class="text-2xl">📈</span>
        </div>
        <p class="text-3xl font-bold">{{ stats.conversionRate }}%</p>
        <p class="text-sm text-red-600 mt-1">
          -{{ stats.conversionRateChange }}% from last week
        </p>
      </div>
    </div>
    
    <!-- Recent Orders -->
    <div class="bg-white rounded-lg shadow">
      <div class="p-6 border-b">
        <h2 class="text-xl font-bold">Recent Orders</h2>
      </div>
      
      <div class="divide-y">
        <TransitionGroup name="list">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span class="text-xl">📦</span>
              </div>
              
              <div>
                <p class="font-medium">Order #{{ order.number }}</p>
                <p class="text-sm text-gray-600">{{ order.customer_name }}</p>
                <p class="text-xs text-gray-500">{{ formatTimeAgo(order.date_created) }}</p>
              </div>
            </div>
            
            <div class="text-right">
              <p class="font-bold text-lg">${{ order.total }}</p>
              <span
                class="inline-block px-2 py-1 text-xs rounded"
                :class="getStatusClass(order.status)"
              >
                {{ order.status }}
              </span>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth']
})

const { connected, connect, subscribe } = useDirectusRealtime()
const { fetchItems } = useDirectusItems()

const stats = ref({
  activeUsers: 0,
  activeUsersChange: 0,
  totalOrders: 0,
  ordersToday: 0,
  revenue: 0,
  revenueGrowth: 0,
  conversionRate: 0,
  conversionRateChange: 0
})

const recentOrders = ref<any[]>([])

// Load initial data
const { data: orders } = await fetchItems('orders', {
  sort: ['-date_created'],
  limit: 10
})

recentOrders.value = orders.value || []

// Calculate initial stats
stats.value.totalOrders = recentOrders.value.length
stats.value.revenue = recentOrders.value.reduce((sum, order) => sum + order.total, 0)

// Connect to real-time updates
onMounted(() => {
  connect()
  
  // Subscribe to orders
  const unsubOrders = subscribe('orders', (data) => {
    if (data.event === 'create') {
      // Add new order to top
      recentOrders.value.unshift(data.payload)
      
      // Keep only last 10
      if (recentOrders.value.length > 10) {
        recentOrders.value.pop()
      }
      
      // Update stats
      stats.value.totalOrders++
      stats.value.ordersToday++
      stats.value.revenue += data.payload.total
      
      // Show notification
      showNotification('New Order', `Order #${data.payload.number} received`)
    }
    
    if (data.event === 'update') {
      const index = recentOrders.value.findIndex(o => o.id === data.payload.id)
      if (index !== -1) {
        recentOrders.value[index] = { ...recentOrders.value[index], ...data.payload }
      }
    }
  })
  
  // Subscribe to stats updates
  const unsubStats = subscribe('dashboard_stats', (data) => {
    stats.value = { ...stats.value, ...data.payload }
  })
  
  onUnmounted(() => {
    unsubOrders()
    unsubStats()
  })
})

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num)
}

const formatTimeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

const showNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}
</script>

<style scoped>
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
```

---

## Notifications

### Notification Center

```vue
<!-- components/NotificationCenter.vue -->
<template>
  <div class="relative">
    <button
      @click="toggleOpen"
      class="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      
      <span
        v-if="unreadCount > 0"
        class="absolute top-0 right-0 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>
    
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50"
      >
        <div class="p-4 border-b flex items-center justify-between">
          <h3 class="font-bold text-lg">Notifications</h3>
          <button
            v-if="unreadCount > 0"
            @click="handleMarkAllRead"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Mark all read
          </button>
        </div>
        
        <div class="max-h-96 overflow-y-auto">
          <div v-if="pending" class="p-8 text-center text-gray-600">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          
          <div v-else-if="!data?.length" class="p-8 text-center text-gray-600">
            <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No notifications</p>
          </div>
          
          <div
            v-for="notification in data"
            :key="notification.id"
            class="p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
            :class="{ 'bg-blue-50': notification.status === 'inbox' }"
            @click="handleNotificationClick(notification)"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                :class="getNotificationIconClass(notification.subject)"
              >
                {{ getNotificationIcon(notification.subject) }}
              </div>
              
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm mb-1">{{ notification.subject }}</p>
                <p class="text-sm text-gray-600 line-clamp-2">{{ notification.message }}</p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ formatTimeAgo(notification.timestamp) }}
                </p>
              </div>
              
              <button
                v-if="notification.status === 'inbox'"
                @click.stop="markAsRead(notification.id)"
                class="text-blue-600 hover:text-blue-700 flex-shrink-0"
                title="Mark as read"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="p-3 border-t text-center">
          <NuxtLink
            to="/notifications"
            @click="isOpen = false"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all notifications
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
const {
  fetchNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} = useDirectusNotifications()

const { connected, connect, subscribe } = useDirectusRealtime()
const router = useRouter()

const isOpen = ref(false)
const unreadCount = ref(0)

const { data, pending, refresh } = await fetchNotifications({
  limit: 20
})

// Get unread count
unreadCount.value = await getUnreadCount()

// Real-time updates
onMounted(() => {
  connect()
  
  const unsubscribe = subscribe('directus_notifications', async (data) => {
    if (data.event === 'create') {
      await refresh()
      unreadCount.value = await getUnreadCount()
      
      // Show browser notification
      showBrowserNotification(data.payload)
    }
  })
  
  onUnmounted(() => {
    unsubscribe()
  })
})

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const handleNotificationClick = async (notification: any) => {
  if (notification.status === 'inbox') {
    await markAsRead(notification.id)
    unreadCount.value--
  }
  
  if (notification.collection && notification.item) {
    await router.push(`/${notification.collection}/${notification.item}`)
  }
  
  isOpen.value = false
}

const handleMarkAllRead = async () => {
  await markAllAsRead()
  await refresh()
  unreadCount.value = 0
}

const getNotificationIcon = (subject: string) => {
  const lower = subject.toLowerCase()
  if (lower.includes('comment')) return '💬'
  if (lower.includes('like')) return '❤️'
  if (lower.includes('order')) return '📦'
  if (lower.includes('message')) return '✉️'
  if (lower.includes('alert')) return '⚠️'
  return '🔔'
}

const getNotificationIconClass = (subject: string) => {
  const lower = subject.toLowerCase()
  if (lower.includes('comment')) return 'bg-blue-100'
  if (lower.includes('like')) return 'bg-red-100'
  if (lower.includes('order')) return 'bg-green-100'
  if (lower.includes('message')) return 'bg-purple-100'
  if (lower.includes('alert')) return 'bg-yellow-100'
  return 'bg-gray-100'
}

const formatTimeAgo = (timestamp: string) => {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(timestamp).toLocaleDateString()
}

const showBrowserNotification = async (notification: any) => {
  if (!('Notification' in window)) return
  
  if (Notification.permission === 'granted') {
    new Notification(notification.subject, {
      body: notification.message,
      icon: '/icon.png'
    })
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      new Notification(notification.subject, {
        body: notification.message,
        icon: '/icon.png'
      })
    }
  }
}

// Close dropdown when clicking outside
onClickOutside(isOpen, () => {
  isOpen.value = false
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
```

---

## Comments

### Comment Thread Component

```vue
<!-- components/CommentThread.vue -->
<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-bold">
        Comments ({{ commentCount }})
      </h3>
      
      <select
        v-model="sortOrder"
        class="px-3 py-1 border rounded-lg text-sm"
      >
        <option value="-date_created">Newest first</option>
        <option value="date_created">Oldest first</option>
      </select>
    </div>
    
    <!-- Add comment form -->
    <div v-if="loggedIn" class="bg-gray-50 p-4 rounded-lg">
      <textarea
        v-model="newComment"
        placeholder="Write a comment..."
        rows="3"
        class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
      ></textarea>
      
      <div class="flex items-center justify-between mt-3">
        <p class="text-sm text-gray-600">
          {{ newComment.length }}/1000 characters
        </p>
        
        <button
          @click="handleAddComment"
          :disabled="!newComment.trim() || submitting || newComment.length > 1000"
          class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? 'Posting...' : 'Post Comment' }}
        </button>
      </div>
    </div>
    
    <div v-else class="bg-gray-50 p-6 rounded-lg text-center">
      <p class="text-gray-600 mb-3">
        Join the conversation
      </p>
      <NuxtLink
        to="/login"
        class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Login to comment
      </NuxtLink>
    </div>
    
    <!-- Comments list -->
    <div v-if="pending" class="text-center py-8 text-gray-600">
      Loading comments...
    </div>
    
    <div v-else-if="!data?.length" class="text-center py-12 text-gray-600">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      <p class="font-medium mb-1">No comments yet</p>
      <p class="text-sm">Be the first to comment!</p>
    </div>
    
    <div v-else class="space-y-4">
      <div
        v-for="comment in data"
        :key="comment.id"
        class="bg-white p-4 rounded-lg border"
      >
        <div class="flex gap-3">
          <img
            :src="getUserAvatar(comment.user_created)"
            :alt="getUserName(comment.user_created)"
            class="w-10 h-10 rounded-full flex-shrink-0"
          />
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium">
                {{ getUserName(comment.user_created) }}
              </span>
              <span class="text-sm text-gray-500">
                {{ formatDate(comment.date_created) }}
              </span>
              
              <span
                v-if="comment.user_created?.id === user?.id"
                class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
              >
                You
              </span>
            </div>
            
            <p
              v-if="editingId !== comment.id"
              class="text-gray-800 whitespace-pre-wrap"
            >
              {{ comment.comment }}
            </p>
            
            <!-- Edit form -->
            <div v-else class="mt-2">
              <textarea
                v-model="editText"
                rows="3"
                class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              ></textarea>
              
              <div class="flex gap-2 mt-2">
                <button
                  @click="handleUpdateComment(comment.id)"
                  :disabled="!editText.trim()"
                  class="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  @click="cancelEdit"
                  class="bg-gray-200 text-gray-800 px-4 py-1 rounded text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
            
            <!-- Actions -->
            <div
              v-if="editingId !== comment.id"
              class="flex gap-3 mt-2"
            >
              <button
                v-if="canEditComment(comment)"
                @click="startEdit(comment)"
                class="text-sm text-gray-600 hover:text-gray-900"
              >
                Edit
              </button>
              
              <button
                v-if="canDeleteComment(comment)"
                @click="handleDeleteComment(comment.id)"
                class="text-sm text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Load more -->
    <button
      v-if="data && data.length >= limit"
      @click="loadMore"
      class="w-full py-2 text-blue-600 hover:text-blue-700 font-medium"
    >
      Load more comments
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  collection: string
  itemId: string | number
}

const props = defineProps<Props>()

const {
  fetchComments,
  addComment,
  updateCommentItem,
  deleteCommentItem,
  canEditComment,
  canDeleteComment
} = useDirectusComments()

const { loggedIn, user } = useUserSession()
const { getFileUrl } = useDirectusFiles()

const newComment = ref('')
const editingId = ref<string | null>(null)
const editText = ref('')
const submitting = ref(false)
const limit = ref(10)
const sortOrder = ref('-date_created')

const { data, pending, refresh } = await fetchComments(
  props.collection,
  props.itemId,
  {
    sort: [sortOrder.value],
    limit: limit.value
  }
)

const commentCount = computed(() => data.value?.length || 0)

watch(sortOrder, () => {
  refresh()
})

const handleAddComment = async () => {
  if (!newComment.value.trim()) return
  
  submitting.value = true
  
  try {
    await addComment(props.collection, props.itemId, newComment.value)
    await refresh()
    newComment.value = ''
  } catch (error) {
    console.error('Failed to add comment:', error)
  } finally {
    submitting.value = false
  }
}

const startEdit = (comment: any) => {
  editingId.value = comment.id
  editText.value = comment.comment
}

const cancelEdit = () => {
  editingId.value = null
  editText.value = ''
}

const handleUpdateComment = async (commentId: string) => {
  if (!editText.value.trim()) return
  
  try {
    await updateCommentItem(commentId, editText.value)
    await refresh()
    cancelEdit()
  } catch (error) {
    console.error('Failed to update comment:', error)
  }
}

const handleDeleteComment = async (commentId: string) => {
  if (!confirm('Delete this comment?')) return
  
  try {
    await deleteCommentItem(commentId)
    await refresh()
  } catch (error) {
    console.error('Failed to delete comment:', error)
  }
}

const loadMore = () => {
  limit.value += 10
  refresh()
}

const getUserName = (user: any) => {
  if (!user) return 'Unknown User'
  return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
}

const getUserAvatar = (user: any) => {
  if (user?.avatar) {
    return getFileUrl(user.avatar, { width: 40, height: 40 })
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(getUserName(user))}&size=40`
}

const formatDate = (date: string) => {
  const now = new Date()
  const commentDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return commentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>
```

---

## Best Practices

### 1. Error Handling

```typescript
// Good: Comprehensive error handling
const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await create('posts', formData.value)
    await router.push('/posts')
  } catch (e: any) {
    // Handle specific error types
    if (e.statusCode === 401) {
      error.value = 'Session expired. Please login again.'
      await router.push('/login')
    } else if (e.statusCode === 403) {
      error.value = 'You don't have permission to perform this action.'
    } else {
      error.value = e.message || 'An error occurred. Please try again.'
    }
    
    console.error('Submit error:', e)
  } finally {
    loading.value = false
  }
}
```

### 2. Loading States

```vue
<template>
  <div>
    <!-- Skeleton loader -->
    <div v-if="pending" class="space-y-4">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-3/4"></div>
        <div class="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
      </div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="p-4 bg-red-50 text-red-600 rounded-lg">
      <p>{{ error.message }}</p>
      <button @click="refresh" class="mt-2 text-sm underline">
        Try again
      </button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="!data?.length" class="text-center py-12">
      <p class="text-gray-600">No items found</p>
    </div>
    
    <!-- Data -->
    <div v-else>
      <!-- Your content -->
    </div>
  </div>
</template>
```

### 3. Optimistic Updates

```typescript
const handleLike = async (postId: string) => {
  // Optimistically update UI
  const post = posts.value.find(p => p.id === postId)
  if (post) {
    post.likes++
    post.liked = true
  }
  
  try {
    await update('posts', postId, {
      likes: post.likes
    })
  } catch (error) {
    // Rollback on error
    if (post) {
      post.likes--
      post.liked = false
    }
  }
}
```

### 4. Debounced Search

```typescript
const searchQuery = ref('')
const debouncedSearch = useDebounceFn(() => {
  refresh()
}, 500)

watch(searchQuery, () => {
  debouncedSearch()
})
```

### 5. Pagination

```typescript
const currentPage = ref(1)
const itemsPerPage = 20

const paginatedQuery = computed(() => ({
  limit: itemsPerPage,
  offset: (currentPage.value - 1) * itemsPerPage
}))

const { data, pending } = await fetchItems('posts', paginatedQuery.value)

const totalPages = computed(() => 
  Math.ceil((data.value?.meta?.total_count || 0) / itemsPerPage)
)
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

```typescript
// Problem: 401 errors after token expiry
// Solution: Use auto-refresh plugin or manual refresh

const { refreshToken } = useDirectusAuth()

try {
  await someRequest()
} catch (error) {
  if (error.statusCode === 401) {
    await refreshToken()
    // Retry request
    await someRequest()
  }
}
```

#### 2. Real-time Connection Issues

```typescript
// Problem: WebSocket not connecting
// Solution: Check WebSocket URL and connection

const { connected, connect } = useDirectusRealtime()

onMounted(() => {
  connect()
  
  // Monitor connection
  watch(connected, (isConnected) => {
    if (!isConnected) {
      console.log('WebSocket disconnected, reconnecting...')
      setTimeout(() => connect(), 3000)
    }
  })
})
```

#### 3. File Upload Failures

```typescript
// Problem: Large file uploads failing
// Solution: Check file size and use proper error handling

const uploadFile = async (file: File) => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 10MB.')
  }
  
  try {
    return await upload(file)
  } catch (error) {
    console.error('Upload failed:', error)
    throw new Error('Upload failed. Please try again.')
  }
}
```

---

## Additional Resources

- [Directus Documentation](https://docs.directus.io)
- [Nuxt 3 Documentation](https://nuxt.com)
- [Directus SDK Reference](https://docs.directus.io/reference/sdk.html)
- [nuxt-auth-utils](https://github.com/Atinux/nuxt-auth-utils)

---

**Need help?** Open an issue on [GitHub](https://github.com/pvenableh/directus-nuxt-layer/issues)