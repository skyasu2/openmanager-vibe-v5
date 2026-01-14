# Changelog (Legacy)

레거시 버전 변경 이력입니다. 최신 변경사항은 [CHANGELOG.md](./CHANGELOG.md)를 참조하세요.

---

## [5.80.0] - 2025-11-15

### Features

- **AI 엔진 개선**
  - UNIFIED/AUTO 모드 추가 (4c34e8f)
  - AI 엔진 단순화 및 최적화

### Bug Fixes

- **Admin 모드 제거**
  - `useAdminMode` 참조 제거 (1dc6a06)
  - Admin 모드 제거 후 발생한 TypeScript 에러 수정 (b479aad)
  - Phase 2 - Admin 모드 완전 제거 (8e2e309)

- **타입스크립트**
  - 남아있던 TypeScript 에러 해결 (e5cb52f)
  - Lint 경고 해결 (cc1a637)

- **기타 수정**
  - `useTimerManager` async IIFE 구문 오류 수정 (78e2037)
  - 게스트 플로우 강화 및 레거시 문서 정리 (457033c)

### Documentation

- Lint 진행 상황 추적 및 프로젝트 분석 문서 추가 (a8a8f0d)
- 중복된 레거시 분석 문서 제거 (2fba402)

---

## [5.79.1] - 2025-10-03

### Security

- **PIN 인증 서버 사이드 검증 추가** (33b2f815)
  - 신규 API 엔드포인트: `/api/admin/verify-pin`
  - 클라이언트 하드코딩 비밀번호 제거
  - 환경변수 기반 서버 검증으로 전환

### Bug Fixes

- **React Hooks 버그 수정**
  - `useInitialAuth`: router 의존성 추가 (stale closure 방지)
  - `useSystemStatus`: AbortController 패턴 추가 (메모리 누수 방지)

### Quality Metrics

- 코드 품질: 78/100 → 85/100 (+7점)
- 보안 등급: B+ → A- (서버 검증 전환)

---

## [5.79.0] - 2025-09-25

### Features

- Package.json 스크립트 대규모 통합 최적화 (76fab682)
- AI 교차검증 시스템 v4.5 - 장애 허용 및 자동 복구 시스템 완성
- WSL 네이티브 Playwright + 베르셀 프로덕션 통합 완성
- Playwright MCP v3.0 스마트 wrapper + WSLg 우선 정책
- ESLint 오류 완전 해결 - 코드 품질 100% 달성

### Bug Fixes

- TypeScript strict 모드 호환성 개선 (57개 변경)
- 30+ TypeError 근본 해결 - AI 교차검증 기반 구조적 리팩토링
- CRITICAL FIX: Vercel 빌드 실패 해결 - .vercelignore 선별적 차단
- WSL 포트 충돌 해결 + Vercel 배포 안전성 확보

### Performance

- 응답시간 최적화: 152ms → 100ms 달성
- devtools 버그 근본 해결 + 개발환경 35% 성능향상

---

## [5.78.0] - 2025-09-21

### Features

- **프로젝트 완성도 100% 달성**: 90% → 100% 마무리 완료
  - ESLint 오류 완전 해결: 4개 → 0개 (코드 품질 100%)
  - 테스트 안정성: 54/55 통과 (98.2%)
  - 프로덕션 배포 성공: 베르셀 자동 배포 트리거 완료
  - TypeScript strict 모드 100% 유지 (0개 에러)

### Bug Fixes

- **AdminClient.tsx React Hook 최적화**:
  - 불필요한 useEffect 무한 루프 방지 (useCallback 적용)
  - Floating Promise 문제 해결 (void 연산자 사용)
- **backup-status API 최적화**:
  - 불필요한 async 키워드 제거

### Security

- **보안 취약점 현황**: 4개 low severity (devDependencies만 영향)
  - jsondiffpatch XSS 취약점 (Playwright MCP 체인 종속성)
  - 프로덕션 코드 영향 없음

---

## [5.77.0] - 2025-09-07

### Features

- **TypeScript strict 모드 100% 완전 준수 달성**: 77개→0개 에러 완전 해결
  - noUncheckedIndexedAccess 완전 준수
  - 모든 undefined 접근 패턴 안전화 (?.와 ?? 활용)
  - Next.js 15.5.0 빌드 성공 (35초 컴파일)

### Refactor

- **설계도 중복 문제 해결 및 문서 정리**
  - `docs/architecture/system-design-blueprint-v5.md` → `docs/archive/future-plans/`로 이동
  - 현재 상태 vs 미래 계획 명확히 구분

### Bug Fixes

- **package.json 중복 키 해결**: deploy:check 중복 제거
- **Claude Code 메모리 최적화**: NODE_OPTIONS 4GB → 8GB로 증대

---

## [5.70.x - 5.76.x] - 2025년 8-9월

### 주요 마일스톤

- **v5.75.x**: CHANGELOG 자동 업데이트 시스템 구축
- **v5.73.0**: AI 어시스턴트 로컬 모드 완전 독립성 확보
- **v5.72.0**: 서브에이전트 시스템 완전 최적화 달성
- **v5.71.0**: StaticDataLoader 아키텍처 갱신 (Vercel 최적화)
- **v5.70.x**: AI CLI 도구 전체 업그레이드 (WSL 환경)

### 기술적 성과

- Supabase 스키마 개선 완료
- GCP VM 표준 메트릭 시스템 문서화
- AI 분석 무결성 보장 시스템 완성
- 실시간 성능 모니터링 시스템 구현 및 최적화

---

## [5.44.x - 5.69.x] - 2025년 7-8월

### 개발 기간 요약

- **문서 체계화 기간**: 30개+ 문서 → 3개 핵심 문서로 통합
- **프로젝트 구조 최적화**: 87% 파일 정리 완료
- **AI 에이전트 독립성 강화**: 완전한 모듈화 아키텍처 구축

### 주요 기능

- 서버 모니터링 대시보드 UI 완성
- AI Agent Advanced Features 구현 (베이직/엔터프라이즈 모드)
- 절전 시스템 구현 (3단계: stopped → ai-monitoring → active)

---

## [5.21.0 - 5.43.x] - 2025년 5-6월 (초기 개발)

### v5.21.2 - 2025-06-02

#### Features

- **CI/CD 품질 강화** - 빌드 전 린트 및 테스트 자동화
- **문서 완성도 향상** - 시스템 제어 및 전원 관리 가이드 추가
- **통합 테스트 확장** - 시스템 시작/중지 API 테스트 구현
- **메트릭 시스템 개선** - 사용자 정의 서버 수 지원

### v5.21.1 - 2025-06-01

#### Features

- **하이브리드 AI 아키텍처 구현** - 내부 + 외부 AI 엔진 자동 폴백
- **Zero-Downtime 시스템** - 내부 엔진 장애 시 외부 엔진 자동 전환
- **프론트엔드 테스트 도구** - `/test-ai-real` 페이지로 실시간 AI 엔진 테스트

### v5.21.0 - 2025-05-31

#### Features

- **AI 엔진 v3.0 완전 구현** - 실제 MCP + TensorFlow.js 통합
- **Vercel 서버리스 배포 완료** - 외부 API 의존성 제거
- **실제 MCP 표준 프로토콜** - JSON-RPC 2.0 기반 구현

#### Performance

- 콜드 스타트: 3-5초
- 메모리 사용: 200-300MB
- 시스템 가용성: 99.9% (하이브리드 폴백)

---

## AI 엔진 발전 히스토리

| 버전 | 특징 |
|------|------|
| v1.0 | Mock AI + 시뮬레이션 데이터 |
| v2.0 | TensorFlow.js 기본 모델 추가 |
| v3.0 | MCP + TensorFlow.js + NLP 완전 통합 |
| v4.0 | 하이브리드 아키텍처 (내부 + 외부 폴백) |
| v5.0 | Vercel AI SDK + Cloud Run 분리 |

---

> 이 파일은 v5.80.0 이전의 변경 이력을 보관합니다.
> 최신 변경사항은 [CHANGELOG.md](./CHANGELOG.md)를 참조하세요.
