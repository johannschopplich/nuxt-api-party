import { createError, defineEventHandler, readBody } from 'h3'
import type { FetchError } from 'ohmyfetch'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<any> => {
  const body = await readBody(event)
  const uri: string = body.uri || ''
  const headers: Record<string, string> = body.headers || {}
  const { apiParty } = useRuntimeConfig()

  try {
    return await $fetch(uri, {
      baseURL: apiParty.url,
      headers: {
        ...(apiParty.token && { Authorization: `Bearer ${apiParty.token}` }),
        ...headers,
      },
    })
  }
  catch (err) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Couldn\'t fetch API data',
      data: (err as FetchError).message,
    })
  }
})
