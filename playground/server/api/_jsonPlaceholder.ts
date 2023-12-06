// import { $jsonPlaceholder } from '#imports'
// eslint-disable-next-line ts/prefer-ts-expect-error
// @ts-ignore: Should work but doesn't with `tsc --noEmit`
import { $jsonPlaceholder } from '#nuxt-api-party/server'

export default defineEventHandler(async () => {
  const response = await $jsonPlaceholder('posts/1')
  return response
})
