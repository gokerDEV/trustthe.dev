
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier/flat'
import { defineConfig, globalIgnores } from 'eslint/config'


export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // Prettier: disable stylistic rules that would fight with Prettier
  // (imported LAST so it can turn things off)
  prettier,

  // Ignores (Next defaults + your own)
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/api/client/**',
  ]),
])
