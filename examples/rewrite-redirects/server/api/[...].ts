export default defineEventHandler((event) => {
  event.node.res.setHeader('Location', '/api/hello')
  event.node.res.statusCode = 302
  event.node.res.end()
})
