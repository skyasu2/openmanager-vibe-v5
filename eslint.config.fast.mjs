import globals from "globals";
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  // 1. Global ignores (same as original)
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
      
      // Scripts and configs (expanded for performance)
      'scripts/',
      'config/',
      'public/',
      'docs/',
      'archive/',
      'reports/',
      '**/*.config.*',
      '**/*.d.ts',
      
      // Test files
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
      
      // Generated files
      '**/generated/',
      '**/.cache/',
      
      // GCP Functions
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
      
      // Specific problematic files
      'tests/scripts/test-ai-priority.mjs',
    ],
  },

  // 2. Base configs for all files
  js.configs.recommended,
  eslintConfigPrettier,

  // 3. Fast configuration for TypeScript files (NO project parsing)
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      'react': reactPlugin,
      'react-hooks': hooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      // NO project parsing for speed
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      
      // --- Essential Rules Only ---
      // General
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error',

      // TypeScript basic rules (no type checking)
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_', 
        ignoreRestSiblings: true 
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      
      // React
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react/jsx-key': 'warn',
      'react/no-unknown-property': ['error', { ignore: ['jsx'] }],
      
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // 4. Basic TypeScript syntax rules (fast)
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['src/**/*.{ts,tsx}'],
  })),

  // 5. Configuration for JS/MJS/CJS files
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
      '@typescript-eslint/no-require-imports': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);