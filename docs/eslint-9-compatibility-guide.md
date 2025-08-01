# ESLint 9와 Next.js 15 호환성 문제 해결 가이드

## 문제 진단

### 현재 상황

- **Next.js**: 15.0.0
- **ESLint**: 8.57.1
- **eslint-config-next**: 15.0.0

### 주요 문제

1. Next.js 15가 내부적으로 ESLint 9 설정을 기대하지만, 실제로는 ESLint 8이 설치되어 있음
2. `next lint` 명령어가 deprecated된 옵션들을 사용하려고 함:
   - `useEslintrc`
   - `extensions`
   - `resolvePluginsRelativeTo`
   - `rulePaths`
   - `ignorePath`
   - `reportUnusedDisableDirectives`

## 해결 방안

### 1. 즉시 해결 방법 (권장)

#### A. 빌드 시 ESLint 건너뛰기

```javascript
// next.config.mjs
eslint: {
  ignoreDuringBuilds: true,
}
```

#### B. 개발 중 대체 명령어 사용

```json
// package.json
{
  "scripts": {
    "check:all": "npm run type-check && npm run format:check",
    "type-check": "tsc --noEmit --incremental --tsBuildInfoFile .tsbuildinfo",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\""
  }
}
```

### 2. 장기 해결 방법

#### A. Next.js 팀의 공식 패치 대기

- Next.js 15.0.x 버전에서 ESLint 9 호환성 문제가 해결될 예정
- [GitHub Issue](https://github.com/vercel/next.js/issues) 모니터링

#### B. ESLint 8 유지

- 현재 안정적인 ESLint 8.57.1 버전 유지
- Next.js가 공식적으로 ESLint 9를 지원할 때까지 대기

### 3. 개발 워크플로우 최적화

#### VS Code 설정

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": false,
    "source.formatDocument": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ]
}
```

#### Pre-commit Hook 사용

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# TypeScript 체크
npm run type-check

# Prettier 포맷팅
npm run format:check
```

### 4. CI/CD 파이프라인 설정

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci
      - run: npm run type-check
      - run: npm run format:check
      - run: npm run build
```

## 성능 최적화 팁

### 1. TypeScript 체크 속도 향상

```bash
# 증분 빌드 사용
tsc --noEmit --incremental

# 특정 파일만 체크
tsc --noEmit src/app/page.tsx
```

### 2. Prettier 속도 향상

```bash
# 캐시 사용
prettier --cache --check "src/**/*.{ts,tsx}"

# 변경된 파일만 체크
prettier --check $(git diff --name-only HEAD)
```

## 임시 해결책

프로젝트가 큰 경우, 다음 스크립트를 사용하여 부분적으로 린트 실행:

```bash
#!/bin/bash
# scripts/lint-partial.sh

# 최근 변경된 파일만 린트
git diff --name-only HEAD | grep -E '\.(ts|tsx)$' | xargs -I {} eslint {}

# 특정 디렉토리만 린트
eslint src/app --ext .ts,.tsx --max-warnings 10
```

## 결론

현재 Next.js 15.0.0과 ESLint 9의 호환성 문제는 알려진 이슈입니다.
가장 실용적인 해결책은:

1. **개발 중**: VS Code의 ESLint 확장 활용
2. **커밋 전**: TypeScript 체크와 Prettier 포맷팅
3. **빌드 시**: ESLint를 일시적으로 비활성화
4. **CI/CD**: 엄격한 품질 검사 수행

Next.js 팀의 공식 수정사항이 나올 때까지 이 워크플로우를 사용하는 것을 권장합니다.
