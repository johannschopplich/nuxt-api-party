import type { H3Event } from 'h3'
import { hasLeadingSlash, hasProtocol, joinURL, withoutBase } from 'ufo'

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const REDIRECT_MODES = new Set(['follow', 'error', 'manual'])

/**
 * Nitro plugin to rewrite API request and response redirect behavior.
 *
 * Note:
 * This plugin requires that the `experimental.enablePrefixedProxy` option is enabled.
 * Having this option disabled would cause some redirects to change from POST to GET, which
 * would result in a 405 error on the proxy.
 *
 * Request headers:
 * - `x-proxy-redirect`: Sets the redirect mode for the proxy request. Valid values are 'follow', 'error', and 'manual'.
 *
 * Response headers:
 * - `x-proxy-location`: Contains the original 'Location' header relative to the endpoint base url
 */
export default defineNitroPlugin(async (nitroApp) => {
  nitroApp.hooks.hook('api-party:request', ({ options }, event) => {
    // Set redirect mode from request header
    const redirect = getRequestHeader(event, 'x-proxy-redirect')
    if (redirect && REDIRECT_MODES.has(redirect)) {
      options.redirect = redirect as RequestRedirect
    }
  })

  nitroApp.hooks.hook('api-party:response', ({ options, response }, event) => {
    // Handle manual redirect responses
    if (options.redirect === 'manual' && REDIRECT_STATUSES.has(response.status)) {
      handleRedirectResponse(event, response)
    }
  })
})

function getEndpointUrl(event: H3Event, endpointId: string) {
  const { apiParty } = useRuntimeConfig(event)
  const endpoint = apiParty.endpoints[endpointId as keyof typeof apiParty.endpoints]!

  // should be safe, this header isn't used to kick off any new requests.
  // and it's called after api-party has already validated the header
  return getRequestHeader(event, `${endpointId}-endpoint-url`) || endpoint.url
}

function handleRedirectResponse(event: H3Event, response: Response) {
  let location = response.headers.get('location')
  if (!location) {
    // No location header? Probably nothing to worry about.
    return
  }

  // No need to rewrite relative URLs without a leading slash or protocol.
  // example: some/path or ?query=string
  // Should be handled automatically by the client.
  if (!hasProtocol(location) && !hasLeadingSlash(location)) {
    return
  }

  const reqUrl = getRequestURL(event)
  const { endpointId, path } = getRouterParams(event) as { endpointId: string, path: string }

  // Construct absolute URL based on the request for URLs without a
  // protocol/host and with a leading slash.

  // for when the endpoint url points to a local nitro path.
  // e.g. { url: '/api' }
  const baseUrl = new URL(getEndpointUrl(event, endpointId), reqUrl)
  // for when the redirect points to the same server
  // e.g. Location: /other-path
  const locUrl = new URL(location, baseUrl)

  // Clean up absolute same-origin redirects. If the location is outside
  // of the base URL, we should error out to avoid invalid redirects.
  location = withoutBase(locUrl.href, baseUrl.href)
  if (location === locUrl.href) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Bad Gateway',
      message: 'Server sent Location header pointing outside base URL or to external resource.',
    })
  }

  // write the original location header
  setResponseHeader(event, 'x-proxy-location', location)

  // rewrite relative location to be absolute based on the API Party endpoint.
  // uses the request path to account for custom api path prefixes. (default: /api/__api_party)
  location = joinURL(reqUrl.pathname.slice(0, -path.length), location)

  // Write the required status and headers, then end the response to prevent
  // sendProxy from overwriting the Location header.
  setResponseStatus(event, response.status, response.statusText)
  setResponseHeader(event, 'location', location)
  event.node.res.end()
}
