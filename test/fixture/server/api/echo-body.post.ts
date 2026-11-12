import { defineEventHandler, getRequestHeader, readRawBody } from '#imports'

export default defineEventHandler(async event => ({
  contentType: getRequestHeader(event, 'content-type'),
  body: await readRawBody(event),
}))
