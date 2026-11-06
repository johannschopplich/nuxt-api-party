import type { H3Event } from 'h3'
import { hasLeadingSlash, hasProtocol, joinURL, withoutBase } from 'ufo'

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])

/**
 * Nitro plugin to rewrite the location of a redirect the server proxy passes back.
 *
 * Response headers:
 * - `x-proxy-location`: Contains the original 'Location' header relative to the endpoint base url.
 */
export default defineNitroPlugin(async (nitroApp) => {
  nitroApp.hooks.hook('api-party:response', ({ response }, event) => {
    if (event && REDIRECT_STATUSES.has(response.status)) {
      handleRedirectResponse(event, response)
    }
  })
})

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

  // For when the endpoint url points to a local nitro path.
  // e.g. { url: '/api' }
  const { apiParty } = useRuntimeConfig(event)
  const baseUrl = new URL(apiParty.endpoints[endpointId as keyof typeof apiParty.endpoints]!.url, reqUrl)
  // For when the redirect points to the same server.
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

  // Write the original location header.
  setResponseHeader(event, 'x-proxy-location', location)

  // Rewrite relative location to be absolute based on the API Party endpoint.
  // Uses the request path to account for custom api path prefixes (default: /api/__api_party).
  location = joinURL(reqUrl.pathname.slice(0, -path.length), location)

  // Write the required status and headers, then end the response to prevent
  // the server proxy from overwriting the Location header.
  setResponseStatus(event, response.status, response.statusText)
  setResponseHeader(event, 'location', location)
  event.node.res.end()
}
