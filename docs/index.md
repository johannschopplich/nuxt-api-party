---
layout: home
titleTemplate: Server Proxy and Generated API Composables
hero:
  name: Nuxt API Party
  text: Server Proxy and Generated API Composables
  tagline: Like useFetch and $fetch, but for all your APIs
  image:
    src: /logo-shadow.svg
    alt: Nuxt API Party Logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API
      link: /api/
    - theme: alt
      text: View on GitHub
      link: https://github.com/johannschopplich/nuxt-api-party

features:
  - title: Generated composables
    icon: <span class="i-carbon:magic-wand-filled"></span>
    details: Auto-generated composables for each API endpoint.
    link: /api/
    linkText: API Reference
  - title: Protected API Credentials
    icon: <span class="i-carbon:ibm-cloud-hyper-protect-dbaas"></span>
    details: A Nuxt server route proxies your requests. No CORS issues!
    link: /guide/how-it-works
    linkText: How It Works
  - title: Familiar Data Handling
    icon: <span class="i-carbon:noodle-bowl"></span>
    details: Handle requests just like Nuxt <code>useFetch</code> and <code>$fetch</code>.
    link: /api/use-fetch-like
    linkText: Async Data Composable
  - title: Connect Multiple APIs
    icon: <span class="i-carbon:ibm-watson-query"></span>
    details: Configure all your APIs once and use them throughout your app.
    link: /guide/getting-started.html#step-3-set-up-api-endpoints
    linkText: Set up API Endpoints
  - title: OpenAPI Support
    icon: <span class="i-devicon-plain:openapi"></span>
    details: Create fully typed API clients from OpenAPI specifications.
    link: /guide/openapi-types
    linkText: Generate Clients
  - title: TypeScript
    icon: <span class="i-devicon-plain:typescript"></span>
    details: Type-safe parameters, request bodies and responses for OpenAPI endpoints.
    link: /guide/openapi-types
    linkText: Leaverage Typings
  - title: Hooks
    icon: <span class="i-carbon:tools-alt"></span>
    details: Customize the module's behavior with hooks.
    link: /guide/hooks
    linkText: Customize at Build-Time
  - title: Proxy Errors
    icon: <span class="i-carbon:error-outline"></span>
    details: Pass-through errors from your API to your app.
    link: /guide/error-handling
    linkText: Log and Handle Errors
---
