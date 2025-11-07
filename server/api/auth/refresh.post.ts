import { createServerDirectus } from '~/server/utils/directus'
import { refresh, readMe } from '@directus/sdk'

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
