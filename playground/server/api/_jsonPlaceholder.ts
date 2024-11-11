import { $jsonPlaceholder, defineEventHandler } from '#imports'

export default defineEventHandler(async () => {
  const response = await $jsonPlaceholder('posts/1')
  return response
})
