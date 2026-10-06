// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],

  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/image',
    '@nuxt/test-utils/module',
    'pinia-plugin-persistedstate/nuxt',
  ],
  typescript: {
    tsConfig: {
      include: [
        // this path is relative to the generated .nuxt/tsconfig.json
        '../tests/**/*',
      ],
    },
  },
  nitro: {
    experimental: {
      websocket: true
    }
  }
})