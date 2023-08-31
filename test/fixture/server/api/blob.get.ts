export default defineEventHandler(() => {
  return new Blob(['Foo'], { type: 'text/plain' })
})
