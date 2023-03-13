# How to Track Errors?

Although the idea of this module is to mask your real API by creating a Nuxt server proxy, `nuxt-api-party` will forward error responses to the client if your API fails to deliver, including:

- `statusCode`
- `statusMessage`
- API response body as `data`

## Example usage with `useJsonPlaceholderData`

```ts
const { data, error } = await useJsonPlaceholderData('not-found')

watchEffect(() => {
  console.error('statusCode:', error.value.statusCode)
  console.error('statusMessage:', error.value.statusMessage)
  console.error('data:', error.value.data)
})
```

## Example usage with `$jsonPlaceholder`

```ts
function onSubmit() {
  try {
    const response = await $jsonPlaceholder('not-found', {
      method: 'POST',
      body: form.value
    })
  }
  catch (e) {
    console.error('statusCode:', e.statusCode)
    console.error('statusMessage:', e.statusMessage)
    console.error('data:', e.data)
  }
}
```
