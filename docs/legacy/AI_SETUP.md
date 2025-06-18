# 🤖 AI Setup Guide

OpenManager Vibe v5의 **AI 기능 완전 설정 가이드**입니다.

## 🧠 AI 엔진 개요

OpenManager Vibe v5는 다음 AI 기술을 사용합니다:

- **Google AI Studio (Gemini 1.5 Flash)**: 주요 AI 엔진
- **MCP (Model Context Protocol)**: AI 컨텍스트 관리
- **Vector Database**: 로컬 벡터 검색
- **RAG (Retrieval-Augmented Generation)**: 컨텍스트 기반 응답

## 🔑 Google AI Studio 설정

### 1️⃣ API 키 발급

1. [Google AI Studio](https://aistudio.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. **Get API Key** 클릭
4. API 키 복사

### 2️⃣ 환경 변수 설정

```bash
# .env.local 파일에 추가
GOOGLE_AI_API_KEY=your_actual_api_key_here
GOOGLE_AI_MODEL=gemini-1.5-flash
GOOGLE_AI_MAX_TOKENS=8192
GOOGLE_AI_TEMPERATURE=0.7
```

### 3️⃣ API 키 검증

```bash
# API 키 테스트
npm run ai:test:google

# 또는 직접 테스트
curl -H "Content-Type: application/json" \
     -H "Authorization: Bearer $GOOGLE_AI_API_KEY" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

## 🔄 MCP (Model Context Protocol) 설정

### 자동 설정 (권장)

```bash
# MCP 완벽 설정
npm run mcp:perfect:setup

# MCP 서버 시작
npm run mcp:dev

# 설정 검증
npm run mcp:validate
```

### 수동 설정

#### 1. MCP 서버 설치

```bash
# 글로벌 설치
npm install -g @modelcontextprotocol/server

# 또는 로컬 설치
npm install --save-dev @modelcontextprotocol/server
```

#### 2. MCP 설정 파일

```json
// mcp-config/cursor-dev/mcp-config.json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/path/to/project"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    "openmanager": {
      "command": "node",
      "args": ["mcp-server/index.js"],
      "env": {
        "PORT": "3001",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

#### 3. MCP 서버 시작

```bash
# 백그라운드에서 MCP 서버 시작
npm run mcp:start

# 로그 확인
npm run mcp:logs

# 상태 확인
npm run mcp:status
```

## 🗄️ Vector Database 설정

### 로컬 Vector Database

```bash
# Vector DB 초기화
npm run vector-db:init

# 문서 인덱싱
npm run vector-db:index

# 검색 테스트
npm run vector-db:test
```

### 설정 파일

```typescript
// src/config/vector-db.ts
export const vectorDbConfig = {
  provider: 'local', // 'local' | 'pinecone' | 'weaviate'
  dimensions: 1536,
  similarity: 'cosine',
  batchSize: 100,
  maxResults: 10,
  threshold: 0.7,
};
```

## 🎯 AI 기능 구성

### 1️⃣ 서버 분석 AI

```typescript
// AI 서버 분석 설정
export const serverAnalysisConfig = {
  enabled: true,
  analysisInterval: 300000, // 5분
  alertThreshold: 0.8,
  metricsToAnalyze: ['cpu_usage', 'memory_usage', 'disk_usage', 'network_io'],
};
```

### 2️⃣ 이상 탐지 AI

```typescript
// 이상 탐지 설정
export const anomalyDetectionConfig = {
  enabled: true,
  algorithm: 'isolation_forest',
  sensitivity: 0.1,
  historicalDataDays: 30,
  retrainInterval: 86400000, // 24시간
};
```

### 3️⃣ 추천 시스템

```typescript
// AI 추천 시스템 설정
export const recommendationConfig = {
  enabled: true,
  updateInterval: 3600000, // 1시간
  maxRecommendations: 5,
  confidence: 0.7,
};
```

## 🔧 고급 설정

### AI 응답 커스터마이징

```typescript
// src/config/ai-prompts.ts
export const aiPrompts = {
  serverAnalysis: `
    다음 서버 메트릭을 분석하고 한국어로 응답해주세요:
    - CPU 사용률: {cpu}%
    - 메모리 사용률: {memory}%
    - 디스크 사용률: {disk}%
    
    문제점과 개선사항을 제안해주세요.
  `,

  anomalyDetection: `
    서버 데이터에서 이상 패턴을 감지했습니다.
    다음 정보를 바탕으로 분석해주세요:
    {anomalyData}
    
    즉시 조치가 필요한지 판단해주세요.
  `,
};
```

### 성능 최적화

```typescript
// AI 성능 설정
export const aiPerformanceConfig = {
  // 응답 캐싱
  caching: {
    enabled: true,
    ttl: 300000, // 5분
    maxSize: 100,
  },

  // 배치 처리
  batching: {
    enabled: true,
    batchSize: 10,
    timeout: 5000,
  },

  // 속도 제한
  rateLimit: {
    enabled: true,
    maxRequests: 60,
    windowMs: 60000, // 1분
  },
};
```

## 🧪 AI 기능 테스트

### 기본 테스트

```bash
# AI 엔진 상태 확인
npm run ai:health

# Google AI 연결 테스트
npm run ai:test:google

# MCP 연결 테스트
npm run ai:test:mcp

# Vector DB 테스트
npm run ai:test:vector
```

### 통합 테스트

```bash
# 전체 AI 스택 테스트
npm run ai:test:integration

# 서버 분석 테스트
npm run ai:test:analysis

# 추천 시스템 테스트
npm run ai:test:recommendations
```

## 🔍 모니터링 및 디버깅

### AI 성능 모니터링

```bash
# AI 메트릭 확인
npm run ai:metrics

# 응답 시간 모니터링
npm run ai:performance

# 에러 로그 확인
npm run ai:logs:error
```

### 디버그 모드

```bash
# AI 디버그 모드로 실행
DEBUG=ai:* npm run dev

# 상세 로깅 활성화
LOG_LEVEL=debug npm run dev
```

## 🛡️ 보안 설정

### API 키 보안

```bash
# API 키 암호화 (프로덕션용)
npm run security:encrypt-keys

# API 키 순환
npm run security:rotate-keys
```

### 요청 검증

```typescript
// AI 요청 검증 설정
export const aiSecurityConfig = {
  validateRequests: true,
  sanitizeInputs: true,
  maxInputLength: 4000,
  blockedPatterns: [/system|admin|root/i, /password|secret|key/i],
};
```

## 📊 사용량 관리

### Google AI 할당량 모니터링

```bash
# 할당량 확인
npm run ai:quota:check

# 사용량 통계
npm run ai:usage:stats

# 비용 추정
npm run ai:cost:estimate
```

### 할당량 관리

```typescript
// 할당량 관리 설정
export const quotaConfig = {
  dailyLimit: 1000,
  hourlyLimit: 100,
  warningThreshold: 0.8,
  autoThrottle: true,
};
```

## 🔧 문제 해결

### 일반적인 문제

#### Google AI API 키 오류

```bash
# API 키 검증
npm run ai:validate:key

# 새 API 키로 교체
npm run ai:update:key
```

#### MCP 연결 실패

```bash
# MCP 서버 재시작
npm run mcp:restart

# MCP 설정 재검증
npm run mcp:revalidate
```

#### Vector DB 인덱싱 실패

```bash
# Vector DB 재초기화
npm run vector-db:reset

# 문서 재인덱싱
npm run vector-db:reindex
```

## 📚 다음 단계

AI 설정이 완료되었다면:

1. [🛠️ Development Guide](DEVELOPMENT.md) - 개발 워크플로우
2. [🏗️ Architecture](ARCHITECTURE.md) - AI 아키텍처 이해
3. [📊 Monitoring](MONITORING.md) - AI 성능 모니터링
4. [☁️ Deployment](DEPLOYMENT.md) - AI 기능 배포

## 🆘 도움말

AI 설정 중 문제가 발생하면:

- AI 관련 로그: `logs/ai-analysis/`
- MCP 로그: `logs/mcp/`
- [GitHub Issues](https://github.com/your-username/openmanager-vibe-v5/issues)
- [AI Setup FAQ](https://docs.openmanager.dev/ai-faq)
