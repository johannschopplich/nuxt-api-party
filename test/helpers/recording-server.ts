import type { AddressInfo } from 'node:net'
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
  ' http://{host}/stolen',
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

export interface RecordingServer {
  /** Host and port the server listens on. */
  host: string
  /** Request URLs the server has received, oldest first. */
  requestUrls: string[]
  close: () => Promise<void>
}

export function recordingEndpoints(host: string) {
  return {
    backendApi: {
      url: `http://${host}/base`,
      allowedUrls: [`http://${host}/other`],
    },
    guardedApi: {
      url: `http://${host}/base`,
      allowedUrls: [`http://${host}/other`],
      allowedRoutes: ALLOWED_ROUTES,
    },
    closedApi: {
      url: `http://${host}/base`,
      allowedRoutes: [],
    },
  }
}

export async function startRecordingServer(): Promise<RecordingServer> {
  const requestUrls: string[] = []
  const server = createServer((request, response) => {
    requestUrls.push(request.url!)
    response.end()
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))

  return {
    host: `127.0.0.1:${(server.address() as AddressInfo).port}`,
    requestUrls,
    close: () => new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
  }
}
