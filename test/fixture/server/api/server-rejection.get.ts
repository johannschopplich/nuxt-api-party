import { defineEventHandler } from '#imports'
import { $testApi } from '#nuxt-api-party/server'

export default defineEventHandler(async () => ({
  // A lone surrogate makes `encodeURIComponent` throw.
  errorName: await $testApi('items/{id}', { path: { id: '\uD800' } }).catch((error: Error) => error.name),
  dotSegmentError: await $testApi('items/{id}', { path: { id: '..' } }).catch((error: Error) => error.message),
}))
