import { setResponseStatus } from 'h3'

export default defineEventHandler((event) => {
  setResponseStatus(event, 404)

  return {
    statusCode: 404,
    statusMessage: 'Not Found',
  }
})
