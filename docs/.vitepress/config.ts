import type { DefaultTheme } from 'vitepress'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitepress'
import { description, version } from '../../package.json'
import { github, name, ogImage, ogUrl, releases } from './meta'

export default defineConfig({
  lang: 'en-US',
  title: name,
  description: 'Auto-generated composables for secure API access',
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

    nav: [
      {
        text: 'Essentials',
        activeMatch: '^/essentials/',
        items: [
          { text: 'What is Nuxt API Party?', link: '/essentials/what-is-nuxt-api-party' },
          { text: 'Getting Started', link: '/essentials/getting-started' },
          { text: 'Data Fetching Methods', link: '/essentials/data-fetching-methods' },
          { text: 'Module Configuration', link: '/essentials/module-configuration' },
        ],
      },
      {
        text: 'Guides',
        activeMatch: '^/guides/',
        items: [
          { text: 'OpenAPI Integration', link: '/guides/openapi-integration' },
          { text: 'Caching Strategies', link: '/guides/caching-strategies' },
          { text: 'Hooks', link: '/guides/hooks' },
          { text: 'Defaults', link: '/guides/defaults' },
          { text: 'Interceptors', link: '/guides/interceptors' },
          { text: 'Error Handling', link: '/guides/error-handling' },
          { text: 'Cookie Forwarding', link: '/guides/cookie-forwarding' },
          { text: 'Dynamic Backend URL', link: '/guides/dynamic-backend-url' },
        ],
      },
      {
        text: 'API',
        link: '/api/',
        activeMatch: '^/api/',
      },
      {
        text: `v${version}`,
        items: [
          { text: 'Release Notes ', link: releases },
        ],
      },
    ],

    sidebar: {
      '/essentials/': sidebarCore(),
      '/guides/': sidebarCore(),
      '/advanced/': sidebarCore(),
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

function sidebarCore(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Essentials',
      items: [
        { text: 'What is Nuxt API Party?', link: '/essentials/what-is-nuxt-api-party' },
        { text: 'Getting Started', link: '/essentials/getting-started' },
        { text: 'Data Fetching Methods', link: '/essentials/data-fetching-methods' },
        { text: 'Module Configuration', link: '/essentials/module-configuration' },
      ],
    },
    {
      text: 'Guides',
      items: [
        { text: 'OpenAPI Integration', link: '/guides/openapi-integration' },
        { text: 'Caching Strategies', link: '/guides/caching-strategies' },
        { text: 'Hooks', link: '/guides/hooks' },
        { text: 'Defaults', link: '/guides/defaults' },
        { text: 'Interceptors', link: '/guides/interceptors' },
        { text: 'Error Handling', link: '/guides/error-handling' },
        { text: 'Cookie Forwarding', link: '/guides/cookie-forwarding' },
        { text: 'Dynamic Backend URL', link: '/guides/dynamic-backend-url' },
      ],
    },
    {
      text: 'Advanced',
      items: [
        { text: 'How Does It Work?', link: '/advanced/how-it-works' },
        { text: 'Migration', link: '/advanced/migration' },
      ],
    },
    { text: 'API Reference', link: '/api/' },
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
      text: 'Generated Composables',
      items: [
        { text: 'useFetch-like Composables', link: '/api/use-fetch-like' },
        { text: '$fetch-like Composables', link: '/api/dollarfetch-like' },
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
