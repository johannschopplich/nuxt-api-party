# Nuxt API Party

A Nuxt module that calls APIs the app doesn't control through generated composables, keeping each API's credentials on the server.

## Language

### Endpoints

**Endpoint**:
One API as the app is configured to call it: a URL, endpoint credentials and options under a name, the endpoint ID. The API is the remote system; configured twice, it is two endpoints.
_Avoid_: API endpoint, backend, service

**Endpoint credentials**:
The token, headers and query an endpoint's configuration adds to every request.
_Avoid_: API key, secrets

**Client endpoint**:
An endpoint whose URL and endpoint credentials are published to the browser, so every request to it goes straight to the API – during SSR too – and never through the server proxy.
_Avoid_: client request, direct request

**Server import**:
The function generated for an endpoint that server code calls to reach the API with the endpoint credentials, without the server proxy.
_Avoid_: server composable, server-side `$<name>`

**Schema**:
The OpenAPI document an endpoint's types are generated from.
_Avoid_: spec, swagger file

**Operation**:
One method on one path of a schema.
_Avoid_: endpoint, route

### Server Proxy

**Server proxy**:
The public route of the app that forwards a request to the API of the endpoint it names, adding the endpoint credentials on the way.
_Avoid_: server route, server handler, proxy mode

**Allowed route**:
A path pattern, optionally limited to methods, naming the requests the server proxy may forward for an endpoint; once an endpoint declares one, the proxy refuses every request that matches none.
_Avoid_: allowlist, whitelist

**Visitor credentials**:
The cookie and `Authorization` header a visitor's browser sends to the app.
_Avoid_: user credentials, caller credentials

**Credential forwarding**:
The server proxy passing visitor credentials on to the API of an endpoint that opts into it.
_Avoid_: cookie forwarding

### Extension Points

**Hook**:
A callback registered app-wide in the Nuxt or the Nitro runtime that sees every request that runtime sends, whichever endpoint it belongs to.
_Avoid_: middleware, global interceptor

**Interceptor**:
A callback passed with one request that sees only that request.
_Avoid_: hook
