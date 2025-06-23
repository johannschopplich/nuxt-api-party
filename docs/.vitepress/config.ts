import type { DefaultTheme } from 'vitepress'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitepress'
import { description, version } from '../../package.json'
import { github, name, ogImage, ogUrl, releases } from './meta'

const url = new URL(ogUrl)

export default defineConfig({
  lang: 'en-US',
  title: name,
  description: 'Server proxy and generated API composables',
  head: [
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'author', content: 'Johann Schopplich' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: ogUrl }],
    ['meta', { property: 'og:title', content: name }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { name: 'twitter:title', content: name }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: ogImage }],
    ['meta', { name: 'twitter:site', content: '@jschopplich' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  appearance: 'dark',

  vite: {
    plugins: [UnoCSS()],
  },

  themeConfig: {
    logo: '/logo.svg',

    editLink: {
      pattern: 'https://github.com/johannschopplich/nuxt-api-party/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },

    nav: nav(),

    sidebar: {
      '/guide/': sidebarGuide(),
      '/config/': sidebarGuide(),
      '/api/': sidebarApi(),
    },

    socialLinks: [
      { icon: 'github', link: github },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-PRESENT Johann Schopplich & Matthew Messinger.<br>Icon by <a href="https://maronbeere.carrd.co">Maronbeere</a>',
    },

    search: {
      provider: 'local',
    },
  },
})

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: 'Guide',
      activeMatch: '^/guide/',
      items: [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'How It Works', link: '/guide/how-it-works' },
            { text: 'Error Handling', link: '/guide/error-handling' },
            { text: 'OpenAPI Types', link: '/guide/openapi-types' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Caching', link: '/guide/caching' },
            { text: 'Interceptors', link: '/guide/interceptors' },
            { text: 'Hooks', link: '/guide/hooks' },
            { text: 'Cookies', link: '/guide/cookies' },
            { text: 'Retries', link: '/guide/retries' },
            { text: 'Dynamic Backend URL', link: '/guide/dynamic-backend-url' },
          ],
        },
      ],
    },
    {
      text: 'Config',
      link: '/config/',
      activeMatch: '^/config/',
    },
    {
      text: 'API',
      items: [
        {
          text: 'Overview',
          link: '/api/',
        },
        {
          text: 'Composables',
          items: [
            { text: 'useFetch-like', link: '/api/use-fetch-like' },
            { text: '$fetch-like', link: '/api/dollarfetch-like' },
          ],
        },
      ],
    },
    {
      text: `v${version}`,
      items: [
        {
          text: 'Release Notes ',
          link: releases,
        },
      ],
    },
  ]
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Guides',
      items: [
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'How It Works', link: '/guide/how-it-works' },
        { text: 'Error Handling', link: '/guide/error-handling' },
        { text: 'OpenAPI Types', link: '/guide/openapi-types' },
      ],
    },
    {
      text: 'Module',
      items: [
        { text: 'Configuration', link: '/config/' },
      ],
    },
    {
      text: 'Advanced',
      items: [
        { text: 'Caching', link: '/guide/caching' },
        { text: 'Interceptors', link: '/guide/interceptors' },
        { text: 'Hooks', link: '/guide/hooks' },
        { text: 'Cookies', link: '/guide/cookies' },
        { text: 'Retries', link: '/guide/retries' },
        { text: 'Dynamic Backend URL', link: '/guide/dynamic-backend-url' },
      ],
    },
    { text: 'Migration', link: '/guide/migration' },
    { text: 'API', link: '/api/' },
    { text: 'Playground', link: 'https://github.com/johannschopplich/nuxt-api-party/tree/main/playground' },
  ]
}

function sidebarApi(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Overview',
      link: '/api/',
    },
    {
      text: 'Composables',
      items: [
        { text: 'useFetch-like', link: '/api/use-fetch-like' },
        { text: '$fetch-like', link: '/api/dollarfetch-like' },
      ],
    },
  ]
}
