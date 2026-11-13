---
layout: home
titleTemplate: Auto-generated composables for any API
hero:
  name: Nuxt API Party
  text: Type-Safe API Clients for Nuxt
  tagline: Configure an endpoint once and call it through composables that keep your credentials on the server.
  image:
    src: /logo-shadow.svg
    alt: Nuxt API Party Logo
  actions:
    - theme: brand
      text: Get Started
      link: /essentials/getting-started
    - theme: alt
      text: API Reference
      link: /api/
    - theme: alt
      text: View on GitHub
      link: https://github.com/johannschopplich/nuxt-api-party

features:
  - title: API Composables
    icon: <span class="i-carbon:magic-wand-filled"></span>
    details: Auto-generated composables for each API.
    link: /api/
    linkText: API Reference
  - title: Credentials Stay on the Server
    icon: <span class="i-carbon:ibm-cloud-hyper-protect-dbaas"></span>
    details: A server proxy in your app forwards each request, so tokens never reach the browser and CORS never applies.
    link: /essentials/how-it-works
    linkText: How It Works
  - title: Familiar Data Handling
    icon: <span class="i-carbon:noodle-bowl"></span>
    details: The composables are built on Nuxt's own <code>useFetch</code> and <code>$fetch</code>.
    link: /api/use-fetch-like
    linkText: useFetch-Like Composable
  - title: Several APIs Side by Side
    icon: <span class="i-carbon:ibm-watson-query"></span>
    details: Configure each API once and reach all of them from anywhere in your app.
    link: /essentials/getting-started#configure-your-first-endpoint
    linkText: Configure Your First Endpoint
  - title: OpenAPI Support
    icon: <span class="i-devicon-plain:openapi"></span>
    details: Typed paths, parameters, request bodies and responses, generated from your OpenAPI document.
    link: /guides/openapi-integration
    linkText: Generate Clients
  - title: Errors Reach Your App
    icon: <span class="i-carbon:server-proxy"></span>
    details: The proxy passes the upstream status code and error payload through unchanged.
    link: /guides/error-handling
    linkText: Log and Handle Errors
---
