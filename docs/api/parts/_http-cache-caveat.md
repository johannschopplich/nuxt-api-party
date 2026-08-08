The `cache` option needs [`server.proxyMode`](/api/module-configuration#proxymode) set to `'passthrough'`, or the
request sent from the client. The default `'wrapped'` mode turns every call into a `POST`, and a `POST` is never
served from the browser's HTTP cache.

::: tip
See the [caching guide](/guides/caching-strategies) for more information on caching.
:::
