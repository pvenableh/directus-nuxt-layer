import { 
  createDirectus, 
  rest, 
  authentication, 
  staticToken,
} from '@directus/sdk'

function createBaseClient(url: string) {
  return createDirectus(url)
}

export function createServerDirectus() {
  const config = useRuntimeConfig()
  
  return createBaseClient(config.directus.url)
    .with(rest())
    .with(authentication('json'))
}

export function createServerDirectusWithToken(token: string) {
  const config = useRuntimeConfig()
  
  return createBaseClient(config.directus.url)
    .with(staticToken(token))
    .with(rest())
}

export async function getAdminDirectus() {
  const config = useRuntimeConfig()
  const client = createServerDirectus()
  
  if (config.directus.staticToken) {
    return createServerDirectusWithToken(config.directus.staticToken)
  }
  
  await client.login(
    config.directus.adminEmail,
    config.directus.adminPassword
  )
  
  return client
}

export async function getUserFromToken(token: string) {
  const client = createServerDirectusWithToken(token)
  const { readMe } = await import('@directus/sdk')
  
  try {
    return await client.request(readMe())
  } catch (error) {
    return null
  }
}
