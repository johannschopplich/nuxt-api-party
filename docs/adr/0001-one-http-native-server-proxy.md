# One HTTP-Native Server Proxy

Until 4.x the server proxy had two modes: the default wrapped every call into a POST carrying the original request as JSON, and `passthrough` forwarded the request as it stood but added no endpoint credentials. 5.0 keeps one proxy that forwards method, path, query, headers and body as they are, streamed, and adds the endpoint credentials on the server. The envelope dropped headers set by interceptors and hooks, base64-encoded uploads, buffered responses and turned every read into an uncacheable POST; its one safety gain – an allowlist of inbound headers – survives as a rule: visitor credentials travel only with credential forwarding, and a cross-site request to such an endpoint is refused.

## Consequences

The path arrives in the URL rather than as a JSON string, so its checks run on the raw, undecoded path.
