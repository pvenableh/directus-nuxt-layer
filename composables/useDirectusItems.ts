import { 
  readItems, 
  readItem, 
  aggregate
} from '@directus/sdk'

export const useDirectusItems = () => {
  const { client } = useDirectus()
  const { request: authRequest } = useAuthenticatedDirectus()

  /**
   * READ operations (public)
   */
  const fetchItems = async (
    collection: string,
    options: {
      fields?: string[]
      filter?: Record<string, any>
      sort?: string[]
      limit?: number
      offset?: number
      page?: number
      search?: string
      deep?: Record<string, any>
    } = {}
  ) => {
    return await useAsyncData(
      `directus-${collection}-${JSON.stringify(options)}`,
      () => client.request(
        readItems(collection, options as any)
      )
    )
  }

  const fetchItem = async (
    collection: string,
    id: string | number,
    options: {
      fields?: string[]
      deep?: Record<string, any>
    } = {}
  ) => {
    return await useAsyncData(
      `directus-${collection}-${id}`,
      () => client.request(
        readItem(collection, id, options as any)
      )
    )
  }

  const fetchItemsLazy = async (
    collection: string,
    options = {}
  ) => {
    return await useLazyAsyncData(
      `directus-${collection}-lazy-${JSON.stringify(options)}`,
      () => client.request(
        readItems(collection, options as any)
      )
    )
  }

  /**
   * AGGREGATE operations (public)
   */
  const aggregateItems = async (
    collection: string,
    options: {
      aggregate: {
        avg?: string[]
        avgDistinct?: string[]
        count?: string[]
        countDistinct?: string[]
        sum?: string[]
        sumDistinct?: string[]
        min?: string[]
        max?: string[]
      }
      groupBy?: string[]
      filter?: Record<string, any>
    }
  ) => {
    return await useAsyncData(
      `directus-${collection}-aggregate`,
      () => client.request(
        aggregate(collection, options as any)
      )
    )
  }

  /**
   * CREATE operations (authenticated)
   */
  const create = async (
    collection: string,
    item: any
  ) => {
    return await authRequest(`items/${collection}`, {
      method: 'POST',
      body: item,
    })
  }

  const createMany = async (
    collection: string,
    items: any[]
  ) => {
    return await authRequest(`items/${collection}`, {
      method: 'POST',
      body: items,
    })
  }

  /**
   * UPDATE operations (authenticated)
   */
  const update = async (
    collection: string,
    id: string | number,
    item: any
  ) => {
    return await authRequest(`items/${collection}/${id}`, {
      method: 'PATCH',
      body: item,
    })
  }

  const updateMany = async (
    collection: string,
    ids: (string | number)[],
    item: any
  ) => {
    return await authRequest(`items/${collection}`, {
      method: 'PATCH',
      body: {
        keys: ids,
        data: item,
      },
    })
  }

  const updateByQuery = async (
    collection: string,
    query: Record<string, any>,
    item: any
  ) => {
    return await authRequest(`items/${collection}`, {
      method: 'PATCH',
      body: item,
      query,
    })
  }

  /**
   * DELETE operations (authenticated)
   */
  const deleteOne = async (
    collection: string,
    id: string | number
  ) => {
    return await authRequest(`items/${collection}/${id}`, {
      method: 'DELETE',
    })
  }

  const deleteMany = async (
    collection: string,
    ids: (string | number)[]
  ) => {
    return await authRequest(`items/${collection}`, {
      method: 'DELETE',
      body: ids,
    })
  }

  /**
   * Utility: Refresh data
   */
  const refresh = async (key?: string) => {
    if (key) {
      await refreshNuxtData(key)
    } else {
      await refreshNuxtData()
    }
  }

  return {
    // Read
    fetchItems,
    fetchItem,
    fetchItemsLazy,
    
    // Aggregate
    aggregateItems,
    
    // Create
    create,
    createMany,
    
    // Update
    update,
    updateMany,
    updateByQuery,
    
    // Delete
    deleteOne,
    deleteMany,
    
    // Utilities
    refresh,
  }
}
