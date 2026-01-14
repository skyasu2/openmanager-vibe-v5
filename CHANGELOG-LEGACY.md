# Changelog (Legacy)

레거시 버전 변경 이력입니다. 최신 변경사항은 [CHANGELOG.md](./CHANGELOG.md)를 참조하세요.

---

## [5.80.0] - 2025-11-15

### 🚀 Features

- **AI 엔진 개선**
  - UNIFIED/AUTO 모드 추가 (4c34e8f)
  - AI 엔진 단순화 및 최적화

### 🐛 Bug Fixes

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

### 📚 Documentation

- Lint 진행 상황 추적 및 프로젝트 분석 문서 추가 (a8a8f0d)
- 중복된 레거시 분석 문서 제거 (2fba402)

---

- debug: Error Boundary 로깅 시스템 추가 - 15개 TypeError 원인 추적 (3896662e)
- fix: 진짜 근본 원인 해결 - servers.length undefined 접근 15개 TypeError 완전 수정 (a0af7810)
- fix: ImprovedServerCard unsafe 배열 접근 패턴 수정 (6949483f)
- fix: 서버 카드 호버 에러 해결 - SafeServerCard 래퍼로 undefined 배열 접근 방지 (d57a1db5)
- fix: AI 엔진 URL 파싱 및 pgvector 함수 오류 수정 (9f681eaa)
- fix: AI Assistant 서버 카드 크래시 버그 완전 해결 + 테스트 안정화 (170f60fc)

#### Improved

- perf: 테스트 성능 44% 최적화 - 1인 AI 개발 맞춤 (181264af)

#### Documentation

- docs: README 최적화 및 문서 구조 개선 (0e8c3e17)
- docs: AI 시스템 이중 구조 문서화 개선 (e720f8f1)
- docs: Playwright MCP 복구 완전 가이드 + 시스템 개선 (19a71d3b)
- docs: v5.78.0 릴리즈 - 프로젝트 100% 완성 달성 (5b5a302f)
- docs: 베르셀 프로덕션 테스트 전략 + WSL Git 인증 가이드 완성 (cd2dec4b)

#### Testing

- feat: AI 친화적 테스트 시스템 구축 + 테스트 분리 최적화 (fe44b544)
- refactor: Mock 테스트 → 실제 환경 테스트 전략 전환 (ae42348c)
- feat: Google AI API 브라우저 테스트 페이지 추가 (0df54e43)
- fix: 폴백 메커니즘에 맞게 테스트 로직 수정 - 100% 통과 달성 (7127cf64)
- feat: 15개 서브에이전트 테스트 완료 + MCP 매핑 최적화 (a2ac9df8)

## [5.78.0] - 2025-09-21

### ✨ feat

#### 🎯 완료

- **프로젝트 완성도 100% 달성**: 90% → 100% 마무리 완료
  - ESLint 오류 완전 해결: 4개 → 0개 (코드 품질 100%)
  - 테스트 안정성: 54/55 통과 (98.2%) - skip된 1개 테스트 분석 완료
  - 프로덕션 배포 성공: 베르셀 자동 배포 트리거 완료
  - TypeScript strict 모드 100% 유지 (0개 에러)

### 🔧 fix

#### 🛠️ 개선사항

- **AdminClient.tsx React Hook 최적화**:
  - 불필요한 useEffect 무한 루프 방지 (useCallback 적용)
  - Floating Promise 문제 해결 (void 연산자 사용)
  - 사용하지 않는 Clock import 제거
- **backup-status API 최적화**:
  - 불필요한 async 키워드 제거 (실제 비동기 작업 없음)
  - 함수 시그니처 정확성 개선

### 🔒 security

#### 🛡️ 보안 상태

- **보안 취약점 현황**: 4개 low severity (devDependencies만 영향)
  - jsondiffpatch XSS 취약점 (Playwright MCP 체인 종속성)
  - 프로덕션 코드 영향 없음, 개발 환경만 해당
  - 수용 가능한 위험 수준으로 평가 완료

## [5.77.0] - 2025-09-07

### ✨ feat

#### 🚀 Added

- **TypeScript strict 모드 100% 완전 준수 달성**: 77개→0개 에러 완전 해결
  - noUncheckedIndexedAccess 완전 준수
  - 모든 undefined 접근 패턴 안전화 (?.와 ?? 활용)
  - Next.js 15.5.0 빌드 성공 (35초 컴파일)

### ♻️ refactor

#### 🔧 Improved

- **설계도 중복 문제 해결 및 문서 정리**: 구버전 아카이브, 현재 운영 상태 명시
  - `docs/architecture/system-design-blueprint-v5.md` → `docs/archive/future-plans/`로 이동
  - 현재 상태(`docs/system-architecture.md`) vs 미래 계획 명확히 구분
  - AI 도구 명명 정확성 개선: Codex → OpenAI CLI (Codex), ccusage → Claude 사용량 모니터링

### 🔧 fix

#### 🐛 Fixed

- **package.json 중복 키 해결**: deploy:check 중복 제거
- **Claude Code 메모리 최적화**: NODE_OPTIONS 4GB → 8GB로 증대

#### 📊 Updated

- **CLAUDE.md 실제 통계 반영**:
  - 코드베이스: 226,356줄, 873개 TypeScript 파일
  - Claude Code 버전: v1.0.107 최신 버전
  - WSL 메모리 사용률: 16.7% 정상 범위

## [이전 버전들]

상세한 이전 버전 히스토리는 다음 레거시 파일들을 참조하세요:

- **[CHANGELOG-LEGACY-1.md](./CHANGELOG-LEGACY-1.md)**: 2025년 8-9월 자동화 시스템 개발 기간
- **[CHANGELOG-LEGACY-2.md](./CHANGELOG-LEGACY-2.md)**: 2025년 8월 문서 체계화 기간
- **[CHANGELOG-LEGACY.md](./CHANGELOG-LEGACY.md)**: 2025년 5-8월 초기 개발 기간

---

> 🤖 이 CHANGELOG는 [스마트 자동 업데이트 시스템](./docs/development/smart-changelog-system.md)에 의해 관리됩니다.
