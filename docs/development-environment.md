# 🏗️ 개발 환경 설정 가이드

> OpenManager VIBE v5의 최신 개발 환경 설정을 안내합니다.

## 📋 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [ESLint v9 설정](#eslint-v9-설정)
3. [Prettier 통합](#prettier-통합)
4. [TypeScript 설정](#typescript-설정)
5. [VS Code 설정](#vs-code-설정)
6. [패키지 관리](#패키지-관리)
7. [일반적인 문제 해결](#일반적인-문제-해결)

## 🖥️ 시스템 요구사항

### 필수 소프트웨어

- **Node.js**: v22.15.1+ (LTS 권장)
- **npm**: v10.0.0+
- **Git**: v2.30.0+

### 지원 운영체제

- Windows 10/11
- macOS 10.15+
- Ubuntu 20.04+ / WSL2

## 🎯 ESLint v9 설정

### 최신 Flat Config 형식

OpenManager VIBE v5는 ESLint v9의 새로운 flat config 형식을 사용합니다.

#### `eslint.config.mjs` 주요 구성

```javascript
// ESLint v9 Flat Config
import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  // 전역 무시 설정
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/coverage/**',
      // ... 기타 무시 경로
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
        ...globals.es2021,
      },
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
  },

  // TypeScript/JavaScript 파일 설정
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'unused-imports': unusedImports,
      prettier: prettierPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // Prettier 통합
      'prettier/prettier': ['error', { printWidth: 80 }],

      // React Hooks 규칙 (v5.2.0)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Import 관리
      'unused-imports/no-unused-imports': 'error',

      // TypeScript 규칙
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
```

### React Hooks 플러그인 통합

#### 호환성 해결

- **문제**: React Hooks 플러그인의 canary 버전이 ESLint v9와 호환되지 않음
- **해결**: 안정 버전 v5.2.0으로 업그레이드

```json
// package.json
{
  "devDependencies": {
    "eslint": "^9.31.0",
    "eslint-plugin-react-hooks": "^5.2.0"
  }
}
```

### ESLint 실행 명령어

```bash
# 린트 검사
npm run lint

# 자동 수정
npm run lint:fix

# 캐시 사용 (빠른 실행)
npm run lint:cache

# 디버깅 모드
npm run lint:debug
```

## 🎨 Prettier 통합

### `.prettierrc` 설정

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf",
  "arrowParens": "always",
  "bracketSpacing": true,
  "jsxBracketSameLine": false,
  "proseWrap": "preserve"
}
```

### 포맷팅 명령어

```bash
# 포맷팅 적용
npm run format

# 포맷팅 검사만
npm run format:check
```

## 📘 TypeScript 설정

### `tsconfig.json` 핵심 설정

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 타입 체크 명령어

```bash
# 타입 체크
npm run type-check
```

## 🔧 VS Code 설정

### `.vscode/settings.json`

```json
{
  // ESLint v9 Flat Config 지원
  "eslint.enable": true,
  "eslint.experimental.useFlatConfig": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],

  // 저장 시 자동 수정
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },

  // Prettier 기본 포맷터 설정
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // 기타 유용한 설정
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": false,
  "files.autoSave": "onFocusChange"
}
```

### 권장 VS Code 확장 프로그램

1. **ESLint** (dbaeumer.vscode-eslint)
2. **Prettier** (esbenp.prettier-vscode)
3. **TypeScript** (내장)
4. **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)

## 📦 패키지 관리

### 주요 개발 의존성

```json
{
  "devDependencies": {
    // ESLint v9 생태계
    "eslint": "^9.31.0",
    "@eslint/eslintrc": "^3.3.1",
    "@eslint/js": "^9.30.1",

    // TypeScript ESLint
    "@typescript-eslint/eslint-plugin": "^8.37.0",
    "@typescript-eslint/parser": "^8.37.0",

    // ESLint 플러그인
    "eslint-plugin-prettier": "^5.5.3",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-unused-imports": "^4.1.4",
    "eslint-plugin-storybook": "^9.0.16",

    // 전역 변수 정의
    "globals": "^16.3.0",

    // Prettier
    "prettier": "^3.4.2",

    // TypeScript
    "typescript": "^5.7.2"
  }
}
```

### 설치 및 업데이트

```bash
# 클린 설치
rm -rf node_modules package-lock.json
npm install

# 의존성 업데이트 확인
npm outdated

# 안전한 업데이트
npm update
```

## ❗ 일반적인 문제 해결

### 1. ESLint v9 마이그레이션 이슈

#### 문제: "context.getScope is not a function"

- **원인**: React Hooks 플러그인 버전 호환성
- **해결**:
  ```bash
  npm install eslint-plugin-react-hooks@5.2.0
  ```

#### 문제: ESLint 설정 파일 충돌

- **원인**: 여러 설정 파일 존재 (.eslintrc.js, .eslintrc.json, eslint.config.mjs)
- **해결**:
  1. 구 형식 파일 삭제
  2. `eslint.config.mjs`만 사용

### 2. VS Code ESLint 인식 문제

#### 문제: ESLint가 작동하지 않음

- **해결**:
  1. VS Code 재시작
  2. ESLint 확장 프로그램 재설치
  3. `eslint.experimental.useFlatConfig: true` 설정 확인

### 3. Prettier와 ESLint 충돌

#### 문제: 포맷팅 규칙 충돌

- **해결**:
  - `eslint-plugin-prettier` 사용
  - `.prettierrc`의 `printWidth`와 ESLint 설정 동기화

### 4. TypeScript 에러

#### 문제: "Cannot find module '@/...'"

- **해결**:
  ```json
  // tsconfig.json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./src/*"]
      }
    }
  }
  ```

## 🔄 개발 워크플로우

### 1. 개발 시작

```bash
# 개발 서버 시작
npm run dev

# 별도 터미널에서 타입 체크 감시
npm run type-check -- --watch
```

### 2. 코드 작성

- VS Code의 자동 저장 및 포맷팅 활용
- ESLint 경고/에러 즉시 해결

### 3. 커밋 전 검증

```bash
# 전체 검증
npm run validate:all

# 또는 개별 실행
npm run type-check
npm run lint
npm run test
```

### 4. 커밋

```bash
# Husky pre-commit 훅이 자동으로 검증 실행
git add .
git commit -m "feat: 기능 추가"
```

## 📝 참고사항

- ESLint v9는 flat config를 기본으로 사용합니다
- React Hooks 규칙은 함수형 컴포넌트 개발에 필수입니다
- Prettier와 ESLint 설정은 프로젝트 전체에서 일관성을 유지합니다
- VS Code 설정은 팀 전체가 동일한 개발 경험을 갖도록 합니다

---

**문서 버전**: 1.0.0  
**마지막 업데이트**: 2025-07-21  
**관련 문서**: [개발 가이드](./development-guide.md), [테스팅 가이드](./testing-guide.md)
