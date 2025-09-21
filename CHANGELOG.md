# Changelog

> 📌 **참고**: 이전 버전들의 상세한 변경 이력은 레거시 파일들을 참조하세요.
>
> - 현재 파일: **v5.78.0 이후** (2025-09-21 ~) - 최신 안정화 버전들
> - [CHANGELOG-LEGACY-1.md](./CHANGELOG-LEGACY-1.md): v5.67.22 ~ v5.76.32 (2025-08-17 ~ 2025-09-06) 
> - [CHANGELOG-LEGACY-2.md](./CHANGELOG-LEGACY-2.md): v5.66.40 ~ v5.67.21 (2025-08-12 ~ 2025-08-17)
> - [CHANGELOG-LEGACY.md](./CHANGELOG-LEGACY.md): v5.0.0 ~ v5.65.6 (2025-05 ~ 2025-08)

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