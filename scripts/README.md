# 📜 Scripts 디렉토리 구조

**최종 업데이트**: 2025-08-20

## 📊 정리 결과 (2025-08-20 추가 정리)

### 개선 효과

- **파일 수**: 218개 → 114개 (47.7% 감소)
- **중복 제거**: MCP, 환경변수, 테스트 관련 중복 100개+ 제거
- **보안 개선**: deprecated crypto 함수를 안전한 버전으로 수정
- **구조화**: 8개 카테고리로 체계적 분류

### 디렉토리 구조

```
scripts/
├── core/              # 핵심 통합 도구 (8개)
├── utils/             # 재사용 유틸리티 (3개)
├── emergency/         # 긴급 대응 스크립트 (3개)
├── scheduled/         # 정기 실행 스크립트
│   ├── daily/
│   ├── weekly/
│   └── monthly/
├── mcp/               # MCP 관련 (6개)
├── security/          # 보안 관련
├── testing/           # 테스트 도구
├── env/               # 환경 설정
├── _archive/          # 레거시 보관
└── [기타]             # 추가 정리 필요 (81개)
```

## 🚀 핵심 스크립트 사용법

### 1. 환경변수 관리

```bash
node scripts/core/env-manager.mjs --backup    # 환경변수 백업
node scripts/core/env-manager.mjs --restore   # 환경변수 복원
node scripts/core/env-manager.mjs --encrypt   # 환경변수 암호화
```

### 2. 테스트 실행

```bash
node scripts/core/test-runner.mjs --all       # 모든 테스트
node scripts/core/test-runner.mjs --unit      # 단위 테스트
node scripts/core/test-runner.mjs --e2e       # E2E 테스트
```

### 3. 모니터링

```bash
node scripts/core/monitor.mjs --system        # 시스템 모니터링
node scripts/core/monitor.mjs --api           # API 상태
node scripts/core/monitor.mjs --free-tier     # 무료 티어 사용량
```

### 4. AI 도구

```bash
node scripts/core/ai-tools.mjs --analyze      # 코드 분석
node scripts/core/ai-tools.mjs --chat         # AI 채팅
node scripts/core/ai-tools.mjs --optimize     # 코드 최적화
```

### 5. 배포

```bash
bash scripts/core/deploy.sh production        # 프로덕션 배포
bash scripts/core/deploy.sh staging           # 스테이징 배포
```

## 🔧 유틸리티 사용법

### 검증 도구

```bash
node scripts/utils/validator.js --config      # 설정 검증
node scripts/utils/validator.js --types       # 타입 검증
```

### Redis 연결 테스트

```bash
npx ts-node scripts/utils/redis-connection.ts
```

## 🚨 긴급 대응

### 빠른 수정

```bash
bash scripts/emergency/quick-fix-oauth.sh     # OAuth 긴급 수정
bash scripts/emergency/emergency-deploy.sh    # 긴급 배포
bash scripts/emergency/vercel-emergency.sh    # Vercel 긴급 대응
```

## 📅 정기 실행 스크립트

### 주간 정리

```bash
bash scripts/scheduled/weekly/weekly-cleanup.sh
bash scripts/scheduled/weekly/weekly-review.sh
```

### 월간 검토

```bash
bash scripts/scheduled/monthly/monthly-review.sh
```

## 🔐 보안 도구

```bash
bash scripts/security/check-all-secrets.sh    # 모든 시크릿 검사
bash scripts/security/check-hardcoded-secrets.sh  # 하드코딩 검사
bash scripts/security/secure-env.sh           # 환경변수 보안 설정
```

## 📝 향후 개선 계획

1. **추가 정리 필요**: 루트 디렉토리의 81개 파일 추가 분류
2. **통합 강화**:
   - `unified-auth-tools.js` 생성 필요
   - `unified-performance-tools.js` 생성 필요
3. **문서화**: 각 스크립트별 상세 사용 가이드 작성
4. **자동화**: GitHub Actions 통합

## ⚠️ 주의사항

- **보안**: 환경변수 관련 스크립트 실행 시 권한 확인 필수
- **백업**: 중요 작업 전 반드시 백업 실행
- **테스트**: 프로덕션 배포 전 모든 테스트 통과 확인

---

_Last updated: 2025-07-31_
