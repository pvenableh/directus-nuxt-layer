import { getAdminDirectus } from '~/server/utils/directus'
import { uploadFiles } from '@directus/sdk'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  
  try {
    const form = await readMultipartFormData(event)
    
    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No file provided'
      })
    }

    const directus = await getAdminDirectus()
    
    const formData = new FormData()
    
    for (const file of form) {
      if (file.data) {
        const blob = new Blob([file.data], { type: file.type })
        formData.append('file', blob, file.filename || 'upload')
        
        if (file.name === 'title') {
          formData.append('title', file.data.toString())
        }
        if (file.name === 'folder') {
          formData.append('folder', file.data.toString())
        }
      }
    }

    const result = await directus.request(uploadFiles(formData))

    return {
      success: true,
      file: result
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'File upload failed'
    })
  }
})
