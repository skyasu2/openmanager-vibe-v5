import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  // 전역 무시 설정
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/dist/**',
      '**/build/**',
      '**/storybook-static/**',
      'scripts/**',
      'config/**',
      'public/**',
      'docs/**',
      '**/*.config.*',
      '**/*.d.ts',
      '**/*.test.*',
      '**/*.spec.*',
      '**/*.stories.*',
    ],
  },

  // JavaScript 권장 규칙
  js.configs.recommended,

  // 전역 설정
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        JSX: 'readonly',
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },

  // 모든 파일에 대한 기본 설정 (타입 체크 없음!)
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // project 옵션 제거 - 이것이 성능 향상의 핵심!
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      prettier: prettierPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Prettier
      'prettier/prettier': ['error', { printWidth: 80 }],
      
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // TypeScript 기본 규칙만 (타입 체크 불필요한 것들)
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'off',
      
      // 기본 규칙
      'no-console': 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-unused-vars': 'off', // TypeScript 규칙으로 대체
      'no-undef': 'off', // TypeScript가 처리
    },
  },
];