# 📚 문서 전체 인덱스

> 생성 시간: 2025-08-12 23:45 KST

## 📊 문서 정리 결과

### 🎯 목표 달성

- ✅ **루트 파일**: 83개 → 핵심만 유지 (93% 감소)
- ✅ **JBGE 원칙**: 완전 준수
- ✅ **체계적 분류**: 기능별 디렉토리 구성
- ✅ **중복 제거**: 유사 문서 통합
- ✅ **아카이브**: 분석 리포트 날짜별 보관

### 📂 전체 구조

#### 루트 레벨 - 인간 친화적 핵심 가이드

```
docs/
├── README.md                  # 메인 문서 인덱스
├── QUICK-START.md            # 5분 빠른 시작 가이드
├── SYSTEM-OVERVIEW.md        # 시스템 아키텍처 개요
├── MCP-GUIDE.md              # MCP 서버 완전 가이드
├── AI-SYSTEMS.md             # AI 협업 시스템 가이드
├── TROUBLESHOOTING.md        # 문제 해결 가이드
└── system-architecture.md    # 상세 기술 명세 (기존)
```

#### Technical 디렉토리 - Claude 참조용 기술 문서

##### 📁 technical/mcp/ (20+ 문서)

```
mcp-best-practices-guide.md              # MCP 베스트 프랙티스
mcp-development-guide-2025.md            # 2025 MCP 개발 가이드
mcp-usage-guide-2025.md                  # MCP 사용법 가이드
# mcp-servers-complete-guide.md            # (제거됨: MCP-GUIDE.md로 통합)
windows-mcp-complete-installation-guide.md # Windows MCP 설치
mcp-environment-variables-guide.md       # MCP 환경변수 가이드
mcp-subagent-integration-guide.md        # 서브에이전트 통합
tavily-mcp-advanced-guide.md             # Tavily MCP 고급 활용
tavily-mcp-troubleshooting.md            # Tavily 문제 해결
serena-mcp-setup-guide-2025.md           # Serena MCP 설정
serena-mcp-practical-guide.md            # Serena 실용 가이드
serena-startup-optimization-guide.md     # Serena 시작 최적화
shadcn-ui-mcp-guide.md                   # shadcn/ui MCP 가이드
google-ai-mcp-integration-guide.md       # Google AI MCP 통합
time-mcp-usage-guide.md                  # Time MCP 활용법
```

##### 📁 technical/ai-engines/ (10+ 문서)

```
# ai-complete-guide.md                     # (제거됨: ai-systems-guide.md가 더 포괄적)
ai-cli-collaboration-strategy.md         # AI CLI 협업 전략
ai-tools-token-usage-analysis.md         # AI 도구 토큰 분석
aitmpl-comparison-analysis.md            # aitmpl 비교 분석
aitmpl-reference-guide.md                # aitmpl 참조 가이드
aitmpl-usage-patterns.md                 # aitmpl 사용 패턴
# sub-agents-comprehensive-guide.md        # (제거됨: sub-agents-complete-guide.md로 리다이렉트)
sub-agents-mcp-mapping-guide.md          # 서브에이전트 MCP 매핑
subagents-mcp-usage-summary.md           # 서브에이전트 사용 요약
gemini-cli-wsl-setup-guide.md            # Gemini CLI 설정
unified-ai-router-refactoring-plan.md    # AI 라우터 리팩토링
```

##### 📁 technical/vercel-deployment/ (7 문서)

```
vercel-api-errors-fix.md                # Vercel API 오류 수정
vercel-deployment-error-fix.md          # 배포 오류 해결
vercel-deployment-exclusion-analysis.md # 배포 제외 분석
vercel-deployment-warnings-analysis.md  # 배포 경고 분석
vercel-env-setup-guide.md               # Vercel 환경변수 설정
vercel-typescript-fix-guide.md          # Vercel TypeScript 수정
v2-api-migration-summary.md             # API v2 마이그레이션
```

##### 📁 technical/gcp-integration/ (4 문서)

```
gcp-vm-ai-backend-guide.md              # GCP VM AI 백엔드 가이드
gcp-vm-ai-backend-implementation-plan.md # 구현 계획
gcp-vm-mcp-analysis-report.md           # GCP VM MCP 분석
```

##### 📁 technical/database/ (4 문서)

```
pgvector-performance-report.md          # pgvector 성능 리포트
pgvector-setup-guide.md                 # pgvector 설정 가이드
memory-cache-guide.md                   # 메모리 캐시 가이드
fix-jwt-time-issue.md                   # JWT 시간 이슈 수정
```

#### Guides 디렉토리 - 단계별 설정 가이드

##### 📁 guides/setup/ (15+ 문서)

```
supabase-github-oauth-setup.md          # Supabase GitHub OAuth
supabase-oauth-setup-guide.md           # Supabase OAuth 설정
github-login-fix-guide.md               # GitHub 로그인 수정
github-oauth-loop-fix.md                # GitHub OAuth 루프 수정
git-authentication-guide.md             # Git 인증 가이드
git-setup-guide.md                      # Git 설정 가이드
git-workflow-2025-standard.md           # Git 워크플로우 2025
oauth-test-guide.md                     # OAuth 테스트 가이드
npm-global-config-guide.md              # npm 글로벌 설정
dev-mock-setup-guide.md                 # 개발 Mock 설정
eslint-9-compatibility-guide.md         # ESLint 9 호환성
eslint-optimization.md                  # ESLint 최적화
file-modularization-guide.md            # 파일 모듈화 가이드
windows-native-setup-guide.md           # Windows 네이티브 설정
storybook-optimization-guide.md         # Storybook 최적화
storybook-performance-guide.md          # Storybook 성능
```

##### 📁 guides/development/ (12 문서) - 기존 유지

##### 📁 guides/security/ (4 문서) - 기존 유지

##### 📁 guides/performance/ (5 문서) - 기존 유지

##### 📁 guides/testing/ (8 문서) - 기존 유지

#### API 디렉토리

##### 📁 api/schemas/ (1 문서)

```
api-schema-split-plan.md                # API 스키마 분할 계획
```

#### Archive 디렉토리

##### 📁 archive/2025-08-12/ (20+ 분석 리포트)

```
dashboard-improvements-report.md        # 대시보드 개선 리포트
api-schema-split-report.md              # API 스키마 분할 리포트
cache-migration-complete-report.md      # 캐시 마이그레이션 완료
claude-config-mismatch-analysis.md      # Claude 설정 불일치 분석
e2e-test-status-report.md               # E2E 테스트 상태 리포트
ai-performance-optimization-summary-2025-08-10.md # AI 성능 최적화 요약
improvement-phase1-complete.md          # 개선 1단계 완료
platform-usage-analysis.md             # 플랫폼 사용량 분석
security-enhancements-phase1.md         # 보안 강화 1단계
test-analysis-report.md                 # 테스트 분석 리포트
test-improvements-summary-2025.md       # 테스트 개선 요약
type-system-integration-report.md       # 타입 시스템 통합 리포트
wsl-to-windows-migration-summary.md     # WSL to Windows 마이그레이션
sub-agents-windows-compatibility-test-report.md # 서브에이전트 Windows 호환성
```

##### 📁 archive/mcp-legacy/ - 기존 유지

##### 📁 archive/wsl-legacy/ - 기존 유지

## 📊 정리 통계

### Before (정리 전)

- **총 파일**: 168개
- **루트 파일**: 83개 (심각한 bloat)
- **큰 파일**: 830줄, 621줄 등 과도한 크기
- **중복 내용**: 다수
- **찾기 어려운 구조**: 체계 없이 산재

### After (정리 후)

- **총 파일**: 168개 (보존)
- **루트 파일**: 핵심만 유지 (JBGE 준수)
- **체계적 분류**: 기능별 디렉토리
- **중복 제거**: 통합 완료
- **효율적 구조**: Claude/인간 모두 쉽게 접근

## 💡 문서 관리 원칙

```

##### 📁 technical/system/ (1 문서)

```

hardware-specs.md # 개발 환경 시스템 스펙 및 WSL 최적화

```

### JBGE (Just Barely Good Enough)

1. **루트는 핵심만**: 필수 정보만
2. **중복 없음**: 하나의 정보는 하나의 위치에
3. **정기 정리**: 30일 이상 미사용 시 아카이브
4. **실시간 업데이트**: 코드 변경 시 즉시 반영

### 체계적 분류

1. **루트**: 인간 친화적 핵심 가이드
2. **technical/**: Claude 참조용 기술 문서
3. **guides/**: 단계별 설정 및 사용법
4. **api/**: API 문서 및 스키마
5. **archive/**: 날짜별 아카이브

### 지속 가능한 유지보수

1. **문서 생성 시**: 적절한 디렉토리에 배치
2. **중복 발견 시**: 즉시 통합
3. **오래된 문서**: 분기별 아카이브 검토
4. **링크 관리**: 정기적 링크 검증

---

> **문서 구조 개선 제안이 있으시면** 이슈로 등록해주세요!
```
