# TODO - OpenManager VIBE v5

<!-- Version: 5.80.0 | Author: Antigravity -->

---

## ✅ 완료된 작업

### 1. 캐싱 전략 개선 ✅ (2025-12-10 확인)

- [x] SWR 전략 적용 (stale-while-revalidate=0으로 Function 호출 폭증 방지)
- [x] TTL 계층화 완료:
  - 30초: `/api/time`, `/api/servers/[id]`, `/api/metrics/current`
  - 3분: `/api/database/status`
  - 5분: `/api/servers/all`, `/api/metrics` (ISR)
  - 1시간: `/api/version`, `/api/web-vitals` GET

### 2. AI Health Check 최적화 ✅

- [x] SSE 모니터링 주기 5분으로 변경
- [x] SystemInactivityService 통합 (시스템 종료 시 자동 중지)
- [x] API Health 캐싱 구현 (60초 TTL)

### 3. Quick Wins ✅

- [x] resize debounce 적용
- [x] Dead Code 정리 (4개 파일) - 검증완료 (사용 중)

---

## 🔴 CRITICAL - 프로덕션 배포 전 필수 작업

### 게스트 모드 보안 복원 (개발 완료 시)

> ⚠️ **중요**: 아래 작업은 개발 완료 후 프로덕션 배포 전에 반드시 수행해야 합니다.

| 파일 | 변경 내용 | 설명 |
|------|----------|------|
| `src/middleware.ts` | `isDevBypassEnabled()` 기본값 → `false` | 환경변수 없으면 보안 활성화 |
| `src/config/guestMode.ts` | `getGuestMode()` 기본값 → `RESTRICTED` | 게스트 접근 제한 복원 |
| `src/hooks/useAuth.ts` | `hasPermission()` 권한 체크 복원 | 게스트 기본 권한만 허용 |
| `src/utils/supabase/middleware.ts` | `updateSession` 반환값 개선 | 실제 세션 검증 결과 반환 |

**체크리스트**:
- [ ] `NEXT_PUBLIC_DEV_BYPASS_AUTH=false` 환경변수 설정
- [ ] `NEXT_PUBLIC_GUEST_FULL_ACCESS=false` 환경변수 설정
- [ ] 미들웨어 보호 경로 테스트 (`/dashboard/*`, `/system-boot/*`)
- [ ] 게스트 권한 제한 테스트 (view_dashboard, view_servers, view_metrics, basic_actions만 허용)
- [ ] E2E 인증 테스트 추가

**관련 커밋**:
- `753b39eb` - feat: Add route protection middleware with dev bypass
- `eb854079` - feat(auth): enable full guest permissions during development

---

## 🟢 LOW - 장기 계획 (선택적)

| 기능 | 설명 | 난이도 | 진행 여부 |
|------|------|--------|----------|
| ~~대화 컨텍스트~~ | 세션 기반 대화 히스토리 | 중간 | ❌ 불필요 (단일 질의 처리로 충분) |
| ~~멀티모달~~ | 이미지 업로드 + Gemini Vision | 높음 | ❌ 불필요 (서버 모니터링 특성) |
| 알림 시스템 | Supabase Realtime 기반 | 중간 | ⚠️ 선택적 (현재 상태 표시로 충분) |

---

## 📦 완료 아카이브

완료된 작업은 아래 문서로 이동:

| 작업 | 완료일 | 문서 |
|------|--------|------|
| AI Health Check 최적화 | 2025-12-10 | [링크](../archive/completed/2025-12-ai-health-check-optimization-completed.md) |
| unified-ai-processor v3.3.0 | 2025-12-10 | [링크](../archive/completed/2025-12-unified-ai-processor-v3.3.0-completed.md) |
| RAG 엔진 리팩토링 | 2025-12-10 | [링크](../archive/completed/2025-12-rag-refactoring-completed.md) |
| 이미지 최적화 | 2025-12-10 | [링크](../archive/completed/2025-12-image-optimization-completed.md) |
| Biome 경고 해결 | 2025-12-08 | [링크](../archive/completed/2025-biome-warnings-completed.md) |
| 메이저 버전 업그레이드 | 2025-12-08 | [링크](../archive/completed/2025-major-version-upgrade-completed.md) |

---

**최종 업데이트**: 2025-12-10
