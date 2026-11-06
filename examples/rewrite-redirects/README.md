# Rewrite Redirects

This example showcases a Nitropack plugin that rewrites redirect locations.

The server proxy passes a redirect back to the client without following it, but its location still points at the API. This plugin rewrites it to point at the server proxy instead.

## Usage

When a redirect response is received (HTTP status codes 3xx), the plugin captures the original `Location` header and rewrites it to be relative to the endpoint base URL. The rewritten location is then included in the response headers as `x-proxy-location`.

> [!NOTE]
> If your endpoint responds with a redirect which points a location outside of the endpoint base URL, a 502 Bad Gateway error will be returned to the client. This is a security measure to prevent open redirect vulnerabilities.
