import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // 🎯 전역 무시 설정
  {
    ignores: [
      // 빌드 및 배포 관련
      '**/.next/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/dist/**',
      '**/build/**',
      '**/storybook-static/**',
      '**/test-results/**',

      // 설정 파일 (ESLint v9에서는 자동 무시되지 않음)
      '**/*.config.*',
      '**/*.d.ts',

      // 개발 도구 및 스크립트
      'scripts/**',
      'infra/**',
      'config/**',
      'mcp-servers/**',
      'gcp-functions/**',

      // 정적 파일
      'public/**',

      // 테스트 파일 (선택적 - 필요시 제거)
      'tests/**',
      'e2e/**',
      '**/*.test.*',
      '**/*.spec.*',
      '**/__tests__/**',

      // 문서 및 백업
      'docs/**',
      'archive/**',
      'logs/**',

      // 스토리북
      '.storybook/**',
      '**/*.stories.*',

      // 임시 파일
      '*.tmp',
      '*.temp',
      '.env*',
      '*.log',
      '*.backup',

      // Git 관련
      '.git/**',
      '.husky/**',
    ],
  },

  // 🔧 JavaScript 권장 규칙
  js.configs.recommended,

  // 🌐 전역 설정
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
        React: 'readonly',
        JSX: 'readonly',
      },
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // 📝 TypeScript/JavaScript 파일 설정
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      prettier: prettierPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // 🎨 Prettier 통합
      'prettier/prettier': [
        'error',
        {
          printWidth: 80, // .prettierrc와 동기화
        },
      ],

      // 📏 파일 크기 제한
      'max-lines': [
        'warn',
        {
          max: 800,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'max-lines-per-function': [
        'warn',
        {
          max: 100,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      // 🔧 TypeScript 타입 안전성
      '@typescript-eslint/no-explicit-any': 'off', // Phase 1: 점진적 개선
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-unsafe-assignment': 'off', // 기존 코드베이스 호환
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off', // @ts-ignore 허용

      // 📦 Import 관리
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          disallowTypeAnnotations: false,
        },
      ],

      // ⚛️ React/Next.js
      // React Hooks 플러그인 v5.2.0 - ESLint v9 호환성 해결
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn', // 기존 설정 유지

      // 🛠️ 일반 규칙
      'no-console': 'off', // 개발 편의성
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-unused-vars': 'off', // TypeScript가 처리
      'prefer-const': 'off', // 기존 코드 호환
      'no-undef': 'off', // TypeScript가 처리
      'no-empty': 'off', // 빈 블록 허용
      'no-constant-condition': 'off', // while(true) 등 허용

      // 📏 코드 스타일 (Prettier가 처리하므로 비활성화)
      indent: 'off',
      quotes: 'off',
      semi: 'off',
      'comma-dangle': 'off',
      'arrow-parens': 'off',
      'max-len': 'off', // Prettier printWidth로 관리

      // 🚫 추가 비활성화 (기존 코드 호환)
      'import/no-anonymous-default-export': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
    },
  },

  // 📚 Storybook 설정
  ...storybook.configs['flat/recommended'],

  // 🔍 특정 파일 타입별 추가 설정
  {
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // 🧪 테스트 파일 설정 (선택적 - ignores에서 제외시 사용)
  {
    files: ['**/*.test.{js,jsx,ts,tsx}', '**/*.spec.{js,jsx,ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
