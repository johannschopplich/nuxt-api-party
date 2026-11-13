import type { DefaultTheme } from 'vitepress'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitepress'
import { description, version } from '../../package.json'
import { github, name, ogImage, ogUrl, releases } from './meta'

export default defineConfig({
  lang: 'en-US',
  title: name,
  description,
  srcExclude: ['**/parts/*.md', 'adr/**'],
  head: [
    [
      'link',
      { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' },
    ],
    [
      'meta',
      { name: 'author', content: 'Johann Schopplich' },
    ],
    [
      'meta',
      { property: 'og:type', content: 'website' },
    ],
    [
      'meta',
      { property: 'og:url', content: ogUrl },
    ],
    [
      'meta',
      { property: 'og:title', content: name },
    ],
    [
      'meta',
      { property: 'og:description', content: description },
    ],
    [
      'meta',
      { property: 'og:image', content: ogImage },
    ],
    [
      'meta',
      { name: 'twitter:title', content: name },
    ],
    [
      'meta',
      { name: 'twitter:description', content: description },
    ],
    [
      'meta',
      { name: 'twitter:image', content: ogImage },
    ],
    [
      'meta',
      { name: 'twitter:site', content: '@jschopplich' },
    ],
    [
      'meta',
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  ],

  appearance: 'dark',

  vite: {
    plugins: [
      UnoCSS(),
    ],
  },

  themeConfig: {
    logo: '/logo.svg',

    editLink: {
      pattern: `${github}/edit/main/docs/:path`,
      text: 'Suggest changes to this page',
    },

    nav: [
      {
        text: 'Essentials',
        activeMatch: '^/essentials/',
        items: [
          { text: 'Getting Started', link: '/essentials/getting-started' },
          { text: 'Data Fetching Methods', link: '/essentials/data-fetching-methods' },
          { text: 'How It Works', link: '/essentials/how-it-works' },
        ],
      },
      {
        text: 'Guides',
        activeMatch: '^/(guides|advanced)/',
        items: [
          { text: 'OpenAPI Integration', link: '/guides/openapi-integration' },
          { text: 'Error Handling', link: '/guides/error-handling' },
          { text: 'Caching Strategies', link: '/guides/caching-strategies' },
          { text: 'Allowed Routes', link: '/guides/allowed-routes' },
          { text: 'Credential Forwarding', link: '/guides/credential-forwarding' },
          { text: 'Client Endpoints', link: '/guides/client-endpoints' },
          { text: 'Hooks', link: '/guides/hooks' },
          { text: 'Interceptors', link: '/guides/interceptors' },
          { text: 'Migration', link: '/advanced/migration' },
          { text: 'Migrating From nuxt-open-fetch', link: '/guides/migrating-from-nuxt-open-fetch' },
        ],
      },
      {
        text: 'API Reference',
        link: '/api/',
        activeMatch: '^/api/',
      },
      {
        text: `v${version}`,
        items: [
          { text: 'Release Notes', link: releases },
        ],
      },
    ],

    sidebar: {
      '/essentials/': sidebarMain(),
      '/guides/': sidebarMain(),
      '/advanced/': sidebarMain(),
      '/api/': sidebarApi(),
    },

    socialLinks: [
      { icon: 'github', link: github },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-PRESENT Johann Schopplich & Matthew Messinger.<br>Icon by <a href="https://konkon.zip">Konkon</a>',
    },

    search: {
      provider: 'local',
    },
  },
})

function sidebarMain(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Essentials',
      items: [
        { text: 'Getting Started', link: '/essentials/getting-started' },
        { text: 'Data Fetching Methods', link: '/essentials/data-fetching-methods' },
        { text: 'How It Works', link: '/essentials/how-it-works' },
      ],
    },
    {
      text: 'Guides',
      items: [
        { text: 'OpenAPI Integration', link: '/guides/openapi-integration' },
        { text: 'Error Handling', link: '/guides/error-handling' },
        { text: 'Caching Strategies', link: '/guides/caching-strategies' },
        { text: 'Allowed Routes', link: '/guides/allowed-routes' },
        { text: 'Credential Forwarding', link: '/guides/credential-forwarding' },
        { text: 'Client Endpoints', link: '/guides/client-endpoints' },
        { text: 'Hooks', link: '/guides/hooks' },
        { text: 'Interceptors', link: '/guides/interceptors' },
        { text: 'Migration', link: '/advanced/migration' },
        { text: 'Migrating From nuxt-open-fetch', link: '/guides/migrating-from-nuxt-open-fetch' },
      ],
    },
    { text: 'API Reference', link: '/api/' },
    { text: 'Playground', link: `${github}/tree/main/playground` },
  ]
}

function sidebarApi(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'API Reference',
      link: '/api/',
    },
    {
      text: 'Module Configuration',
      link: '/api/module-configuration',
    },
    {
      text: 'Generated Composables',
      items: [
        { text: 'useFetch-Like Composable', link: '/api/use-fetch-like' },
        { text: '$fetch-Like Composable', link: '/api/dollarfetch-like' },
        { text: 'Server Imports', link: '/api/server-imports' },
      ],
    },
    {
      text: 'Types',
      items: [
        { text: 'OpenAPI Type Helpers', link: '/api/openapi-types' },
      ],
    },
  ]
}
