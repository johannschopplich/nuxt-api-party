export default defineNuxtConfig({
  modules: ['../src/module'],

  apiParty: {
    name: 'json-placeholder',
  },

  typescript: {
    strict: true,
    typeCheck: true,
    shim: false,
  },
})
