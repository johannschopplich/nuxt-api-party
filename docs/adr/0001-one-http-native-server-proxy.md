# One HTTP-Native Server Proxy

One server proxy forwards method, path, query, headers and body as they are, streamed, and adds the endpoint credentials on the server – instead of a default that wraps every call into a `POST` carrying the original request as JSON, beside a passthrough mode that adds no endpoint credentials. Such an envelope drops headers set by interceptors and hooks, base64-encodes uploads, buffers responses and turns every read into an uncacheable `POST`. Its one safety gain, an allowlist of inbound headers, holds as a rule: visitor credentials travel only with credential forwarding, and a cross-site request to such an endpoint is refused.

## Consequences

The path arrives in the URL rather than as a JSON string, so its checks run on the raw, undecoded path.
