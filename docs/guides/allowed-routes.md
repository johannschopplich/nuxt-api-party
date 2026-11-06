# Allowed Routes

The [server proxy](/advanced/how-it-works) is public – anyone who can reach your app can call it with `curl`, and the proxy forwards the request with the endpoint credentials. The token never reaches the browser, but whatever it authorizes is open to everyone.

List the routes your app calls in `allowedRoutes`, and the proxy answers every other request with a 403 before it contacts the API:

::: code-group
```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: ['nuxt-api-party'],

  apiParty: {
    endpoints: {
      cms: {
        url: process.env.CMS_API_BASE_URL!,
        token: process.env.CMS_API_TOKEN!,
        allowedRoutes: [
          { path: '/articles/**', methods: ['GET'] },
          { path: '/comments/*', methods: ['GET', 'POST'] }
        ]
      }
    }
  }
})
```
:::

Each `path` matches the pathname below the endpoint's `url`, without the query string. `*` matches exactly one segment, so `/comments/*` admits `/comments/1` but not `/comments/1/replies`. A trailing `**` matches any number of segments, including none, so `/articles/**` admits `/articles` as well as `/articles/1/comments`. `methods` limits the HTTP methods a route accepts; leave it out to accept every method. A route that lists only `GET` refuses `HEAD`.

## What the List Covers

The list guards the server proxy only: [server imports](/api/server-imports) call the API directly, and a [client endpoint](/api/module-configuration#client-endpoints) cannot set `allowedRoutes` at all.

The proxy checks the URL before a [Nitro request hook](/guides/hooks#nitro-runtime-hooks) runs, so a hook that rewrites the URL is not checked again.

::: warning Server-Side Rendering
Calls made during server-side rendering pass through the same proxy. List the routes your server-rendered pages request, too.
:::

::: tip Scoped Tokens
Where your API issues scoped tokens, give the endpoint one that can do only what your app needs. `methods` checks the method the proxy sends, so an API that honors a method override, such as an `X-HTTP-Method-Override` header, is only as restricted as its token.
:::

## Paths the Proxy Refuses

Independent of the list, the proxy refuses a path with a raw tab, a line break, a colon before its first slash, or a dot segment such as `articles/../admin` or `articles/..%2Fadmin`, with a 400. An encoded slash otherwise stays inside its segment, so `/comments/*` admits `/comments/a%2Fb`.

## Lists From Several Sources

Lists from Nuxt layers, the module options and `runtimeConfig` add up rather than narrow one another. Only the `NUXT_API_PARTY_ENDPOINTS_CMS_ALLOWED_ROUTES` environment variable replaces the list, and only for an endpoint that sets `allowedRoutes` at build time – `[]` is enough.
