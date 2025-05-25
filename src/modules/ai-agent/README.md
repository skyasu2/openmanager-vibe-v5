# 🧠 OpenManager AI Agent

**NPU 기반 경량 AI 추론 엔진** - 서버 모니터링 전용 AI 어시스턴트

[![npm version](https://badge.fury.io/js/%40openmanager%2Fai-agent.svg)](https://badge.fury.io/js/%40openmanager%2Fai-agent)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 주요 특징

- 🚀 **LLM 비용 없는 실시간 AI 추론** - 패턴 매칭 기반 빠른 응답
- 🔧 **NPU 시뮬레이션** - 실제 NPU 대신 고도화된 알고리즘 사용
- 🎯 **도메인 특화** - 서버 모니터링 전용 AI 어시스턴트
- 🔌 **완전한 이식성** - 어떤 환경에서든 독립적으로 동작
- 📦 **모듈화 아키텍처** - 필요한 부분만 선택적 사용
- 🌐 **환경 독립성** - 브라우저, Node.js, Edge Runtime 지원
- 🔧 **플러그인 시스템** - 확장 가능한 아키텍처

## 🚀 빠른 시작

### 설치

```bash
npm install @openmanager/ai-agent
```

### 기본 사용법

```typescript
import { AIAgentEngine, createConfig } from '@openmanager/ai-agent';

// 1. 설정 생성
const config = createConfig()
  .environment('browser')
  .enableLogging(true)
  .enableNPU(true)
  .build();

// 2. AI 엔진 초기화
const aiAgent = AIAgentEngine.getInstance(config);
await aiAgent.initialize();

// 3. 질의 처리
const response = await aiAgent.processQuery({
  query: '서버 상태를 확인해주세요',
  sessionId: 'user-session-123'
});

console.log(response.response); // AI 응답
console.log(response.intent);   // 의도 분류 결과
console.log(response.actions);  // 실행 가능한 액션들
```

## 🔧 환경별 설정

### 브라우저 환경

```typescript
import { AIAgentEngine, environmentPresets } from '@openmanager/ai-agent';

const config = environmentPresets.browser();
const aiAgent = AIAgentEngine.getInstance(config);
```

### Node.js 서버 환경

```typescript
import { AIAgentEngine, environmentPresets } from '@openmanager/ai-agent';

const config = environmentPresets.server();
const aiAgent = AIAgentEngine.getInstance(config);
```

### Edge Runtime (Vercel, Cloudflare Workers)

```typescript
import { AIAgentEngine, environmentPresets } from '@openmanager/ai-agent';

const config = environmentPresets.edge();
const aiAgent = AIAgentEngine.getInstance(config);
```

### 모바일 환경

```typescript
import { AIAgentEngine, environmentPresets } from '@openmanager/ai-agent';

const config = environmentPresets.mobile();
const aiAgent = AIAgentEngine.getInstance(config);
```

## 🔌 어댑터 시스템

### 스토리지 어댑터

```typescript
import { AdapterFactory } from '@openmanager/ai-agent/adapters';

// 메모리 스토리지
const memoryStorage = AdapterFactory.createStorageAdapter('memory');

// localStorage (브라우저)
const localStorage = AdapterFactory.createStorageAdapter('localStorage', {
  prefix: 'my-app'
});

// 커스텀 스토리지
class CustomStorageAdapter implements StorageAdapter {
  async get(key: string): Promise<any> { /* 구현 */ }
  async set(key: string, value: any): Promise<void> { /* 구현 */ }
  // ...
}
```

### 로깅 어댑터

```typescript
// 콘솔 로깅
const consoleLogger = AdapterFactory.createLoggingAdapter('console', {
  level: 'debug'
});

// 무음 로깅 (프로덕션)
const silentLogger = AdapterFactory.createLoggingAdapter('silent');

// 커스텀 로깅
class CustomLoggingAdapter implements LoggingAdapter {
  debug(message: string, ...args: any[]): void { /* 구현 */ }
  info(message: string, ...args: any[]): void { /* 구현 */ }
  // ...
}
```

### 네트워크 어댑터

```typescript
// Fetch API
const fetchAdapter = AdapterFactory.createNetworkAdapter('fetch', {
  baseURL: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' }
});

// Mock 어댑터 (테스트용)
const mockAdapter = AdapterFactory.createNetworkAdapter('mock', {
  responses: {
    '/api/servers': { data: [/* 서버 목록 */] }
  }
});
```

## 🔌 플러그인 시스템

### 내장 플러그인

```typescript
const config = createConfig()
  .plugins(['debug', 'metrics', 'cache'])
  .build();
```

### 커스텀 플러그인

```typescript
import { Plugin, PluginManifest, PluginContext } from '@openmanager/ai-agent/plugins';

class MyCustomPlugin implements Plugin {
  manifest: PluginManifest = {
    name: 'my-plugin',
    version: '1.0.0',
    description: 'My custom plugin',
    author: 'Me',
    hooks: ['onQuery', 'onResponse']
  };

  async initialize(context: PluginContext): Promise<void> {
    // 플러그인 초기화
  }

  async onQuery(query: string, context: any): Promise<any> {
    // 쿼리 전처리
    return { preprocessed: true };
  }

  async onResponse(response: any, context: any): Promise<any> {
    // 응답 후처리
    return { ...response, postprocessed: true };
  }
}

// 플러그인 등록
await aiAgent.pluginManager.registerPlugin(new MyCustomPlugin());
```

## 📊 메트릭 및 모니터링

```typescript
// 메트릭 어댑터 설정
const metricsAdapter = AdapterFactory.createMetricsAdapter('console');

// 또는 커스텀 메트릭
class PrometheusMetricsAdapter implements MetricsAdapter {
  increment(metric: string, value?: number, tags?: Record<string, string>): void {
    // Prometheus 메트릭 전송
  }
  // ...
}
```

## 🎯 의도 분류 및 액션

### 지원하는 의도

- `server_status` - 서버 상태 확인
- `performance_analysis` - 성능 분석
- `log_analysis` - 로그 분석
- `alert_management` - 알림 관리
- `resource_monitoring` - 리소스 모니터링
- `troubleshooting` - 문제 해결
- `configuration` - 설정 관리
- `security_check` - 보안 검사
- `backup_status` - 백업 상태
- `general_inquiry` - 일반 문의

### 액션 실행

```typescript
const response = await aiAgent.processQuery({
  query: 'CPU 사용률이 높은 서버를 찾아주세요'
});

// 실행 가능한 액션들
console.log(response.actions);
// ['check_cpu_usage', 'list_high_cpu_servers', 'suggest_optimization']
```

## 🔧 고급 설정

### 완전한 설정 예제

```typescript
import { createConfig, AIAgentEngine } from '@openmanager/ai-agent';

const config = createConfig()
  .environment('browser')
  .platform('web')
  .enableLogging(true)
  .logLevel('debug')
  .storage('localStorage')
  .enableNPU(true)
  .enableMCP(true)
  .timeout(10000)
  .plugins(['debug', 'metrics', 'cache'])
  .build();

const aiAgent = AIAgentEngine.getInstance(config);
await aiAgent.initialize();
```

### 환경 감지

```typescript
import { detectEnvironment } from '@openmanager/ai-agent/config';

// 자동 환경 감지
const autoConfig = detectEnvironment();
const aiAgent = AIAgentEngine.getInstance(autoConfig);
```

## 📦 다른 프로젝트에 통합

### React 프로젝트

```typescript
// hooks/useAIAgent.ts
import { useEffect, useState } from 'react';
import { AIAgentEngine, environmentPresets } from '@openmanager/ai-agent';

export const useAIAgent = () => {
  const [aiAgent, setAIAgent] = useState<AIAgentEngine | null>(null);

  useEffect(() => {
    const initAI = async () => {
      const config = environmentPresets.browser();
      const agent = AIAgentEngine.getInstance(config);
      await agent.initialize();
      setAIAgent(agent);
    };

    initAI();
  }, []);

  return aiAgent;
};
```

### Vue.js 프로젝트

```typescript
// composables/useAIAgent.ts
import { ref, onMounted } from 'vue';
import { AIAgentEngine, environmentPresets } from '@openmanager/ai-agent';

export const useAIAgent = () => {
  const aiAgent = ref<AIAgentEngine | null>(null);

  onMounted(async () => {
    const config = environmentPresets.browser();
    const agent = AIAgentEngine.getInstance(config);
    await agent.initialize();
    aiAgent.value = agent;
  });

  return { aiAgent };
};
```

### Express.js 서버

```typescript
// server.ts
import express from 'express';
import { AIAgentEngine, environmentPresets } from '@openmanager/ai-agent';

const app = express();
const aiAgent = AIAgentEngine.getInstance(environmentPresets.server());

app.post('/api/ai-query', async (req, res) => {
  const { query, sessionId } = req.body;
  
  const response = await aiAgent.processQuery({
    query,
    sessionId,
    serverData: req.serverData
  });
  
  res.json(response);
});
```

## 🧪 테스트

```typescript
import { AIAgentEngine, AdapterFactory } from '@openmanager/ai-agent';

// 테스트용 Mock 설정
const mockConfig = {
  environment: 'node' as const,
  platform: 'server' as const,
  runtime: {
    enableLogging: false,
    logLevel: 'error' as const,
    enableMetrics: false,
    enableCache: false,
    cacheSize: 10,
    timeout: 1000
  },
  storage: {
    type: 'memory' as const,
    prefix: 'test',
    ttl: 1000
  },
  engine: {
    enableNPU: true,
    enableMCP: false,
    maxContextLength: 1024,
    confidenceThreshold: 0.5,
    fallbackMode: 'simple' as const
  },
  network: {
    enableOffline: true,
    retryAttempts: 1,
    retryDelay: 100,
    enableCORS: false
  },
  security: {
    enableEncryption: false,
    enableSanitization: true,
    allowedOrigins: ['*'],
    rateLimiting: {
      enabled: false,
      maxRequests: 100,
      windowMs: 60000
    }
  },
  plugins: {
    enabled: [],
    config: {}
  }
};

const aiAgent = AIAgentEngine.getInstance(mockConfig);
```

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

- 📧 Email: support@openmanager.io
- 🐛 Issues: [GitHub Issues](https://github.com/openmanager/ai-agent/issues)
- 📖 Documentation: [Wiki](https://github.com/openmanager/ai-agent/wiki)

---

**Made with ❤️ by OpenManager Team** 