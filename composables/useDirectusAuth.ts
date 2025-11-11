/**
 * Authentication composable for Directus + Nuxt Auth Utils
 * 
 * COMPLETE VERSION with password reset and user invitations
 */
export const useDirectusAuth = () => {
  const { loggedIn, user, session, clear: clearSession, fetch: fetchSession } = useUserSession()
  const router = useRouter()

  // ===== BASIC AUTH =====
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

  // ===== PASSWORD RESET =====
  const requestPasswordReset = async (email: string) => {
    try {
      const response = await $fetch('/api/auth/password-request', {
        method: 'POST',
        body: { email }
      })
      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Password reset request failed')
    }
  }

  const resetPassword = async (token: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/password-reset', {
        method: 'POST',
        body: { token, password }
      })
      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Password reset failed')
    }
  }

  // ===== USER INVITATIONS =====
  const inviteUser = async (email: string, role?: string) => {
    try {
      const response = await $fetch('/api/auth/invite', {
        method: 'POST',
        body: { email, role }
      })
      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Failed to send invitation')
    }
  }

  const acceptInvite = async (token: string, password: string) => {
    try {
      const response = await $fetch('/api/auth/accept-invite', {
        method: 'POST',
        body: { token, password }
      })
      
      await fetchSession()
      return response
    } catch (error: any) {
      throw new Error(error.data?.message || 'Failed to accept invitation')
    }
  }

  // ===== OAUTH =====
  const loginWithGitHub = () => {
    window.location.href = '/api/auth/github'
  }

  const loginWithGoogle = () => {
    window.location.href = '/api/auth/google'
  }

  return {
    // State
    loggedIn,
    user,
    session,
    
    // Basic Auth
    login,
    register,
    logout,
    refreshToken,
    
    // Password Reset
    requestPasswordReset,
    resetPassword,
    
    // User Invitations
    inviteUser,
    acceptInvite,
    
    // OAuth
    loginWithGitHub,
    loginWithGoogle,
  }
}
