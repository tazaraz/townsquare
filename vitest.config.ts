import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
    test: {
        projects: [
            await defineVitestProject({
                test: {
                    name: 'unit',
                    include: ['tests/unit/*.{test,spec}.ts'],
                    environment: 'nuxt',
                },
            }),
        ]
    }
})