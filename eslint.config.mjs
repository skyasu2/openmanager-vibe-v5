import globals from "globals";
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import k6Plugin from 'eslint-plugin-k6-linting-rules';

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
      'react': reactPlugin,
      'react-hooks': hooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
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
      
      // --- Custom Rules ---
      // General
      'no-console': 'off',

      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/require-await': 'warn',
      
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
      'react/jsx-key': 'warn', // Warn about missing keys
      'react/no-unknown-property': ['error', { ignore: ['jsx'] }],
      
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  ...tseslint.configs.recommendedTypeChecked.map(config => ({
    ...config,
    files: ['src/**/*.{ts,tsx}'],
  })),
  
  // Override TypeScript unsafe rules after recommendedTypeChecked
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // TypeScript unsafe operations - disabled for better TypeScript inference
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // Keep these as error (removed temporary downgrades)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

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
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // 5. Configuration for specific file types
  {
    files: ['google-cloud-sdk/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      }
    }
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
        }
    }
  }
);
