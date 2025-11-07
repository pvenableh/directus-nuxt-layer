import { getAdminDirectus } from '~/server/utils/directus'
import { readUsers, createUser } from '@directus/sdk'

export default defineOAuthGoogleEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user: googleUser, tokens }) {
    try {
      const directus = await getAdminDirectus()
      
      const existingUsers = await directus.request(
        readUsers({
          filter: {
            external_identifier: { _eq: googleUser.sub },
            provider: { _eq: 'google' }
          }
        })
      )
      
      let directusUser
      
      if (existingUsers.length > 0) {
        directusUser = existingUsers[0]
      } else {
        directusUser = await directus.request(
          createUser({
            email: googleUser.email,
            first_name: googleUser.given_name,
            last_name: googleUser.family_name,
            provider: 'google',
            external_identifier: googleUser.sub,
            role: 'authenticated',
            status: 'active',
          })
        )
      }

      await setUserSession(event, {
        user: {
          id: directusUser.id,
          email: directusUser.email,
          firstName: directusUser.first_name,
          lastName: directusUser.last_name,
          role: typeof directusUser.role === 'object' ? directusUser.role.name : directusUser.role,
          avatar: googleUser.picture,
          provider: 'google',
        },
        loggedInAt: Date.now(),
      })

      return sendRedirect(event, '/')
    } catch (error: any) {
      console.error('Google OAuth error:', error)
      return sendRedirect(event, '/login?error=oauth_failed')
    }
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  }
})
