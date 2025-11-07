export default defineEventHandler(async (event) => {
  try {
    await clearUserSession(event)
    
    return {
      success: true,
      message: 'Logged out successfully'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: 'Failed to logout'
    })
  }
})
