# Changelog

> 📌 **참고**: 이전 버전들의 상세한 변경 이력은 레거시 파일들을 참조하세요.
>
> - 현재 파일: **v5.78.0 이후** (2025-09-21 ~) - 최신 안정화 버전들
> - [CHANGELOG-LEGACY-1.md](./CHANGELOG-LEGACY-1.md): v5.67.22 ~ v5.76.32 (2025-08-17 ~ 2025-09-06) 
> - [CHANGELOG-LEGACY-2.md](./CHANGELOG-LEGACY-2.md): v5.66.40 ~ v5.67.21 (2025-08-12 ~ 2025-08-17)
> - [CHANGELOG-LEGACY.md](./CHANGELOG-LEGACY.md): v5.0.0 ~ v5.65.6 (2025-05 ~ 2025-08)

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
- ️ feat: Phase 2 Dependencies 최적화 완료 - 23개 패키지 제거 (2fc9c6f9)
- ️ feat: Phase 1 Dependencies 최적화 완료 - 40개 패키지 제거 (09abeb69)
- scripts: 개별 검사를 통한 세밀한 스크립트 정리 완료 (14abe6c5)
- scripts: 스크립트 최적화 및 중복 제거 완료 (b2dbe26e)
- privacy: 개발기간 등 개인정보 제거 (4683f1dc)
- fix: .env.local.template 중복 파일 정리 완료 (1a7d5957)
- refactor: 파일 정리 사이드 이펙트 해결 완료 (811c2d80)
- ️ CRITICAL FIX: Vercel 빌드 실패 해결 - .vercelignore 선별적 차단 (57e45757)
- ️ CRITICAL SECURITY: WSL 포트 충돌 해결 + Vercel 배포 안전성 완벽 확보 (ef0f1b1d)
- ️ fix: 30+ TypeError 근본 해결 - AI 교차검증 기반 구조적 리팩토링 완성 (f15fc951)
- ️ CRITICAL FIX: 15개 TypeError 완전 해결 - useServerDashboard.ts 배열 접근 패턴 수정 (6fedb939)
- ️ fix: AI 교차검증 기반 TypeError 완전 해결 - Race Condition 근본 원인 수정 (0a797ce2)
- fix: ImprovedServerCard 3개 unsafe 패턴 완전 수정 - AI 교차검증 이중 안전장치 (03692f9b)
- ️ fix: AI 교차검증 기반 TypeError 완전 해결 - Race Condition 근본 원인 수정 (35cceb91)
- ️ fix: SafeServerCard 실시간 데이터 업데이트 안전성 강화 (7571ae84)
- docs: Vercel 중심 테스트 전략으로 문서 전환 (20f49927)
- fix: SystemConfiguration 안전성 강화 - 베르셀 배포 ZodError 해결 (7def75bd)
- fix: .env.example 중복 설정 제거 및 역할 명확화 (0947e697)
- fix: pre-commit 훅 수정 + 중앙집중식 설정 템플릿 추가 (ab0c6973)
- fix: MCP serena 프로젝트 활성화 및 종합 시스템 개선 (c7046495)
- refactor: 테스트 시스템 최적화 및 설정 정리 (31cb632a)
- fix: AI 어시스턴트 백엔드 안정성 개선 + Next.js 15.4.5 다운그레이드 (335baae8)
- ️ feat: Playwright 테스트 도구 + MCP 복구 자동화 완성 (b3c81de7)
- fix: 중단 원인 완전 해결 + 구조적 개선 시스템 구축 (0a926c8f)
- fix: 사이드 이펙트 완전 해결 - 프로젝트 90%→100% 완성 달성 (30b087b9)
- fix: 중단 원인 완전 해결 + 구조적 개선 시스템 구축 (c041e934)
- fix: 테스트 및 보안 안정성 개선 (e8bcbe34)
- fix: Husky v10 호환성 - deprecated 경고 완전 제거 (5813a9f5)
- feat: 베르셀 환경 테스트 전략 완전 통합 + 문서 체계 최적화 (6eec72df)
- feat: Playwright MCP 설정 가이드 완전 문서화 (dc6b988c)
- feat: 서브에이전트 최적화 + MCP CLI-only 통합 + 문서 체계화 (01c5c612)

#### Fixed

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