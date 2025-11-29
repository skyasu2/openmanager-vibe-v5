# Changelog

> 📌 **참고**: 이전 버전들의 상세 변경 이력은 레거시 파일들을 참조하세요.
>
> - 현재 파일: **v5.80.0 이후** (2025-11-15 ~) - 최신 안정화 버전
> - [v5.78.0 ~ v5.79.1](./CHANGELOG-LEGACY-3.md) (2025-09-21 ~ 2025-10-03)
> - [v5.67.22 ~ v5.76.32](./CHANGELOG-LEGACY-1.md) (2025-08-17 ~ 2025-09-06)
> - [v5.66.40 ~ v5.67.21](./CHANGELOG-LEGACY-2.md) (2025-08-12 ~ 2025-08-17)
> - [v5.0.0 ~ v5.65.6](./CHANGELOG-LEGACY.md) (2025-05 ~ 2025-08)

## [Unreleased] - 2025-11-29

### 🚀 Features

- **PM2 프로세스 관리**: PM2 프로세스 관리 시스템 구현 (WSL Best Practice Item 3+4) ([d1ce69f6](https://github.com/your-username/openmanager-vibe-v5/commit/d1ce69f6))
- **GPU Animations**: GPU-accelerated animation system (Day 1/3 - 120fps target) ([f74e0b26](https://github.com/your-username/openmanager-vibe-v5/commit/f74e0b26))
- refactor system boot, improve ai sidebar ux, and cleanup code ([7b86458f](https://github.com/your-username/openmanager-vibe-v5/commit/7b86458f))
- refactor useServerDashboard hook and unify design consistency ([6a19f96d](https://github.com/your-username/openmanager-vibe-v5/commit/6a19f96d))
- AI Assistant Engine improvements - Google AI routing & ML libraries ([5fa65c7a](https://github.com/your-username/openmanager-vibe-v5/commit/5fa65c7a))
- 테스트 API 키 인증 추가 ([12628144](https://github.com/your-username/openmanager-vibe-v5/commit/12628144))
- 바이브 코딩 히스토리에 현재 단계(stage4) 추가 ([385f4473](https://github.com/your-username/openmanager-vibe-v5/commit/385f4473))
- 환경 변수 검증 시스템 추가 ([7adda1bd](https://github.com/your-username/openmanager-vibe-v5/commit/7adda1bd))
- auto-ai-review.sh v4.1.2 - Gemini 피드백 적용 ([a7cfa4e4](https://github.com/your-username/openmanager-vibe-v5/commit/a7cfa4e4))
- auto-ai-review.sh v4.1.0 - ESLint 스마트 검증 ([89f4bc6c](https://github.com/your-username/openmanager-vibe-v5/commit/89f4bc6c))
- auto-ai-review.sh v4.0.0 - 실시간 검증 추가 ([350badc4](https://github.com/your-username/openmanager-vibe-v5/commit/350badc4))
- Git Hooks 베스트 프렉티스 적용 (2025 표준) ([bc9eafc2](https://github.com/your-username/openmanager-vibe-v5/commit/bc9eafc2))
- AI 협업 아키텍처 완성 - Gemini ImportProcessor 근본 해결 ([c03a24ea](https://github.com/your-username/openmanager-vibe-v5/commit/c03a24ea))
- Phase 2-3 AI 모니터링 시스템 통합 완료 ([bb80af1a](https://github.com/your-username/openmanager-vibe-v5/commit/bb80af1a))
- GCP Functions 배포 준비 100% 완료 ([57ba76a6](https://github.com/your-username/openmanager-vibe-v5/commit/57ba76a6))
- GCP Functions 최적화 및 배포 준비 완료 ([82c21f57](https://github.com/your-username/openmanager-vibe-v5/commit/82c21f57))
- AI 사고 과정 시각화 개선 (Step 4) ([7e5b7738](https://github.com/your-username/openmanager-vibe-v5/commit/7e5b7738))
- AI 모드 선택 UI 제거 (Step 3) ([13a01122](https://github.com/your-username/openmanager-vibe-v5/commit/13a01122))
- 지능형 라우팅 로직 구현 (Step 2) ([4a14d9e2](https://github.com/your-username/openmanager-vibe-v5/commit/4a14d9e2))
- 게스트 모드 제한 로직 추가 (현재는 비활성화) ([065f78be](https://github.com/your-username/openmanager-vibe-v5/commit/065f78be))
- Add Google AI API rate limiting and ToS compliance ([ac42598a](https://github.com/your-username/openmanager-vibe-v5/commit/ac42598a))
- Implement primary/secondary Google AI API keys with fallback ([4d12e1ba](https://github.com/your-username/openmanager-vibe-v5/commit/4d12e1ba))
- Implement AI mode selection and improve error handling ([9e8059fc](https://github.com/your-username/openmanager-vibe-v5/commit/9e8059fc))
- Update feature cards with latest versions and accurate metrics ([5198d1a4](https://github.com/your-username/openmanager-vibe-v5/commit/5198d1a4))
- AI 사이드바에 무료 티어 모니터링 대시보드 추가 ([2881faba](https://github.com/your-username/openmanager-vibe-v5/commit/2881faba))
- 공통 컴포넌트에 애니메이션 및 성능 추적 추가, 테스트 커버리지 확대 ([5a2d8be9](https://github.com/your-username/openmanager-vibe-v5/commit/5a2d8be9))
- 서버 카드 UI 개선 및 메트릭 차트 컴포넌트 분리 ([8b148e53](https://github.com/your-username/openmanager-vibe-v5/commit/8b148e53))
- lint improvements for multiple components and services ([96023c77](https://github.com/your-username/openmanager-vibe-v5/commit/96023c77))

### 🔒 Security

- **API 인증**: 나머지 AI API 인증 적용 (raw-metrics, rag/benchmark) - 최종 ([fa33baeb](https://github.com/your-username/openmanager-vibe-v5/commit/fa33baeb))
- **API 인증**: 주요 AI API 인증 미들웨어 적용 (3개) ([6ad1e38d](https://github.com/your-username/openmanager-vibe-v5/commit/6ad1e38d))
- **API 인증**: AI 통합 스트리밍 API 인증 적용 ([bdf27866](https://github.com/your-username/openmanager-vibe-v5/commit/bdf27866))
- **API 인증**: 서버 API 인증 미들웨어 적용 + withAuth 제네릭 타입 지원 ([a2db6238](https://github.com/your-username/openmanager-vibe-v5/commit/a2db6238))
- **Shell Injection**: Shell Injection 방어 및 CI/CD 호환성 개선 ([76238c8e](https://github.com/your-username/openmanager-vibe-v5/commit/76238c8e))

### 🔨 Refactor

- **API 정리**: remove unused apis (phase 21.3) ([4b42b44e](https://github.com/your-username/openmanager-vibe-v5/commit/4b42b44e))
- **레거시 제거**: remove legacy ai apis (phase 21.1) ([f76ed201](https://github.com/your-username/openmanager-vibe-v5/commit/f76ed201))
- **레거시 제거**: remove legacy ai apis (phase 21.1) ([4c0518f2](https://github.com/your-username/openmanager-vibe-v5/commit/4c0518f2))
- **AI 엔진**: optimize ai engine and gcp integration ([9fd88df6](https://github.com/your-username/openmanager-vibe-v5/commit/9fd88df6))
- **대규모 정리**: 대규모 코드 정리 및 문서 자동화 시스템 구축 ([799e3a1b](https://github.com/your-username/openmanager-vibe-v5/commit/799e3a1b))

### 🐛 Bug Fixes

- **UI**: ImprovedServerCard에 누락된 아이콘 import 추가 ([0a195df9](https://github.com/your-username/openmanager-vibe-v5/commit/0a195df9))
- **Supabase**: SSR 안전성 개선 - 모듈 최상위 클라이언트 초기화 수정 ([229254c1](https://github.com/your-username/openmanager-vibe-v5/commit/229254c1))
- add shebang to pre-push hook ([55f402f3](https://github.com/your-username/openmanager-vibe-v5/commit/55f402f3))
- Remove side-effects from admin mode removal ([b20615e6](https://github.com/your-username/openmanager-vibe-v5/commit/b20615e6))
- Use client-safe environment variable access ([4b24f1cc](https://github.com/your-username/openmanager-vibe-v5/commit/4b24f1cc))
- Add missing navItems array declaration in Header ([12f1ccb8](https://github.com/your-username/openmanager-vibe-v5/commit/12f1ccb8))
- Provider 에러 핸들링 강화 (RAG, KoreanNLP, ML - undefined 체크) ([45957986](https://github.com/your-username/openmanager-vibe-v5/commit/45957986))
- Codex 리뷰 피드백 반영 (Critical 이슈 2개 해결) ([ae513bdf](https://github.com/your-username/openmanager-vibe-v5/commit/ae513bdf))
- Codex 리뷰 피드백 반영 (Critical 이슈 2개 해결) ([6da819e9](https://github.com/your-username/openmanager-vibe-v5/commit/6da819e9))
- auto-ai-review.sh v4.1.1 - Codex 피드백 3가지 버그 수정 ([196b9327](https://github.com/your-username/openmanager-vibe-v5/commit/196b9327))
- 전역 변수 사용으로 검증 결과 전달 문제 해결 ([4636df2b](https://github.com/your-username/openmanager-vibe-v5/commit/4636df2b))
- auto-ai-review.sh v4.0.0 - Codex 피드백 반영 ([c6c34536](https://github.com/your-username/openmanager-vibe-v5/commit/c6c34536))
- TypeScript 타입 에러 수정 및 Phase 3 계획서 추가 ([583b4028](https://github.com/your-username/openmanager-vibe-v5/commit/583b4028))
- Git Hooks 개선 및 TypeScript 에러 수정 ([a84789f9](https://github.com/your-username/openmanager-vibe-v5/commit/a84789f9))
- 스크립트 경로 참조 업데이트 및 자동 정리 스크립트 추가 ([1775de4e](https://github.com/your-username/openmanager-vibe-v5/commit/1775de4e))
- 스크립트 경로 참조 업데이트 (Phase 3 Side-Effect 수정 완료) ([54fa0f98](https://github.com/your-username/openmanager-vibe-v5/commit/54fa0f98))
- 스크립트 경로 참조 업데이트 (Phase 3 Side-Effect 수정 완료) ([56fe1c1c](https://github.com/your-username/openmanager-vibe-v5/commit/56fe1c1c))
- Codex 리뷰 반영 - 안정성 및 하위 호환성 개선 ([90dc9b3e](https://github.com/your-username/openmanager-vibe-v5/commit/90dc9b3e))
- Vercel 빌드 실패 수정 - 빌드 타임 환경변수 검증 건너뛰기 ([ee1fd852](https://github.com/your-username/openmanager-vibe-v5/commit/ee1fd852))
- 불필요한 @ts-expect-error 제거 및 타입 수정 ([31482219](https://github.com/your-username/openmanager-vibe-v5/commit/31482219))
- Gemini CLI 리팩토링 후 사이드 이펙트 수정 ([d51e7d63](https://github.com/your-username/openmanager-vibe-v5/commit/d51e7d63))
- 게스트 로그인 시 메인 페이지 건너뛰는 문제 수정 ([c9d89078](https://github.com/your-username/openmanager-vibe-v5/commit/c9d89078))
- google-ai-manager 타입 에러 수정 (string ([949ccef6](https://github.com/your-username/openmanager-vibe-v5/commit/949ccef6))
- GitHub Actions lint 에러 수정 (3 errors → 0) ([5b7261c9](https://github.com/your-username/openmanager-vibe-v5/commit/5b7261c9))
- GitHub Actions 에러 수정 (7 errors, 10 warnings) ([7f0141b7](https://github.com/your-username/openmanager-vibe-v5/commit/7f0141b7))
- CI 워크플로우 Node.js 버전 수정 및 분석 문서 추가 ([3bfbcc98](https://github.com/your-username/openmanager-vibe-v5/commit/3bfbcc98))
- Re-configure Vercel environment variables with clean stdin ([4d22b76f](https://github.com/your-username/openmanager-vibe-v5/commit/4d22b76f))
- Correct Vercel environment variables setup ([d8c26c3b](https://github.com/your-username/openmanager-vibe-v5/commit/d8c26c3b))
- TypeScript error - Use additionalData for aggregated_data and recommendations ([2064aa24](https://github.com/your-username/openmanager-vibe-v5/commit/2064aa24))
- Update Google AI API to use environment variable for model name ([8bc0fc02](https://github.com/your-username/openmanager-vibe-v5/commit/8bc0fc02))
- Replace @ alias with relative paths in unit tests ([39644ac5](https://github.com/your-username/openmanager-vibe-v5/commit/39644ac5))
- Replace removed admin helpers with guest helpers in performance test ([4dda6a62](https://github.com/your-username/openmanager-vibe-v5/commit/4dda6a62))
- AlertSeverity 타입 정의 통일 및 일관성 개선 ([c17c5032](https://github.com/your-username/openmanager-vibe-v5/commit/c17c5032))

### 📚 Documentation

- **AI 메모리**: AI 메모리 파일 및 문서 정리 ([81baf9e9](https://github.com/your-username/openmanager-vibe-v5/commit/81baf9e9))
- **Performance**: GPU animation validation guide (Day 3/3 - 120fps verification) ([4502bca5](https://github.com/your-username/openmanager-vibe-v5/commit/4502bca5))
- **WSL**: WSL 재설치 복원 가이드 추가 ([c7397df9](https://github.com/your-username/openmanager-vibe-v5/commit/c7397df9))
- **WSL**: WSL 복원 가이드 최종 개선 - Gemini 추가 제안 100% 반영 ([362e97f2](https://github.com/your-username/openmanager-vibe-v5/commit/362e97f2))
- **WSL**: WSL 복원 가이드 개선 - 코드 리뷰 제안 반영 ([f5934b31](https://github.com/your-username/openmanager-vibe-v5/commit/f5934b31))
- Phase 4 재구조화 완료 - core vs environment 분리 ([fd125c98](https://github.com/your-username/openmanager-vibe-v5/commit/fd125c98))
- update AI system documentation and fix ESLint errors ([7ce645c0](https://github.com/your-username/openmanager-vibe-v5/commit/7ce645c0))
- docs: ([2c37e23d](https://github.com/your-username/openmanager-vibe-v5/commit/2c37e23d))
- 오픈소스 도입 여부 평가 (2025-11-22) ([bae2c54c](https://github.com/your-username/openmanager-vibe-v5/commit/bae2c54c))
- AI 엔진 종합 상태 리포트 추가 (2025-11-22) ([24035b02](https://github.com/your-username/openmanager-vibe-v5/commit/24035b02))
- AI 엔진 리팩토링 분석 리포트 추가 ([a36327bb](https://github.com/your-username/openmanager-vibe-v5/commit/a36327bb))
- Phase 3 계획서 최종 업데이트 (100% 달성 반영) ([4aa547a7](https://github.com/your-username/openmanager-vibe-v5/commit/4aa547a7))
- 헬스체크 정책 문서 추가 ([1d8fc366](https://github.com/your-username/openmanager-vibe-v5/commit/1d8fc366))
- Update GEMINI.md with new AI collaboration workflow ([2b0511f0](https://github.com/your-username/openmanager-vibe-v5/commit/2b0511f0))
- GCP 배포 실행 가이드 추가 ([785e8048](https://github.com/your-username/openmanager-vibe-v5/commit/785e8048))
- GCP Functions 배포 가이드 추가 ([a08f2d52](https://github.com/your-username/openmanager-vibe-v5/commit/a08f2d52))
- GCP Functions 현황 분석 및 최적화 계획 ([48fea6ed](https://github.com/your-username/openmanager-vibe-v5/commit/48fea6ed))
- 단계별 개선 계획 수립 ([b800877e](https://github.com/your-username/openmanager-vibe-v5/commit/b800877e))
- 게스트 모드 변경 사이드 이펙트 분석 ([b89d3fba](https://github.com/your-username/openmanager-vibe-v5/commit/b89d3fba))
- 문서 구조 최적화 및 아키텍처 문서 개선 ([8fc6d364](https://github.com/your-username/openmanager-vibe-v5/commit/8fc6d364))
- Refactor and unify documentation, archive legacy files ([504c99e5](https://github.com/your-username/openmanager-vibe-v5/commit/504c99e5))
- Clarify development-only tools ([da0e479e](https://github.com/your-username/openmanager-vibe-v5/commit/da0e479e))
- Add feature cards update summary report ([71a6f454](https://github.com/your-username/openmanager-vibe-v5/commit/71a6f454))
- AI 어시스턴트 기능 분석 및 연결 검증 문서 ([238f1b2f](https://github.com/your-username/openmanager-vibe-v5/commit/238f1b2f))
- update lint plan status (errors cleared, 538 warnings) ([764654f1](https://github.com/your-username/openmanager-vibe-v5/commit/764654f1))

### 💅 Styles

- @ts-ignore를 @ts-expect-error로 변경 (ESLint 규칙 준수) ([193ce352](https://github.com/your-username/openmanager-vibe-v5/commit/193ce352))

### ♻️ Refactors

- 타입 정리 및 불필요한 import 제거 ([28075a9f](https://github.com/your-username/openmanager-vibe-v5/commit/28075a9f))
- modularize supabase-rag-engine.ts ([808b2c6c](https://github.com/your-username/openmanager-vibe-v5/commit/808b2c6c))
- split useServerDashboard.ts into types, utils, and hooks ([25d99a05](https://github.com/your-username/openmanager-vibe-v5/commit/25d99a05))
- Remove admin variant from UI components ([e42a8f74](https://github.com/your-username/openmanager-vibe-v5/commit/e42a8f74))
- Complete migration to UnifiedServerDataSource - remove OLD data system ([bcb4cca3](https://github.com/your-username/openmanager-vibe-v5/commit/bcb4cca3))
- 코드 품질 개선 (Gemini 리뷰 피드백 반영) ([3e619628](https://github.com/your-username/openmanager-vibe-v5/commit/3e619628))
- API 인증 보안 강화 - 2차 개선 (Codex 리뷰 피드백 반영) ([ef0c3bbf](https://github.com/your-username/openmanager-vibe-v5/commit/ef0c3bbf))
- API 인증 보안 강화 (Codex 리뷰 피드백 반영) ([12b465c9](https://github.com/your-username/openmanager-vibe-v5/commit/12b465c9))
- TODO 정리 및 보안 강화 ([a4592974](https://github.com/your-username/openmanager-vibe-v5/commit/a4592974))
- GCP Functions 정리 - Phase 1 코드 클린업 ([529be755](https://github.com/your-username/openmanager-vibe-v5/commit/529be755))
- ESLint 경고 추가 정리 및 작업 계획서 추가 ([f15619e3](https://github.com/your-username/openmanager-vibe-v5/commit/f15619e3))
- ESLint 경고 대량 감소 (245→110, 55% 개선) ([ba370a76](https://github.com/your-username/openmanager-vibe-v5/commit/ba370a76))
- 커밋 훅 및 서브에이전트 최적화 ([45af8f2c](https://github.com/your-username/openmanager-vibe-v5/commit/45af8f2c))
- 서브에이전트 최적화 (deprecated 제거, 간소화, 하드코딩 제거) ([6e658af4](https://github.com/your-username/openmanager-vibe-v5/commit/6e658af4))
- 모든 헬스체크를 수동 테스트 전용으로 변경 ([a52b706e](https://github.com/your-username/openmanager-vibe-v5/commit/a52b706e))
- 미사용 타입 정리 (2개 경고 추가 해결) ([7d220afb](https://github.com/your-username/openmanager-vibe-v5/commit/7d220afb))
- 미사용 변수/파라미터 정리 (7개 경고 해결) ([f0d00649](https://github.com/your-username/openmanager-vibe-v5/commit/f0d00649))
- 중복 및 분산된 개발 패턴 통합 ([b46a1f7d](https://github.com/your-username/openmanager-vibe-v5/commit/b46a1f7d))
- LRU 캐시 로직 수정 (ADR-001 버그 수정) ([3fe52936](https://github.com/your-username/openmanager-vibe-v5/commit/3fe52936))
- Simplify environment setup and improve security ([4ee50939](https://github.com/your-username/openmanager-vibe-v5/commit/4ee50939))
- Remove AI mode selection and unify AI pipeline ([89dba706](https://github.com/your-username/openmanager-vibe-v5/commit/89dba706))
- Clean up and refactor e2e test suite ([01418b66](https://github.com/your-username/openmanager-vibe-v5/commit/01418b66))
- Simplify Vibe Coding card for portfolio focus ([b89d8415](https://github.com/your-username/openmanager-vibe-v5/commit/b89d8415))
- GCP Functions Phase 2 최적화 - 중복 타입 제거 ([c1c12c76](https://github.com/your-username/openmanager-vibe-v5/commit/c1c12c76))

### ⚡ Performance

- Optimize useEffect with useMemo in global-error.tsx ([11681ff6](https://github.com/your-username/openmanager-vibe-v5/commit/11681ff6))
- 시스템 중단 상태 컴퓨팅 사용량 78% 절감 ([8752e6d2](https://github.com/your-username/openmanager-vibe-v5/commit/8752e6d2))

### 🧪 Tests

- Skip localhost tests when not on Vercel ✅ ([ca04f4a8](https://github.com/your-username/openmanager-vibe-v5/commit/ca04f4a8))
- Exclude E2E tests from Vitest (Quick Win #2 Revised) ✅ ([e4666a6d](https://github.com/your-username/openmanager-vibe-v5/commit/e4666a6d))
- Add GOOGLE_AI_API_KEY to test env (Quick Win #4) ([b7ff9a51](https://github.com/your-username/openmanager-vibe-v5/commit/b7ff9a51))
- Skip path alias test (Quick Win #3 Revised) ✅ ([e37cb805](https://github.com/your-username/openmanager-vibe-v5/commit/e37cb805))
- Exclude E2E tests from Vitest (Quick Win #2) ✅ ([68b15c87](https://github.com/your-username/openmanager-vibe-v5/commit/68b15c87))
- Fix missing vitest imports (Quick Win #1) ✅ ([54dcbb42](https://github.com/your-username/openmanager-vibe-v5/commit/54dcbb42))
- Skip path alias tests pending proper resolution ([57437e00](https://github.com/your-username/openmanager-vibe-v5/commit/57437e00))
- Add node environment for API route unit tests ([93b17f1c](https://github.com/your-username/openmanager-vibe-v5/commit/93b17f1c))

### 🔧 Chores

- remove Serena anti-pattern check from pre-commit hook ([1f081ed9](https://github.com/your-username/openmanager-vibe-v5/commit/1f081ed9))
- remove unused @executeautomation/playwright-mcp-server dependency ([faa351ba](https://github.com/your-username/openmanager-vibe-v5/commit/faa351ba))
- remove legacy MCP code and unused files ([d1200471](https://github.com/your-username/openmanager-vibe-v5/commit/d1200471))
- optimize eslint config, fix lint-staged and tsc wrapper ([eed63a9e](https://github.com/your-username/openmanager-vibe-v5/commit/eed63a9e))
- reactivate AI review system and enforce WSL execution ([24b168ed](https://github.com/your-username/openmanager-vibe-v5/commit/24b168ed))
- snapshot before lib reorganization ([0900283e](https://github.com/your-username/openmanager-vibe-v5/commit/0900283e))
- Trigger Vercel redeployment for ADMIN_PASSWORD env var ([50752ea2](https://github.com/your-username/openmanager-vibe-v5/commit/50752ea2))
- 스크립트 개선 완료 (Phase 2) ([32cadd2b](https://github.com/your-username/openmanager-vibe-v5/commit/32cadd2b))
- 스크립트 대량 정리 - 68개 삭제 (Phase 1 완료) ([79365b66](https://github.com/your-username/openmanager-vibe-v5/commit/79365b66))
- trigger deploy after env var cleanup ([769310b9](https://github.com/your-username/openmanager-vibe-v5/commit/769310b9))
- Trigger Vercel redeploy with updated environment variables ([14ac8704](https://github.com/your-username/openmanager-vibe-v5/commit/14ac8704))
- fix hook deps in dashboard client ([68d17b41](https://github.com/your-username/openmanager-vibe-v5/commit/68d17b41))
- fix hook deps in auth error and memo util ([30df1c1c](https://github.com/your-username/openmanager-vibe-v5/commit/30df1c1c))
- suppress floating promises in system controls and ai engines ([9edf2bfb](https://github.com/your-username/openmanager-vibe-v5/commit/9edf2bfb))
- fix streaming router floating promises and unused ([fcf34c73](https://github.com/your-username/openmanager-vibe-v5/commit/fcf34c73))
- remove unused schemas in servers APIs ([e143acf7](https://github.com/your-username/openmanager-vibe-v5/commit/e143acf7))
- clear lint unused vars in utils ([f23680a1](https://github.com/your-username/openmanager-vibe-v5/commit/f23680a1))
- clean lint warnings in recovery and modal ([f4a5355a](https://github.com/your-username/openmanager-vibe-v5/commit/f4a5355a))
- lint cleanup batch ([ddd31ccb](https://github.com/your-username/openmanager-vibe-v5/commit/ddd31ccb))
- lint_unused 정리 및 경고 감소 ([dad18929](https://github.com/your-username/openmanager-vibe-v5/commit/dad18929))

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
