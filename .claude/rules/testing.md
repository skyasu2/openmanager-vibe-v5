# Testing Rules

## Test Commands
```bash
npm run validate:all        # 전체 검증 (Lint + Type + Test)
npm run test:vercel:e2e     # E2E 테스트 (Cloud Run 통합)
npm run lint                # Biome lint
npm run typecheck           # TypeScript 검사
```

## Testing Strategy
1. **Unit Tests**: Vitest 사용
2. **E2E Tests**: Playwright 사용
3. **Type Checking**: TypeScript strict mode

## Pre-commit Validation
- Biome 자동 포맷팅 (PostToolUse hook)
- Lint 에러 시 커밋 차단

## Test File Location
- 단위 테스트: `src/**/*.test.ts`
- E2E 테스트: `tests/e2e/**/*.spec.ts`
- 테스트 유틸: `tests/utils/`
