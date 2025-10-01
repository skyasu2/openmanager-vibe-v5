# E2E Playwright 테스트

## 개요
Playwright 기반 End-to-End 테스트 전략

## 테스트 환경
- **로컬**: 개발 중 빠른 검증
- **Vercel**: 실제 운영 환경 검증 (우선)

## 주요 테스트 케이스
1. 대시보드 렌더링
2. AI 쿼리 시스템
3. PIN 인증 및 관리자 모드
4. 서버 메트릭 표시
5. 실시간 데이터 동기화

## 실행 명령어
```bash
npm run test:e2e               # 로컬 Playwright
npm run test:vercel:e2e        # Vercel 환경 (권장)
```

→ 상세 내용은 testing/vercel-first-strategy.md 참조
