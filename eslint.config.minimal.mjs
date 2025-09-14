import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // Global ignores for performance
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'build/',
      'dist/',
      'scripts/',
      'config/',
      'public/',
      'docs/',
      'archive/',
      'reports/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
      '**/*.config.*',
      '**/*.d.ts',
      '*.tsbuildinfo',
      'next-env.d.ts',
    ],
  },

  // Basic JavaScript rules only
  js.configs.recommended,

  // TypeScript syntax parsing without type checking
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        // NO project parsing for speed
      },
    },
    rules: {
      // Essential rules only
      'no-unused-vars': 'off', // Use TypeScript version
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true 
      }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off',
      'no-undef': 'off', // TypeScript handles this
    },
  },

  // JS/JSX files
  {
    files: ['src/**/*.{js,jsx}'],
    rules: {
      'no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true 
      }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off',
    },
  },
];