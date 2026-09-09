import type { AddressInfo } from 'node:net'
import { createServer } from 'node:http'

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

export interface ForeignServer {
  /** Host and port the server listens on. */
  host: string
  /** Request URLs the server has received, oldest first. */
  requestUrls: string[]
  close: () => Promise<void>
}

/** Starts an HTTP server on a random loopback port that records every request it receives. */
export async function startForeignServer(): Promise<ForeignServer> {
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
