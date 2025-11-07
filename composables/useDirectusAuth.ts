/**
 * Authentication composable for Directus + Nuxt Auth Utils
 */
export const useDirectusAuth = () => {
  const { loggedIn, user, session, clear: clearSession, fetch: fetchSession } = useUserSession()
  const router = useRouter()

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      await fetchSession()
      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Login failed')
    }
  }

  const register = async (data: {
    email: string
    password: string
    firstName?: string
    lastName?: string
  }) => {
    try {
      const response = await $fetch('/api/auth/register', {
        method: 'POST',
        body: data
      })

      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Registration failed')
    }
  }

  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      await clearSession()
      await router.push('/login')
    } catch (error: any) {
      console.error('Logout error:', error)
      await clearSession()
      await router.push('/login')
    }
  }

  const refreshToken = async () => {
    try {
      await $fetch('/api/auth/refresh', { method: 'POST' })
      await fetchSession()
    } catch (error: any) {
      await clearSession()
      throw new Error('Session expired')
    }
  }

  const loginWithGitHub = () => {
    window.location.href = '/api/auth/github'
  }

  const loginWithGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  return {
    loggedIn,
    user,
    session,
    login,
    register,
    logout,
    refreshToken,
    loginWithGitHub,
    loginWithGoogle,
  }
}
