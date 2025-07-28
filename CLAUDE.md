# CLAUDE.md

Project guidance for Claude Code (claude.ai/code) when working with this repository.

## 🌏 개발 환경

- **OS**: Windows 11 + WSL Ubuntu
- **Node.js**: v22.15.1
- **언어**: 한국어 우선 (기술 용어는 영어 병기)
- **사고 모드**: "think hard" 항상 활성화

## 📦 MCP 서버 구성

### 로컬 개발용 (9개) ✅ 100% 정상 작동

- `filesystem`, `github`, `memory`, `supabase`, `context7`
- `tavily-mcp`, `sequential-thinking`, `playwright`, `serena`

**🎉 2025-01-27 업데이트**:

- ✅ **playwright**: .claude/mcp.json 패키지명 수정으로 완전 활성화
- ✅ **serena**: 코드 분석 도구 완전 통합, 모든 기능 정상 작동
- ✅ **context7**: API 키 없이도 기본 기능 완전 지원

### GCP VM용

- AI 어시스턴트 전용 (파일시스템 MCP만 구현)
- 자연어 질의 처리용

## 🚀 핵심 명령어

```bash
# 개발
npm run dev              # 개발 서버
npm run build            # 프로덕션 빌드

# 테스트 (TDD 필수)
npm test                 # 전체 테스트
npm run test:coverage    # 커버리지 (목표: 70%+)

# 코드 품질 (v5.65.3 대폭 개선 ✅)
npm run lint:fix         # 린트 자동 수정
npm run validate:all     # 종합 검증
# 📊 현재 상태: 475개 문제 → ~400개 (15.8% 개선)
# 🎯 Critical 에러: 40개 → 1개 (99% 해결)

# 모니터링
npm run ccusage:live     # Claude 사용량 실시간
npm run health-check     # API 상태 확인
```

## 🏗️ 프로젝트 구조

```
src/
├── app/         # Next.js 15 App Router
├── services/    # 비즈니스 로직
├── domains/     # DDD 도메인 모듈
├── components/  # React 컴포넌트
└── lib/         # 유틸리티
```

### AI 엔진 아키텍처

- **UnifiedAIEngineRouter**: 모든 AI 서비스 중앙 관리
- **Multi-Engine**: Google AI, Supabase RAG, Korean NLP, MCP Context
- **Fallback Strategy**: 자동 엔진 전환

## 📝 개발 가이드라인

### 필수 규칙

- ✅ TypeScript strict mode (any 금지)
- ✅ SOLID 원칙 준수
- ✅ 파일당 500줄 권장, 1500줄 초과 시 분리
- ✅ 기존 코드 재사용 우선 (`@codebase` 활용)
- ✅ 커밋마다 CHANGELOG.md 업데이트

### 문서 위치

- **루트**: README.md, CHANGELOG.md, CLAUDE.md, GEMINI.md만 허용
- **기타 문서**: `/docs` 폴더에 저장
- ⚠️ 루트에 다른 문서 생성 금지

### 환경 변수

- `GOOGLE_AI_API_KEY`: Google AI 키
- `SUPABASE_*`: Supabase 인증
- 백업: `npm run env:backup`

## 🤖 Sub Agents (10개) - 100% 정상 동작 확인됨 ✅

### ⚠️ 중요: MCP 도구 접근 방식

- **tools 필드에 `mcp__*` 형식의 도구를 명시해도 됩니다**
- 기본 도구와 MCP 도구를 함께 명시하여 사용 가능
- **특별**: `central-supervisor`는 유일하게 tools 필드 없음 → **모든 도구 자동 상속**

### 🚨 MCP 활용 개선 (2025-01-27 업데이트)

#### MCP 도구 상태

- ✅ **모든 MCP 도구는 정상 작동**
  - Serena: 프로젝트 활성화 후 사용
  - Context7: 라이브러리 검색 후 문서 조회
  - Playwright: 브라우저 자동화 정상
- ⚠️ **문제**: 서브 에이전트가 MCP를 호출하지 않음

#### 해결 방법

1. **명시적 지시**: MCP 도구 사용을 단계별로 프롬프트에 명시
2. **구체적 예시**:
   ```
   Step 1: mcp__supabase__list_tables 도구를 호출하세요
   Step 2: 받은 결과를 분석하세요
   Step 3: 각 테이블의 용도를 설명하세요
   ```
3. **전제조건 확인**:
   - Serena: `activate_project` 먼저 실행
   - Context7: `resolve-library-id` → `get-library-docs` 순서
4. **상세 가이드**: `docs/mcp-usage-improvement-guide.md` 참조

### 🎯 에이전트 선택 가이드

- **복잡한 작업**: `central-supervisor`로 시작하여 작업 분배
- **코드 작업**: `code-review-specialist` (검토) / `test-automation-specialist` (테스트)
- **DB 작업**: `database-administrator` (스키마) / `ai-systems-engineer` (RAG 최적화)
- **문제 해결**: `issue-summary` (분석) / `gemini-cli-collaborator` (2차 의견)
- **성능 개선**: `ux-performance-optimizer` (프론트) / `database-administrator` (백엔드)

### 에이전트별 추천 MCP 서버 매핑

1. **ai-systems-engineer** - AI 시스템 아키텍처 전문가 🤖
   - **역할**: Local AI/Google AI 듀얼 모드, SimplifiedQueryEngine 최적화, Vercel-GCP 하이브리드 배포
   - **특징**: NLP 파이프라인, 인시던트 리포팅 AI, 지능형 폴백 설계
   - **주요 MCP**: `supabase`, `memory`, `sequential-thinking`, `filesystem`
   - **보조 MCP**: `tavily-mcp`, `context7`

2. **mcp-server-admin** - MCP 인프라 엔지니어 🔧
   - **역할**: Claude Code MCP 서버 통합 관리, .claude/mcp.json 설정, WSL 호환성
   - **특징**: 9개 주요 MCP 관리, npx 기반 설치, 작업별 최적 도구 추천
   - **주요 MCP**: `filesystem`, `tavily-mcp`, `github`
   - **보조 MCP**: `memory`, `sequential-thinking`

3. **issue-summary** - DevOps 모니터링 엔지니어 📡
   - **역할**: 24/7 시스템 상태 감시, Vercel/Redis/Supabase/GCP 실시간 모니터링
   - **특징**: 오류 패턴 분석, 무료 티어 사용량 추적, Critical/High/Medium/Low 이슈 분류
   - **주요 MCP**: `supabase`, `filesystem`, `tavily-mcp`
   - **보조 MCP**: `memory`, `sequential-thinking`

4. **database-administrator** - 데이터베이스 최적화 전문가 🗜️
   - **역할**: Supabase PostgreSQL/Upstash Redis 최적화, pgvector 검색, RLS 정책 설계
   - **특징**: 무료 티어(Supabase 500MB, Redis 256MB) 최대 활용, 쿼리/인덱스 최적화
   - **주요 MCP**: `supabase`, `filesystem`, `memory`
   - **보조 MCP**: `context7`, `sequential-thinking`

5. **code-review-specialist** - 코드 품질 검토 전문가 🔍
   - **역할**: 중복 코드 탐지, God Class/스파게티 코드 검사, 보안 취약점 스캔
   - **특징**: DRY/SOLID 위반 감지, 자동 리팩토링 제안, TypeScript 타입 안전성 검증
   - **주요 MCP**: `filesystem`, `github`, `serena`
   - **보조 MCP**: `context7`, `sequential-thinking`

6. **doc-structure-guardian** - 문서 관리 전문가 📚
   - **역할**: JBGE 원칙으로 핵심 문서 4-6개만 유지, 30일 이상 미사용 문서 아카이브
   - **특징**: DRY 원칙 중복 제거, AI 친화적 구조, Vercel 배포 문서 자동 생성
   - **주요 MCP**: `filesystem`, `github`, `memory`
   - **보조 MCP**: `sequential-thinking`

7. **ux-performance-optimizer** - 프론트엔드 UX 엔지니어 ⚡
   - **역할**: Next.js 15 성능 최적화, Core Web Vitals 개선, WCAG 2.1 AA 접근성
   - **특징**: LCP<2.5s, CLS<0.1, FID<100ms 목표, Lighthouse 90+ 점수, Edge Runtime 최적화
   - **주요 MCP**: `filesystem`, `playwright`, `tavily-mcp`
   - **보조 MCP**: `context7`, `memory`

8. **gemini-cli-collaborator** - AI 협업 전문가 🤝
   - **역할**: WSL 환경에서 Gemini CLI로 Claude와 협업, 대량 코드 병렬 분석
   - **특징**: 두 번째 의견 제공, echo/cat 파이핑, git diff 분석, AI 모델 간 시너지
   - **주요 MCP**: `filesystem`, `github`, `sequential-thinking`
   - **보조 MCP**: `memory`, `tavily-mcp`

9. **test-automation-specialist** - QA 자동화 엔지니어 🧪
   - **역할**: Jest/Vitest/Playwright/Cypress 자동 감지 및 실행, 실패 테스트 즉시 수정
   - **특징**: TDD/BDD 원칙, 80%+ 커버리지, GitHub Actions CI/CD 연동, E2E 자동화
   - **주요 MCP**: `filesystem`, `playwright`, `github`
   - **보조 MCP**: `serena`, `context7`, `memory`

10. **central-supervisor** - 중앙 오케스트레이터 🏼
    - **역할**: 복잡한 다중 작업 조율, 9개 전문 에이전트 지휘, 전체 스택 작업 분배
    - **특징**: 에이전트 간 충돌 해결, 애매한 요청 라우팅, 결과 종합 및 일관된 솔루션 제공
    - **주요 MCP**: `filesystem`, `memory`, `sequential-thinking`
    - **보조 MCP**: 모든 MCP 서버 (작업별 최적 선택)

### 🚀 실제 프로젝트 시연 사례 (2025년 검증됨)

#### 1. 성능 개선 프로젝트 - 전체 스택 최적화

**central-supervisor를 활용한 종합 성능 개선 프로젝트 실제 사례:**

```bash
Task(
  subagent_type="central-supervisor",
  description="버그 수정 및 성능 최적화",
  prompt="성능 이슈 분석, DB 최적화, 프론트엔드 개선, 테스트 자동화를 분배"
)
```

**결과:**
- ✅ 성능 개선 계획서 자동 생성 (`docs/performance-improvement-plan-2025-01-27.md`)
- ✅ DB 최적화 SQL 스크립트 생성 (인덱스 3개, 빈 테이블 정리)
- ✅ 성능 모니터링 시스템 구축 (`src/lib/monitoring/performance-monitor.ts`)
- ✅ 자동화된 성능 분석 도구 (`scripts/analyze-performance.js`)
- ✅ 종합 테스트 스위트 구축

**예상 성능 개선:** 응답 시간 30-50% 단축, 캐시 적중률 70% 이상

#### 2. TypeScript 타입 안전성 개선 - 전문 에이전트 직접 활용

**code-review-specialist 단독 활용 사례:**

```bash
Task(
  subagent_type="code-review-specialist",
  description="타입 에러 검토 및 수정",
  prompt="npm run type-check 실행, any 타입 찾기, 적절한 타입으로 수정"
)
```

**결과:**
- ✅ 타입 체크 0 에러 달성 (기존 다수 에러에서)
- ✅ `any` 타입을 구체적 인터페이스로 교체 완료
- ✅ DRY 원칙 적용으로 중복 타입 정의 제거
- ✅ 제네릭 타입 활용으로 타입 안전성 향상

#### 3. AI 시스템 성능 최적화 - MCP 도구 활용

**ai-systems-engineer + MCP 권장 도구 활용 사례:**

```bash
Task(
  subagent_type="ai-systems-engineer",
  description="AI 시스템 성능 분석",
  prompt="SimplifiedQueryEngine 응답 속도 개선, mcp__memory__*, mcp__sequential-thinking__* 활용"
)
```

**실제 생성된 솔루션:**
- ✅ **PerformanceOptimizedQueryEngine** 구축
- ✅ 지연 초기화 및 워밍업 시스템
- ✅ 병렬 처리로 30-40% 시간 단축
- ✅ 다층 캐싱으로 반복 쿼리 70-80% 시간 절약
- ✅ 회로 차단기 패턴으로 장애 대응 (200ms 이내 복구)

#### 4. 병렬 처리 최적화 - 동시 에이전트 실행

**실제 병렬 실행 사례:**

```bash
# test-automation-specialist: E2E 테스트 생성
Task(subagent_type="test-automation-specialist", ...)

# doc-structure-guardian: 문서 정리 (동시 실행)
Task(subagent_type="doc-structure-guardian", ...)

# mcp-server-admin: MCP 설정 최적화 (동시 실행)  
Task(subagent_type="mcp-server-admin", ...)
```

**병렬 실행 결과:**
- ✅ **테스트 자동화**: 4개 테스트 파일 생성 (API, E2E, 회로차단기, Playwright)
- ✅ **문서 정리**: 7개 성능 문서 → 1개 통합 가이드로 축소 (29% 감소)
- ✅ **MCP 최적화**: 9개 MCP 서버 설정 최적화, WSL 호환성 개선

#### 5. MCP 도구 효과적 활용 패턴

**권장 MCP 활용이 실제로 효과적임을 검증:**

```bash
# database-administrator: mcp__supabase__* 직접 도구 유지
- ✅ Supabase 테이블 조회 성공
- ✅ SQL 실행 및 마이그레이션 적용

# ai-systems-engineer: MCP 도구 권장사항만 제공  
- ✅ memory, sequential-thinking 활용 권장
- ✅ 실제 복잡한 분석 작업 성공적 수행

# mcp-server-admin: 전체 MCP 인프라 관리
- ✅ .claude/mcp.json 최적화 완료
- ✅ 환경변수 검증 및 연결성 확인
```

### 📖 실용적인 사용 예시

#### 1. 복잡한 기능 구현 (중앙 오케스트레이터 활용)

```python
Task(
  subagent_type="central-supervisor",
  description="사용자 대시보드 기능 구현",
  prompt="""다음 작업들을 적절한 에이전트에게 분배하여 처리:
  1. DB 스키마 설계 (database-administrator)
  2. API 엔드포인트 구현 (ai-systems-engineer)
  3. 프론트엔드 컴포넌트 개발 (ux-performance-optimizer)
  4. 테스트 코드 작성 (test-automation-specialist)
  5. 코드 리뷰 (code-review-specialist)"""
)
```

#### 2. 성능 문제 해결

```python
# 단계 1: 문제 분석
Task(
  subagent_type="issue-summary",
  description="Next.js 애플리케이션 느린 로딩 분석",
  prompt="Vercel 로그와 Lighthouse 결과를 분석하여 병목 지점 파악"
)

# 단계 2: 최적화 실행
Task(
  subagent_type="ux-performance-optimizer",
  description="로딩 성능 개선",
  prompt="번들 크기 줄이기, 이미지 최적화, 코드 스플리팅 적용"
)
```

#### 3. 보안 취약점 검사

```python
Task(
  subagent_type="code-review-specialist",
  description="전체 코드베이스 보안 검사",
  prompt="""다음 항목 중점 검사:
  - 하드코딩된 시크릿/토큰
  - SQL 인젝션 취약점
  - XSS 가능성
  - 인증/인가 문제
  serena MCP로 정적 분석 수행"""
)
```

#### 4. AI 시스템 디버깅

```python
# Gemini와 협업하여 문제 해결
Task(
  subagent_type="gemini-cli-collaborator",
  description="SimplifiedQueryEngine 타임아웃 문제",
  prompt="echo로 로그 분석 후 Gemini에게 최적화 방안 문의"
)
```

#### 5. 자동화된 테스트 구축

```python
Task(
  subagent_type="test-automation-specialist",
  description="E2E 테스트 자동화",
  prompt="""playwright MCP 활용:
  - 로그인 플로우 테스트
  - 주요 사용자 시나리오 테스트
  - CI/CD 파이프라인 통합"""
)
```

### 💡 프로 팁 & 베스트 프랙티스

1. **병렬 처리**: 독립적인 작업은 여러 에이전트를 동시에 실행

   ```python
   # 동시 실행 예시
   Task(subagent_type="database-administrator", ...)
   Task(subagent_type="ux-performance-optimizer", ...)
   ```

2. **단계적 접근**: 복잡한 작업은 분석 → 구현 → 검증 순서로

   ```
   issue-summary (분석) → ai-systems-engineer (구현) → test-automation-specialist (검증)
   ```

3. **MCP 서버 활용**: 각 에이전트의 추천 MCP를 프롬프트에 명시하면 더 효과적

4. **문서화**: `doc-structure-guardian`은 주요 변경사항 후 자동 실행 권장

### 🎯 자주 사용하는 에이전트 조합 패턴

#### 1. 풀스택 기능 개발

```
central-supervisor (전체 조율)
├─ database-administrator (DB 스키마)
├─ ai-systems-engineer (API 개발)
├─ ux-performance-optimizer (프론트엔드)
└─ test-automation-specialist (테스트)
```

#### 2. 긴급 버그 수정

```
issue-summary (문제 분석)
└─ gemini-cli-collaborator (2차 의견)
   └─ code-review-specialist (코드 검토)
```

#### 3. 성능 최적화

```
ux-performance-optimizer (프론트 분석)
├─ database-administrator (쿼리 최적화)
└─ ai-systems-engineer (캐싱 구현)
```

### 📄 마밴정리: 언제 어떤 에이전트를 사용해야 하나요?

| 상황               | 추천 에이전트                | 이유                    |
| ------------------ | ---------------------------- | ----------------------- |
| 복잡한 멀티 태스크 | `central-supervisor`         | 여러 에이전트 조율 필요 |
| 코드 품질 개선     | `code-review-specialist`     | DRY/SOLID 위반 감지     |
| 성능 문제          | `ux-performance-optimizer`   | Core Web Vitals 최적화  |
| DB 스키마 설계     | `database-administrator`     | RLS 정책, 인덱스 최적화 |
| 테스트 자동화      | `test-automation-specialist` | E2E/단위 테스트         |
| AI 시스템 문제     | `ai-systems-engineer`        | NLP/RAG 최적화          |
| 긴급 장애 대응     | `issue-summary`              | 24/7 모니터링           |
| MCP 설정           | `mcp-server-admin`           | MCP 서버 통합 관리      |
| 문서 정리          | `doc-structure-guardian`     | JBGE 원칙 적용          |
| 디버깅 도움        | `gemini-cli-collaborator`    | 2차 의견, AI 협업       |

상세 가이드: `docs/sub-agents-mcp-mapping-guide.md`

### 📌 서브 에이전트 자동 실행 가이드

#### 1. 개발 워크플로우별 자동 실행

**코드 작성 완료 시 - 품질 검사 자동화**

```python
Task(
  subagent_type="code-review-specialist",
  description="코드 품질 검사 및 개선",
  prompt="""다음 작업을 수행해주세요:
  1. npm run lint:fix 실행 및 남은 이슈 분석
  2. npm run type-check 실행 및 타입 에러 수정
  3. npm run validate:all 종합 검증
  4. DRY/SOLID 원칙 위반 사항 검토
  5. 보안 취약점 스캔
  결과를 종합하여 개선이 필요한 부분을 자동 수정해주세요."""
)
```

**커밋 전 - 테스트 자동화**

```python
Task(
  subagent_type="test-automation-specialist",
  description="테스트 실행 및 커버리지 확인",
  prompt="모든 테스트를 실행하고 실패하는 테스트를 수정하세요. 커버리지가 70% 미만인 파일에 대해 테스트를 추가해주세요."
)
```

**배포 전 - 전체 검증**

```python
Task(
  subagent_type="central-supervisor",
  description="배포 전 종합 검증",
  prompt="배포 전 모든 검증 작업을 수행하세요: 타입 체크, 린트, 테스트, 빌드, 보안 스캔"
)
```

#### 2. 문제 상황별 자동 대응

**성능 저하 발생 시**

```python
# 병렬 실행으로 빠른 분석
Task(subagent_type="ux-performance-optimizer",
     prompt="Lighthouse 분석 및 프론트엔드 병목 지점 파악")
Task(subagent_type="database-administrator",
     prompt="슬로우 쿼리 분석 및 인덱스 최적화 방안 제시")
```

**시스템 장애 시**

```python
# 단계적 분석
Task(subagent_type="issue-summary",
     prompt="최근 30분간 로그 분석 및 에러 패턴 파악")
Task(subagent_type="gemini-cli-collaborator",
     prompt="issue-summary 결과를 바탕으로 근본 원인 분석")
```

**AI 기능 타임아웃**

```python
Task(subagent_type="ai-systems-engineer",
     prompt="SimplifiedQueryEngine 타임아웃 원인 분석 및 폴백 전략 수립")
```

#### 3. 정기 유지보수 자동화

**주간 작업**

- 월요일: `doc-structure-guardian` - 30일 미사용 문서 아카이브
- 수요일: `code-review-specialist` - 누적된 기술 부채 스캔
- 금요일: `test-automation-specialist` - 전체 테스트 스위트 실행

**월간 작업**

- 매월 1일: `database-administrator` - 쿼리 성능 분석 및 최적화
- 매월 15일: `ux-performance-optimizer` - 성능 트렌드 분석

**분기별 작업**

- `central-supervisor` 주도로 전체 시스템 점검

### 🤖 서브 에이전트 체이닝 고급 패턴

#### 1. 자동 에스컬레이션 체인

```
code-review-specialist (문제 발견)
  └─ 심각도 HIGH 이상 시 → issue-summary (영향 분석)
      └─ 시스템 전체 영향 시 → central-supervisor (대응 조율)
```

#### 2. 지능형 문서화 체인

```
code-review-specialist (코드 변경 감지)
  └─ 주요 변경 시 → doc-structure-guardian (문서 업데이트)
      └─ API 변경 시 → ai-systems-engineer (API 문서 생성)
```

#### 3. 프로액티브 최적화 체인

```
issue-summary (성능 저하 감지)
  ├─ 프론트엔드 이슈 → ux-performance-optimizer
  ├─ 백엔드 이슈 → database-administrator
  └─ AI 이슈 → ai-systems-engineer
```

### 💡 프로액티브 서브 에이전트 활용

#### 자동 트리거 조건 설정

**1. 파일 저장 시 자동 실행**

- `*.tsx, *.ts` 저장 → `code-review-specialist` (린트/타입 체크)
- `*.test.ts` 저장 → `test-automation-specialist` (관련 테스트 실행)
- `*.sql` 저장 → `database-administrator` (쿼리 검증)

**2. Git 이벤트 기반 실행**

- PR 생성 → `code-review-specialist` (자동 코드 리뷰)
- 커밋 전 → `test-automation-specialist` (pre-commit 테스트)
- 머지 후 → `doc-structure-guardian` (문서 동기화)

**3. 시스템 이벤트 기반 실행**

- 에러 로그 급증 → `issue-summary` (자동 분석 시작)
- API 응답 시간 증가 → `ai-systems-engineer` (병목 분석)
- 메모리 사용량 급증 → `database-administrator` (쿼리 최적화)

**4. 시간 기반 자동 실행**

- 매일 오전 9시: `issue-summary` (야간 이슈 요약)
- 매주 월요일: `code-review-specialist` (주간 코드 품질 리포트)
- 매월 1일: `central-supervisor` (월간 시스템 헬스 체크)

### 🎯 서브 에이전트 사용 모범 사례

1. **명확한 프롬프트 작성**: 구체적인 작업 지시와 예상 결과 명시
2. **병렬 실행 활용**: 독립적인 작업은 동시에 여러 에이전트 실행
3. **결과 검증**: 에이전트 작업 완료 후 항상 결과 확인
4. **피드백 루프**: 에이전트 결과를 다음 에이전트에 전달하여 개선
5. **비용 최적화**: 무료 티어 한계 고려하여 필수 작업만 자동화

### 🛡️ 서브 에이전트 에러 해결 (2025-01-27 업데이트)

#### 필수 환경변수 설정

```bash
# .env.local에 추가 필수
GITHUB_TOKEN=ghp_your_personal_access_token
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=sbp_your_access_token
TAVILY_API_KEY=tvly-your_api_key
```

#### 개선된 실행 방법

```typescript
// AgentHelper 사용 (권장)
import { AgentHelper } from '@/services/agents/agent-helper';

const result = await AgentHelper.executeWithAgent(
  'ai-systems-engineer',
  'operation-name',
  async () => {
    // 실제 작업 로직
  },
  {
    validateMCP: true, // MCP 검증
    includeContext: true, // 컨텍스트 포함
    trackUsage: true, // 사용 추적
    enableRecovery: true, // 에러 복구
  }
);
```

#### 상태 확인

```bash
# 서브 에이전트 상태 API
GET /api/agents/health

# 개별 에이전트 디버그
const debug = await AgentHelper.debugAgent('database-administrator');
```

상세 가이드: `docs/sub-agents-error-analysis-solution.md`

## 🎯 실전 검증된 서브 에이전트 활용 전략

### ✅ 권장 설정 (2025년 검증 완료)

#### 1. Tools 필드 설정 전략
```yaml
# ❌ 기존 방식 (비추천)
tools: ["mcp__filesystem__*", "mcp__github__*", ...]

# ✅ 새로운 방식 (추천)
# tools 필드 생략 → 모든 도구 자동 상속
# MCP 도구는 description에 권장사항으로 명시

description: |
  AI 시스템 전문가입니다.
  권장 MCP 도구: mcp__memory__*, mcp__sequential-thinking__*
```

#### 2. MCP 도구 활용 패턴
```bash
# ✅ 효과적인 MCP 활용 방법
1. 서브 에이전트 프롬프트에 "MCP 도구 사용 권장" 명시
2. 구체적인 MCP 도구명 제시 (mcp__supabase__list_tables 등)
3. 단계별 MCP 호출 가이드 제공
4. 전제조건 확인 (serena 활성화, context7 라이브러리 검색)
```

#### 3. 에이전트 조합 최적화
```yaml
# 성능 개선 프로젝트 표준 패턴
1단계: central-supervisor (전체 계획 수립)
2단계: 병렬 실행 (independent tasks)
  - issue-summary (현황 분석)
  - database-administrator (DB 최적화)  
  - ux-performance-optimizer (프론트 개선)
3단계: test-automation-specialist (검증)
4단계: doc-structure-guardian (문서화)
```

### 🚨 피해야 할 실수들

1. **tools 필드 과도한 제한**: 필요한 도구를 차단할 수 있음
2. **MCP 도구 강제 지정**: 서브 에이전트가 접근 실패할 수 있음  
3. **병렬 처리 무시**: 독립적 작업을 순차적으로 처리하여 시간 낭비
4. **전문성 무시**: central-supervisor로 모든 것을 처리하려는 시도
5. **결과 검증 생략**: 에이전트 작업 완료 후 결과 확인 필수

### 🎯 상황별 최적 에이전트 선택

| 작업 유형 | 1순위 에이전트 | 2순위 에이전트 | 병렬 처리 가능 |
|-----------|----------------|----------------|----------------|
| **성능 문제** | ux-performance-optimizer | database-administrator | ✅ |
| **타입 에러** | code-review-specialist | - | ❌ |
| **AI 시스템** | ai-systems-engineer | gemini-cli-collaborator | ✅ |
| **테스트 작성** | test-automation-specialist | - | ❌ |
| **문서 정리** | doc-structure-guardian | - | ✅ |
| **MCP 설정** | mcp-server-admin | - | ✅ |
| **긴급 장애** | issue-summary | central-supervisor | ❌ |
| **복합 작업** | central-supervisor | - | N/A |

### 💡 실전 팁

#### 효과적인 프롬프트 작성
```bash
# ✅ 좋은 예시
Task(
  subagent_type="database-administrator",
  prompt="""Supabase 데이터베이스를 최적화해주세요:
  
  1. mcp__supabase__list_tables로 테이블 목록 조회
  2. 각 테이블별 사용량 분석  
  3. 느린 쿼리 식별 및 인덱스 제안
  4. mcp__supabase__apply_migration으로 최적화 적용
  
  결과물: SQL 스크립트 + 성능 분석 리포트"""
)

# ❌ 나쁜 예시  
Task(
  subagent_type="database-administrator",
  prompt="DB 최적화 해줘"
)
```

#### 병렬 처리 활용
```bash
# ✅ 효율적인 병렬 처리
# 3개 에이전트 동시 실행으로 시간 단축
Task(subagent_type="issue-summary", ...)     # 문제 분석
Task(subagent_type="ai-systems-engineer", ...)  # AI 최적화  
Task(subagent_type="ux-performance-optimizer", ...)  # UI 개선
```

#### MCP 활용 극대화
```bash
# database-administrator, issue-summary: mcp__supabase__* 직접 도구 유지
# 나머지 에이전트: description에 MCP 권장사항 명시
# → 유연성과 전문성의 균형
```

## 💡 사용 팁

### Claude Code 사용량 모니터링

```bash
npx ccusage@latest blocks --live    # 실시간 대시보드
npm run ccusage:daily               # 일별 사용량
```

### 메모리 관리

- 개발: 8GB (`--max-old-space-size=8192`)
- 프로덕션: 4GB (`--max-old-space-size=4096`)

### 성능 최적화

- Vercel 무료 티어 최적화
- Edge Runtime 활용
- 캐싱 전략 구현

## 🔍 트러블슈팅

### 파일 읽기/쓰기 에러

- **"Error: File has not been read yet. Read it first before writing to it"**
  - 원인: Claude Code는 기존 파일 수정 시 반드시 Read 도구로 먼저 읽어야 함
  - 해결: Write/Edit 전에 항상 Read 도구 사용
  - 주의: Task 도구나 서브 에이전트도 동일한 규칙 적용
  - 팁: 서브 에이전트가 파일 수정 시에도 main 에이전트와 동일한 컨텍스트 필요

### 일반 문제

- **메모리 에러**: package.json의 Node.js 메모리 제한 확인
- **AI 타임아웃**: API 키와 네트워크 연결 확인
- **빌드 실패**: `npm run type-check`로 TypeScript 이슈 확인

## 📚 관련 문서

### Claude 서브 에이전트

- [Claude Sub-agents 공식 문서](https://docs.anthropic.com/en/docs/claude-code/sub-agents) - Claude의 서브 에이전트 기능에 대한 공식 문서입니다. 서브 에이전트를 활용한 협업 워크플로우와 설정 방법을 확인하세요.
- [Claude MCP (Model Control Protocol) 문서](https://docs.anthropic.com/en/docs/claude-code/mcp) - Claude의 MCP 기능에 대한 공식 문서입니다. MCP를 통한 모델 제어 및 확장 방법을 확인하세요.

### 기타 문서

- **MCP 가이드**: `docs/claude-code-mcp-setup-2025.md`
- **AI 시스템**: `docs/ai-system-unified-guide.md`
- **보안 가이드**: `docs/security-complete-guide.md`
- **개발 도구**: `docs/development-tools.md`
- **서브 에이전트 에러 해결**: `docs/sub-agents-error-analysis-solution.md`
- **서브 에이전트 매핑 가이드**: `docs/sub-agents-mcp-mapping-guide.md`
- **파일 읽기/쓰기 패턴**: `docs/claude-code-file-rw-pattern.md`

---

💡 **핵심 원칙**: 간결성, 재사용성, 타입 안전성, 무료 티어 최적화
