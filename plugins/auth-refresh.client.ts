export default defineNuxtPlugin(() => {
  const { loggedIn, refreshToken, session } = useDirectusAuth()
  
  const checkAndRefresh = async () => {
    if (!loggedIn.value) return
    
    const expiresAt = session.value?.expiresAt
    if (expiresAt) {
      const timeUntilExpiry = expiresAt - Date.now()
      
      if (timeUntilExpiry < 5 * 60 * 1000) {
        try {
          await refreshToken()
        } catch (error) {
          console.error('Auto-refresh failed:', error)
        }
      }
    }
  }

  const interval = setInterval(checkAndRefresh, 60 * 1000)
  
  checkAndRefresh()

  if (import.meta.client) {
    window.addEventListener('beforeunload', () => {
      clearInterval(interval)
    })
  }
})
