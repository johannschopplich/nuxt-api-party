import { defineConfig } from 'vitepress'
import type { DefaultTheme } from 'vitepress'
import { description, name, version } from '../../package.json'
import {
  github,
  ogImage,
  ogUrl,
  releases,
} from './meta'

export default defineConfig({
  lang: 'en-US',
  title: name,
  description: 'Connect with any API securely',
  head: [
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['meta', { property: 'og:title', content: name }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:url', content: ogUrl }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { name: 'twitter:title', content: name }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: ogImage }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    editLink: {
      pattern: 'https://github.com/johannschopplich/nuxt-api-party/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },

    nav: nav(),

    sidebar: {
      '/guide/': sidebarGuide(),
      '/config/': sidebarConfig(),
      '/api/': sidebarApi(),
    },

    socialLinks: [
      { icon: 'github', link: github },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-present Johann Schopplich',
    },
  },
})

function nav(): DefaultTheme.NavItem[] {
  return [
    { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
    { text: 'Config', link: '/config/' },
    { text: 'API', link: '/api/', activeMatch: '/api/' },
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
      text: 'Introduction',
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
      ],
    },
    {
      text: 'FAQ',
      items: [
        { text: 'How to Track Errors', link: '/guide/faq-how-to-track-errors' },
      ],
    },
    { text: 'Playground', link: 'https://github.com/johannschopplich/nuxt-api-party/tree/main/playground' },
    { text: 'Migration', link: '/guide/migration' },
  ]
}

function sidebarConfig(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Config',
      items: [
        { text: 'Module Config', link: '/config/' },
      ],
    },
  ]
}

function sidebarApi(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'API Reference',
      items: [
        { text: 'Overview', link: '/api/' },
      ],
    },
    {
      text: 'Composables',
      items: [
        { text: 'useApiPartyData', link: '/api/use-api-party-data' },
        { text: '$apiParty', link: '/api/api-party' },
      ],
    },
  ]
}
