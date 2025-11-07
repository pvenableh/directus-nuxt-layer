import { getAdminDirectus } from '~/server/utils/directus'
import { createUser } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  const { email, password, firstName, lastName } = await readBody(event)

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required'
    })
  }

  try {
    const directus = await getAdminDirectus()
    
    const newUser = await directus.request(
      createUser({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role: 'authenticated',
        status: 'active',
      })
    )

    return {
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message || 'Registration failed'
    })
  }
})
