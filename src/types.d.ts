declare module '#nuxt-api-party.nitro-config' {
  export const experimentalRewriteProxyRedirects: boolean
}

declare module '#build/module/nuxt-api-party.config' {
  export const allowClient: boolean | 'allow' | 'always'
  export const serverBasePath: string

  export const experimentalEnablePrefixedProxy: boolean
  export const experimentalDisableClientPayloadCache: boolean
}
