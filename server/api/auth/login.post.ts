import { createServerDirectus } from '~/server/utils/directus'
import { readMe } from '@directus/sdk'

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
