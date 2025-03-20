import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  externals: [
    'openapi-typescript',
    // TODO: Why does Nuxt module builder not exclude these?
    'h3',
    'crossws',
    'cookie-es',
    'iron-webcrypto',
  ],
})
