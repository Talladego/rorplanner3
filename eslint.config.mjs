import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  { ignores: ['dist'] },
  // Node scripts (probes and tooling)
  {
    files: ['scripts/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parser: tsparser,
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      // Allow "any" in ad-hoc scripts to keep them flexible
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsparser,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
  // TypeScript handles prop typing; disable runtime prop-types enforcement
  'react/prop-types': 'off',
      // Prevent ambiguous ApolloProvider imports; enforce stable subpath
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@apollo/client',
              importNames: ['ApolloProvider'],
              message: "Import ApolloProvider from '@apollo/client/react' to avoid ESM resolution issues.",
            },
          ],
        },
      ],
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // Components must not import the store adapter directly; enforce boundary only for components
  {
    files: ['src/components/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsparser,
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/store/loadout/loadoutStoreAdapter'],
              message: 'Components must not import the store adapter directly; use loadoutService instead.',
            },
          ],
        },
      ],
    },
  },
  // Tests: enable vitest-style globals and relax restrictions
  {
    files: ['src/__tests__/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.browser,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
      parser: tsparser,
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-imports': 'off',
      'no-undef': 'off',
    },
  },
  // Generated GraphQL types: allow any in generated file to avoid noisy linting
  {
    files: ['src/generated/**/*.ts'],
    languageOptions: { parser: tsparser },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow duplicate exports / pattern collisions produced by multiple plugins (typed-document-node + react-apollo)
      'no-redeclare': 'off',
      // Allow Apollo imports inside generated file (rule is only to steer manual code)
      'no-restricted-imports': 'off',
    },
  },
]
