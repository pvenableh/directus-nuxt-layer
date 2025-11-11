#!/usr/bin/env node

/**
 * Directus Nuxt Layer - Server Files Setup (COMPLETE VERSION)
 * Includes: Auth, OAuth, Password Reset, User Invitations, Realtime
 * Run with: node setup-server.js
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
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  createDirectory(dir);
  fs.writeFileSync(filePath, content);
  log(`✓ Created: ${filePath}`, "green");
}

const serverFiles = {
  "server/utils/directus.ts": `import { 
  createDirectus, 
  rest, 
  authentication, 
  staticToken,
} from '@directus/sdk'

function createBaseClient(url: string) {
  return createDirectus(url)
}

export function createServerDirectus() {
  const config = useRuntimeConfig()
  
  return createBaseClient(config.directus.url)
    .with(rest())
    .with(authentication('json'))
}

export function createServerDirectusWithToken(token: string) {
  const config = useRuntimeConfig()
  
  return createBaseClient(config.directus.url)
    .with(staticToken(token))
    .with(rest())
}

export async function getAdminDirectus() {
  const config = useRuntimeConfig()
  const client = createServerDirectus()
  
  if (config.directus.staticToken) {
    return createServerDirectusWithToken(config.directus.staticToken)
  }
  
  await client.login(
    config.directus.adminEmail,
    config.directus.adminPassword
  )
  
  return client
}

export async function getUserFromToken(token: string) {
  const client = createServerDirectusWithToken(token)
  const { readMe } = await import('@directus/sdk')
  
  try {
    return await client.request(readMe())
  } catch (error) {
    return null
  }
}
`,

  "server/api/auth/login.post.ts": `import { readMe } from '@directus/sdk'
import { createServerDirectus } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required'
    })
  }

  try {
    const directus = createServerDirectus()
    
    const authResult = await directus.login(email, password)
    const user = await directus.request(readMe())

    const expiresAt = Date.now() + (authResult.expires * 1000)

    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: typeof user.role === 'object' ? user.role.name : user.role,
        avatar: user.avatar,
        provider: 'local',
      },
      loggedInAt: Date.now(),
      expiresAt,
    }, {
      secure: {
        directusAccessToken: authResult.access_token,
        directusRefreshToken: authResult.refresh_token,
      }
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 401,
      message: error.message || 'Invalid credentials'
    })
  }
})
`,

  "server/api/auth/logout.post.ts": `export default defineEventHandler(async (event) => {
  try {
    await clearUserSession(event)
    
    return {
      success: true,
      message: 'Logged out successfully'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: 'Failed to logout'
    })
  }
})
`,

  "server/api/auth/refresh.post.ts": `import { refresh, readMe } from '@directus/sdk'
import { createServerDirectus } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (!session?.secure?.directusRefreshToken) {
    throw createError({
      statusCode: 401,
      message: 'No refresh token available'
    })
  }

  try {
    const directus = createServerDirectus()
    
    const authResult = await directus.request(
      refresh('json', session.secure.directusRefreshToken)
    )

    directus.setToken(authResult.access_token)
    const user = await directus.request(readMe())

    const expiresAt = Date.now() + (authResult.expires * 1000)

    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: typeof user.role === 'object' ? user.role.name : user.role,
        avatar: user.avatar,
        provider: session.user.provider,
      },
      loggedInAt: session.loggedInAt,
      expiresAt,
    }, {
      secure: {
        directusAccessToken: authResult.access_token,
        directusRefreshToken: authResult.refresh_token,
      }
    })

    return {
      success: true,
      expiresIn: authResult.expires
    }
  } catch (error: any) {
    await clearUserSession(event)
    
    throw createError({
      statusCode: 401,
      message: 'Failed to refresh token'
    })
  }
})
`,

  "server/api/auth/register.post.ts": `import { createUser } from '@directus/sdk'
import { getAdminDirectus } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const { email, password, firstName, lastName } = await readBody(event)

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required'
    })
  }

  try {
    const directus = await getAdminDirectus()
    
    const newUser = await directus.request(
      createUser({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: 'authenticated',
        status: 'active',
      })
    )

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message || 'Registration failed'
    })
  }
})
`,

  "server/api/auth/password-request.post.ts": `import { passwordRequest } from '@directus/sdk'
import { getAdminDirectus } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required'
    })
  }

  try {
    const config = useRuntimeConfig()
    const directus = await getAdminDirectus()
    
    // Send password reset email
    await directus.request(
      passwordRequest(email, \`\${config.public.appUrl}/auth/reset-password\`)
    )

    // Always return success (don't reveal if email exists)
    return {
      success: true,
      message: 'If an account exists, a password reset email was sent'
    }
  } catch (error: any) {
    // Don't expose errors - always return success for security
    return {
      success: true,
      message: 'If an account exists, a password reset email was sent'
    }
  }
})
`,

  "server/api/auth/password-reset.post.ts": `import { passwordReset } from '@directus/sdk'
import { getAdminDirectus } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const { token, password } = await readBody(event)

  if (!token || !password) {
    throw createError({
      statusCode: 400,
      message: 'Token and password are required'
    })
  }

  try {
    const directus = await getAdminDirectus()
    
    await directus.request(passwordReset(token, password))

    return {
      success: true,
      message: 'Password reset successfully'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message || 'Password reset failed. Token may be invalid or expired.'
    })
  }
})
`,

  "server/api/auth/invite.post.ts": `import { inviteUser } from '@directus/sdk'
import { getAdminDirectus } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  
  // Check if user has permission to invite
  if (session.user.role !== 'administrator') {
    throw createError({
      statusCode: 403,
      message: 'Only administrators can invite users'
    })
  }

  const { email, role } = await readBody(event)

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required'
    })
  }

  try {
    const config = useRuntimeConfig()
    const directus = await getAdminDirectus()
    
    await directus.request(
      inviteUser(
        email,
        role || 'authenticated',
        \`\${config.public.appUrl}/auth/accept-invite\`
      )
    )

    return {
      success: true,
      message: 'Invitation sent successfully'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message || 'Failed to send invitation'
    })
  }
})
`,

  "server/api/auth/accept-invite.post.ts": `import { acceptUserInvite, readMe } from '@directus/sdk'
import { createServerDirectus } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const { token, password } = await readBody(event)

  if (!token || !password) {
    throw createError({
      statusCode: 400,
      message: 'Token and password are required'
    })
  }

  try {
    const directus = createServerDirectus()
    
    // Accept the invitation
    const authResult = await directus.request(acceptUserInvite(token, password))
    
    // Get user info
    directus.setToken(authResult.access_token)
    const user = await directus.request(readMe())

    // Create session
    const expiresAt = Date.now() + (authResult.expires * 1000)

    await setUserSession(event, {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: typeof user.role === 'object' ? user.role.name : user.role,
        avatar: user.avatar,
        provider: 'local',
      },
      loggedInAt: Date.now(),
      expiresAt,
    }, {
      secure: {
        directusAccessToken: authResult.access_token,
        directusRefreshToken: authResult.refresh_token,
      }
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message || 'Failed to accept invitation'
    })
  }
})
`,

  "server/api/auth/github.get.ts": `import { readUsers, createUser } from '@directus/sdk'
import { getAdminDirectus } from '../../utils/directus'

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user: githubUser, tokens }) {
    try {
      const directus = await getAdminDirectus()
      
      const existingUsers = await directus.request(
        readUsers({
          filter: {
            external_identifier: { _eq: githubUser.id.toString() },
            provider: { _eq: 'github' }
          }
        })
      )
      
      let directusUser
      
      if (existingUsers.length > 0) {
        directusUser = existingUsers[0]
      } else {
        directusUser = await directus.request(
          createUser({
            email: githubUser.email,
            first_name: githubUser.name?.split(' ')[0],
            last_name: githubUser.name?.split(' ').slice(1).join(' '),
            provider: 'github',
            external_identifier: githubUser.id.toString(),
            role: 'authenticated',
            status: 'active',
          })
        )
      }

      await setUserSession(event, {
        user: {
          id: directusUser.id,
          email: directusUser.email,
          firstName: directusUser.first_name,
          lastName: directusUser.last_name,
          role: typeof directusUser.role === 'object' ? directusUser.role.name : directusUser.role,
          avatar: githubUser.avatar_url,
          provider: 'github',
        },
        loggedInAt: Date.now(),
      })

      return sendRedirect(event, '/')
    } catch (error: any) {
      console.error('GitHub OAuth error:', error)
      return sendRedirect(event, '/login?error=oauth_failed')
    }
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  }
})
`,

  "server/api/auth/google.get.ts": `import { readUsers, createUser } from '@directus/sdk'
import { getAdminDirectus } from '../../utils/directus'

export default defineOAuthGoogleEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user: googleUser, tokens }) {
    try {
      const directus = await getAdminDirectus()
      
      const existingUsers = await directus.request(
        readUsers({
          filter: {
            external_identifier: { _eq: googleUser.sub },
            provider: { _eq: 'google' }
          }
        })
      )
      
      let directusUser
      
      if (existingUsers.length > 0) {
        directusUser = existingUsers[0]
      } else {
        directusUser = await directus.request(
          createUser({
            email: googleUser.email,
            first_name: googleUser.given_name,
            last_name: googleUser.family_name,
            provider: 'google',
            external_identifier: googleUser.sub,
            role: 'authenticated',
            status: 'active',
          })
        )
      }

      await setUserSession(event, {
        user: {
          id: directusUser.id,
          email: directusUser.email,
          firstName: directusUser.first_name,
          lastName: directusUser.last_name,
          role: typeof directusUser.role === 'object' ? directusUser.role.name : directusUser.role,
          avatar: googleUser.picture,
          provider: 'google',
        },
        loggedInAt: Date.now(),
      })

      return sendRedirect(event, '/')
    } catch (error: any) {
      console.error('Google OAuth error:', error)
      return sendRedirect(event, '/login?error=oauth_failed')
    }
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  }
})
`,

  "server/api/directus/[...path].ts": `export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  
  const path = event.context.params?.path || ''
  const method = event.method
  const query = getQuery(event)
  
  if (!session?.secure?.directusAccessToken) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated'
    })
  }

  try {
    const body = ['POST', 'PATCH', 'PUT'].includes(method) 
      ? await readBody(event) 
      : undefined
    
    const response = await $fetch(\`\${useRuntimeConfig().directus.url}/\${path}\`, {
      method: method as any,
      headers: {
        'Authorization': \`Bearer \${session.secure.directusAccessToken}\`,
        'Content-Type': 'application/json',
      },
      body,
      query,
    })

    return response
  } catch (error: any) {
    if (error.statusCode === 401) {
      try {
        await $fetch('/api/auth/refresh', { method: 'POST' })
        
        const newSession = await getUserSession(event)
        const response = await $fetch(\`\${useRuntimeConfig().directus.url}/\${path}\`, {
          method: method as any,
          headers: {
            'Authorization': \`Bearer \${newSession.secure?.directusAccessToken}\`,
            'Content-Type': 'application/json',
          },
          body: ['POST', 'PATCH', 'PUT'].includes(method) ? await readBody(event) : undefined,
          query,
        })
        
        return response
      } catch (refreshError) {
        throw createError({
          statusCode: 401,
          message: 'Session expired'
        })
      }
    }
    
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Request failed'
    })
  }
})
`,

  "server/api/files/upload.post.ts": `import { uploadFiles } from '@directus/sdk'
import { getAdminDirectus } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  
  try {
    const form = await readMultipartFormData(event)
    
    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file provided'
      })
    }

    const directus = await getAdminDirectus()
    
    const formData = new FormData()
    
    for (const file of form) {
      if (file.data) {
        const blob = new Blob([file.data], { type: file.type })
        formData.append('file', blob, file.filename || 'upload')
        
        if (file.name === 'title') {
          formData.append('title', file.data.toString())
        }
        if (file.name === 'folder') {
          formData.append('folder', file.data.toString())
        }
      }
    }

    const result = await directus.request(uploadFiles(formData))

    return {
      success: true,
      file: result
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'File upload failed'
    })
  }
})
`,

  "server/api/websocket/token.get.ts": `export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const session = await getUserSession(event)
  
  // Priority 1: Use user's access token if logged in
  if (session?.secure?.directusAccessToken) {
    return {
      token: session.secure.directusAccessToken,
      type: 'user'
    }
  }
  
  // Priority 2: Fall back to static token for public/anonymous access
  if (config.directus.staticToken) {
    return {
      token: config.directus.staticToken,
      type: 'static'
    }
  }
  
  // Priority 3: Try to get admin token as last resort
  if (config.directus.adminEmail && config.directus.adminPassword) {
    try {
      const { createServerDirectus } = await import('../../utils/directus')
      const directus = createServerDirectus()
      const authResult = await directus.login(
        config.directus.adminEmail,
        config.directus.adminPassword
      )
      
      return {
        token: authResult.access_token,
        type: 'admin'
      }
    } catch (error) {
      console.error('Failed to get admin token:', error)
    }
  }
  
  // No token available
  throw createError({
    statusCode: 401,
    message: 'No authentication token available'
  })
})
`,

  "middleware/auth.ts": `export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/login')
  }
})
`,

  "middleware/guest.ts": `export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn } = useUserSession()

  if (loggedIn.value) {
    return navigateTo('/')
  }
})
`,

  "plugins/auth-refresh.client.ts": `export default defineNuxtPlugin(() => {
  const { loggedIn, refreshToken, session } = useDirectusAuth()
  
  const checkAndRefresh = async () => {
    if (!loggedIn.value) return
    
    const expiresAt = session.value?.expiresAt
    if (expiresAt) {
      const timeUntilExpiry = expiresAt - Date.now()
      
      // Refresh if expiring in less than 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000) {
        try {
          await refreshToken()
        } catch (error) {
          console.error('Auto-refresh failed:', error)
        }
      }
    }
  }

  // Check every minute
  const interval = setInterval(checkAndRefresh, 60 * 1000)
  
  // Check immediately
  checkAndRefresh()

  // Cleanup on unload
  if (import.meta.client) {
    window.addEventListener('beforeunload', () => {
      clearInterval(interval)
    })
  }
})
`,
};

log(
  "\n🚀 Setting up COMPLETE server files with all auth features...\n",
  "blue"
);

Object.entries(serverFiles).forEach(([filePath, content]) => {
  writeFile(filePath, content);
});

log("\n✨ Complete server setup finished!\n", "green");
log("\n📦 What was created:", "blue");
log("• ✅ Basic Auth (login, logout, register, refresh)");
log("• ✅ OAuth (GitHub, Google)");
log("• ✅ Password Reset (request + reset)");
log("• ✅ User Invitations (invite + accept)");
log("• ✅ File Upload");
log("• ✅ Directus Proxy");
log("• ✅ WebSocket Token (for realtime)");
log("• ✅ Middleware (auth, guest)");
log("• ✅ Auto-refresh Plugin");

log("\n⚠️  Don't forget to add to your .env:", "yellow");
log("PUBLIC_APP_URL=http://localhost:3000  # For reset links");

log("\n🔄 Next steps:", "blue");
log("1. pnpm install");
log("2. Update your nuxt.config.ts with appUrl in runtimeConfig");
log("3. Run setup-layer.js for composables");
log("4. Configure environment variables");
log("");
