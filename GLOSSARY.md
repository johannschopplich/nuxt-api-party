# Nuxt API Party

A Nuxt module that calls APIs the app doesn't control through generated composables, keeping each API's credentials on the server.

## Language

### Endpoints

**Endpoint**:
An API configured under a name in `apiParty.endpoints`; that name is the endpoint ID.
_Avoid_: backend, service

**Endpoint credentials**:
The token, headers and query an endpoint's configuration adds to every request. They stay on the server unless the endpoint is a client endpoint.
_Avoid_: API key, secrets

**Client endpoint**:
An endpoint whose URL and endpoint credentials are published to the browser, so every request to it goes straight to the API – during SSR too – and never through the server proxy.
_Avoid_: client request, direct request

**Schema**:
The OpenAPI document an endpoint's types are generated from.
_Avoid_: spec, swagger file

**Operation**:
One method on one path of a schema.
_Avoid_: endpoint, route

### Server Proxy

**Server proxy**:
The public route of the app that forwards a request to its endpoint and adds the endpoint credentials on the way.
_Avoid_: server route, server handler, proxy mode

**Allowed route**:
A path pattern, optionally limited to methods, that the server proxy forwards for an endpoint; once one is declared, every other request is refused.
_Avoid_: allowlist, whitelist

**Visitor credentials**:
The cookie and `Authorization` header a visitor's browser sends to the app.
_Avoid_: user credentials, caller credentials

**Credential forwarding**:
The server proxy passing visitor credentials on to an endpoint that opts into it.
_Avoid_: cookie forwarding

### Extension Points

**Hook**:
An app-wide callback in a Nuxt or Nitro plugin that sees every request its runtime sends, whichever endpoint it belongs to.
_Avoid_: middleware, global interceptor

**Interceptor**:
A callback passed with one request that sees only that request.
_Avoid_: hook
