// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    css: ['~/assets/css/main.css'],

    app: {
        head: {
            meta: [
                { name: 'mobile-web-app-capable', content: 'yes' },
                { name: 'apple-mobile-web-app-capable', content: 'yes' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' },

                { name: 'description', content: 'An online Blood on the Clocktower grimoire' },
                { name: 'theme-color', content: '#ad8c4d',},
                { property: 'og:type', content: 'website' },
                { property: 'og:site_name', content: 'Townsquare' },
                { property: 'og:title', content: 'Townsquare' },
                { property: 'og:description', content: 'An online Blood on the Clocktower grimoire' },
                { property: 'og:image', content: 'https://botc.tazaraz.dev/logo.png' },
                { property: 'og:url', content: 'https://botc.tazaraz.dev/' },
            ],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
                { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
                { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
                { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
                { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
                { rel: 'manifest', href: '/site.webmanifest' },
            ],
        },
    },

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
    },
})