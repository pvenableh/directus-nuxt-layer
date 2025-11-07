import { readUsers, createUser } from '@directus/sdk'
import { getAdminDirectus } from '../../utils/directus'

export default defineOAuthGitHubEventHandler({
  config: {
    emailRequired: true,
  },
  async onSuccess(event, { user: githubUser, tokens }) {
    try {
      const directus = await getAdminDirectus()
      
      const existingUsers = await directus.request(
        readUsers({
          filter: {
            external_identifier: { _eq: githubUser.id.toString() },
            provider: { _eq: 'github' }
          }
        })
      )
      
      let directusUser
      
      if (existingUsers.length > 0) {
        directusUser = existingUsers[0]
      } else {
        directusUser = await directus.request(
          createUser({
            email: githubUser.email,
            first_name: githubUser.name?.split(' ')[0],
            last_name: githubUser.name?.split(' ').slice(1).join(' '),
            provider: 'github',
            external_identifier: githubUser.id.toString(),
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
          avatar: githubUser.avatar_url,
          provider: 'github',
        },
        loggedInAt: Date.now(),
      })

      return sendRedirect(event, '/')
    } catch (error: any) {
      console.error('GitHub OAuth error:', error)
      return sendRedirect(event, '/login?error=oauth_failed')
    }
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  }
})
