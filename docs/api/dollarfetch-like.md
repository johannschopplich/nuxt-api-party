# `$fetch`-Like Composable

Sends a plain fetch and returns the raw API response. Intended for actions inside methods, e.g. when sending form data on submit.

::: info Placeholder
`$myApi` is a placeholder. The composable is generated based on your API endpoint ID. For example, endpoint `jsonPlaceholder` generates `$jsonPlaceholder`.
:::

## Type Declarations

<<< @/../src/runtime/composables/$api.ts#options

Every [`ofetch` option](https://github.com/unjs/ofetch) but `baseURL`, which the endpoint decides, passes through – `cache` for the browser's [HTTP cache](/guides/caching-strategies#browser-caching) included.

## In Component Setup

`$myApi` sends a request every time it runs and stores nothing in the Nuxt payload. Called in a component's setup, it runs once during SSR and once more in the browser while the page hydrates – two requests for one result. In development, the module warns in the console when that happens.

Fetch data for a page with [`useMyApiData`](/api/use-fetch-like), or wrap the call in `useAsyncData`, which hands the server's response to the browser:

```ts
const { data } = await useAsyncData('posts', () => $jsonPlaceholder('posts'))
```

## Examples

<!--@include: ../parts/_demo-setup.md-->

```ts
async function createPost() {
  const post = await $jsonPlaceholder('posts', {
    method: 'POST',
    body: {
      foo: 'bar'
    },
    async onRequest({ request }) {
      console.log(request)
    },
    async onResponse({ response }) {
      console.log(response)
    },
    async onRequestError({ error }) {
      console.log(error)
    },
    async onResponseError({ error }) {
      console.log(error)
    }
  })
}
```

## Several Calls in `useAsyncData`

::: warning Nuxt Context Issue
`$myApi` reads the Nuxt app when it is called. In a `useAsyncData` handler on the server, a second call after an `await` runs without it and throws.
:::

Start the calls together, before the first `await`:

```ts
const { data } = await useAsyncData('post-with-comments', async () => {
  const [post, comments] = await Promise.all([
    $jsonPlaceholder('posts/1'),
    $jsonPlaceholder('posts/1/comments')
  ])

  return { post, comments }
})
```

Where one call needs the result of the other, run the second inside `nuxtApp.runWithContext`:

```ts
const { data } = await useAsyncData('author-of-post', async (nuxtApp) => {
  const post = await $jsonPlaceholder<{ userId: number }>('posts/1')

  return await nuxtApp.runWithContext(() => $jsonPlaceholder(`users/${post.userId}`))
})
```

## Client Endpoints

<!--@include: ./parts/_client-endpoints.md-->
