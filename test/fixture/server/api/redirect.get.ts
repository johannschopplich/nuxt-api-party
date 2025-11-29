import { defineEventHandler, getQuery, getRequestURL, setHeader, setResponseStatus } from 'h3'
import { withBase } from 'ufo'

export default defineEventHandler(async (event) => {
  const mode = String(getQuery(event).mode)

  const url = getRequestURL(event)

  setResponseStatus(event, 302)
  setHeader(event, 'location', {
    relative: 'todos',
    absolute: '/api/todos',
    protocol: 'https://jsonplaceholder.typicode.com/todos',
    outside: '/',
    external: withBase('/api/todos', String(url.origin)),
  }[mode] || '/api/todos')
})
