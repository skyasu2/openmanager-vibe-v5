# AI CLI 협업 전략 가이드

📅 **작성일**: 2025년 8월 12일  
🎯 **목적**: Gemini CLI를 서브 에이전트를 통한 체계적 활용

## 🔄 협업 트리거 조건

### 1. 제3자 시선이 필요할 때 (Second Opinion)

#### 상황 예시

- 복잡한 아키텍처 결정
- 성능 vs 가독성 트레이드오프
- 보안 구현 검증
- 디자인 패턴 선택

#### 활용 패턴

```typescript
// Claude Code가 먼저 구현
const implementation = await claude.implement(feature);

// 제3자 검증이 필요한 경우
if (needsSecondOpinion(implementation)) {
  // Gemini로 전체 영향 분석
  await Task({
    subagent_type: 'gemini-cli-collaborator',
    description: '구현 검증',
    prompt: `다음 구현을 검토하고 개선점 제안: ${implementation}`,
  });
}
```

### 2. 병렬 작업이 필요할 때 (Parallel Processing)

#### 상황 예시

- 대규모 리팩토링 + 성능 최적화
- 다중 모듈 동시 개발
- 테스트 작성 + 문서화 동시 진행

#### 활용 패턴

```typescript
// 병렬 작업 실행
await Promise.all([
  // Claude: 메인 기능 구현
  claude.implementFeature(),

  // Gemini: 독립적인 관련 기능 개발
  Task({
    subagent_type: 'gemini-cli-collaborator',
    description: '관련 기능 개발',
    prompt: 'gemini로 관련 API 엔드포인트 및 테스트 개발',
  }),
]);
```

### 3. 사용자 직접 요청 시 (Direct Request)

#### 명시적 요청 키워드

- "Gemini로 분석해줘"
- "2개 AI 모두 활용해서"

#### 활용 패턴

```typescript
// 사용자: "Gemini로 전체 코드베이스 중복 제거해줘"
await Task({
  subagent_type: 'gemini-cli-collaborator',
  description: '중복 제거',
  prompt: 'gemini "전체 코드베이스에서 중복 패턴 찾고 제거 방안 제시"',
});
```

## 📋 서브 에이전트 활용 매트릭스

| 상황           | 서브 에이전트           | CLI 명령   | 주요 역할                 |
| -------------- | ----------------------- | ---------- | ------------------------- |
| **제3자 검증** | gemini-cli-collaborator | `gemini`   | 완전한 개발 도구로서 검증 |
| **병렬 개발**  | gemini-cli-collaborator | `gemini`   | 독립적 기능 구현          |
| **직접 요청**  | 해당 서브 에이전트      | 명시된 CLI | 요청된 모든 작업          |

## 🎯 서브 에이전트 정의

### gemini-cli-collaborator

```yaml
name: gemini-cli-collaborator
description: Gemini CLI를 활용한 완전한 AI 개발 도구
tools: Bash, Read, Write, Edit, mcp__memory__*, mcp__filesystem__*
capabilities:
  - 완전한 기능 구현 및 개발
  - 1M 토큰 컨텍스트로 대규모 프로젝트 처리
  - 독립적인 모듈/서비스 개발
  - 테스트 코드 작성 및 디버깅
  - 아키텍처 설계 및 구현
  - 제3자 관점 전체 검증
```

## 🔄 협업 워크플로우

### Step 1: 트리거 감지

```typescript
function shouldUseCLICollaboration(context: Context): boolean {
  return (
    context.needsSecondOpinion || // 제3자 검증 필요
    context.canParallelize || // 병렬 처리 가능
    context.userRequested || // 사용자 요청
    context.complexityHigh || // 높은 복잡도
    context.largeScaleChange // 대규모 변경
  );
}
```

### Step 2: 서브 에이전트 선택

```typescript
function selectSubAgents(task: Task): SubAgent[] {
  const agents = [];

  if (task.needsLargeScaleAnalysis) {
    agents.push('gemini-cli-collaborator');
  }

  return agents;
}
```

### Step 3: 병렬 실행

```typescript
async function executeParallel(agents: SubAgent[], task: Task) {
  const results = await Promise.all(
    agents.map((agent) =>
      Task({
        subagent_type: agent,
        description: task.description,
        prompt: task.getPromptFor(agent),
      })
    )
  );

  return integrateResults(results);
}
```

## 📊 활용 시나리오

### 시나리오 1: 새 기능 구현 (병렬 개발)

1. **Claude**: 메인 기능 설계 및 인터페이스 정의
2. **병렬 실행**:
   - **Claude**: 프론트엔드 컴포넌트 개발
   - **Gemini** (서브 에이전트): 백엔드 API 개발
3. **Claude**: 통합 및 테스트

### 시나리오 2: 복잡한 시스템 구현

1. **Claude**: 시스템 아키텍처 설계
2. **병렬 실행**:
   - **Gemini** (서브 에이전트): 인프라 및 배포 설정
3. **Claude**: 시스템 통합 및 검증

### 시나리오 3: 대규모 프로젝트 개발

1. **Claude**: 프로젝트 구조 및 작업 분배
2. **병렬 실행**:
   - **Claude**: 메인 애플리케이션 개발
   - **Gemini** (서브 에이전트): 마이크로서비스 A 개발
3. **Claude**: 서비스 통합 및 E2E 테스트

## 💡 베스트 프랙티스

### DO ✅

- 서브 에이전트를 통한 체계적 활용
- 명확한 역할 분담
- 병렬 처리로 시간 단축
- 제3자 검증으로 품질 향상
- Memory MCP에 결과 저장

### DON'T ❌

- CLI 직접 호출 (서브 에이전트 우회)
- 무분별한 병렬 처리
- 단순 작업에 과도한 협업
- 결과 통합 없이 방치
- 토큰 한도 무시

## 🔍 모니터링

### 효율성 메트릭

```yaml
collaboration_metrics:
  second_opinion_accuracy: 85%+
  parallel_time_saving: 40-60%
  user_satisfaction: 90%+
  token_efficiency: optimal
  integration_success: 95%+
```

### 사용량 추적

```bash
# 일일 사용량 체크
gemini /stats     # Gemini: 1000회/일 중 사용량
```

## 🎯 결론

### 핵심 원칙

1. **Claude가 메인**: 모든 작업의 중심
2. **서브 에이전트 활용**: 체계적이고 목적 지향적
3. **병렬 처리**: 효율성 극대화
4. **제3자 검증**: 품질 보증
5. **사용자 중심**: 명시적 요청 즉시 대응

---

💡 **Remember**: CLI는 도구일 뿐, 서브 에이전트가 지능적 활용의 핵심!
