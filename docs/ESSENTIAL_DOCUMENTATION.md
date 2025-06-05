# 📚 OpenManager Vibe v5 - 통합 가이드

> **AI-Powered 서버 모니터링 플랫폼**  
> **Enhanced AI Engine v2.0 + MCP 문서 활용 극대화**  
> **개발자**: jhhong (개인 프로젝트)

---

## 📋 목차

1. [🎯 프로젝트 개요](#-프로젝트-개요)
2. [🚀 빠른 시작](#-빠른-시작)
3. [🏗️ 시스템 아키텍처](#-시스템-아키텍처)
4. [🤖 Enhanced AI Engine v2.0](#-enhanced-ai-engine-v20)
5. [📊 모니터링 및 데이터 흐름](#-모니터링-및-데이터-흐름)
6. [🧪 테스트 및 배포](#-테스트-및-배포)
7. [📡 API 레퍼런스](#-api-레퍼런스)
8. [🔧 문제 해결](#-문제-해결)
9. [🛠️ 개발 환경 설정](#-개발-환경-설정)

---

## 🎯 프로젝트 개요

OpenManager Vibe v5는 **MCP(Model Context Protocol) 기반 AI 엔진**을 활용한 지능형 서버 모니터링 플랫폼입니다.

### ✨ 핵심 특징
- 🧠 **Enhanced AI Engine v2.0**: 벡터 DB 없는 고성능 문서 검색
- 📚 **MCP 문서 활용 극대화**: 실시간 컨텍스트 학습
- 🔄 **Render 자동 관리**: 무료 서비스 최적화
- ⚡ **Vercel 무료 최적화**: 1GB 메모리 제한 대응
- 🎯 **LLM 없이 완전 동작**: 기본 TensorFlow.js + MCP

### 🛠️ 기술 스택
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **AI Engine**: TensorFlow.js, MCP Protocol, Enhanced NLP
- **Backend**: FastAPI (Python), PostgreSQL
- **Deployment**: Vercel (무료), Render (무료)
- **Development**: Cursor AI, MCP Tools

---

## 🚀 빠른 시작

### 1. 기본 설치
```bash
# 저장소 클론
git clone https://github.com/yourusername/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 2. 환경 변수 설정
```bash
# .env.local 파일 생성
cp .env.example .env.local

# 필수 환경 변수 설정
DATABASE_URL="your_postgresql_url"
REDIS_URL="your_redis_url"
NEXTAUTH_SECRET="your_secret_key"

# AI 엔진 설정 (선택사항)
RENDER_API_KEY="your_render_key"
FASTAPI_BASE_URL="https://your-ai-engine.onrender.com"
```

### 3. 데이터베이스 초기화
```bash
# Prisma 마이그레이션
npx prisma migrate dev

# 시드 데이터 생성
npm run db:seed
```

### 4. Enhanced AI Engine 테스트
```bash
# AI 엔진 상태 확인
curl http://localhost:3000/api/ai/enhanced

# 스마트 쿼리 테스트
curl -X POST http://localhost:3000/api/ai/enhanced \
  -H "Content-Type: application/json" \
  -d '{"query": "시스템 성능 최적화 방법", "sessionId": "test123"}'
```

---

## 🏗️ 시스템 아키텍처

### 전체 구조도
```
┌─────────────────┬─────────────────┬─────────────────┐
│   프론트엔드     │     백엔드       │  Enhanced AI    │
├─────────────────┼─────────────────┼─────────────────┤
│ Next.js 14      │ Vercel 서버리스  │ TensorFlow.js   │
│ React 18        │ API Routes      │ MCP Protocol    │
│ TypeScript 5    │ PostgreSQL      │ Enhanced NLP    │
│ Tailwind CSS    │ Redis Cache     │ Document Search │
└─────────────────┴─────────────────┴─────────────────┘
```

### 핵심 컴포넌트

#### **1. 프론트엔드 (Next.js 14)**
- **실시간 대시보드**: WebSocket 기반 실시간 메트릭
- **AI 인터페이스**: Enhanced AI와의 자연어 대화
- **서버 관리**: 드래그&드롭 서버 등록 및 관리
- **반응형 UI**: 모바일/데스크톱 최적화

#### **2. 백엔드 (Vercel Serverless)**
- **API Routes**: RESTful API 엔드포인트
- **WebSocket**: 실시간 데이터 스트리밍
- **인증**: NextAuth.js 기반 사용자 관리
- **캐싱**: Redis 기반 고성능 캐시

#### **3. Enhanced AI Engine v2.0**
- **MCP 문서 검색**: 벡터 DB 없는 키워드 검색
- **컨텍스트 학습**: 실시간 세션 기반 학습
- **TensorFlow.js**: 경량 ML 모델 실행
- **Render 자동화**: 무료 서비스 활용 극대화

---

## 🤖 Enhanced AI Engine v2.0

### 🚀 주요 기능

#### **1. MCP 문서 활용 극대화**
```typescript
class EnhancedAIEngine {
  // 문서 기반 키워드 검색 (벡터 DB 없음)
  async searchDocuments(query: string): Promise<SearchResult[]> {
    const keywords = this.extractKeywords(query);
    const results = await this.mcpDocumentSearch(keywords);
    return this.rankResults(results, query);
  }

  // 실시간 컨텍스트 학습
  async learnFromSession(sessionId: string, interaction: Interaction) {
    await this.updateSessionContext(sessionId, interaction);
    await this.adaptResponses(sessionId);
  }
}
```

#### **2. Render 자동 관리**
```typescript
class RenderManager {
  // 자동 ping으로 슬립 방지
  async keepAlive(): Promise<void> {
    setInterval(async () => {
      await fetch(`${RENDER_SERVICE_URL}/ping`);
    }, 14 * 60 * 1000); // 14분마다
  }

  // 비용 효율적 서비스 관리
  async manageResources(): Promise<void> {
    if (this.isLowUsage()) {
      await this.scaleDown();
    } else {
      await this.scaleUp();
    }
  }
}
```

### 📊 성능 지표
- ⚡ **5초 내 응답**: 벡터 DB 없는 경량 검색
- 🧠 **90%+ 신뢰도**: MCP 문서 컨텍스트 활용
- 🔄 **자동 Render 관리**: 무료 서비스 최적화
- 💾 **1GB 메모리 내**: Vercel 무료 제한 준수

### 🎯 API 사용법

#### **스마트 쿼리**
```bash
# POST /api/ai/enhanced
curl -X POST http://localhost:3000/api/ai/enhanced \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CPU 사용률이 높을 때 최적화 방법",
    "sessionId": "user_123",
    "context": {
      "currentMetrics": {"cpu": 85, "memory": 70},
      "serverType": "web"
    }
  }'
```

#### **엔진 상태 확인**
```bash
# GET /api/ai/enhanced
curl http://localhost:3000/api/ai/enhanced
```

---

## 📊 모니터링 및 데이터 흐름

### 실시간 데이터 파이프라인

```
서버 메트릭 → 데이터 수집기 → Redis 캐시 → WebSocket → 대시보드
       ↓              ↓             ↓           ↓
   TensorFlow.js → AI 분석 → 알림 시스템 → 사용자 알림
```

### 주요 메트릭
- **시스템 메트릭**: CPU, Memory, Disk, Network
- **애플리케이션 메트릭**: Response Time, Error Rate, Throughput
- **AI 메트릭**: 예측 정확도, 이상 탐지율, 응답 시간

### 데이터 저장소

#### **PostgreSQL (메타데이터)**
- 서버 정보 및 설정
- 사용자 계정 및 권한
- AI 학습 기록

#### **Redis (시계열 + 캐시)**
- 실시간 메트릭 데이터
- WebSocket 세션 관리
- AI 컨텍스트 캐시

---

## 🧪 테스트 및 배포

### 테스트 전략

#### **1. 단위 테스트 (Vitest)**
```bash
# 컴포넌트 테스트
npm run test:unit

# AI 엔진 테스트
npm run test:ai
```

#### **2. 통합 테스트 (Playwright)**
```bash
# E2E 테스트
npm run test:e2e

# AI 인터페이스 테스트
npm run test:ai-interface
```

#### **3. 성능 테스트**
```bash
# Lighthouse 감사
npm run lighthouse

# AI 응답 시간 벤치마크
npm run benchmark:ai
```

### 배포 가이드

#### **Vercel 배포 (권장)**
```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 배포
vercel --prod

# 환경 변수 설정
vercel env add DATABASE_URL
vercel env add REDIS_URL
```

#### **Docker 배포**
```bash
# Docker 이미지 빌드
docker build -t openmanager-vibe .

# 컨테이너 실행
docker run -p 3000:3000 openmanager-vibe
```

---

## 📡 API 레퍼런스

### Enhanced AI Engine API

#### **POST /api/ai/enhanced**
스마트 쿼리 처리

**요청**:
```json
{
  "query": "시스템 성능 최적화 방법",
  "sessionId": "user_123",
  "context": {
    "currentMetrics": {"cpu": 85, "memory": 70},
    "serverType": "web"
  }
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "response": "CPU 사용률이 85%로 높습니다. 다음 최적화를 권장합니다...",
    "confidence": 0.92,
    "sources": ["performance-guide.md", "cpu-optimization.md"],
    "suggestions": ["프로세스 최적화", "캐시 설정", "스케일링"]
  },
  "metadata": {
    "responseTime": 1234,
    "sessionLearning": true,
    "renderStatus": "active"
  }
}
```

#### **GET /api/ai/enhanced**
엔진 상태 확인

**응답**:
```json
{
  "status": "healthy",
  "engine": "Enhanced v2.0",
  "features": {
    "documentSearch": true,
    "contextLearning": true,
    "renderManagement": true
  },
  "performance": {
    "avgResponseTime": 1.2,
    "accuracy": 0.91,
    "uptime": "99.8%"
  }
}
```

### 서버 관리 API

#### **GET /api/servers**
서버 목록 조회

#### **POST /api/servers**
새 서버 등록

#### **PUT /api/servers/[id]**
서버 정보 업데이트

#### **DELETE /api/servers/[id]**
서버 삭제

### 메트릭 API

#### **GET /api/metrics/realtime**
실시간 시스템 메트릭

#### **GET /api/metrics/timeseries**
시계열 메트릭 데이터

#### **POST /api/metrics/analyze**
메트릭 AI 분석

---

## 🔧 문제 해결

### 일반적인 문제

#### **1. AI 엔진 응답 없음**
```bash
# 엔진 상태 확인
curl http://localhost:3000/api/ai/enhanced

# Render 서비스 확인
curl https://your-ai-engine.onrender.com/health
```

**해결 방법**:
- Render 서비스가 슬립 상태인지 확인
- 환경 변수 `RENDER_API_KEY` 설정 확인
- 네트워크 연결 상태 점검

#### **2. 메모리 부족 (Vercel)**
```bash
# 메모리 사용량 확인
curl http://localhost:3000/api/system/status
```

**해결 방법**:
- TensorFlow.js 모델 크기 최적화
- Redis 캐시 설정 조정
- 불필요한 의존성 제거

#### **3. WebSocket 연결 끊김**
```bash
# WebSocket 상태 확인
curl http://localhost:3000/api/websocket/status
```

**해결 방법**:
- 연결 재시도 로직 확인
- 방화벽 설정 점검
- 프록시 설정 확인

### 성능 최적화

#### **1. AI 응답 시간 개선**
- 문서 인덱싱 최적화
- 키워드 추출 알고리즘 개선
- 캐시 활용 강화

#### **2. 메모리 사용량 최적화**
- 불필요한 컨텍스트 정리
- 메모리 풀 관리
- 가비지 컬렉션 최적화

#### **3. 네트워크 최적화**
- HTTP/2 활용
- 압축 설정 최적화
- CDN 활용

---

## 🛠️ 개발 환경 설정

### 필수 도구

#### **1. Node.js 환경**
```bash
# Node.js 22.x 설치 권장
node -v  # v22.15.1
npm -v   # 10.7.0
```

#### **2. 데이터베이스**
```bash
# PostgreSQL 설치
brew install postgresql  # macOS
sudo apt install postgresql  # Ubuntu

# Redis 설치
brew install redis  # macOS
sudo apt install redis-server  # Ubuntu
```

#### **3. 개발 도구**
- **Cursor AI**: MCP 프로토콜 지원 IDE
- **Docker**: 컨테이너 개발 환경
- **Git**: 버전 관리

### MCP 개발 도구 설정

#### **1. Cursor IDE 설정**
```json
// .cursor/mcp.json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/path/to/project"]
    },
    "memory": {
      "command": "npx", 
      "args": ["@modelcontextprotocol/server-memory"]
    }
  }
}
```

#### **2. GitHub MCP 설정**
```bash
# GitHub Personal Access Token 생성
# Settings > Developer settings > Personal access tokens

# 환경 변수 설정
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_your_token"
```

### 개발 워크플로우

#### **1. 기능 개발**
```bash
# 새 브랜치 생성
git checkout -b feature/new-feature

# 개발 및 테스트
npm run dev
npm run test

# 커밋 및 푸시
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin feature/new-feature
```

#### **2. 코드 품질 관리**
```bash
# 린트 검사
npm run lint

# 타입 체크
npm run type-check

# 포맷팅
npm run format
```

#### **3. 배포 전 체크리스트**
- [ ] 모든 테스트 통과
- [ ] 린트 오류 없음
- [ ] 타입 에러 없음
- [ ] 환경 변수 설정 완료
- [ ] 데이터베이스 마이그레이션 완료

---

## 📚 추가 리소스

### 문서
- [CHANGELOG.md](./CHANGELOG.md) - 상세 변경 이력
- [WHY_MCP_AI_ENGINE.md](./WHY_MCP_AI_ENGINE.md) - AI 엔진 설계 철학

### 외부 링크
- [MCP Protocol 공식 문서](https://modelcontextprotocol.io)
- [TensorFlow.js 가이드](https://www.tensorflow.org/js)
- [Next.js 14 문서](https://nextjs.org/docs)
- [Vercel 배포 가이드](https://vercel.com/docs)

### 커뮤니티
- GitHub Issues: 버그 리포트 및 기능 요청
- GitHub Discussions: 일반적인 질문 및 토론

---

**개발자**: jhhong (개인 프로젝트)  
**개발 도구**: Cursor AI + MCP (Model Context Protocol)  
**라이선스**: MIT License 