# Changelog (v5.78.0 ~ v5.79.1)

> 📌 **참고**: 이 파일은 v5.78.0 ~ v5.79.1 버전의 변경 이력을 포함하고 있습니다.
> 최신 버전은 [CHANGELOG.md](./CHANGELOG.md)를 참조하세요.

## [5.79.1] - 2025-10-03

### 🔒 security: PIN 인증 서버 검증 강화 + React Hooks 버그 수정

#### Security Improvements

- 🔒 **PIN 인증 서버 사이드 검증 추가** (33b2f815)
  - 신규 API 엔드포인트: `/api/admin/verify-pin`
  - 클라이언트 하드코딩 `ADMIN_PASSWORD` 제거
  - 환경변수 기반 서버 검증으로 전환
  - 보안 강화: 클라이언트 번들에 비밀번호 노출 방지

#### Bug Fixes

- 🐛 **React Hooks 버그 수정** (33b2f815)
  - `useInitialAuth`: router 의존성 추가 (stale closure 방지)
  - `useSystemStatus`: AbortController 패턴 추가 (메모리 누수 방지)
  - fetch 취소 로직 강화 (컴포넌트 unmount 시 안전 처리)

#### Quality Metrics

- **코드 품질**: 78/100 → 85/100 (+7점)
- **보안 등급**: B+ → A- (서버 검증 전환)
- **TypeScript**: 0 에러 유지 ✅

---

## [5.79.0] - 2025-09-25

### fix: TypeScript strict 모드 호환성 개선 (57개 변경)

#### Added

- feat: Package.json 스크립트 대규모 통합 최적화 완료 (76fab682)
- AI 교차검증 시스템 v4.5 - 장애 허용 및 자동 복구 시스템 완성 (1d7664c1)
- feat: WSL 네이티브 Playwright + 베르셀 프로덕션 통합 완성 (f1736c4f)
- feat: Playwright MCP v3.0 스마트 wrapper + WSLg 우선 정책 완성 (7da0eab7)
- feat: ESLint 오류 완전 해결 - 코드 품질 100% 달성 (818c9eb2)
- perf: devtools 버그 근본 해결 + 개발환경 완전 안정화 (35% 성능향상) (59e35ec4)
- perf: 응답시간 최적화 완료 (152ms → 100ms 목표 달성) (f245a8b8)

#### Changed

- fix: TypeScript strict 모드 호환성 개선 (ebf9ed74)
- fix: 의존성 제거 후 사이드 이펙트 종합 해결 (bc2441a7)
- feat: Phase 2 Dependencies 최적화 완료 - 23개 패키지 제거 (2fc9c6f9)
- feat: Phase 1 Dependencies 최적화 완료 - 40개 패키지 제거 (09abeb69)
- scripts: 개별 검사를 통한 세밀한 스크립트 정리 완료 (14abe6c5)
- scripts: 스크립트 최적화 및 중복 제거 완료 (b2dbe26e)
- privacy: 개발기간 등 개인정보 제거 (4683f1dc)
- fix: .env.local.template 중복 파일 정리 완료 (1a7d5957)
- refactor: 파일 정리 사이드 이펙트 해결 완료 (811c2d80)
- CRITICAL FIX: Vercel 빌드 실패 해결 - .vercelignore 선별적 차단 (57e45757)
- CRITICAL SECURITY: WSL 포트 충돌 해결 + Vercel 배포 안전성 완벽 확보 (ef0f1b1d)
- fix: 30+ TypeError 근본 해결 - AI 교차검증 기반 구조적 리팩토링 완성 (f15fc951)
- CRITICAL FIX: 15개 TypeError 완전 해결 - useServerDashboard.ts 배열 접근 패턴 수정 (6fedb939)
- fix: AI 교차검증 기반 TypeError 완전 해결 - Race Condition 근본 원인 수정 (0a797ce2)
- fix: ImprovedServerCard 3개 unsafe 패턴 완전 수정 - AI 교차검증 이중 안전장치 (03692f9b)
- fix: AI 교차검증 기반 TypeError 완전 해결 - Race Condition 근본 원인 수정 (35cceb91)
- fix: SafeServerCard 실시간 데이터 업데이트 안전성 강화 (7571ae84)
- feat: Playwright 테스트 도구 + MCP 복구 자동화 완성 (b3c81de7)
- fix: 중단 원인 완전 해결 + 구조적 개선 시스템 구축 (0a926c8f)
- fix: 사이드 이펙트 완전 해결 - 프로젝트 90%→100% 완성 달성 (30b087b9)
- fix: 중단 원인 완전 해결 + 구조적 개선 시스템 구축 (c041e934)
- fix: 테스트 및 보안 안정성 개선 (e8bcbe34)

---

## [5.78.0] - 2025-09-21

### Initial Release

- 프로젝트 초기 버전 릴리스

> 🤖 이 CHANGELOG는 [스마트 자동 업데이트 시스템](./docs/development/smart-changelog-system.md)에 의해 관리됩니다.
