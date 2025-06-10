# 개발 설정 파일

이 폴더는 OpenManager Vibe v5의 개발 관련 설정 파일들을 포함합니다.

## 📁 파일 설명

### 코드 품질 도구

- `eslint.config.mjs` - ESLint 설정 (코드 린팅)
  - TypeScript, React, Next.js 규칙 적용
  - 커스텀 규칙: 바이브 코딩 스타일 준수
- `components.json` - shadcn/ui 컴포넌트 설정
  - 컴포넌트 경로: `src/components/ui`
  - 유틸리티 함수: `src/lib/utils`

### 스타일링

- `tailwind.config.ts` - Tailwind CSS 설정
  - 커스텀 테마: OpenManager 브랜딩
  - 반응형 브레이크포인트 정의
  - 다크모드 지원 설정
- `postcss.config.mjs` - PostCSS 설정
  - Tailwind CSS 플러그인
  - autoprefixer 설정

### 테스트

- `vitest.config.ts` - Vitest 테스트 프레임워크 설정
  - 단위 테스트: `tests/unit/`
  - 통합 테스트: `tests/integration/`
  - 커버리지 설정: 80% 목표

## 🔧 사용법

### 설정 파일 수정 시

```bash
# 1. 프로젝트 루트에서 원본 파일 수정
vim eslint.config.mjs

# 2. 검증
npm run lint

# 3. 백업 폴더에 복사
cp eslint.config.mjs development/config/

# 4. 커밋
git add eslint.config.mjs development/config/eslint.config.mjs
git commit -m "설정: ESLint 규칙 업데이트"
```

### 새로운 개발 환경 설정

```bash
# shadcn/ui 컴포넌트 추가
npx shadcn-ui@latest add button

# 테스트 실행
npm run test:unit

# 린트 검사
npm run lint
```

## 📋 주의사항

- ⚠️ **중요**: 이 폴더의 파일들은 **백업/참조용**입니다
- 🔧 실제 설정 변경은 **프로젝트 루트**에서 하세요
- 🔄 변경 후 이 폴더에도 복사하여 동기화하세요
- 📝 설정 변경 시 팀에 공유해주세요

## 🔗 관련 링크

- [ESLint 설정 가이드](../docs/setup/개발_환경_설정.md)
- [Tailwind 커스터마이징](../docs/guides/스타일_가이드.md)
- [테스트 작성법](../docs/guides/테스트_가이드.md)
