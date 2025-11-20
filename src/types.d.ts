declare module '#nuxt-api-party.nitro-config' {
  export const experimentalRewriteProxyRedirects: boolean
}

declare module '#build/module/nuxt-api-party.config' {
  export declare const allowClient: boolean | 'allow' | 'always'
  export declare const serverBasePath: string

  export declare const experimentalEnablePrefixedProxy: boolean
  export declare const experimentalDisableClientPayloadCache: boolean
}
