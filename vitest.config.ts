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
                    setupFiles: ['tests/setup.ts'],
                },
            }),
        ],
        onConsoleLog: (l) => {
            // Hide '<Suspense> is an experimental feature and its API will likely change.' warning.
            return !l.startsWith('<Suspense>');
        }
    }
})