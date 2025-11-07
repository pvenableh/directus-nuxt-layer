import { createDirectus, rest } from '@directus/sdk'

/**
 * Public Directus client (read-only, unauthenticated)
 */
export const useDirectus = () => {
  const config = useRuntimeConfig()
  
  const client = createDirectus(config.public.directus.url)
    .with(rest())

  return {
    client,
  }
}

/**
 * Authenticated Directus requests via API proxy
 */
export const useAuthenticatedDirectus = () => {
  const { loggedIn } = useUserSession()
  
  const makeRequest = async <T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
      body?: any
      query?: Record<string, any>
    } = {}
  ): Promise<T> => {
    if (!loggedIn.value) {
      throw createError({
        statusCode: 401,
        message: 'Authentication required'
      })
    }

    const { method = 'GET', body, query } = options
    
    return await $fetch(`/api/directus/${endpoint}`, {
      method,
      body,
      query,
    })
  }

  return {
    request: makeRequest,
  }
}
