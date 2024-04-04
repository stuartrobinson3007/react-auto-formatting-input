import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // By default this plugin will only load variables that start with VITE_*
  // To fix this we can use the loadEnv function from Vite
  // We set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  process.env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    test: {
      globals: true,
      includeSource: ['test/**/*.{js,ts}'],
      exclude: [...configDefaults.exclude],
      environment: 'happy-dom',
      alias: {
        '@/': new URL('./', import.meta.url).pathname,
      },
    },
  }
})
