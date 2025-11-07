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
  
  // Priority 2: Fall back to static token for public access
  if (config.directus.staticToken) {
    return {
      token: config.directus.staticToken,
      type: 'static'
    }
  }
  
  // No token available
  throw createError({
    statusCode: 401,
    message: 'No authentication token available'
  })
})
