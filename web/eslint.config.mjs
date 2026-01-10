import tseslint from 'typescript-eslint'
import eslint from '@eslint/js'

import nextTs from 'eslint-config-next/typescript'
import { globalIgnores, defineConfig } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

const eslintConfig = defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      semi: ['error', 'never'],
      'prefer-const': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'react/no-children-prop': [
        'error',
        {
          allowFunctions: true,
        },
      ],
    },
  })),
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'components/ui/**',
    'node_modules/**',
  ]),
  eslintConfigPrettier,
])

export default eslintConfig
