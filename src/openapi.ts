import { resolve } from 'pathe'
import { useNuxt } from '@nuxt/kit'
import type { OpenAPI3, OpenAPITSOptions } from 'openapi-typescript'
import type { Endpoint } from './module'

export async function generateTypes(
  endpoints: Record<string, Endpoint>,
  globalOpenAPIOptions: OpenAPITSOptions,
) {
  let runningCount = 0

  // openapi-typescript uses `process.exit()` to handle errors
  process.on('exit', () => {
    if (runningCount > 0)
      throw new Error('Failed to generate OpenAPI types')
  })

  const openAPITS = await resolveOpenAPIImports()
  const schemas = await Promise.all(
    Object.entries(endpoints).map(async ([id, endpoint]) => {
      let types = ''

      const schema = await resolveSchema(endpoint)
      runningCount++

      try {
        types = await openAPITS(schema, {
          commentHeader: '',
          ...globalOpenAPIOptions,
          ...endpoint.openAPITS,
        })
      }
      catch {
        // TODO: Use `Record<string, never>`?
        types = `
export type paths = Record<string, any>
export type webhooks = Record<string, any>
export type components = Record<string, any>
export type external = Record<string, any>
export type operations = Record<string, any>
        `.trimStart()
      }
      finally {
        runningCount--
      }

      return `
declare module '#nuxt-api-party/${id}' {
${types.replace(/^/gm, '  ').trimEnd()}
}`.trimStart()
    }),
  )

  return schemas.join('\n\n')
}

async function resolveSchema({ schema }: Endpoint): Promise<string | URL | OpenAPI3> {
  const nuxt = useNuxt()

  if (typeof schema === 'function')
    return await schema()

  if (typeof schema === 'string' && !schema.match(/^https?:\/\//))
    schema = resolve(nuxt.options.rootDir, schema)

  return schema!
}

async function resolveOpenAPIImports() {
  const openAPITS = await import('openapi-typescript')
  return openAPITS.default || openAPITS
}
