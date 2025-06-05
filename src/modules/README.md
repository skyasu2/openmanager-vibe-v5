# OpenManager 모듈화 아키텍처

## 🏗️ 모듈 구조

OpenManager는 독립적이고 재사용 가능한 모듈로 구성되어 있습니다.

```
src/modules/
├── ai-agent/           # 🧠 AI 에이전트 엔진 (핵심 모듈)
├── ai-sidebar/         # 🎨 AI 사이드바 UI (독립 모듈)
├── mcp/               # 🔌 MCP 표준 프로토콜 (독립 모듈)
└── shared/            # 🔧 공통 유틸리티
```

## 🧠 AI Agent Engine

지능형 AI 기반 경량 추론 엔진입니다.

### 특징
- **기본: LLM 없는 실시간 AI 추론 (베타: LLM 연동 지원)**
- **패턴 매칭 기반 고속 의도 분류**
- **도메인 특화 서버 모니터링 AI**
- **확장 가능한 플러그인 아키텍처**

### 사용법

```typescript
import { aiAgentEngine } from '@/modules/ai-agent';

// AI 엔진 초기화
await aiAgentEngine.initialize();

// 질의 처리
const response = await aiAgentEngine.processQuery({
  query: '전체 서버 상태를 알려주세요',
  sessionId: 'user-session-123'
});

console.log(response.response); // AI 응답
console.log(response.actions);  // 제안 액션들
```

### 독립 사용 예시

```typescript
// 다른 프로젝트에서 AI 엔진만 사용
import { AIAgentEngine } from './modules/ai-agent';

const aiEngine = AIAgentEngine.getInstance({
  enableMCP: true,
  enableInference: true,
  debugMode: true
});

await aiEngine.initialize();
const result = await aiEngine.processQuery({
  query: 'CPU 사용률이 높은 서버를 찾아주세요'
});
```

## 🎨 AI Sidebar

어떤 프로젝트에든 쉽게 통합 가능한 AI 사이드바 UI 모듈입니다.

### 특징
- **독립적인 React 컴포넌트**
- **커스터마이징 가능한 UI**
- **반응형 디자인 지원**
- **다크/라이트 테마 지원**

### 사용법

```tsx
import { AISidebar, useAISidebar, setupAISidebar } from '@/modules/ai-sidebar';

// 빠른 설정
const sidebar = setupAISidebar({
  apiEndpoint: '/api/ai-agent',
  theme: 'dark',
  position: 'right'
});

// React 컴포넌트에서 사용
function MyApp() {
  const { isOpen, openSidebar, closeSidebar } = useAISidebar();

  return (
    <div>
      <button onClick={openSidebar}>AI 도우미</button>
      
      <AISidebar
        config={{
          apiEndpoint: '/api/ai-agent',
          theme: 'auto',
          position: 'right',
          width: 400,
          title: 'AI Assistant',
          placeholder: '무엇을 도와드릴까요?'
        }}
        isOpen={isOpen}
        onClose={closeSidebar}
      />
    </div>
  );
}
```

### 다른 프로젝트에 통합

```tsx
// 1. 모듈 복사
cp -r ./modules/ai-sidebar ./your-project/src/modules/

// 2. 의존성 설치 (React, Tailwind CSS)
npm install react react-dom

// 3. 사용
import { AISidebar } from './modules/ai-sidebar';
```

## 🔌 MCP (Model Context Protocol)

표준 MCP 프로토콜을 지원하는 독립 모듈입니다.

### 특징
- **표준 MCP 프로토콜 준수**
- **베타: LLM 연동 지원 (선택사항)**
- **확장 가능한 아키텍처**

### 사용법

```typescript
import { MCPProcessor } from '@/modules/mcp';

const mcpProcessor = MCPProcessor.getInstance();
await mcpProcessor.initialize();

const response = await mcpProcessor.processQuery(
  '서버 성능을 분석해주세요',
  serverData
);
```

## 🔧 Shared Module

모든 모듈에서 공통으로 사용하는 유틸리티입니다.

### 사용법

```typescript
import { 
  generateId, 
  formatDate, 
  debounce, 
  deepMerge,
  MODULE_VERSIONS,
  API_ENDPOINTS 
} from '@/modules/shared';

// ID 생성
const sessionId = generateId('session');

// 날짜 포맷팅
const formattedDate = formatDate(new Date(), 'YYYY-MM-DD');

// 디바운스
const debouncedSearch = debounce(searchFunction, 300);

// 설정 병합
const config = deepMerge(defaultConfig, userConfig);
```

## 🚀 독립 모듈로 사용하기

### AI 에이전트 엔진만 사용

```bash
# 필요한 파일들만 복사
cp -r ./modules/ai-agent ./your-project/src/
cp -r ./modules/shared ./your-project/src/
```

```typescript
import { aiAgentEngine } from './ai-agent';

// 바로 사용 가능
const response = await aiAgentEngine.processQuery({
  query: 'System status check'
});
```

### AI 사이드바만 사용

```bash
# UI 모듈만 복사
cp -r ./modules/ai-sidebar ./your-project/src/
cp -r ./modules/shared ./your-project/src/
```

```tsx
import { AISidebar } from './ai-sidebar';

// 어떤 React 프로젝트에든 통합 가능
<AISidebar 
  config={{ apiEndpoint: 'https://your-api.com/ai' }}
  isOpen={true}
  onClose={() => {}}
/>
```

## 📦 패키지로 배포

각 모듈을 독립적인 npm 패키지로 배포할 수 있습니다:

```json
// package.json 예시
{
  "name": "@openmanager/ai-agent",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./core": "./dist/core/index.js",
    "./processors": "./dist/processors/index.js"
  }
}
```

## 🔄 모듈 간 통신

```typescript
// 이벤트 기반 통신
import { EventEmitter } from '@/modules/shared';

const eventBus = new EventEmitter();

// AI 엔진에서 이벤트 발생
eventBus.emit('ai:response', response);

// 사이드바에서 이벤트 수신
eventBus.on('ai:response', (response) => {
  updateUI(response);
});
```

## 🎯 확장 가능성

### 새로운 모듈 추가

```typescript
// modules/new-module/index.ts
export class NewModule {
  static getInstance() {
    // 싱글톤 패턴
  }
  
  async initialize() {
    // 초기화 로직
  }
}
```

### 플러그인 시스템

```typescript
// AI 에이전트에 새로운 프로세서 추가
import { CustomProcessor } from './custom-processor';

aiAgentEngine.addProcessor('custom', new CustomProcessor());
```

## 📋 체크리스트

### ✅ 완료된 기능
- [x] AI 에이전트 엔진 모듈화
- [x] AI 사이드바 UI 모듈화  
- [x] MCP 프로토콜 모듈화
- [x] 공유 유틸리티 모듈화
- [x] 독립적인 사용 가능
- [x] TypeScript 타입 지원
- [x] React 훅 제공

### 🔄 진행 중
- [ ] npm 패키지 배포
- [ ] 문서화 완성
- [ ] 테스트 코드 작성

### 📈 향후 계획
- [ ] 플러그인 시스템 확장
- [ ] 다른 프레임워크 지원 (Vue, Angular)
- [ ] 클라우드 배포 지원

이제 각 모듈을 독립적으로 사용하거나 다른 프로젝트에 쉽게 통합할 수 있습니다! 🎉 