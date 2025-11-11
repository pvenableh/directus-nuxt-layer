import { passwordReset } from '@directus/sdk'
import { getAdminDirectus } from '../../utils/directus'

export default defineEventHandler(async (event) => {
  const { token, password } = await readBody(event)

  if (!token || !password) {
    throw createError({
      statusCode: 400,
      message: 'Token and password are required'
    })
  }

  try {
    const directus = await getAdminDirectus()
    
    await directus.request(passwordReset(token, password))

    return {
      success: true,
      message: 'Password reset successfully'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message || 'Password reset failed. Token may be invalid or expired.'
    })
  }
})
