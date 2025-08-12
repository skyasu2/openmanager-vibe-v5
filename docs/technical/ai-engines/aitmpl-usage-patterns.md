# aitmpl.com 패턴 활용 가이드

## 🎯 목적

aitmpl.com의 템플릿 패턴을 참조하여 OpenManager VIBE v5 프로젝트를 개선하는 실용적 가이드

## 📋 활용 시나리오별 가이드

## 1. 🤖 새 에이전트 개발 시

### Step 1: aitmpl.com 패턴 참조
```markdown
# aitmpl.com 에이전트 구조 확인
- Role: 명확한 역할 정의
- Tools: 사용 도구 명시
- Instructions: 구체적 지침
- Examples: 사용 예시
```

### Step 2: 우리 프로젝트 포맷 적용
```markdown
# .claude/agents/new-agent-name.md

You are a specialized agent for [specific domain].

## Primary Responsibilities
- [책임 1]
- [책임 2]

## Available Tools
- Tool1: [용도]
- Tool2: [용도]

## Collaboration Protocol
- Works with: [다른 에이전트]
- Reports to: central-supervisor

## Success Criteria
- [성공 지표]
```

### Step 3: 비교 체크리스트
- [ ] 역할이 명확한가?
- [ ] 다른 에이전트와 중복되지 않는가?
- [ ] 협업 프로토콜이 정의되었는가?
- [ ] 성공 기준이 측정 가능한가?

### 실제 예시: 새 performance-optimizer 에이전트
```markdown
# aitmpl 참조: 일반 performance 에이전트
- 범용적 성능 최적화
- 다양한 언어 지원

# 우리 구현: vercel-performance-optimizer
- Vercel Edge Runtime 특화
- Next.js 15 최적화
- Core Web Vitals 중심
- 무료 티어 한계 고려
```

## 2. 🔌 MCP 서버 추가 시

### Step 1: aitmpl.com MCP 패턴 분석
```json
// aitmpl.com 표준 MCP 설정
{
  "mcpServers": {
    "example": {
      "command": "npx",
      "args": ["-y", "@org/package@latest"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

### Step 2: 우리 프로젝트 통합 방식
```bash
# Claude Code CLI 명령어 (우리 방식)
claude mcp add new-server npx -e KEY=value -- -y @package/name@latest

# 환경변수 관리 (.env.local)
NEW_SERVER_API_KEY=xxx
NEW_SERVER_URL=https://...
```

### Step 3: 통합 체크리스트
- [ ] 기존 MCP와 충돌하지 않는가?
- [ ] 환경변수가 .env.local.template에 추가되었는가?
- [ ] CLAUDE.md에 문서화되었는가?
- [ ] 에러 처리가 구현되었는가?

### 실제 예시: 새 monitoring MCP 추가
```bash
# aitmpl 참조: 일반 monitoring 서버
- 표준 메트릭 수집
- 범용 대시보드

# 우리 구현: vercel-analytics MCP
claude mcp add vercel-analytics npx -e VERCEL_TOKEN=${VERCEL_TOKEN} -- -y @vercel/analytics-mcp@latest

# 특화 기능
- Vercel 전용 메트릭
- Edge Function 분석
- 무료 티어 사용량 추적
```

## 3. 💡 명령어 개발 시

### Step 1: aitmpl.com 명령어 패턴
```typescript
// aitmpl.com 슬래시 명령어 구조
interface Command {
  name: string;          // /command-name
  description: string;   
  parameters: {
    param1: { type: 'string', required: true },
    param2: { type: 'number', required: false }
  };
  handler: async (params) => {
    // 실행 로직
    return result;
  };
}
```

### Step 2: 우리 프로젝트 스크립트 변환
```json
// package.json scripts를 명령어로
{
  "scripts": {
    "validate:all": "npm run lint && npm run type-check && npm test"
  }
}

// → 슬래시 명령어로 변환
/validate-all
- 린트, 타입체크, 테스트를 순차 실행
- 결과를 통합 리포트로 제공
```

### Step 3: 구현 패턴
```typescript
// .claude/commands/validate-all.ts
export const validateAllCommand = {
  name: 'validate-all',
  description: '프로젝트 전체 검증',
  parameters: {
    skipTests: { 
      type: 'boolean', 
      required: false,
      description: '테스트 스킵 여부'
    }
  },
  handler: async ({ skipTests }) => {
    const results = [];
    
    // ESLint
    results.push(await runESLint());
    
    // TypeScript
    results.push(await runTypeCheck());
    
    // Tests
    if (!skipTests) {
      results.push(await runTests());
    }
    
    return formatResults(results);
  }
};
```

## 4. 📊 애널리틱스 도입 시

### Step 1: aitmpl 애널리틱스 테스트
```bash
# aitmpl 애널리틱스 실행
npx claude-code-templates@latest --analytics

# 관찰 포인트
- 어떤 메트릭을 수집하는가?
- UI/UX는 어떻게 구성되었는가?
- 실시간 업데이트 방식은?
```

### Step 2: 우리 프로젝트 적용 계획
```typescript
// .claude/analytics/config.ts
export const analyticsConfig = {
  // aitmpl 참조 메트릭
  sessionMetrics: {
    duration: true,
    commandsUsed: true,
    errorsCount: true
  },
  
  // 우리 프로젝트 특화 메트릭
  customMetrics: {
    mpcServerHealth: true,
    agentPerformance: true,
    tokenUsage: true
  }
};
```

### Step 3: 대시보드 구현
```typescript
// scripts/analytics-dashboard.ts
import { analyticsConfig } from '.claude/analytics/config';

// aitmpl 패턴 참조
class AnalyticsDashboard {
  // 실시간 데이터 수집
  collectMetrics() {
    // aitmpl 방식: 파일 시스템 모니터링
    // 우리 방식: MCP 서버 상태 추가
  }
  
  // 시각화
  renderDashboard() {
    // aitmpl 방식: 터미널 UI
    // 우리 방식: 웹 기반 추가 검토
  }
}
```

## 5. 📦 템플릿화 전략

### Step 1: 현재 구성 분석
```bash
# 우리 프로젝트 구조
.claude/
├── agents/         # 18개 에이전트 → 템플릿화 가능
├── issues/         # 이슈 추적 → 표준화 가능
└── backup/         # 백업 → 자동화 가능
```

### Step 2: aitmpl 구조로 변환
```bash
# 템플릿 구조 생성
templates/
├── openmanager-template/
│   ├── CLAUDE.md.template
│   ├── agents/
│   │   ├── monitoring.agent.md
│   │   └── database.agent.md
│   ├── mcp/
│   │   └── setup.json
│   └── package.json
```

### Step 3: 템플릿 변수 정의
```javascript
// template.config.js
module.exports = {
  variables: {
    PROJECT_NAME: 'OpenManager',
    MCP_SERVERS: ['supabase', 'github', 'filesystem'],
    AGENTS: ['database-administrator', 'vercel-platform-specialist']
  },
  
  // aitmpl 패턴 참조
  setup: {
    autoDetect: true,
    interactive: true,
    validation: true
  }
};
```

## 6. 🔄 선택적 도입 가이드

### 즉시 도입 가능 (Low Risk)
```bash
# 1. 애널리틱스 대시보드 테스트
npx claude-code-templates@latest --analytics

# 2. Chat UI 테스트
npx claude-code-templates@latest --chats

# 3. 헬스 체크 도구
npx claude-code-templates@latest --health-check
```

### 단계적 도입 (Medium Risk)
```markdown
1. 명령어 시스템
   - 2-3개 명령어 선별
   - 우리 포맷으로 변환
   - 테스트 후 확대

2. 에이전트 패턴
   - 구조 표준화
   - 협업 프로토콜 강화
   - 문서 템플릿화
```

### 신중한 검토 필요 (High Risk)
```markdown
1. 전체 템플릿 시스템 도입
   - 기존 구성과 충돌 가능
   - 마이그레이션 비용 높음

2. MCP 서버 대체
   - 현재 11개 안정적
   - 변경 필요성 낮음
```

## 7. 🎯 실전 체크리스트

### 새 기능 추가 전
- [ ] aitmpl.com에 유사 템플릿이 있는가?
- [ ] 있다면 어떤 구조를 사용하는가?
- [ ] 우리 프로젝트에 맞게 어떻게 수정할 것인가?

### 기존 기능 개선 시
- [ ] aitmpl.com의 베스트 프랙티스는?
- [ ] 우리 방식과 차이점은?
- [ ] 선택적으로 도입할 부분은?

### 문서화 시
- [ ] aitmpl.com 문서 구조 참조했는가?
- [ ] 템플릿화 가능한 부분은?
- [ ] 재사용성을 고려했는가?

## 8. 📚 참조 명령어 모음

### aitmpl.com 도구 명령어
```bash
# 설치
npm install -g claude-code-templates

# 대화형 설정
npx claude-code-templates@latest

# 애널리틱스
npx claude-code-templates@latest --analytics

# Chat UI
npx claude-code-templates@latest --chats

# 헬스 체크
npx claude-code-templates@latest --health-check
```

### 우리 프로젝트 명령어
```bash
# MCP 관리
claude mcp list
claude mcp add [name] [command]
claude mcp remove [name]

# 프로젝트 검증
npm run validate:all
npm run test:quick
npm run type-check

# 모니터링
npx ccusage@latest blocks --live
```

## 9. 💡 활용 팁

### DO ✅
- aitmpl 패턴을 **참조**하되 맹목적으로 따르지 않기
- 우리 프로젝트 특성에 맞게 **변형**하기
- 작은 부분부터 **점진적**으로 도입
- 도입 전후 **성능 비교** 측정

### DON'T ❌
- 전체 시스템을 한 번에 교체
- 검증 없이 대량 도입
- 기존 안정적인 구성 무시
- 호환성 검토 없이 적용

## 10. 📈 효과 측정

### 도입 전 기준선
```typescript
const baseline = {
  agentSetupTime: '10분',
  mpcConfigTime: '15분',
  commandCreationTime: '5분',
  documentationTime: '30분'
};
```

### 도입 후 목표
```typescript
const target = {
  agentSetupTime: '5분',     // 50% 개선
  mpcConfigTime: '10분',      // 33% 개선
  commandCreationTime: '2분', // 60% 개선
  documentationTime: '15분'   // 50% 개선
};
```

### 측정 방법
1. 시간 측정: 각 작업별 소요 시간
2. 품질 측정: 에러율, 재작업 빈도
3. 만족도: 개발자 피드백

---

*작성일: 2025-08-06*
*용도: 신규 개발 및 기존 기능 개선 시 참조*
*업데이트: aitmpl.com 변경 사항 반영 필요*