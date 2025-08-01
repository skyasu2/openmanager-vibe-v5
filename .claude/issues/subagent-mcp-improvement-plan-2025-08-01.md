# 서브에이전트 및 MCP 시스템 개선 계획

**생성일**: 2025-08-01
**작성자**: Claude Code

## 🚨 식별된 주요 문제점

### 1. MCP 도구 과다 사용

- **filesystem**: 11개 에이전트 사용 (전체의 65%)
- **sequential-thinking**: 9개 에이전트 사용 (전체의 53%)
- **context7**: 9개 에이전트 사용 (전체의 53%)
- **영향**: 성능 저하, 토큰 낭비, 역할 중복

### 2. 문서화 불일치

- CLAUDE.md와 실제 MCP 사용 현황 불일치 (50% 불일치)
- 새로 추가된 에이전트들의 MCP 사용 미문서화
- MCP 사용 근거 및 가이드라인 부재

### 3. 역할 경계 모호

- 여러 에이전트가 동일한 MCP 도구 사용
- 전문성 희석 및 책임 소재 불명확
- 중복 작업 가능성 증가

### 4. 고빈도 에이전트의 비효율성

- code-review-specialist: 매 코드 변경마다 실행되나 과도한 MCP 사용
- test-automation-specialist: 높은 실행 빈도에 비해 MCP 최적화 부족

## 💡 개선안

### Phase 1: 즉시 실행 가능한 개선사항 (1-2일)

#### 1.1 MCP 도구 사용 최적화

**A. filesystem 사용 제한**

```yaml
# 유지 (5개)
- mcp-server-admin # MCP 인프라 관리 필수
- documentation-manager # 파일 구조 관리 필수
- structure-refactor-agent # 대규모 파일 작업
- git-cicd-specialist # Git 파일 작업
- backend-gcp-specialist # 배포 파일 관리

# 제거 (6개)
- code-review-specialist # Read/Grep으로 대체
- test-first-developer # Write로 대체
- quality-control-checker # Read/Grep으로 대체
- security-auditor # Grep으로 대체
- debugger-specialist # Read로 대체
- test-automation-specialist # 테스트 파일만 Write
```

**B. sequential-thinking 사용 제한**

```yaml
# 유지 (3개)
- central-supervisor # 복잡한 조율 필수
- debugger-specialist # 근본 원인 분석
- mcp-server-admin # 복잡한 문제 해결

# 제거 (6개)
- vercel-platform-specialist # 구조화된 분석으로 충분
- ux-performance-optimizer # 메트릭 기반 분석
- structure-refactor-agent # 패턴 매칭으로 충분
- code-review-specialist # 규칙 기반 검사
- test-first-developer # 템플릿 기반
- backend-gcp-specialist # 표준 패턴 적용
- quality-control-checker # 체크리스트 기반
```

**C. context7 사용 최적화**

```yaml
# 유지 (6개 - CLAUDE.md 기준)
- documentation-manager
- test-automation-specialist
- ux-performance-optimizer
- backend-gcp-specialist
- database-administrator
- ai-systems-engineer

# 제거 (3개)
- git-cicd-specialist # 내부 문서로 충분
- security-auditor # 기본 보안 체크
- debugger-specialist # 에러 패턴 분석
```

#### 1.2 에이전트별 설정 파일 업데이트

각 에이전트의 tools 섹션을 최적화된 버전으로 수정:

```yaml
# code-review-specialist.md
tools: Bash, Read, Grep, mcp__serena__*

# test-first-developer.md
tools: Read, Write, Bash, mcp__memory__*

# quality-control-checker.md
tools: Read, Grep, Bash

# structure-refactor-agent.md
tools: Read, Glob, Grep, Write, Bash, mcp__filesystem__*, mcp__serena__*, mcp__memory__*
```

### Phase 2: 단기 개선사항 (1주)

#### 2.1 CLAUDE.md 업데이트

MCP 서버별 활용 에이전트 목록을 실제 최적화된 현황으로 업데이트:

```markdown
### MCP 서버별 활용 에이전트 목록 (최적화 버전)

| MCP 서버              | 활용 에이전트                                                                                                                                         | 주요 용도           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `filesystem`          | 5개: mcp-server-admin, documentation-manager, structure-refactor-agent, git-cicd-specialist, backend-gcp-specialist                                   | 인프라 및 구조 관리 |
| `memory`              | 4개: mcp-server-admin, test-automation-specialist, ai-systems-engineer, gemini-cli-collaborator                                                       | 지식 저장 및 공유   |
| `github`              | 5개: documentation-manager, security-auditor, debugger-specialist, backend-gcp-specialist, git-cicd-specialist                                        | 저장소 작업         |
| `supabase`            | 1개: database-administrator                                                                                                                           | DB 전담 관리        |
| `context7`            | 6개: documentation-manager, test-automation-specialist, ux-performance-optimizer, backend-gcp-specialist, database-administrator, ai-systems-engineer | 문서 검색           |
| `tavily-mcp`          | 3개: documentation-manager, vercel-platform-specialist, backend-gcp-specialist                                                                        | 웹 검색             |
| `sequential-thinking` | 3개: central-supervisor, debugger-specialist, mcp-server-admin                                                                                        | 복잡한 문제 해결    |
| `playwright`          | 2개: test-automation-specialist, ux-performance-optimizer                                                                                             | 브라우저 자동화     |
| `serena`              | 5개: test-automation-specialist, ux-performance-optimizer, debugger-specialist, ai-systems-engineer, code-review-specialist                           | 코드 분석           |
| `time`                | 4개: vercel-platform-specialist, documentation-manager, debugger-specialist, database-administrator                                                   | 시간 관리           |
```

#### 2.2 사용 가이드라인 문서 작성

각 에이전트의 MCP 사용 근거와 모범 사례를 담은 가이드 작성:

```markdown
# 서브에이전트 MCP 사용 가이드라인

## 원칙

1. 핵심 역할에 필요한 MCP만 사용
2. 기본 도구(Read, Write, Grep)로 가능하면 MCP 사용 자제
3. 고빈도 에이전트는 최소한의 MCP만 사용

## 에이전트별 가이드

### code-review-specialist

- serena만 사용 (고급 코드 분석)
- filesystem 제거 (Read/Grep으로 충분)
- sequential-thinking 제거 (패턴 매칭으로 충분)
  ...
```

### Phase 3: 중장기 개선사항 (2-4주)

#### 3.1 성능 모니터링 시스템 구축

```typescript
// 에이전트 실행 시간 및 MCP 사용량 추적
interface AgentMetrics {
  agentName: string;
  executionTime: number;
  mcpCallCount: Map<string, number>;
  tokenUsage: number;
  successRate: number;
}
```

#### 3.2 동적 MCP 할당 시스템

작업 유형에 따라 동적으로 MCP 도구 할당:

```typescript
// 작업 복잡도에 따른 동적 할당
function assignMCPTools(
  agent: string,
  taskComplexity: 'low' | 'medium' | 'high'
) {
  const baseTool = getBaseTools(agent);

  if (taskComplexity === 'high') {
    return [...baseTool, ...getAdvancedTools(agent)];
  }

  return baseTool;
}
```

#### 3.3 에이전트 통합 고려

중복 기능이 많은 에이전트 통합:

```yaml
# 통합 후보
1. code-review-specialist + quality-control-checker
→ code-quality-specialist

2. test-automation-specialist + test-first-developer
→ test-engineering-specialist

3. documentation-manager (research + structure 통합 완료)
```

## 📊 예상 효과

### 정량적 효과

- MCP 연결 수: 40% 감소 (평균 6개 → 3.6개)
- 토큰 사용량: 30% 감소 (sequential-thinking 최적화)
- 실행 시간: 20% 단축 (경량화된 에이전트)

### 정성적 효과

- 역할 명확화로 유지보수성 향상
- 문서와 실제 구현의 일치
- 디버깅 및 문제 해결 용이성 증가

## 🚀 실행 계획

### Week 1

- [ ] Phase 1 구현 (MCP 최적화)
- [ ] 에이전트 설정 파일 업데이트
- [ ] 초기 테스트 및 검증

### Week 2

- [ ] CLAUDE.md 업데이트
- [ ] 가이드라인 문서 작성
- [ ] 성능 기준선 측정

### Week 3-4

- [ ] 모니터링 시스템 구축
- [ ] 동적 할당 시스템 프로토타입
- [ ] 에이전트 통합 검토

## ✅ 성공 지표

1. 모든 에이전트의 MCP 사용이 문서화와 일치
2. 고빈도 에이전트의 실행 시간 20% 단축
3. 중복 MCP 사용 50% 감소
4. 개발자 피드백 긍정적 (역할 명확성)
