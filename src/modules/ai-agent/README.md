# OpenManager AI Agent Module

🧠 **완전히 독립적인 AI 에이전트 엔진**

외부 의존성 없이 어떤 환경에서든 동작하는 경량 AI 추론 엔진입니다.

## ✨ 주요 특징

- **🔋 NPU 시뮬레이션**: LLM 비용 없는 실시간 AI 추론
- **🔌 MCP 프로토콜**: 표준 모델 컨텍스트 프로토콜 지원
- **🎯 도메인 특화**: 서버 모니터링에 최적화된 AI
- **🧩 플러그인 시스템**: 확장 가능한 아키텍처
- **🌐 환경 독립적**: 브라우저, Node.js, Edge 환경 지원
- **📦 제로 의존성**: 외부 라이브러리 없이 동작

## 🚀 빠른 시작

### 기본 사용법

```typescript
import { createAIAgent } from './modules/ai-agent';

// 1. AI 에이전트 생성
const aiAgent = await createAIAgent({
  environment: 'browser',
  enableLogging: true
});

// 2. 질의 처리
const response = await aiAgent.processQuery({
  query: '서버 상태를 확인해주세요',
  userId: 'user123'
});

console.log(response.response); // AI 응답
console.log(response.intent);   // 의도 분류 결과
console.log(response.actions);  // 추천 액션
```

### 환경별 생성

```typescript
// 브라우저 환경
const browserAgent = await createBrowserAIAgent({
  enableLogging: true,
  plugins: ['debug', 'metrics']
});

// 서버 환경
const serverAgent = await createServerAIAgent({
  enableMetrics: true,
  logLevel: 'debug'
});

// Edge 환경 (Vercel, Cloudflare Workers)
const edgeAgent = await createEdgeAIAgent({
  enableLogging: false,
  timeout: 3000
});

// 프로덕션 환경
const productionAgent = await createProductionAIAgent({
  enableMCP: true,
  enableThinking: true
});
```

### 고급 설정

```typescript
import { createConfig, AIAgentEngine } from './modules/ai-agent';

// 설정 빌더 사용
const config = createConfig()
  .environment('browser')
  .platform('web')
  .enableLogging(true)
  .logLevel('debug')
  .storage('localStorage')
  .enableNPU(true)
  .enableMCP(true)
  .timeout(5000)
  .plugins(['debug', 'metrics', 'cache'])
  .build();

// 직접 엔진 생성
const aiAgent = AIAgentEngine.getInstance({
  enableMCP: true,
  enableNPU: true,
  maxContextLength: 4096,
  responseTimeout: 5000,
  debugMode: true,
  mode: 'basic',
  enableThinking: true,
  enableAdminLogging: true
});

await aiAgent.initialize();
```

## 🔧 설정 옵션

### 환경 설정

```typescript
interface AIAgentEnvironmentConfig {
  environment: 'browser' | 'node' | 'edge' | 'worker';
  platform: 'web' | 'mobile' | 'desktop' | 'server';
  
  runtime: {
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableMetrics: boolean;
    enableCache: boolean;
    cacheSize: number;
    timeout: number;
  };
  
  storage: {
    type: 'memory' | 'localStorage' | 'sessionStorage' | 'indexedDB';
    prefix: string;
    ttl: number;
  };
  
  engine: {
    enableNPU: boolean;
    enableMCP: boolean;
    maxContextLength: number;
    confidenceThreshold: number;
    fallbackMode: 'simple' | 'pattern' | 'llm';
  };
}
```

### AI 엔진 설정

```typescript
interface AIAgentConfig {
  enableMCP: boolean;          // MCP 프로토콜 활성화
  enableNPU: boolean;          // NPU 시뮬레이션 활성화
  maxContextLength: number;    // 최대 컨텍스트 길이
  responseTimeout: number;     // 응답 타임아웃 (ms)
  debugMode: boolean;          // 디버그 모드
  mode: AIAgentMode;          // 동작 모드
  enableThinking: boolean;     // 사고 과정 추적
  enableAdminLogging: boolean; // 관리자 로깅
}
```

## 📋 API 레퍼런스

### createAIAgent(options)

기본 AI 에이전트를 생성합니다.

**Parameters:**
- `options` (object): 설정 옵션
  - `environment` (string): 실행 환경
  - `enableLogging` (boolean): 로깅 활성화
  - `plugins` (string[]): 사용할 플러그인 목록

**Returns:** `Promise<AIAgentEngine>`

### processQuery(request)

AI 질의를 처리합니다.

**Parameters:**
- `request` (AIAgentRequest): 질의 요청
  - `query` (string): 사용자 질의
  - `userId` (string, optional): 사용자 ID
  - `sessionId` (string, optional): 세션 ID
  - `context` (object, optional): 추가 컨텍스트
  - `serverData` (any, optional): 서버 데이터

**Returns:** `Promise<AIAgentResponse>`

```typescript
interface AIAgentResponse {
  success: boolean;
  response: string;
  intent: {
    name: string;
    confidence: number;
    entities: Record<string, any>;
  };
  actions: string[];
  context: Record<string, any>;
  metadata: {
    processingTime: number;
    timestamp: string;
    engineVersion: string;
    sessionId: string;
  };
  error?: string;
}
```

## 🔌 플러그인 시스템

### 기본 플러그인

```typescript
// 디버그 플러그인
const debugPlugin = new DebugPlugin();

// 메트릭 플러그인
const metricsPlugin = new MetricsPlugin();

// 캐시 플러그인
const cachePlugin = new CachePlugin();

// 플러그인 등록
const pluginManager = new PluginManager();
pluginManager.register(debugPlugin);
pluginManager.register(metricsPlugin);
pluginManager.register(cachePlugin);
```

### 커스텀 플러그인

```typescript
import { Plugin, PluginContext } from './modules/ai-agent';

class CustomPlugin implements Plugin {
  manifest = {
    name: 'custom-plugin',
    version: '1.0.0',
    description: '커스텀 플러그인'
  };

  async initialize(context: PluginContext): Promise<void> {
    console.log('커스텀 플러그인 초기화');
  }

  async beforeQuery(query: string, context: any): Promise<any> {
    // 질의 전처리
    return { query, context };
  }

  async afterResponse(response: any, context: any): Promise<any> {
    // 응답 후처리
    return response;
  }

  async shutdown(): Promise<void> {
    console.log('커스텀 플러그인 종료');
  }
}
```

## 🎯 어댑터 시스템

### 스토리지 어댑터

```typescript
import { MemoryStorageAdapter, LocalStorageAdapter } from './modules/ai-agent';

// 메모리 스토리지 (기본)
const memoryStorage = new MemoryStorageAdapter();

// 로컬 스토리지 (브라우저)
const localStorage = new LocalStorageAdapter('my-app');

// 사용법
await storage.set('key', 'value', 3600000); // 1시간 TTL
const value = await storage.get('key');
```

### 로깅 어댑터

```typescript
import { ConsoleLoggingAdapter, SilentLoggingAdapter } from './modules/ai-agent';

// 콘솔 로깅
const consoleLogger = new ConsoleLoggingAdapter('debug');

// 무음 로깅
const silentLogger = new SilentLoggingAdapter();

// 사용법
logger.info('정보 메시지');
logger.warn('경고 메시지');
logger.error('오류 메시지');
```

## 🌐 환경별 사용 예제

### 브라우저 환경

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Agent Demo</title>
</head>
<body>
    <script type="module">
        import { createBrowserAIAgent } from './modules/ai-agent/index.js';
        
        const aiAgent = await createBrowserAIAgent({
            enableLogging: true,
            storage: 'localStorage'
        });
        
        const response = await aiAgent.processQuery({
            query: '서버 상태 확인'
        });
        
        console.log(response.response);
    </script>
</body>
</html>
```

### Node.js 환경

```javascript
// server.js
const { createServerAIAgent } = require('./modules/ai-agent');

async function main() {
    const aiAgent = await createServerAIAgent({
        enableLogging: true,
        enableMetrics: true,
        logLevel: 'debug'
    });
    
    const response = await aiAgent.processQuery({
        query: '성능 분석 요청',
        serverData: {
            cpu: 75,
            memory: 60,
            disk: 45
        }
    });
    
    console.log('AI 응답:', response.response);
    console.log('추천 액션:', response.actions);
}

main().catch(console.error);
```

### Vercel Edge Functions

```typescript
// api/ai-agent.ts
import { createEdgeAIAgent } from '../modules/ai-agent';

export default async function handler(request: Request) {
    const aiAgent = await createEdgeAIAgent({
        enableLogging: false,
        timeout: 3000
    });
    
    const { query } = await request.json();
    
    const response = await aiAgent.processQuery({ query });
    
    return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' }
    });
}
```

## 🧪 실제 환경 테스트

```typescript
import { createProductionAIAgent } from './modules/ai-agent';

describe('Production AI Agent Tests', () => {
    let aiAgent;
    
    beforeEach(async () => {
        aiAgent = await createProductionAIAgent({
            enableMCP: true,
            enableThinking: true,
            debugMode: false
        });
    });
    
    test('실제 서버 데이터로 상태 분석', async () => {
        const realServerData = [
            { id: 'web-01', status: 'healthy', cpu: 45, memory: 60, location: 'US East' },
            { id: 'db-01', status: 'warning', cpu: 85, memory: 75, location: 'EU West' }
        ];
        
        const response = await aiAgent.processQuery({
            query: '서버 상태는 어떤가요?',
            serverData: realServerData
        });
        
        expect(response.success).toBe(true);
        expect(response.intent.name).toBe('server_status');
        expect(response.response).toContain('2대');
        expect(response.response).toContain('85%'); // 실제 CPU 데이터 반영
    });
    
    test('성능 병목 현상 실시간 분석', async () => {
        const serverData = [
            { id: 'api-01', cpu: 95, memory: 88, status: 'critical' },
            { id: 'api-02', cpu: 30, memory: 45, status: 'healthy' }
        ];
        
        const response = await aiAgent.processQuery({
            query: 'CPU 사용률이 높은 서버를 찾아주세요',
            serverData
        });
        
        expect(response.intent.name).toBe('performance_analysis');
        expect(response.response).toContain('api-01'); // 실제 고부하 서버 식별
        expect(response.response).toContain('병목'); // 병목 현상 분석
    });
});
```

## 📦 패키지로 배포

```json
{
  "name": "@openmanager/ai-agent",
  "version": "1.0.0",
  "description": "독립적인 AI 에이전트 엔진",
  "main": "index.js",
  "types": "index.d.ts",
  "exports": {
    ".": {
      "import": "./index.js",
      "require": "./index.js",
      "types": "./index.d.ts"
    }
  },
  "files": [
    "**/*.js",
    "**/*.d.ts",
    "README.md"
  ],
  "keywords": [
    "ai",
    "agent",
    "npu",
    "mcp",
    "monitoring",
    "server"
  ]
}
```

## 🔍 지원 확인

```typescript
import { isAIAgentSupported, getAIAgentInfo } from './modules/ai-agent';

// 지원 여부 확인
if (isAIAgentSupported()) {
    console.log('AI Agent 지원됨');
} else {
    console.log('AI Agent 지원되지 않음');
}

// 상세 정보
const info = getAIAgentInfo();
console.log('환경:', info.environment);
console.log('버전:', info.version);
console.log('기능:', info.features);
```

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다. 