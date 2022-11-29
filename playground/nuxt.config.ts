export default defineNuxtConfig({
  modules: ['../src/module'],

  apiParty: {
    name: 'json-placeholder',
  },

  typescript: {
    typeCheck: true,
    shim: false,
  },
})
