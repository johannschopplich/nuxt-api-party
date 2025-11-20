import { defineEventHandler, getQuery } from 'h3'

// clone of httpbin.org/redirect
export default defineEventHandler<{ query: { url: string, status_code?: number } }>(async (event) => {
  const { url, status_code = 302 } = getQuery(event)
  event.node.res.statusCode = Number(status_code)
  event.node.res.setHeader('location', url)
})
