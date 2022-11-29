import { createError, defineEventHandler, readBody } from 'h3'
import type { FetchError } from 'ofetch'
import type { ModuleOptions } from '../../../module'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<any> => {
  const body = await readBody<{
    path: string
    headers: Record<string, string>
    endpoint: string
  }>(event)

  const { path, headers } = body
  const { apiParty } = useRuntimeConfig()
  const endpoint = (apiParty.endpoints as ModuleOptions['endpoints'])![body.endpoint]

  try {
    return await $fetch(path, {
      baseURL: endpoint.url,
      headers: {
        ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
        ...endpoint.headers,
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
