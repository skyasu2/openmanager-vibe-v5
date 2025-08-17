# 🔧 필수 MCP 서버 활용 가이드

> **업데이트**: 2025년 8월 16일  
> **통합 완료**: Time, Shadcn-UI, Google AI MCP 통합 문서  
> **적용 범위**: 개발 효율성, UI 개발, AI 통합

## 📋 목차

1. [Time MCP](#time-mcp)
2. [Shadcn-UI MCP](#shadcn-ui-mcp)
3. [Google AI MCP](#google-ai-mcp)
4. [통합 활용 시나리오](#통합-활용-시나리오)
5. [성능 최적화](#성능-최적화)

## 🕐 Time MCP

### 개요

Time MCP는 타임존 간 시간 변환과 정확한 시간 정보를 제공하는 도구입니다. 글로벌 서비스 개발과 문서 작성 시 시간 정보의 정확성을 보장합니다.

### 핵심 기능

| 기능           | 명령어                        | 용도                    |
| -------------- | ----------------------------- | ----------------------- |
| 현재 시간 조회 | `mcp__time__get_current_time` | 특정 타임존의 현재 시간 |
| 시간 변환      | `mcp__time__convert_time`     | 타임존 간 시간 변환     |

### 실전 활용법

#### 1. 서버 모니터링 타임스탬프

```typescript
// services/monitoring/timestamp.ts
export async function getMonitoringTimestamp(region: string) {
  const timezoneMap = {
    korea: 'Asia/Seoul',
    'us-west': 'America/Los_Angeles',
    'us-east': 'America/New_York',
    europe: 'Europe/London',
    japan: 'Asia/Tokyo',
  };

  const timezone = timezoneMap[region] || 'UTC';

  return await mcp__time__get_current_time({
    timezone,
  });
}

// 사용 예시
const koreaTime = await getMonitoringTimestamp('korea');
// 결과: "2025-08-16T14:30:00+09:00"
```

#### 2. 글로벌 서비스 로그 분석

```typescript
// 서로 다른 지역의 로그를 UTC로 통일
async function normalizeLogTimestamps(logs: LogEntry[]) {
  const normalizedLogs = await Promise.all(
    logs.map(async (log) => {
      const utcTime = await mcp__time__convert_time({
        time: log.timestamp,
        from_timezone: log.region_timezone,
        to_timezone: 'UTC',
      });

      return {
        ...log,
        timestamp_utc: utcTime,
        original_timestamp: log.timestamp,
      };
    })
  );

  return normalizedLogs.sort(
    (a, b) =>
      new Date(a.timestamp_utc).getTime() - new Date(b.timestamp_utc).getTime()
  );
}
```

#### 3. 문서 자동 타임스탬프

```typescript
// 문서 작성 시 자동으로 KST 시간 기록
export async function addDocumentTimestamp() {
  const currentTime = await mcp__time__get_current_time({
    timezone: 'Asia/Seoul',
  });

  return `> **작성일**: ${currentTime} KST (자동 생성)`;
}

// Markdown 파일 헤더에 자동 추가
const header = await addDocumentTimestamp();
// 결과: "> **작성일**: 2025-08-16T14:30:00+09:00 KST (자동 생성)"
```

#### 4. 배포 시간 조율

```typescript
// 글로벌 서비스의 최적 배포 시간 계산
async function calculateOptimalDeployTime() {
  const regions = [
    { name: 'Korea', timezone: 'Asia/Seoul', weight: 0.4 },
    { name: 'US West', timezone: 'America/Los_Angeles', weight: 0.3 },
    { name: 'Europe', timezone: 'Europe/London', weight: 0.3 },
  ];

  const currentTimes = await Promise.all(
    regions.map(async (region) => ({
      ...region,
      currentTime: await mcp__time__get_current_time({
        timezone: region.timezone,
      }),
      hour: new Date(
        await mcp__time__get_current_time({
          timezone: region.timezone,
        })
      ).getHours(),
    }))
  );

  // 오전 2-4시 (트래픽 최소) 시간대 찾기
  const optimalRegions = currentTimes.filter(
    (region) => region.hour >= 2 && region.hour <= 4
  );

  return optimalRegions.length > 0 ? '즉시 배포 가능' : '배포 대기 권장';
}
```

## 🎨 Shadcn-UI MCP

### 개요

shadcn-ui MCP는 shadcn/ui v4 컴포넌트 라이브러리의 모든 컴포넌트와 블록에 접근할 수 있는 MCP 서버입니다.

### 핵심 특징

- **46개의 기본 컴포넌트** 제공
- **55개의 미리 만들어진 블록** 제공
- 실시간 소스 코드 및 메타데이터 조회
- 카테고리별 분류: dashboard, login, sidebar, products 등

### 주요 기능

| 기능          | 명령어                            | 설명                    |
| ------------- | --------------------------------- | ----------------------- |
| 컴포넌트 목록 | `mcp__shadcn-ui__list_components` | 46개 컴포넌트 목록 조회 |
| 컴포넌트 소스 | `mcp__shadcn-ui__get_component`   | 특정 컴포넌트 소스 코드 |
| 블록 목록     | `mcp__shadcn-ui__list_blocks`     | 55개 블록 목록 조회     |
| 블록 소스     | `mcp__shadcn-ui__get_block`       | 특정 블록 소스 코드     |

### 실전 활용법

#### 1. 프로젝트 초기 설정

```typescript
// 사용 가능한 모든 컴포넌트 확인
const components = (await mcp__shadcn) - ui__list_components();
console.log(`사용 가능한 컴포넌트: ${components.length}개`);
// 결과: accordion, alert, button, card, checkbox, dialog, input, table 등

// 프로젝트에 필요한 기본 컴포넌트들 선별
const essentialComponents = [
  'button',
  'card',
  'input',
  'dialog',
  'table',
  'toast',
];

// 각 컴포넌트의 메타데이터 확인
for (const component of essentialComponents) {
  const metadata =
    (await mcp__shadcn) -
    ui__get_component({
      name: component,
    });
  console.log(`${component}: ${metadata.description}`);
}
```

#### 2. 대시보드 개발

```typescript
// 대시보드 블록 활용
const dashboardBlocks = (await mcp__shadcn) - ui__list_blocks();
const dashboardComponents = dashboardBlocks.filter(
  (block) => block.category === 'dashboard'
);

// 통계 카드 컴포넌트 가져오기
const statsCard =
  (await mcp__shadcn) -
  ui__get_block({
    name: 'stats-cards',
  });

// 프로젝트에 바로 적용
await mcp__filesystem__write_file({
  path: '/src/components/dashboard/StatsCards.tsx',
  content: `// Auto-generated from shadcn-ui MCP
${statsCard.code}

// 프로젝트 특화 수정
export { StatsCards as DashboardStats };`,
});
```

#### 3. 폼 컴포넌트 생성

```typescript
// 로그인 폼 블록 활용
const loginBlock =
  (await mcp__shadcn) -
  ui__get_block({
    name: 'authentication-01',
  });

// 커스텀 폼 요소들 추가
const formComponents = await Promise.all([
  mcp__shadcn - ui__get_component({ name: 'input' }),
  mcp__shadcn - ui__get_component({ name: 'button' }),
  mcp__shadcn - ui__get_component({ name: 'form' }),
  mcp__shadcn - ui__get_component({ name: 'label' }),
]);

// 통합 폼 컴포넌트 생성
const customForm = `
// 기본 컴포넌트들
${formComponents.map((comp) => comp.code).join('\n\n')}

// 로그인 블록 기반 커스텀 폼
${loginBlock.code}
`;

await mcp__filesystem__write_file({
  path: '/src/components/auth/LoginForm.tsx',
  content: customForm,
});
```

#### 4. 테마 및 스타일 관리

```typescript
// 모든 컴포넌트의 CSS 변수 수집
const components = (await mcp__shadcn) - ui__list_components();
const styleVariables = new Set();

for (const componentName of components) {
  const component =
    (await mcp__shadcn) -
    ui__get_component({
      name: componentName,
    });

  // CSS 변수 추출 (예시 로직)
  const cssVars = component.code.match(/var\(--[^)]+\)/g) || [];
  cssVars.forEach((cssVar) => styleVariables.add(cssVar));
}

// 프로젝트 테마 파일 생성
const themeConfig = `
// Auto-generated theme variables from shadcn-ui
export const themeVariables = [
  ${Array.from(styleVariables)
    .map((v) => `'${v}'`)
    .join(',\n  ')}
];

// 다크모드 지원
export const darkTheme = {
  // 자동 생성된 다크 테마 변수들
};
`;

await mcp__filesystem__write_file({
  path: '/src/styles/theme-config.ts',
  content: themeConfig,
});
```

#### 5. 컴포넌트 문서 자동 생성

```typescript
// 프로젝트에서 사용 중인 shadcn-ui 컴포넌트 문서화
const usedComponents = ['button', 'card', 'dialog', 'input', 'table'];

const componentDocs = await Promise.all(
  usedComponents.map(async (name) => {
    const component = (await mcp__shadcn) - ui__get_component({ name });
    return {
      name,
      description: component.description,
      props: component.props || [],
      examples: component.examples || [],
    };
  })
);

const docsMarkdown = `
# 프로젝트 UI 컴포넌트 가이드

${componentDocs
  .map(
    (comp) => `
## ${comp.name}

**설명**: ${comp.description}

**사용법**:
\`\`\`tsx
import { ${comp.name} } from '@/components/ui/${comp.name}';
\`\`\`

**Props**: ${comp.props.length > 0 ? comp.props.join(', ') : '표준 HTML 속성'}

---
`
  )
  .join('')}
`;

await mcp__filesystem__write_file({
  path: '/docs/ui-components.md',
  content: docsMarkdown,
});
```

## 🤖 Google AI MCP

### 개요

Google AI API와 GCP VM MCP 서버를 연동하여 자연어 질의 처리 성능을 극대화하는 통합 솔루션입니다.

**목표**: Google AI 모드 효과성을 **0-5% → 85-95%**로 향상

### 환경 설정

#### Vercel 환경변수

```bash
# Google AI API 설정
GOOGLE_AI_API_KEY=AIzaSyABC...DEF123
GOOGLE_AI_ENABLED=true
GOOGLE_AI_MODEL=gemini-1.5-flash

# GCP VM MCP 서버 설정
GCP_VM_IP=104.154.205.25
GCP_MCP_SERVER_PORT=10000
GCP_MCP_SERVER_URL=http://104.154.205.25:10000

# 통합 모드 설정
GOOGLE_AI_MCP_MODE=enhanced
GOOGLE_AI_FALLBACK_ENABLED=true
```

### 핵심 통합 패턴

#### 1. 지능형 쿼리 라우팅

```typescript
// services/ai/intelligent-router.ts
export class IntelligentQueryRouter {
  async route(query: string, context: any) {
    // 1. 쿼리 복잡도 분석
    const complexity = await this.analyzeComplexity(query);

    // 2. 적절한 AI 엔진 선택
    if (complexity.requiresRealTimeData) {
      return await this.useGoogleAIWithMCP(query, context);
    } else if (complexity.requiresDeepReasoning) {
      return await this.useClaudeEngine(query, context);
    } else {
      return await this.useGeminiEngine(query, context);
    }
  }

  private async useGoogleAIWithMCP(query: string, context: any) {
    // Google AI + GCP VM MCP 조합 활용
    const mcpData = await mcp__gcp__get_vm_status();
    const enhancedContext = {
      ...context,
      realTimeData: mcpData,
      timestamp: await mcp__time__get_current_time({
        timezone: 'UTC',
      }),
    };

    return await googleAI.generateResponse(query, enhancedContext);
  }
}
```

#### 2. 실시간 데이터 증강

```typescript
// 실시간 서버 상태와 AI 분석 결합
export async function enhancedServerAnalysis(query: string) {
  // 1. 현재 서버 상태 수집
  const serverStatus = await mcp__gcp__list_instances();
  const currentTime = await mcp__time__get_current_time({
    timezone: 'UTC',
  });

  // 2. Google AI로 상태 분석
  const analysis = await googleAI.analyze({
    query,
    context: {
      serverStatus,
      timestamp: currentTime,
      previousAnalysis: await memory.recall('last-server-analysis'),
    },
  });

  // 3. 분석 결과 저장
  await memory.store('last-server-analysis', {
    result: analysis,
    timestamp: currentTime,
  });

  return analysis;
}
```

#### 3. 다중 AI 검증 시스템

```typescript
// 중요한 결정은 여러 AI로 교차 검증
export async function criticalDecisionMaking(problem: string) {
  const solutions = await Promise.all([
    // Google AI (실시간 데이터 기반)
    googleAI.solve(problem, {
      realTimeData: await gatherRealTimeData(),
    }),

    // Claude (깊은 추론)
    claude.solve(problem, {
      reasoning: 'deep',
      context: await gatherHistoricalData(),
    }),

    // Gemini (빠른 분석)
    gemini.solve(problem, {
      mode: 'fast',
      multimodal: true,
    }),
  ]);

  // 솔루션 합의 도출
  return await findConsensus(solutions);
}
```

## 🔄 통합 활용 시나리오

### 시나리오 1: 스마트 대시보드 개발

```typescript
// Time + Shadcn-UI + Google AI 통합
export async function createSmartDashboard() {
  // 1. 현재 시간 기반 지역별 상태
  const regions = ['korea', 'us-west', 'europe'];
  const timeData = await Promise.all(
    regions.map((region) =>
      mcp__time__get_current_time({
        timezone: getTimezone(region),
      })
    )
  );

  // 2. Shadcn-UI 대시보드 컴포넌트 활용
  const dashboardTemplate = await mcp__shadcn_ui__get_block({
    name: 'dashboard-04',
  });

  // 3. Google AI로 데이터 분석 및 인사이트 생성
  const insights = await googleAI.analyze({
    query: '지역별 시간대와 서버 상태를 고려한 최적화 제안',
    context: {
      timeData,
      serverStatus: await mcp__gcp__get_vm_status(),
    },
  });

  // 4. 통합 대시보드 생성
  const smartDashboard = `
${dashboardTemplate.code}

// AI 생성 인사이트 컴포넌트
const AIInsights = () => (
  <Card>
    <CardHeader>
      <CardTitle>AI 분석 결과</CardTitle>
    </CardHeader>
    <CardContent>
      <p>${insights.summary}</p>
      <ul>
        ${insights.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
      </ul>
    </CardContent>
  </Card>
);
`;

  return smartDashboard;
}
```

### 시나리오 2: 글로벌 배포 자동화

```typescript
// 모든 MCP를 활용한 지능형 배포 시스템
export async function intelligentDeployment(version: string) {
  // 1. 각 지역의 현재 시간 확인
  const globalTimes = await Promise.all([
    mcp__time__get_current_time({ timezone: 'Asia/Seoul' }),
    mcp__time__get_current_time({ timezone: 'America/Los_Angeles' }),
    mcp__time__get_current_time({ timezone: 'Europe/London' }),
  ]);

  // 2. 서버 상태 확인
  const serverHealth = await mcp__gcp__get_vm_status();

  // 3. Google AI로 최적 배포 시간 계산
  const deploymentPlan = await googleAI.plan({
    query: '글로벌 서비스의 최적 배포 전략 수립',
    context: {
      globalTimes,
      serverHealth,
      version,
      trafficPatterns: await getTrafficHistory(),
    },
  });

  // 4. 배포 상태 UI 생성 (Shadcn-UI)
  const deploymentUI = await mcp__shadcn_ui__get_component({
    name: 'progress',
  });

  // 5. 단계별 배포 실행
  if (deploymentPlan.canDeploy) {
    return await executeSteppedDeployment(deploymentPlan, deploymentUI);
  } else {
    return {
      status: 'delayed',
      reason: deploymentPlan.delayReason,
      nextOptimalTime: deploymentPlan.nextOptimalTime,
    };
  }
}
```

### 시나리오 3: 자동 문서화 시스템

```typescript
// 실시간 시스템 문서 자동 생성
export async function generateSystemDocumentation() {
  // 1. 현재 시스템 상태 수집
  const systemState = {
    timestamp: await mcp__time__get_current_time({ timezone: 'UTC' }),
    servers: await mcp__gcp__list_instances(),
    components: await mcp__shadcn_ui__list_components(),
  };

  // 2. Google AI로 문서 구조 계획
  const docPlan = await googleAI.plan({
    query: 'OpenManager VIBE v5 시스템 문서 구조 설계',
    context: systemState,
  });

  // 3. 각 섹션별 자동 문서 생성
  const sections = await Promise.all(
    docPlan.sections.map(async (section) => {
      const content = await googleAI.generate({
        query: `${section.title} 섹션 상세 내용 작성`,
        context: {
          ...systemState,
          sectionRequirements: section.requirements,
        },
      });

      return {
        title: section.title,
        content: content,
        timestamp: await mcp__time__get_current_time({
          timezone: 'Asia/Seoul',
        }),
      };
    })
  );

  // 4. 최종 문서 조합
  const documentation = `
# OpenManager VIBE v5 시스템 문서

> **자동 생성일**: ${systemState.timestamp}  
> **생성 방식**: Time + Google AI + Shadcn-UI MCP 통합

${sections
  .map(
    (section) => `
## ${section.title}

${section.content}

---
`
  )
  .join('')}
`;

  // 5. 문서 저장
  await mcp__filesystem__write_file({
    path: '/docs/auto-generated-system-docs.md',
    content: documentation,
  });

  return documentation;
}
```

## ⚡ 성능 최적화

### 1. MCP 호출 최적화

```typescript
// 병렬 처리로 응답 시간 단축
export async function optimizedMCPUsage() {
  // ❌ 비효율적 (순차 처리)
  const time = await mcp__time__get_current_time({ timezone: 'UTC' });
  const components = await mcp__shadcn_ui__list_components();
  const servers = await mcp__gcp__list_instances();

  // ✅ 효율적 (병렬 처리)
  const [time2, components2, servers2] = await Promise.all([
    mcp__time__get_current_time({ timezone: 'UTC' }),
    mcp__shadcn_ui__list_components(),
    mcp__gcp__list_instances(),
  ]);
}
```

### 2. 캐싱 전략

```typescript
// 자주 사용하는 데이터 캐싱
const mcpCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5분

export async function cachedMCPCall(key: string, mcpFunction: Function) {
  const cached = mcpCache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await mcpFunction();
  mcpCache.set(key, {
    data,
    timestamp: Date.now(),
  });

  return data;
}

// 사용 예시
const components = await cachedMCPCall('shadcn-components', () =>
  mcp__shadcn_ui__list_components()
);
```

### 3. 에러 처리 및 폴백

```typescript
// MCP 서버 장애 대응
export async function resilientMCPCall(mcpCall: Function, fallback: any) {
  try {
    return await Promise.race([
      mcpCall(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      ),
    ]);
  } catch (error) {
    console.warn('MCP call failed, using fallback:', error.message);
    return fallback;
  }
}

// 사용 예시
const currentTime = await resilientMCPCall(
  () => mcp__time__get_current_time({ timezone: 'UTC' }),
  new Date().toISOString()
);
```

---

## 💡 모범 사례

1. **병렬 처리**: 독립적인 MCP 호출은 Promise.all 활용
2. **캐싱 활용**: 변경이 적은 데이터는 적절한 캐싱 적용
3. **에러 처리**: 폴백 메커니즘으로 안정성 확보
4. **성능 모니터링**: MCP 호출 시간 추적 및 최적화
5. **통합 활용**: 여러 MCP를 조합한 고급 기능 구현

이 가이드를 통해 Time, Shadcn-UI, Google AI MCP의 모든 기능을 효율적으로 활용할 수 있습니다.
