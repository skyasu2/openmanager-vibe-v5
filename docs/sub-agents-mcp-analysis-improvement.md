# 서브 에이전트 MCP 활용 분석 및 개선 방안

## 작성일: 2025-01-27

### 📊 테스트 결과 요약

#### 1. 시뮬레이션 테스트 결과

- **전체 성공률**: 70% (10개 중 7개 성공)
- **MCP 활용률**: 28% (목표: 70%)
- **평균 실행 시간**: 1.8ms
- **실패 에이전트**: ai-systems-engineer, database-administrator, issue-summary

#### 2. 실제 Task 도구 호출 결과

- **mcp-server-admin**: ✅ 성공 (9개 MCP 서버 상태 확인)
- **database-administrator**: ✅ 성공 (Supabase MCP 도구 활용)
- **MCP 도구 사용**: 정상 작동 확인

### 🔍 원인 분석

#### 1. 시뮬레이션 vs 실제 실행의 차이

```typescript
// 시뮬레이션 (문제점)
const result = await AgentHelper.executeWithAgent(
  testCase.agent,
  'test-operation',
  async () => {
    // Task 도구를 실제로 호출하지 않음
    return { mockData: true };
  }
);

// 실제 실행 (정상)
Task({
  subagent_type: 'database-administrator',
  description: '작업 설명',
  prompt: '실제 작업 내용',
});
```

#### 2. MCP 도구 접근 메커니즘

- **자동 상속**: 서브 에이전트는 기본 도구만 명시, MCP 도구는 자동으로 사용 가능
- **명명 규칙**: `mcp__서버명__도구명` 형식
- **특별 케이스**: central-supervisor는 tools 필드 없이 모든 도구 접근 가능

#### 3. 환경변수 설정 상태

- **완전 설정됨**: github, supabase, tavily-mcp
- **미설정**: context7 (API_KEY)
- **영향**: context7를 제외한 모든 MCP 서버 정상 작동

### 🛠️ 개선 방안

#### 1. Task 도구 직접 호출 래퍼 구현

```typescript
// src/services/agents/task-wrapper.ts
export class TaskWrapper {
  static async callSubAgent(
    agentType: string,
    description: string,
    prompt: string,
    options?: { trackMCP?: boolean }
  ): Promise<any> {
    // 실제 Task 도구 호출을 시뮬레이션
    console.log(`[TaskWrapper] Calling ${agentType}`);

    // MCP 사용 추적
    if (options?.trackMCP) {
      // MCPUsageTracker 통합
    }

    // 실제로는 Task 도구를 호출해야 함
    // 현재는 개발 환경에서의 제약으로 시뮬레이션
    return {
      success: true,
      agent: agentType,
      mcpToolsAvailable: this.getAvailableMCPTools(agentType),
    };
  }

  private static getAvailableMCPTools(agentType: string): string[] {
    // 에이전트별 추천 MCP 매핑 반환
    const mapping = {
      'ai-systems-engineer': ['supabase', 'memory', 'sequential-thinking'],
      'database-administrator': ['supabase', 'filesystem', 'memory'],
      // ... 나머지 에이전트
    };

    return mapping[agentType] || [];
  }
}
```

#### 2. MCP 활용률 향상 전략

##### 즉시 개선 가능한 항목

1. **명시적 MCP 사용 가이드 추가**

   ```typescript
   // 각 서브 에이전트의 프롬프트에 MCP 도구 사용 명시
   const enhancedPrompt = `
   ${originalPrompt}
   
   다음 MCP 도구를 활용하세요:
   - mcp__supabase__execute_sql: 데이터베이스 쿼리
   - mcp__filesystem__read_file: 파일 읽기
   - mcp__memory__create_entities: 지식 저장
   `;
   ```

2. **에이전트별 MCP 사용 예시 추가**

   ```typescript
   // .claude/agents/{agent-name}.md 파일에 추가
   ## MCP 도구 사용 예시

   데이터베이스 쿼리 시:
   \`\`\`
   mcp__supabase__execute_sql로 쿼리 실행
   mcp__supabase__list_tables로 테이블 확인
   \`\`\`
   ```

##### 중장기 개선 사항

1. **MCP 프록시 레이어 구현**
   - Task 도구와 MCP 도구 간의 브릿지
   - 자동 MCP 도구 감지 및 라우팅
   - 사용 통계 자동 수집

2. **서브 에이전트 학습 시스템**
   - 성공적인 MCP 사용 패턴 기록
   - 에이전트별 최적 MCP 조합 학습
   - 자동 프롬프트 최적화

### 📈 예상 개선 효과

#### 단기 (1주일)

- MCP 활용률: 28% → 50%
- 실패 에이전트: 3개 → 1개
- 평균 응답 시간: 유지 (2ms 이하)

#### 중기 (1개월)

- MCP 활용률: 50% → 70%+
- 모든 에이전트 정상 작동
- 자동화된 MCP 추천 시스템

### 🎯 액션 아이템

#### 즉시 실행

1. [ ] context7 API 키 획득 및 설정
2. [ ] TaskWrapper 클래스 구현
3. [ ] 각 에이전트 프롬프트에 MCP 사용 가이드 추가

#### 이번 주

1. [ ] MCP 사용 모니터링 대시보드 구축
2. [ ] 에이전트별 MCP 사용 패턴 문서화
3. [ ] 자동화된 테스트 스위트 구축

#### 이번 달

1. [ ] MCP 프록시 레이어 설계 및 구현
2. [ ] 서브 에이전트 학습 시스템 프로토타입
3. [ ] 전체 시스템 성능 벤치마크

### 🔧 테스트 명령어

```bash
# 환경변수 검증
npm run agents:verify-env

# 개별 에이전트 테스트
npm run agents:test

# API 상태 확인
npm run agents:health

# MCP 사용률 보고서
cat sub-agents-test-report.md
```

### 📝 결론

서브 에이전트 시스템은 기본적으로 잘 구축되어 있으며, MCP 도구들도 정상적으로 작동합니다.
다만 다음과 같은 개선이 필요합니다:

1. **테스트 환경 개선**: 실제 Task 도구 호출을 시뮬레이션할 수 있는 환경 구축
2. **MCP 사용 가이드**: 각 에이전트가 MCP 도구를 더 적극적으로 사용하도록 유도
3. **모니터링 강화**: 실시간 MCP 사용률 추적 및 분석

이러한 개선을 통해 목표인 70% MCP 활용률을 달성할 수 있을 것으로 예상됩니다.
