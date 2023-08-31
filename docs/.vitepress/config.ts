import { defineConfig } from 'vitepress'
import type { DefaultTheme } from 'vitepress'
import { description, name, version } from '../../package.json'
import {
  github,
  ogImage,
  ogUrl,
  releases,
} from './meta'

const url = new URL(ogUrl)

export default defineConfig({
  lang: 'en-US',
  title: name,
  description: 'Connect with any API securely',
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
    // Plausible analytics
    ['script', { 'src': 'https://plausible.io/js/script.js', 'defer': '', 'data-domain': url.hostname }],
  ],

  appearance: 'dark',

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
      copyright: 'Copyright © 2022-present Johann Schopplich',
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
          ],
        },
        {
          text: 'In-Depth',
          items: [
            { text: 'Hydration', link: '/guide/hydration' },
            { text: 'Caching', link: '/guide/caching' },
            { text: 'Cookies', link: '/guide/cookies' },
            { text: 'Retries', link: '/guide/retries' },
            { text: 'Dynamic Backend URL', link: '/guide/dynamic-backend-url' },
            { text: 'OpenAPI Types', link: '/guide/openapi-types' },
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
            { text: 'useMyApiData', link: '/api/use-my-api-data' },
            { text: '$myApi', link: '/api/my-api' },
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
      ],
    },
    {
      text: 'Module',
      items: [
        { text: 'Configuration', link: '/config/' },
      ],
    },
    {
      text: 'In-Depth',
      items: [
        { text: 'Hydration', link: '/guide/hydration' },
        { text: 'Caching', link: '/guide/caching' },
        { text: 'Cookies', link: '/guide/cookies' },
        { text: 'Retries', link: '/guide/retries' },
        { text: 'Dynamic Backend URL', link: '/guide/dynamic-backend-url' },
        { text: 'OpenAPI Types', link: '/guide/openapi-types' },
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
        { text: 'useMyApiData', link: '/api/use-my-api-data' },
        { text: '$myApi', link: '/api/my-api' },
      ],
    },
  ]
}
