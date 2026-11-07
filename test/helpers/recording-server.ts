import type { IncomingHttpHeaders } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'
import { ALLOWED_ROUTES } from './allowed-routes'

/** Paths that name a host of their own, with `{host}` standing in for that host. */
export const ABSOLUTE_PATH_TEMPLATES = [
  'http://{host}/stolen',
  '//{host}/stolen',
  'http:{host}/stolen',
  'http:/{host}/stolen',
  'HTTP:{host}/stolen',
  ' http:{host}/stolen',
  ' http://{host}/stolen',
  '﻿http://{host}/stolen',
  '　http:\\\\{host}/stolen',
]

/** Paths that, joined onto a `/base` base URL, resolve outside it for the WHATWG parser or for a backend that decodes `%2F`. */
export const ESCAPING_PATHS = [
  '../secret',
  '%2E%2E/secret',
  '.%2e/secret',
  'todos/..\\..\\secret',
  'articles/..%2F..%2F..%2Fsecret',
]

export const UPSTREAM_COOKIE = 'upstream=1; Path=/'

export const UPSTREAM_REDIRECT_LOCATION = '/base/redirected'

export interface RecordedRequest {
  url: string
  method: string
  headers: IncomingHttpHeaders
  body: string
}

export interface RecordingServer {
  /** Host and port the server listens on. */
  host: string
  /** Requests the server has received, oldest first. */
  requests: RecordedRequest[]
  readonly requestUrls: string[]
  close: () => Promise<void>
}

export function recordingEndpoints(host: string) {
  return {
    backendApi: {
      url: `http://${host}/base`,
    },
    forwardingApi: {
      url: `http://${host}/base`,
      forwardCredentials: true,
    },
    tokenApi: {
      url: `http://${host}/base`,
      token: 'endpoint-token',
      headers: { 'x-endpoint': 'endpoint', 'Authorization': 'Basic endpoint' },
      query: { tenant: 'a', locale: 'en' },
      forwardCredentials: true,
    },
    guardedApi: {
      url: `http://${host}/base`,
      allowedRoutes: ALLOWED_ROUTES,
    },
    closedApi: {
      url: `http://${host}/base`,
      allowedRoutes: [],
    },
  }
}

/**
 * Starts a server that records every request and answers it empty, except a path ending in
 * `/set-cookie`, which sets `UPSTREAM_COOKIE`, and one ending in `/redirect`, which redirects
 * to `UPSTREAM_REDIRECT_LOCATION`.
 */
export async function startRecordingServer(): Promise<RecordingServer> {
  const requests: RecordedRequest[] = []
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = []
    for await (const chunk of request)
      chunks.push(chunk)

    requests.push({
      url: request.url!,
      method: request.method!,
      headers: request.headers,
      body: Buffer.concat(chunks).toString(),
    })

    if (request.url!.endsWith('/set-cookie'))
      response.setHeader('set-cookie', UPSTREAM_COOKIE)

    if (request.url!.endsWith('/redirect'))
      response.writeHead(302, { location: UPSTREAM_REDIRECT_LOCATION })

    response.end()
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))

  return {
    host: `127.0.0.1:${(server.address() as AddressInfo).port}`,
    requests,
    get requestUrls() {
      return requests.map(request => request.url)
    },
    close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  }
}
