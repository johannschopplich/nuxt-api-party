import { defineEventHandler, getRequestHeader } from '#imports'

export default defineEventHandler(async (event) => {
  const delay = getRequestHeader(event, 'x-middleware-delay')
  if (delay)
    await new Promise(resolve => setTimeout(resolve, Number(delay)))
})
