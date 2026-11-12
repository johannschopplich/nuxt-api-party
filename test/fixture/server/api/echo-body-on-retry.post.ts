import { createError, defineEventHandler, readRawBody } from '#imports'

let hasFailed = false

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event)

  if (!hasFailed) {
    hasFailed = true
    throw createError({ statusCode: 503 })
  }

  return { body }
})
