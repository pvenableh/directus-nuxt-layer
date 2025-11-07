export const useDirectusComments = () => {
  const { request: authRequest } = useAuthenticatedDirectus()
  const { user } = useUserSession()

  const fetchComments = async (
    collection: string,
    itemId: string | number,
    options: {
      fields?: string[]
      sort?: string[]
      limit?: number
    } = {}
  ) => {
    return await useAsyncData(
      `directus-comments-${collection}-${itemId}`,
      () => authRequest('activity', {
        query: {
          filter: {
            collection: { _eq: collection },
            item: { _eq: String(itemId) },
            action: { _eq: 'comment' }
          },
          fields: options.fields || ['*', 'user_created.*'],
          sort: options.sort || ['-date_created'],
          limit: options.limit,
        }
      })
    )
  }

  const addComment = async (
    collection: string,
    itemId: string | number,
    comment: string
  ) => {
    return await authRequest('activity/comment', {
      method: 'POST',
      body: {
        collection,
        item: String(itemId),
        comment,
      }
    })
  }

  const updateCommentItem = async (
    commentId: string,
    comment: string
  ) => {
    return await authRequest(`activity/comment/${commentId}`, {
      method: 'PATCH',
      body: {
        comment,
      }
    })
  }

  const deleteCommentItem = async (commentId: string) => {
    return await authRequest(`activity/comment/${commentId}`, {
      method: 'DELETE',
    })
  }

  const getCommentCount = async (
    collection: string,
    itemId: string | number
  ) => {
    const { data } = await fetchComments(collection, itemId, {
      fields: ['id'],
      limit: -1,
    })
    
    return data.value?.length || 0
  }

  const canEditComment = (comment: any) => {
    return comment.user_created?.id === user.value?.id
  }

  const canDeleteComment = (comment: any) => {
    return comment.user_created?.id === user.value?.id || 
           user.value?.role === 'administrator'
  }

  return {
    fetchComments,
    getCommentCount,
    addComment,
    updateCommentItem,
    deleteCommentItem,
    canEditComment,
    canDeleteComment,
  }
}
