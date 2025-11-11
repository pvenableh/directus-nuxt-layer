import { inviteUser } from '@directus/sdk'
import { getAdminDirectus } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  
  // Check if user has permission to invite
  if (session.user.role !== 'administrator') {
    throw createError({
      statusCode: 403,
      message: 'Only administrators can invite users'
    })
  }

  const { email, role } = await readBody(event)

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required'
    })
  }

  try {
    const config = useRuntimeConfig()
    const directus = await getAdminDirectus()
    
    await directus.request(
      inviteUser(
        email,
        role || 'authenticated',
        `${config.public.appUrl}/auth/accept-invite`
      )
    )

    return {
      success: true,
      message: 'Invitation sent successfully'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message || 'Failed to send invitation'
    })
  }
})
