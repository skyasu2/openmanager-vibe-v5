# MCP 문서 통합 매핑 가이드

_작성일: 2025-01-28_

## 현재 MCP 문서 현황 (21개)

### 1. 설정 관련 (7개) → `guides/mcp/setup.md`로 통합

- claude-code-mcp-setup-2025.md
- mcp-quick-guide.md
- mcp-optimization-guide-2025.md
- sentry-mcp-setup-guide.md
- vercel-mcp-setup-guide.md
- mcp-restart-guide.md
- sub-agents-mcp-mapping-guide.md

### 2. 서버 상태 관련 (6개) → `guides/mcp/servers.md`로 통합

- mcp-server-status-2025.md
- mcp-server-status-check-2025-01-26.md
- mcp-server-status-check.md
- mcp-server-status.md
- mcp-server-test-results-2025-07-26.md
- mcp-status-check-2025-07-26.md

### 3. 문제 해결 관련 (1개) → `guides/mcp/troubleshooting.md`

- mcp-troubleshooting-guide.md

### 4. 아키텍처 관련 (2개) → `guides/mcp/architecture.md`로 통합

- mcp-unified-architecture-guide.md
- mcp-pgvector-integration-report-2025-01-27.md

### 5. 모범 사례 관련 (3개) → `guides/mcp/best-practices.md`로 통합

- mcp-best-practices-guide.md
- mcp-usage-improvement-guide.md
- mcp-documentation-consolidation-mapping.md (이 문서)

### 6. 보안 관련 (2개) → `guides/mcp/security.md`로 통합

- mcp-security-alert.md
- mcp-security-audit-report.md

### 7. 상태 보고서 (1개) → 아카이브

- mcp-documentation-status-report-2025-01-28.md

## 통합 후 구조 (6개 문서)

```
guides/mcp/
├── README.md               # MCP 개요 및 네비게이션
├── setup.md               # 설치 및 설정 통합 가이드
├── servers.md             # 서버 상태 및 관리
├── architecture.md        # 시스템 아키텍처
├── best-practices.md      # 모범 사례 및 활용법
├── security.md            # 보안 가이드
└── troubleshooting.md     # 문제 해결

```

## 통합 원칙

### 1. 중복 제거

- 동일한 내용이 여러 문서에 반복되는 경우 하나로 통합
- 버전별 차이는 하나의 문서 내 섹션으로 구분

### 2. 시간순 정리

- 최신 정보를 상단에 배치
- 구버전 정보는 "이전 버전" 섹션으로 이동

### 3. 실용성 우선

- 설정 방법은 단계별로 명확하게
- 문제 해결은 증상별로 구분
- 모범 사례는 실제 사용 예시 포함

### 4. 상호 참조

- 관련 문서 간 링크 추가
- 외부 리소스 링크 검증
- 코드 예시는 실제 파일 경로 참조

## 문서별 통합 가이드

### `setup.md` 구조

```markdown
# MCP 설정 종합 가이드

## 빠른 시작

- 5분 안에 시작하기

## 상세 설정

### 로컬 개발 환경

### WSL 환경

### Vercel 배포

### Sentry 통합

## 환경 변수

## 설정 파일

## 검증 방법
```

### `servers.md` 구조

```markdown
# MCP 서버 관리

## 현재 서버 목록 (9개)

### 각 서버별 상태

### 헬스 체크 방법

## 서버 관리

### 시작/중지

### 모니터링

### 로그 확인

## 성능 최적화
```

### `architecture.md` 구조

```markdown
# MCP 아키텍처

## 시스템 개요

## 핵심 컴포넌트

## 데이터 흐름

## pgvector 통합

## 확장 가능성
```

## 실행 계획

### Phase 1: 백업 및 준비 (Day 1)

1. 모든 MCP 문서 백업
2. 통합 스크립트 실행
3. 새 구조 생성

### Phase 2: 내용 통합 (Day 2-3)

1. 중복 내용 식별 및 병합
2. 구조화된 문서 작성
3. 코드 예시 업데이트

### Phase 3: 검증 및 배포 (Day 4-5)

1. 링크 검증
2. 팀 리뷰
3. 기존 문서 아카이빙
4. 새 문서 배포

## 성공 지표

- **문서 수**: 21개 → 6개 (71% 감소)
- **중복 내용**: 0%
- **상호 참조**: 100% 유효
- **검색 가능성**: 향상

## 장기 유지보수

### 월간 검토

- 새로운 MCP 기능 추가
- 오래된 정보 아카이빙
- 사용자 피드백 반영

### 자동화

- CI/CD에서 링크 검증
- 자동 목차 생성
- 변경 이력 추적
