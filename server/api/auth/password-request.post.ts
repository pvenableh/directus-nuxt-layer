import { passwordRequest } from '@directus/sdk'
import { getAdminDirectus } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required'
    })
  }

  try {
    const config = useRuntimeConfig()
    const directus = await getAdminDirectus()
    
    // Send password reset email
    await directus.request(
      passwordRequest(email, `${config.public.appUrl}/auth/reset-password`)
    )

    // Always return success (don't reveal if email exists)
    return {
      success: true,
      message: 'If an account exists, a password reset email was sent'
    }
  } catch (error: any) {
    // Don't expose errors - always return success for security
    return {
      success: true,
      message: 'If an account exists, a password reset email was sent'
    }
  }
})
