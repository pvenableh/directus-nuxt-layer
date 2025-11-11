export default defineNuxtConfig({
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
