# 🤖 서브 에이전트 종합 가이드

> 최종 업데이트: 2025-08-13 08:30 KST  
> 버전: v5.67.13 (계층 구조 명확화)  
> 총 에이전트: 18개  
> MCP 서버: 11개 (모두 연결 ✅)  
> **계층 구조**: Claude Code → central-supervisor → 전문 에이전트들

## 📋 목차

1. 계층 구조 개요
2. MCP 서버 현황
3. 서브 에이전트 목록
4. 에이전트별 상세 가이드
5. MCP 활용 패턴
6. 협업 프로토콜
7. 테스트 현황
8. 베스트 프랙티스

## 🎯 계층 구조 개요

### 명확한 3계층 구조

1. **Claude Code (최상위 통제자)**
   - 모든 개발 작업의 메인 통제자
   - 직접 작업 수행 또는 서브에이전트 지시
   - 최종 결과 통합 및 품질 보증

2. **central-supervisor (서브 오케스트레이터)**
   - Claude Code의 지시를 받아 복잡한 작업을 분해
   - 전문 에이전트들에게 작업 분배 및 조율
   - 진행 상황 모니터링 및 Claude Code에 보고

3. **전문 에이전트들 (실행자)**
   - 각자의 전문 영역에서 구체적 작업 수행
   - central-supervisor 또는 Claude Code의 지시 실행

### 서브 에이전트 특징

- **전문 영역**: 특정 기술 도메인에 특화
- **MCP 통합**: 관련 MCP 서버를 활용하여 실제 작업 수행
- **계층적 협업**: Claude Code의 지시체계 하에서 작업

### 사용 방법

```typescript
// Task 도구를 사용하여 서브 에이전트 호출
Task({
  subagent_type: 'database-administrator',
  description: 'DB 최적화',
  prompt: 'Supabase 쿼리 성능을 분석하고 개선점을 제안해주세요',
});
```

## 🔌 MCP 서버 현황

| MCP 서버            | 상태 | 용도               | 주요 활용 에이전트                                   |
| ------------------- | ---- | ------------------ | ---------------------------------------------------- |
| filesystem          | ✅   | 파일 시스템 작업   | 모든 에이전트                                        |
| memory              | ✅   | 지식 그래프 관리   | ai-systems-engineer, central-supervisor              |
| github              | ✅   | GitHub 저장소 관리 | git-cicd-specialist, documentation-manager           |
| supabase            | ✅   | PostgreSQL DB      | database-administrator                               |
| sequential-thinking | ✅   | 복잡한 문제 해결   | debugger-specialist, ai-systems-engineer             |
| playwright          | ✅   | 브라우저 자동화    | test-automation-specialist, ux-performance-optimizer |
| context7            | ✅   | 라이브러리 문서    | ai-systems-engineer, documentation-manager           |
| shadcn-ui           | ✅   | UI 컴포넌트        | ux-performance-optimizer                             |
| time                | ✅   | 시간/시간대        | dev-environment-manager, database-administrator      |
| tavily-mcp          | ✅   | 웹 검색            | documentation-manager, vercel-platform-specialist    |
| serena              | ✅   | 코드 분석 (LSP)    | code-review-specialist, structure-refactor-agent     |

## 📁 서브 에이전트 목록

### 🔴 Phase 1: 핵심 에이전트 (4개)

| 에이전트                   | 역할                          | 주요 MCP                    | 테스트 상태    |
| -------------------------- | ----------------------------- | --------------------------- | -------------- |
| database-administrator     | Supabase PostgreSQL 전문 관리 | supabase, time              | 🟡 부분 테스트 |
| mcp-server-admin           | MCP 인프라 관리 및 복구       | filesystem, memory          | 🟡 부분 테스트 |
| test-automation-specialist | 테스트 자동화 및 커버리지     | playwright, serena          | 🟡 부분 테스트 |
| debugger-specialist        | 디버깅 및 근본 원인 분석      | sequential-thinking, serena | 🟡 부분 테스트 |

### 🟠 Phase 2: 협업 에이전트 (3개)

| 에이전트              | 역할                                     | 주요 MCP                       | 테스트 상태 |
| --------------------- | ---------------------------------------- | ------------------------------ | ----------- |
| central-supervisor    | Claude Code 지시하의 서브 오케스트레이터 | 모든 MCP                       | ⚪ 미테스트 |
| git-cicd-specialist   | Git 워크플로우 및 CI/CD                  | github, filesystem             | ⚪ 미테스트 |
| documentation-manager | 문서 관리 및 JBGE 원칙                   | filesystem, github, tavily-mcp | ⚪ 미테스트 |

### 🟡 Phase 3: 특화 에이전트 (11개)

| 에이전트                   | 역할                  | 주요 MCP                     | 테스트 상태    |
| -------------------------- | --------------------- | ---------------------------- | -------------- |
| gcp-vm-specialist          | GCP VM 백엔드 관리    | filesystem, memory, time     | ⚪ 미테스트    |
| ai-systems-engineer        | AI 시스템 최적화      | memory, serena, context7     | ⚪ 미테스트    |
| security-auditor           | 보안 검사 자동화      | filesystem, github           | ⚪ 미테스트    |
| code-review-specialist     | 코드 품질 검토        | serena, filesystem           | ⚪ 미테스트    |
| quality-control-checker    | 프로젝트 규칙 감시    | filesystem                   | ⚪ 미테스트    |
| structure-refactor-agent   | 구조 설계 및 리팩토링 | serena, filesystem, memory   | ⚪ 미테스트    |
| ux-performance-optimizer   | 프론트엔드 성능       | playwright, serena, context7 | ✅ 테스트 완료 |
| vercel-platform-specialist | Vercel 플랫폼 전문    | tavily-mcp, time             | ⚪ 미테스트    |
| dev-environment-manager    | 개발 환경 관리        | filesystem, memory, time     | ⚪ 미테스트    |
| gemini-cli-collaborator    | Gemini CLI 협업       | filesystem, memory           | ⚪ 미테스트    |
| qwen-cli-collaborator      | Qwen Code 협업        | filesystem, memory           | ⚪ 미테스트    |

## 📚 에이전트별 상세 가이드

### 1. database-administrator

전문 영역: Supabase PostgreSQL 성능 최적화

활성화 조건:

- mcp**supabase**\* 도구 사용 감지
- 스키마 파일 (_schema_.sql, _migration_.sql) 수정
- API 응답 시간 >500ms
- 쿼리 실행 시간 >100ms
- RLS 정책 에러
- pgvector 성능 이슈

주요 기능:

```sql
-- 느린 쿼리 분석
EXPLAIN ANALYZE SELECT * FROM large_table;

-- 인덱스 최적화
CREATE INDEX idx_performance ON table(column)
WHERE condition;

-- RLS 정책 설계
CREATE POLICY "Users can view own data"
ON user_data FOR SELECT
USING (auth.uid() = user_id);
```

### 2. mcp-server-admin

전문 영역: MCP 서버 상태 관리 및 자동 복구

활성화 조건:

- MCP 도구 에러 감지
- claude mcp 명령 실패
- 서버 연결 끊김 감지

주요 기능:

```bash
# MCP 서버 상태 확인
claude mcp list

# 서버 재시작
claude api restart

# 설정 복구
claude mcp add <서버명> <명령어>
```

### 3. test-automation-specialist

전문 영역: Jest/Vitest/Playwright 테스트 자동화

활성화 조건:

- npm test 명령 실패
- 커버리지 80% 미만
- .test.ts, .spec.ts 파일 수정
- 새 컴포넌트/함수 생성 시 테스트 없음

주요 기능:

```typescript
// 자동 테스트 생성
describe('Component', () => {
  it('should render correctly', async () => {
    // Playwright로 E2E 테스트
    await page.goto('/');
    await expect(page).toHaveTitle(/OpenManager/);
  });
});
```

### 4. debugger-specialist

전문 영역: 체계적 디버깅 및 근본 원인 분석

활성화 조건:

- 스택 트레이스 발견
- 에러 로그 감지
- API 타임아웃
- 런타임 예외
- TypeScript 컴파일 에러

5단계 프로세스:

1. Superficial Analysis (표면 분석)
2. Root Cause Analysis (근본 원인)
3. Best Practices Research (모범 사례)
4. Solution Design (해결책 설계)
5. Verification (검증)

## 🔄 MCP 활용 패턴

### 패턴 1: 데이터 영속성 (Memory MCP)

```typescript
// 에이전트 간 정보 공유
mcp__memory__create_entities([
  {
    name: 'OptimizationResult',
    entityType: 'Analysis',
    observations: ['성능 30% 개선', '메모리 사용량 감소'],
  },
]);

// 다른 에이전트에서 조회
const results = await mcp__memory__search_nodes({
  query: 'OptimizationResult',
});
```

### 패턴 2: 웹 리서치 (Tavily MCP)

```typescript
// 최신 문서 검색
const docs =
  (await mcp__tavily) -
  mcp__tavily_search({
    query: 'Next.js 15 새로운 기능',
    max_results: 5,
  });

// 콘텐츠 추출
const content =
  (await mcp__tavily) -
  mcp__tavily_extract({
    urls: ['https://nextjs.org/docs'],
  });
```

### 패턴 3: 코드 분석 (Serena MCP)

```python
# 심볼 검색
symbols = mcp__serena__find_symbol(
    name_path="MyComponent",
    include_body=True,
    depth=1
)

# 참조 찾기
references = mcp__serena__find_referencing_symbols(
    name_path="MyComponent",
    relative_path="src/components/MyComponent.tsx"
)
```

## 🤝 협업 프로토콜

### 순차 실행 패턴

```typescript
// 1. 구조 분석
Task({ subagent_type: 'structure-refactor-agent', prompt: '중복 코드 검출' });

// 2. 코드 검토
Task({ subagent_type: 'code-review-specialist', prompt: '개선된 코드 검토' });

// 3. 규칙 확인
Task({
  subagent_type: 'quality-control-checker',
  prompt: 'CLAUDE.md 규칙 준수 확인',
});
```

### 병렬 실행 패턴

```typescript
// 독립적인 작업은 동시 실행
Promise.all([
  Task({ subagent_type: 'database-administrator', prompt: 'DB 최적화' }),
  Task({
    subagent_type: 'ux-performance-optimizer',
    prompt: '프론트엔드 성능 개선',
  }),
  Task({ subagent_type: 'security-auditor', prompt: '보안 취약점 검사' }),
]);
```

### Central Supervisor 패턴

```typescript
// 복잡한 작업은 central-supervisor가 조율
Task({
  subagent_type: 'central-supervisor',
  prompt: `다음 복잡한 작업을 조율해주세요:
    1. 새로운 인증 시스템 구현
    2. 데이터베이스 마이그레이션
    3. API 엔드포인트 생성
    4. 테스트 작성
    5. 문서 업데이트`,
});
```

## 🧪 테스트 현황

### 테스트 완료 (1개)

- ✅ ux-performance-optimizer: 2025-08-03 테스트 완료

### 부분 테스트 (4개)

- 🟡 database-administrator: MCP 연결 확인
- 🟡 mcp-server-admin: 기본 기능 확인
- 🟡 test-automation-specialist: 정의 파일 확인
- 🟡 debugger-specialist: 정의 파일 확인

### 미테스트 (13개)

- ⚪ 나머지 모든 에이전트

### 테스트 스크립트

```bash
# 전체 에이전트 테스트
bash .claude/test-all-agents.sh

# 개별 에이전트 테스트
claude --print Task \
  --subagent_type "database-administrator" \
  --prompt "테스트 작업" \
  --description "에이전트 테스트"
```

## 💡 베스트 프랙티스

### 1. 에이전트 선택 가이드

| 상황          | 추천 에이전트              | 이유                   |
| ------------- | -------------------------- | ---------------------- |
| 느린 API 응답 | database-administrator     | DB 쿼리 최적화 전문    |
| 테스트 실패   | test-automation-specialist | 테스트 작성/수정 전문  |
| 복잡한 버그   | debugger-specialist        | 체계적 디버깅 프로세스 |
| 다중 작업     | central-supervisor         | 작업 조율 및 분배      |
| 코드 품질     | code-review-specialist     | 코드 분석 전문         |

### 2. MCP 에러 처리

```typescript
try {
  // MCP 도구 호출
  const result = await mcp__supabase__query('SELECT ...');
} catch (error) {
  // 폴백 전략
  console.error('MCP 에러:', error);

  // mcp-server-admin 호출
  Task({
    subagent_type: 'mcp-server-admin',
    prompt: `MCP 에러 복구: ${error.message}`,
  });
}
```

### 3. 성능 최적화 팁

- 캐싱: Memory MCP로 중간 결과 저장
- 병렬화: 독립적인 작업은 동시 실행
- 재사용: 이전 분석 결과 활용
- 최소화: 필요한 MCP만 사용

### 4. 문서화 규칙

- 모든 에이전트 작업은 Memory MCP에 기록
- 중요한 결정은 문서로 남김
- 테스트 결과는 `.claude/test-results/`에 저장

## 📊 성능 메트릭

| 메트릭             | 목표 | 현재  | 상태 |
| ------------------ | ---- | ----- | ---- |
| MCP 서버 가용성    | 100% | 100%  | ✅   |
| 에이전트 응답 시간 | <5초 | 3.2초 | ✅   |
| 테스트 커버리지    | 100% | 5.5%  | ❌   |
| 문서화 완성도      | 100% | 80%   | 🟡   |

## 🔗 관련 문서

- [MCP 개발 가이드](/docs/mcp-development-guide-2025.md)
- [서브 에이전트 매핑 가이드](/docs/sub-agents-mcp-mapping-guide.md)
- [CLAUDE.md](/CLAUDE.md) - 프로젝트 전체 가이드
- [테스트 스크립트](/.claude/test-all-agents.sh)

---

작성자: Claude Code + skyasu  
최종 검토: 2025-08-12  
다음 업데이트: 모든 에이전트 테스트 완료 후
