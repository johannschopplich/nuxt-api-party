import { defineEventHandler } from '#imports'
import { $testApi } from '#nuxt-api-party/server'

// A lone surrogate makes `encodeURIComponent` throw.
export default defineEventHandler(() => $testApi('items/{id}', { path: { id: '\uD800' } }).catch((error: Error) => ({ errorName: error.name })))
