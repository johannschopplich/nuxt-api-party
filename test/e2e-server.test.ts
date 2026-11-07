import { join } from 'node:path'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { recordingEndpoints, startRecordingServer } from './helpers/recording-server'

describe('nuxt-api-party server', async () => {
  const backend = await startRecordingServer()
  beforeEach(() => {
    backend.requests.length = 0
  })
  afterAll(() => backend.close())

  await setup({
    server: true,
    rootDir: join(import.meta.dirname, 'fixture'),
    nuxtConfig: {
      apiParty: {
        endpoints: recordingEndpoints(backend.host),
      },
    },
  })

  it('fires the api-party:request and api-party:response hooks with the endpoint ID and no event', async () => {
    const response = await fetch('/api/server-request/backendApi/articles')

    expect(backend.requests[0]!.headers['x-nitro-endpoint-id']).toBe('backendApi')
    expect(response.headers.get('x-nitro-endpoint-id')).toBeNull()
    expect(await response.json()).toEqual({ endpointId: 'backendApi' })
  })

  it('sends the endpoint token in place of the authorization in the endpoint headers', async () => {
    await fetch('/api/server-request/tokenApi/articles')

    expect(backend.requests[0]!.headers.authorization).toBe('Bearer endpoint-token')
  })

  it('lets the authorization header of a call replace the endpoint token', async () => {
    await fetch('/api/server-request/tokenApi/articles?authorization=Basic%20call')

    expect(backend.requests[0]!.headers.authorization).toBe('Basic call')
  })

  it('rejects a lone surrogate path parameter instead of throwing', async () => {
    const response = await fetch('/api/server-rejection')

    expect(await response.json()).toEqual({ errorName: 'URIError' })
  })

  it('leaves an upstream redirect unfollowed', async () => {
    await fetch('/api/server-request/backendApi/redirect')

    expect(backend.requestUrls).toEqual(['/base/redirect'])
  })
})
