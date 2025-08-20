# Config Directory

**체계적으로 정리된 설정 파일 구조** - JBGE 원칙 적용 (2025-08-20 업데이트)

This directory contains organized configuration files for OpenManager VIBE v5, categorized by purpose and functionality.

## 📁 Directory Structure

```
config/
├── build/           # 빌드 최적화 설정
├── next/            # Next.js 변형 설정
├── security/        # 보안 및 암호화 설정
├── testing/         # 테스트 환경 설정
└── typescript/      # TypeScript 컴파일러 설정
```

## 🏗️ Build Configuration (`build/`)
- `package.optimized.json` - 최적화된 패키지 설정

## ⚛️ Next.js Configuration (`next/`)
- `next.config.optimized.mjs` - 성능 최적화 버전
- `next.config.performance.mjs` - 성능 특화 설정
- `next.config.ultra-optimized.mjs` - 극한 최적화 버전

## 🔐 Security Configuration (`security/`)
- `encrypted-env-config.mjs` - 환경변수 암호화 (MJS)
- `encrypted-env-config.ts` - 환경변수 암호화 (TypeScript)
- `supabase-encrypted.json` - Supabase 암호화 설정

## 🧪 Testing Configuration (`testing/`)
- `vitest.config.dom.ts` - DOM 테스트 환경
- `vitest.config.minimal.ts` - 최소 테스트 설정
- `vitest.node.config.ts` - Node.js 테스트 환경
- `vitest.performance.config.ts` - 성능 테스트 설정

## 📘 TypeScript Configuration (`typescript/`)
- `tsconfig.build.json` - 빌드용 TypeScript 설정
- `tsconfig.precommit.json` - Pre-commit 검증용 설정
- `tsconfig.test.json` - 테스트용 TypeScript 설정

## 🎯 사용 방법

### 특정 설정으로 실행
```bash
# 성능 최적화 모드로 개발
npx next dev -c config/next/next.config.performance.mjs

# 성능 테스트 실행
npx vitest run -c config/testing/vitest.performance.config.ts

# 빌드용 TypeScript 컴파일
npx tsc -p config/typescript/tsconfig.build.json
```

### 환경별 설정 전환
```bash
# 최적화된 패키지로 빌드
cp config/build/package.optimized.json package.json
npm run build
```

## 📋 루트 디렉토리 유지 파일

다음 파일들은 도구 호환성을 위해 루트에 유지됩니다:

- `package.json` - 기본 패키지 설정
- `tsconfig.json` - 기본 TypeScript 설정
- `next.config.mjs` - 기본 Next.js 설정
- `eslint.config.mjs` - ESLint 설정
- `tailwind.config.ts` - Tailwind CSS 설정
- `postcss.config.mjs` - PostCSS 설정
- `playwright.config.ts` - E2E 테스트 설정
- `vitest.config.ts` - 기본 테스트 설정
- `components.json` - shadcn/ui 설정
- `vercel.json` - Vercel 배포 설정

## 🔄 Configuration Switching

### 개발 환경별 전환
```javascript
// package.json scripts
{
  "dev": "next dev",
  "dev:optimized": "next dev -c config/next/next.config.optimized.mjs",
  "dev:performance": "next dev -c config/next/next.config.performance.mjs"
}
```

### 테스트 환경별 전환
```javascript
{
  "test": "vitest",
  "test:dom": "vitest -c config/testing/vitest.config.dom.ts",
  "test:node": "vitest -c config/testing/vitest.node.config.ts",
  "test:performance": "vitest -c config/testing/vitest.performance.config.ts"
}
```

---

💡 **원칙**: 베이스 설정은 루트에 유지, 변형/최적화 설정은 config/에서 관리
