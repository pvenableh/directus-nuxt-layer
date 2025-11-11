export default defineEventHandler(async (event) => {
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
