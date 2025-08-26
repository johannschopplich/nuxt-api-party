import { defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  hooks: {
    'api-party:extend': async ({ endpoints }) => {
      endpoints.testMod = {
        url: '/api',
      }
    },
  },
})
