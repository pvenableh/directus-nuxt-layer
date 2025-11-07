export default defineEventHandler(async (event) => {
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
    
    const response = await $fetch(`${useRuntimeConfig().directus.url}/${path}`, {
      method: method as any,
      headers: {
        'Authorization': `Bearer ${session.secure.directusAccessToken}`,
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
        const response = await $fetch(`${useRuntimeConfig().directus.url}/${path}`, {
          method: method as any,
          headers: {
            'Authorization': `Bearer ${newSession.secure?.directusAccessToken}`,
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
