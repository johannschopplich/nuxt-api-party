export default defineEventHandler(() => {
  throw createError({
    data: {
      reason: 'anything',
    },
    statusCode: 404,
    statusMessage: 'Not Found',
  })
})
