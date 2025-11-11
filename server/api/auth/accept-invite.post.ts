import { acceptUserInvite, readMe } from '@directus/sdk'
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
