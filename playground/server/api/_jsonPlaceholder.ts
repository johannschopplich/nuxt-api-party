// TODO: Why does tsc fail in this file?
// eslint-disable-next-line ts/ban-ts-comment
// @ts-nocheck

// import { $jsonPlaceholder } from '#imports'
import { $jsonPlaceholder } from '#nuxt-api-party/server'

export default defineEventHandler(async () => {
  const response = await $jsonPlaceholder('posts/1')
  return response
})
