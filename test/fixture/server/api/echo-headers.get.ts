import { defineEventHandler, getRequestHeaders } from '#imports'

export default defineEventHandler(event => getRequestHeaders(event))
