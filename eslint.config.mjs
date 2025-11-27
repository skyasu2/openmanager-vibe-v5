import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import k6Plugin from 'eslint-plugin-k6-linting-rules';

// 🚀 Performance: 타입 체킹을 환경변수로 제어 (lint-staged/pre-push에서 비활성화)
// ESLINT_FAST=true: 타입 체킹 없이 빠른 린트만 실행
const FAST_MODE = process.env.ESLINT_FAST === 'true';

export default tseslint.config(
  // 1. Global ignores (migrated from .eslintignore)
  {
    ignores: [
      // Dependencies
      'node_modules/',
      '.pnp',
      '.pnp.js',

      // Testing
      'coverage/',
      'playwright-report/',
      'test-results/',

      // Next.js
      '.next/',
      'out/',
      'build/',
      'dist/',

      // Production
      '*.production',

      // Misc
      '.DS_Store',
      '*.pem',
      '.vscode/',
      '.idea/',

      // Debug
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      '.pnpm-debug.log*',

      // Local env files
      '.env*.local',
      '.env',

      // Vercel
      '.vercel/',

      // TypeScript
      '*.tsbuildinfo',
      'next-env.d.ts',

      // Scripts and configs
      'scripts/',
      'config/',
      'public/',
      'docs/',
      '**/*.config.*',
      '**/*.d.ts',

      // Test files
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',

      // Generated files
      '**/generated/',
      '**/.cache/',

      // GCP Functions (Python)
      'gcp-functions/',

      // External libraries and SDKs
      'google-cloud-sdk/',
      'vm-context-api/',

      // Analysis and migration scripts
      'analyze_*.js',
      'check_*.js',
      'execute_*.js',
      'database_*.js',
      'test-*.js',
      '*.benchmark.js',

      // Infrastructure
      'infra/',
      'tests/scripts/',

      // Archive and backups (legacy files)
      'archive/**',
      'backups/**',

      // Specific problematic files
      'tests/scripts/test-ai-priority.mjs', // Corrupted file
    ],
  },

  // 2. Base configs for all files
  js.configs.recommended,
  eslintConfigPrettier,

  // 3. Configuration for TypeScript files (React/Next.js)
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@typescript-eslint': tseslint.plugin, // 🔧 FAST_MODE에서도 플러그인 등록 필요
    },
    languageOptions: {
      parser: tseslint.parser, // 🔧 TypeScript 파서 명시
      // 🚀 FAST_MODE: 타입 체킹 비활성화로 10-20배 속도 향상
      parserOptions: FAST_MODE
        ? {}
        : {
            project: true,
            tsconfigRootDir: import.meta.dirname,
          },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,

      // --- Custom Rules ---
      // General
      'no-console': 'off',

      // TypeScript (타입 체킹 불필요한 규칙)
      'no-undef': 'off', // TypeScript checks this
      'no-unused-vars': 'off', // Disable base rule in favor of @typescript-eslint/no-unused-vars
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-case-declarations': 'error', // UPGRADED: Potential scoping bugs in switch statements

      // TypeScript (타입 체킹 필요한 규칙 - FAST_MODE에서 비활성화)
      '@typescript-eslint/require-await': FAST_MODE ? 'off' : 'off', // Disabled: conflicts with TypeScript explicit Promise return types
      '@typescript-eslint/no-floating-promises': FAST_MODE ? 'off' : 'error', // UPGRADED: Uncaught promises can cause runtime bugs
      '@typescript-eslint/no-redundant-type-constituents': 'off', // Disabled: produces false positives with multi-level re-exports
      '@typescript-eslint/no-base-to-string': FAST_MODE ? 'off' : 'error', // UPGRADED: toString() misuse causes runtime errors

      // TypeScript unsafe operations - disabled for better TypeScript inference
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',

      // React
      'react/react-in-jsx-scope': 'off', // Not needed with Next.js 17+
      'react/jsx-uses-react': 'off', // Not needed with Next.js 17+
      'react/prop-types': 'off', // Handled by TypeScript
      'react/jsx-key': 'error', // UPGRADED: Missing keys cause React rendering bugs
      'react/no-unknown-property': ['error', { ignore: ['jsx'] }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // 🚀 FAST_MODE: 타입 체킹 규칙 건너뛰기 (lint-staged/pre-push용)
  ...(FAST_MODE
    ? []
    : tseslint.configs.recommendedTypeChecked.map((config) => ({
        ...config,
        files: ['src/**/*.{ts,tsx}'],
      }))),

  // Override TypeScript unsafe rules after recommendedTypeChecked
  // 🚀 FAST_MODE: 이 블록도 조건부 적용 (타입 체킹 필요)
  ...(FAST_MODE
    ? []
    : [
        {
          files: ['src/**/*.{ts,tsx}'],
          rules: {
            // TypeScript unsafe operations - disabled for better TypeScript inference
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',

            // Override type-checked rules (must match first config block)
            '@typescript-eslint/no-unused-vars': [
              'warn',
              { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/no-floating-promises': 'error', // UPGRADED: Uncaught promises can cause runtime bugs
            '@typescript-eslint/no-redundant-type-constituents': 'off', // Disabled: produces false positives with multi-level re-exports
            '@typescript-eslint/no-base-to-string': 'error', // UPGRADED: toString() misuse causes runtime errors
            '@typescript-eslint/require-await': 'off', // Disabled: conflicts with TypeScript explicit Promise return types
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-case-declarations': 'error', // UPGRADED: Potential scoping bugs in switch statements
          },
        },
      ]),

  // 4. Configuration for JS/MJS/CJS files (Node.js scripts, configs, etc.)
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    extends: [tseslint.configs.disableTypeChecked],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'prefer-const': 'warn',
      'no-var': 'warn',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off', // Allow require() in JS files
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // 5. Configuration for specific file types
  {
    files: ['google-cloud-sdk/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['tests/scripts/performance-test.k6.js'],
    plugins: {
      'k6-linting-rules': k6Plugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser, // k6 environment is browser-like
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
        open: 'readonly',
        check: 'readonly',
        fail: 'readonly',
        group: 'readonly',
        sleep: 'readonly',
      },
    },
  }
);
