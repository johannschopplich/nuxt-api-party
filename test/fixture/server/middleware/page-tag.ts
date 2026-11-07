import { defineEventHandler } from '#imports'

// Stands in for the platform bindings an edge preset puts on a page request, such as `event.context.cloudflare`.
export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/'))
    event.context._platform = { pageTag: event.path }
})
