declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role?: string
    avatar?: string
    provider?: 'local' | 'github' | 'google' | string
  }

  interface UserSession {
    user: User
    loggedInAt: number
    expiresAt?: number
  }

  interface SecureSessionData {
    directusAccessToken?: string
    directusRefreshToken?: string
  }
}

export {}
