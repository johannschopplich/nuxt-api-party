import { createError, defineEventHandler, getRequestHeader, getRouterParam, readBody } from 'h3'
import { deserializeMaybeEncodedBody } from '../utils'
import type { ModuleOptions } from '../../module'
import type { EndpointFetchOptions } from '../utils'
import type { FetchError } from '../types'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event): Promise<any> => {
  const endpointId = getRouterParam(event, 'endpointId')!
  const { apiParty } = useRuntimeConfig()
  const endpoints = (apiParty as unknown as ModuleOptions).endpoints || {}
  const endpoint = endpoints[endpointId]

  if (!endpoint) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown API endpoint "${endpointId}"`,
    })
  }

  const _body = await readBody<EndpointFetchOptions>(event)

  const {
    path,
    query,
    headers,
    body,
    ...fetchOptions
  } = _body

  // Check if the path is an absolute URL
  if (new URL(path, 'http://localhost').origin !== 'http://localhost') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Absolute URLs are not allowed',
    })
  }

  // Allows to overwrite the backend url with a custom header
  // (e.g. `jsonPlaceholder` endpoint becomes `Json-Placeholder-Endpoint-Url`)
  const baseURL = new Headers(headers).get(`${endpointId}-endpoint-url`) || endpoint.url

  // Check if the base URL is in the allow list
  if (
    baseURL !== endpoint.url
    && !endpoint.allowedUrls?.includes(baseURL)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: `Base URL "${baseURL}" is not allowed`,
    })
  }

  try {
    return await globalThis.$fetch(
      path,
      {
        ...fetchOptions,
        baseURL,
        query: {
          ...endpoint.query,
          ...query,
        },
        headers: {
          ...(endpoint.token && { Authorization: `Bearer ${endpoint.token}` }),
          ...(endpoint.cookies && { cookie: getRequestHeader(event, 'cookie') }),
          ...endpoint.headers,
          ...headers,
        },
        ...(body && { body: await deserializeMaybeEncodedBody(body) }),
      },
    )
  }
  catch (error) {
    const { response } = error as FetchError

    throw createError({
      statusCode: response?.status,
      statusMessage: response?.statusText,
      data: response?._data,
    })
  }
})
