# Rewrite Redirects

This example showcases a Nitropack plugin that rewrites redirect locations.

The default behavior is to follow redirects automatically, which can obscure the original redirect location from the client. This plugin allows redirects to be forwarded to the client transparently.

> [!WARNING]
> In order to use this plugin, you need to enable the experimental api party option `enablePrefixedProxy`. Due to how clients implement redirects, supporting non-prefixed proxy requests is not possible.

## Usage

To take advantage of this plugin, execute a request with the `x-proxy-redirect` header set to `manual`. This instructs the proxy to not follow redirects automatically.

When a redirect response is received (HTTP status codes 3xx), the plugin captures the original `Location` header and rewrites it to be relative to the endpoint base URL. The rewritten location is then included in the response headers as `x-proxy-location`.

> [!NOTE]
> If your endpoint responds with a redirect which points a location outside of the endpoint base URL, a 502 Bad Gateway error will be returned to the client. This is a security measure to prevent open redirect vulnerabilities.

### Request Headers

- `x-proxy-redirect`: Sets the redirect mode for the proxy request. Valid values are `'follow' | 'error' | 'manual'`.
