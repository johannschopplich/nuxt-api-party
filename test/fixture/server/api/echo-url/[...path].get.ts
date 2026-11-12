import { defineEventHandler } from '#imports'

export default defineEventHandler(event => ({ url: event.node.req.originalUrl }))
