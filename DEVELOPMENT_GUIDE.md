# 🚀 OpenManager Vibe v5 - 통합 개발 가이드

> **마지막 업데이트**: 2025년 6월 30일  
> **버전**: v5.21.0  
> **상태**: AI 엔진 v3.0 Vercel 배포 완료 ✅

---

## 📋 목차

1. [🏗️ 프로젝트 설정](#-프로젝트-설정)
2. [🚀 배포 가이드](#-배포-가이드) 
3. [🧪 테스트 가이드](#-테스트-가이드)
4. [🔧 AI 시스템 설정](#-ai-시스템-설정)
5. [🐛 트러블슈팅](#-트러블슈팅)
6. [⚙️ 고급 설정](#-고급-설정)

---

## 🏗️ **프로젝트 설정**

### **1. 환경 요구사항**
```bash
Node.js: v18.17.0 이상
npm: v9.0.0 이상
Memory: 최소 8GB (AI 모델 로딩)
Disk: 최소 5GB (node_modules + 빌드)
```

### **2. 저장소 클론 및 초기 설정**
```bash
# 저장소 클론
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# Node.js 버전 설정 (.nvmrc 사용)
nvm use

# 의존성 설치
npm ci

# 환경 변수 설정
cp .env.example .env.local
```

### **3. 환경 변수 설정**
```env
# .env.local
NODE_ENV=development

# 데이터베이스 (선택사항)
DATABASE_URL=postgresql://user:password@localhost:5432/openmanager

# Redis 캐시 (선택사항)
REDIS_URL=redis://localhost:6379
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io

# 외부 연동 (선택사항)  
SLACK_WEBHOOK_URL=https://hooks.slack.com/your-webhook
```

### **4. 개발 서버 시작**
```bash
# 개발 모드 실행
npm run dev

# 브라우저에서 접속
http://localhost:3000
```

---

## 🚀 **배포 가이드**

### **1. 배포 전 체크리스트**
```bash
# 📦 패키지 의존성 확인
npm ci

# 🔍 타입 체크
npm run type-check

# 🧹 ESLint 검사 (선택사항)
npm run lint

# 🏗️ 빌드 테스트
npm run build

# ✅ 모든 단계를 한번에 실행
npm run deploy-check
```

### **2. Vercel 배포**
```bash
# Vercel CLI 설치 (최초 1회)
npm i -g vercel

# 프로젝트 배포
vercel --prod

# 환경 변수 설정 (Vercel 대시보드에서)
# NODE_ENV=production
# REDIS_URL=your-production-redis-url
```

### **3. 배포 후 검증**
```bash
# 기본 API 테스트
curl https://your-project.vercel.app/api/health

# AI 엔진 v3.0 테스트
curl https://your-project.vercel.app/api/v3/ai?action=health

# AI 분석 테스트
curl -X POST https://your-project.vercel.app/api/v3/ai \
  -H "Content-Type: application/json" \
  -d '{"query": "서버 상태를 분석해주세요", "language": "ko"}'
```

---

## 🧪 **테스트 가이드**

### **1. 단위 테스트**
```bash
# Jest 테스트 실행
npm run test

# 커버리지 포함 테스트
npm run test:coverage

# 특정 파일 테스트
npm run test -- services/ai
```

### **2. E2E 테스트**
```bash
# Playwright E2E 테스트
npm run e2e

# 특정 브라우저 테스트
npm run e2e -- --project=chromium

# UI 모드로 테스트
npm run e2e -- --ui
```

### **3. AI 시스템 테스트**
```bash
# AI 엔진 v3.0 상태 확인
curl http://localhost:3000/api/v3/ai?action=health

# TensorFlow.js 모델 테스트
curl http://localhost:3000/api/v3/ai?action=models

# MCP 클라이언트 테스트  
curl http://localhost:3000/api/v3/ai?action=mcp

# 통합 AI 분석 테스트
curl -X POST http://localhost:3000/api/v3/ai \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CPU 사용률이 90%입니다. 장애 가능성을 분석해주세요.",
    "language": "ko",
    "include_predictions": true
  }'
```

---

## 🔧 **AI 시스템 설정**

### **1. AI 엔진 v3.0 아키텍처**
```typescript
// 3개 AI 모델 동시 실행
1. 장애 예측 신경망 (4층, ReLU+Sigmoid)
2. 이상 탐지 오토인코더 (20→4→20)
3. 시계열 예측 LSTM (50+50 유닛)

// MCP (Model Context Protocol) 통합
- 파일시스템 서버 연동
- 메모리 서버 (세션 관리)
- 웹 검색 서버 (선택사항)
```

### **2. MCP 서버 설정**
```json
// MCP 서버 설정 (.mcp/settings.json)
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["@mcp/server-filesystem", "/allowed/path"]
    },
    "memory": {
      "command": "npx", 
      "args": ["@mcp/server-memory"]
    }
  }
}
```

---

## 🐛 **트러블슈팅**

### **1. 일반적인 문제**

#### **❌ npm install 에러**
```bash
# package-lock.json 재생성
rm package-lock.json node_modules -rf
npm install

# 캐시 클리어
npm cache clean --force
```

#### **❌ 타입 에러**
```bash
# 타입 체크로 문제 확인
npm run type-check

# TypeScript 설정 확인
cat tsconfig.json

# 타입 정의 업데이트
npm install @types/node --save-dev
```

#### **❌ 빌드 에러**
```bash
# 상세한 빌드 에러 확인
npm run build 2>&1 | tee build.log

# Next.js 캐시 클리어
rm -rf .next

# ESLint 무시하고 빌드
SKIP_LINT=true npm run build
```

### **2. AI 시스템 문제**

#### **❌ AI 모델 로딩 실패**
```bash
# TensorFlow.js 설치 확인
npm list @tensorflow/tfjs

# 메모리 부족 시 Node.js 옵션 추가
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# GPU 가속 비활성화 (호환성 문제 시)
TF_CPP_MIN_LOG_LEVEL=2 npm run dev
```

#### **❌ MCP 연결 실패**
```bash
# MCP 서버 상태 확인
curl http://localhost:3000/api/mcp/status

# MCP 서버 재시작
npm run mcp:restart

# MCP 로그 확인
tail -f logs/mcp-server.log
```

### **3. 배포 관련 문제**

#### **❌ Vercel 배포 실패**
```bash
# Vercel 빌드 로그 확인
vercel logs

# 로컬에서 프로덕션 빌드 테스트
npm run build
npm run start

# 환경 변수 확인
vercel env ls
```

---

**📝 이 가이드는 프로젝트 발전에 따라 지속적으로 업데이트됩니다.**  
**❓ 문제가 있으시면 GitHub 이슈를 등록해주세요.** 