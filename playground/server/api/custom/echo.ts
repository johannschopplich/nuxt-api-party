import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  return {
    method: event.node.req.method,
    url: event.node.req.url,
    headers: event.node.req.headers,
  }
})
