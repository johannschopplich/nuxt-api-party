// TODO: Drop the removed-option checks in 6.0.
const REMOVED_MODULE_OPTIONS: Record<string, string> = {
  server: 'The server proxy is served below `nitro.apiBaseURL` and forwards every request as it is, so neither `server.basePath` nor `server.proxyMode` applies any more.',
  client: 'Set `client: true` on each endpoint whose requests should skip the server proxy.',
  openAPITS: 'The types are generated with apiful, which takes no generator options.',
  payloadCache: 'Pass `getCachedData` to `use<Name>Data` to serve a repeated request from the payload, or wrap a `$<name>` call in `useAsyncData`.',
}

const REMOVED_ENDPOINT_OPTIONS: Record<string, string> = {
  allowedUrls: 'Configure one endpoint per API URL instead.',
  cookies: 'Set `forwardCredentials: true` instead.',
  openAPITS: 'The types are generated with apiful, which takes no generator options.',
}

const MIGRATION_GUIDE_URL = 'https://nuxt-api-party.byjohann.dev/advanced/migration'

interface UnvalidatedOptions {
  [key: string]: unknown
  endpoints?: Record<string, Record<string, unknown>>
}

/**
 * Throws for an option removed in 5.0 and for an endpoint that is a client endpoint and relies on the server
 * proxy at the same time.
 */
export function assertValidOptions(input: object) {
  const options = input as UnvalidatedOptions
  const optionErrors: string[] = []

  for (const [key, replacement] of Object.entries(REMOVED_MODULE_OPTIONS)) {
    if (options[key] !== undefined)
      optionErrors.push(`The \`${key}\` option was removed. ${replacement}`)
  }

  for (const [endpointId, endpoint] of Object.entries(options.endpoints ?? {})) {
    for (const [key, replacement] of Object.entries(REMOVED_ENDPOINT_OPTIONS)) {
      if (endpoint[key] !== undefined)
        optionErrors.push(`The \`${key}\` option of the endpoint \`${endpointId}\` was removed. ${replacement}`)
    }

    if (endpoint.client !== true)
      continue

    if (endpoint.forwardCredentials)
      optionErrors.push(`The endpoint \`${endpointId}\` sets both \`client\` and \`forwardCredentials\`. A client endpoint skips the server proxy, so there are no visitor credentials to forward.`)

    if (endpoint.allowedRoutes)
      optionErrors.push(`The endpoint \`${endpointId}\` sets both \`client\` and \`allowedRoutes\`. A client endpoint publishes its token and skips the server proxy, so the allowed routes protect nothing.`)
  }

  if (optionErrors.length) {
    throw new Error([
      'Invalid Nuxt API Party options:',
      ...optionErrors.map(optionError => `- ${optionError}`),
      `See the migration guide: ${MIGRATION_GUIDE_URL}`,
    ].join('\n'))
  }
}
