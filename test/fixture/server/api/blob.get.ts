import { defineEventHandler } from '#imports'

export default defineEventHandler(() => {
  return new Blob(['Foo'], { type: 'text/plain' })
})
