import { 
  readNotifications, 
  readNotification,
} from '@directus/sdk'

export const useDirectusNotifications = () => {
  const { request: authRequest } = useAuthenticatedDirectus()
  const { client } = useDirectus()
  const { user } = useUserSession()

  const fetchNotifications = async (options: {
    fields?: string[]
    filter?: Record<string, any>
    sort?: string[]
    limit?: number
    offset?: number
    unreadOnly?: boolean
  } = {}) => {
    const filter = options.unreadOnly 
      ? { 
          recipient: { _eq: user.value?.id },
          status: { _eq: 'inbox' },
          ...options.filter 
        }
      : { 
          recipient: { _eq: user.value?.id },
          ...options.filter 
        }

    return await useAsyncData(
      `directus-notifications-${JSON.stringify(options)}`,
      () => client.request(
        readNotifications({
          fields: options.fields || ['*'],
          filter,
          sort: options.sort || ['-timestamp'],
          limit: options.limit,
          offset: options.offset,
        })
      )
    )
  }

  const fetchNotification = async (id: string) => {
    return await useAsyncData(
      `directus-notification-${id}`,
      () => client.request(readNotification(id))
    )
  }

  const getUnreadCount = async () => {
    const { data } = await fetchNotifications({
      unreadOnly: true,
      fields: ['id'],
      limit: -1,
    })
    
    return data.value?.length || 0
  }

  const markAsRead = async (notificationId: string) => {
    return await authRequest(`notifications/${notificationId}`, {
      method: 'PATCH',
      body: {
        status: 'archived',
      }
    })
  }

  const markManyAsRead = async (notificationIds: string[]) => {
    return await authRequest('notifications', {
      method: 'PATCH',
      body: {
        keys: notificationIds,
        data: {
          status: 'archived',
        }
      }
    })
  }

  const markAllAsRead = async () => {
    return await authRequest('notifications', {
      method: 'PATCH',
      body: {
        query: {
          filter: {
            recipient: { _eq: user.value?.id },
            status: { _eq: 'inbox' }
          }
        },
        data: {
          status: 'archived',
        }
      }
    })
  }

  const createNotificationItem = async (notification: {
    recipient: string
    subject: string
    message?: string
    collection?: string
    item?: string
  }) => {
    return await authRequest('notifications', {
      method: 'POST',
      body: {
        ...notification,
        status: 'inbox',
        timestamp: new Date().toISOString(),
      }
    })
  }

  const deleteNotificationItem = async (notificationId: string) => {
    return await authRequest(`notifications/${notificationId}`, {
      method: 'DELETE',
    })
  }

  const deleteManyNotifications = async (notificationIds: string[]) => {
    return await authRequest('notifications', {
      method: 'DELETE',
      body: notificationIds,
    })
  }

  return {
    fetchNotifications,
    fetchNotification,
    getUnreadCount,
    markAsRead,
    markManyAsRead,
    markAllAsRead,
    createNotificationItem,
    deleteNotificationItem,
    deleteManyNotifications,
  }
}
