# 문서 재구성 종합 계획 2025-01-28

## 현재 상태 분석

### 심각한 문제점

- **1,744개의 README 파일**: 프로젝트 전체에 과도한 README 파일 분산
- **100개 이상의 문서**: docs 폴더에 체계 없이 나열된 문서들
- **22개의 MCP 문서**: 중복되고 버전이 다른 MCP 관련 문서들
- **구조화되지 않은 계층**: 대부분의 문서가 최상위 레벨에 평면적으로 배치

### 주요 문제 영역

1. **MCP 문서 중복** (22개 → 5개로 통합 필요)
   - mcp-server-status 관련 6개 파일
   - mcp-setup 관련 4개 파일
   - mcp-guide 관련 5개 파일
   - mcp-troubleshooting 관련 3개 파일

2. **AI 시스템 문서 중복**
   - ai-complete-guide.md
   - ai-system-unified-guide.md
   - ML-ENHANCEMENT-SUMMARY.md

3. **인증 관련 문서 분산**
   - auth-\*.md 파일 7개
   - oauth-\*.md 파일 8개
   - github-oauth-\*.md 파일 3개

4. **환경 설정 문서 혼재**
   - env-\*.md 파일 5개
   - setup/\*.md 파일 4개
   - development/\*.md 파일 2개

## 새로운 문서 구조

```
docs/
├── README.md                    # 문서 인덱스 및 네비게이션
├── getting-started/            # 시작하기
│   ├── README.md              # 빠른 시작 가이드
│   ├── installation.md        # 설치 가이드
│   ├── configuration.md       # 기본 설정
│   └── first-steps.md         # 첫 단계
│
├── guides/                     # 주요 가이드
│   ├── development/           # 개발 가이드
│   │   ├── README.md
│   │   ├── setup.md          # 개발 환경 설정
│   │   ├── coding-standards.md
│   │   └── testing.md
│   │
│   ├── ai/                    # AI 시스템
│   │   ├── README.md
│   │   ├── architecture.md   # 통합 AI 아키텍처
│   │   ├── engines.md        # AI 엔진 가이드
│   │   └── rag-system.md     # RAG 시스템
│   │
│   ├── mcp/                   # MCP 통합 가이드
│   │   ├── README.md
│   │   ├── setup.md          # MCP 설정 통합본
│   │   ├── servers.md        # 서버 상태 및 관리
│   │   └── troubleshooting.md
│   │
│   ├── authentication/        # 인증 시스템
│   │   ├── README.md
│   │   ├── oauth-setup.md    # OAuth 통합 가이드
│   │   └── supabase-auth.md
│   │
│   └── deployment/            # 배포
│       ├── README.md
│       ├── vercel.md
│       └── production.md
│
├── api/                        # API 문서
│   ├── README.md
│   ├── rest-api.md
│   └── graphql.md
│
├── reference/                  # 참조 문서
│   ├── configuration.md       # 모든 설정 옵션
│   ├── environment-variables.md
│   ├── error-codes.md
│   └── glossary.md
│
├── troubleshooting/           # 문제 해결
│   ├── README.md
│   ├── common-issues.md
│   ├── error-reference.md
│   └── faq.md
│
└── archive/                   # 아카이브 (30일 이상 미사용)
    ├── 2025-01/              # 월별 아카이브
    └── legacy/               # 레거시 문서

```

## 문서 통합 전략

### 1단계: MCP 문서 통합 (22개 → 5개)

- **setup.md**: 모든 설정 관련 문서 통합
- **servers.md**: 서버 상태 및 관리 통합
- **troubleshooting.md**: 문제 해결 가이드 통합
- **architecture.md**: MCP 아키텍처 설명
- **best-practices.md**: 모범 사례

### 2단계: AI 문서 통합 (15개 → 4개)

- **architecture.md**: AI 시스템 전체 구조
- **engines.md**: 각 AI 엔진 상세 가이드
- **rag-system.md**: RAG 및 벡터 DB
- **optimization.md**: 성능 최적화

### 3단계: 인증 문서 통합 (18개 → 3개)

- **oauth-setup.md**: OAuth 통합 가이드
- **supabase-auth.md**: Supabase 인증
- **troubleshooting.md**: 인증 문제 해결

### 4단계: 환경 설정 통합 (11개 → 3개)

- **setup.md**: 환경 설정 가이드
- **environment-variables.md**: 환경 변수 참조
- **security.md**: 보안 설정

## 자동화 도구

### 문서 정리 스크립트

- `scripts/docs/reorganize.sh`: 문서 재구성 자동화
- `scripts/docs/validate-links.sh`: 링크 검증
- `scripts/docs/generate-index.sh`: 인덱스 생성

### CI/CD 통합

- PR 시 문서 링크 자동 검증
- 월별 자동 아카이빙
- 중복 문서 감지

## 실행 일정

### Week 1 (즉시 실행)

- [x] 문서 재구성 계획 수립
- [ ] 정리 스크립트 생성
- [ ] 새 폴더 구조 생성
- [ ] MCP 문서 통합 시작

### Week 2

- [ ] AI 문서 통합
- [ ] 인증 문서 통합
- [ ] 환경 설정 문서 통합

### Week 3

- [ ] 상호 참조 링크 업데이트
- [ ] 검색 메타데이터 추가
- [ ] 자동화 도구 구현

### Week 4

- [ ] 최종 검증
- [ ] 팀 리뷰
- [ ] 배포

## 성공 지표

1. **문서 수 감소**
   - MCP: 22개 → 5개 (77% 감소)
   - AI: 15개 → 4개 (73% 감소)
   - 전체: 100개 → 30-40개 (60-70% 감소)

2. **구조 개선**
   - 평면 구조 → 계층적 구조
   - 카테고리별 명확한 분류
   - 일관된 네이밍 규칙

3. **유지보수성**
   - 자동 아카이빙 시스템
   - 링크 검증 자동화
   - 중복 방지 메커니즘

## 주의사항

1. **기존 링크 보존**: 301 리다이렉트 설정
2. **Git 히스토리 유지**: `git mv` 사용
3. **팀 공지**: 변경사항 사전 공유
4. **점진적 마이그레이션**: 한 번에 모두 변경하지 않음

## 다음 단계

1. 이 계획 검토 및 승인
2. `scripts/docs/reorganize.sh` 스크립트 실행
3. 단계별 실행 및 모니터링
