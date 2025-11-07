export const useDirectusFiles = () => {
  const config = useRuntimeConfig()
  const { request: authRequest } = useAuthenticatedDirectus()

  /**
   * Get file URL
   */
  const getFileUrl = (fileId: string, options?: {
    width?: number
    height?: number
    quality?: number
    fit?: 'cover' | 'contain' | 'inside' | 'outside'
    format?: 'jpg' | 'png' | 'webp' | 'tiff'
  }) => {
    const params = new URLSearchParams()
    
    if (options?.width) params.append('width', options.width.toString())
    if (options?.height) params.append('height', options.height.toString())
    if (options?.quality) params.append('quality', options.quality.toString())
    if (options?.fit) params.append('fit', options.fit)
    if (options?.format) params.append('format', options.format)

    const queryString = params.toString()
    const base = `${config.public.directus.url}/assets/${fileId}`
    
    return queryString ? `${base}?${queryString}` : base
  }

  /**
   * Upload file
   */
  const uploadFile = async (
    file: File,
    options?: {
      title?: string
      folder?: string
      description?: string
    }
  ) => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (options?.title) formData.append('title', options.title)
    if (options?.folder) formData.append('folder', options.folder)
    if (options?.description) formData.append('description', options.description)

    return await $fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    })
  }

  /**
   * Upload multiple files
   */
  const uploadFiles = async (
    files: File[],
    options?: {
      folder?: string
    }
  ) => {
    const uploads = files.map(file => 
      uploadFile(file, { 
        title: file.name,
        folder: options?.folder 
      })
    )
    
    return await Promise.all(uploads)
  }

  /**
   * Delete file
   */
  const deleteFile = async (fileId: string) => {
    return await authRequest(`files/${fileId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Update file metadata
   */
  const updateFile = async (
    fileId: string,
    data: any
  ) => {
    return await authRequest(`files/${fileId}`, {
      method: 'PATCH',
      body: data,
    })
  }

  /**
   * Get file metadata
   */
  const getFile = async (fileId: string) => {
    return await authRequest(`files/${fileId}`)
  }

  return {
    getFileUrl,
    uploadFile,
    uploadFiles,
    deleteFile,
    updateFile,
    getFile,
  }
}
