# 🔌 OpenManager Vibe V5 - API 및 배포 가이드

> **프로젝트**: OpenManager Vibe V5 - 지능형 AI 기반 서버 모니터링 시스템  
> **대상**: API 개발자, 시스템 관리자, DevOps 엔지니어  
> **최종 업데이트**: 2025-01-27  

---

## 📋 **개요**

이 문서는 OpenManager Vibe V5의 API 사용법과 프로덕션 배포 방법을 통합적으로 다룹니다.

### 🎯 **주요 내용**
- **순차 서버 생성 API**: 95% 성능 개선된 서버 배포 시스템
- **AI 에이전트 API**: 3단계 Fallback 시스템
- **실시간 스트리밍**: SSE 기반 사고 과정 전송
- **Vercel 배포**: 최적화된 프로덕션 설정
- **모니터링**: 운영 시 필수 체크사항

---

## 🚀 **API 시스템**

### **1. 순차 서버 생성 API**

#### **1.1 기본 사용법**

**서버 생성 시작**
```bash
POST /api/servers/next
Content-Type: application/json

{
  "currentCount": 0,
  "reset": false
}
```

**응답 예시**
```json
{
  "success": true,
  "server": {
    "id": "srv_001",
    "hostname": "web-prod-01",
    "name": "Production Web Server",
    "type": "web",
    "environment": "production",
    "location": "Seoul",
    "provider": "onpremise",
    "status": "online",
    "cpu": 45,
    "memory": 68,
    "disk": 23,
    "uptime": "15일 8시간",
    "ip": "192.168.1.10",
    "services": [
      {"name": "nginx", "status": "running", "port": 80},
      {"name": "php-fpm", "status": "running", "port": 9000}
    ]
  },
  "currentCount": 1,
  "isComplete": false,
  "progress": 5,
  "nextServerType": "Database",
  "message": "⚡ web-prod-01 서버 배포됨"
}
```

#### **1.2 서버 생성 순서**

시스템은 중요도에 따라 서버를 순차 생성합니다:

**1-3초: 핵심 서버**
```
1. web-prod-01      (웹 서버)
2. db-master-01     (데이터베이스)
3. api-gateway-prod (API 게이트웨이)
```

**4-9초: 클러스터 서버**
```
4. k8s-master-01    (쿠버네티스 마스터)
5. k8s-worker-01    (워커 노드)
6. k8s-worker-02    (워커 노드)
7. cache-redis-01   (캐시 서버)
8. k8s-ingress-01   (인그레스 컨트롤러)
9. proxy-nginx-01   (프록시 서버)
```

**10-20초: 지원 서버**
```
10-20. analytics, monitoring, backup, mail 등
```

#### **1.3 상태 관리**

**리셋**
```bash
POST /api/servers/next
{
  "reset": true
}
```

**상태 조회**
```bash
GET /api/servers/next

# 응답
{
  "success": true,
  "currentCount": 15,
  "totalServers": 20,
  "isComplete": false,
  "progress": 75
}
```

### **2. AI 에이전트 API**

#### **2.1 최적화된 AI 엔진**

**기본 쿼리**
```bash
POST /api/ai-agent/optimized
Content-Type: application/json

{
  "action": "smart-query",
  "query": "서버 CPU 사용률이 높은 이유를 분석해주세요",
  "serverData": {
    "metrics": {
      "cpu": {"current": 85.5, "history": [75, 80, 82, 85, 85.5]},
      "memory": {"current": 72.3, "history": [68, 70, 71, 72, 72.3]}
    }
  },
  "priority": "high"
}
```

**응답 예시**
```json
{
  "success": true,
  "response": "CPU 사용률이 높은 주요 원인:\n1. 프로세스 급증: nginx worker 프로세스가 평소 대비 3배 증가\n2. 메모리 압박: 72%의 높은 메모리 사용률로 인한 스왑 발생\n3. 권장사항: nginx worker_processes 조정 및 메모리 증설 검토",
  "metadata": {
    "processingTime": 1200,
    "method": "optimized_ai_engine",
    "fallbackUsed": false,
    "analysisDepth": "advanced"
  },
  "actions": [
    {
      "type": "config_optimization",
      "description": "nginx 설정 최적화",
      "impact": "high"
    }
  ]
}
```

#### **2.2 실시간 사고 과정 스트리밍**

**SSE 연결**
```bash
GET /api/ai-agent/thinking-process
Accept: text/event-stream

# 스트림 응답
data: {"step": "analyzing", "content": "서버 메트릭 분석 중...", "progress": 10}

data: {"step": "pattern_matching", "content": "유사한 패턴 검색 중...", "progress": 30}

data: {"step": "reasoning", "content": "CPU 스파이크 원인 추론 중...", "progress": 60}

data: {"step": "generating", "content": "해결방안 생성 중...", "progress": 90}

data: {"step": "completed", "result": {...}, "progress": 100}
```

#### **2.3 3단계 Fallback 시스템**

```mermaid
graph LR
    A[User Query] --> B{1차: Optimized API}
    B -->|Success| C[최적화 응답]
    B -->|Fail| D{2차: Pattern Matching}
    D -->|Success| E[패턴 기반 응답]
    D -->|Fail| F[3차: Fallback 응답]
```

**Fallback 응답 예시**
```json
{
  "success": true,
  "response": "현재 시스템이 일시적으로 제한된 상태입니다. 기본 분석 결과를 제공합니다.",
  "metadata": {
    "method": "fallback_system",
    "fallbackUsed": true,
    "originalError": "AI engine timeout"
  }
}
```

### **3. 관리자 API**

#### **3.1 로그 조회**
```bash
GET /api/ai-agent/admin/logs?limit=50&level=error

# 응답
{
  "logs": [
    {
      "timestamp": "2025-01-27T10:30:00Z",
      "level": "error",
      "message": "AI engine timeout",
      "context": {"query": "...", "processingTime": 15000}
    }
  ]
}
```

#### **3.2 통계 데이터**
```bash
GET /api/ai-agent/admin/stats

# 응답
{
  "totalQueries": 1247,
  "successRate": 94.2,
  "averageResponseTime": 2.3,
  "fallbackUsage": 5.8
}
```

---

## 🏗️ **배포 가이드**

### **1. Vercel 배포 (권장)**

#### **1.1 기본 배포**

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 연결
vercel

# 4. 프로덕션 배포
vercel --prod
```

#### **1.2 환경 변수 설정**

**Vercel 대시보드에서 설정:**
```bash
# 필수 환경 변수
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# 선택사항 (AI 기능 활성화 시)
VERCEL_PLAN=hobby  # 또는 pro
PYTHON_PATH=python3
AI_ENGINE_MODE=optimized

# 데이터베이스 (선택사항)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
```

#### **1.3 Vercel 설정 파일**

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" },
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/servers/next",
      "destination": "/api/servers/next"
    }
  ]
}
```

### **2. Docker 배포**

#### **2.1 Dockerfile**

```dockerfile
# 멀티스테이지 빌드로 최적화
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat python3 py3-pip
WORKDIR /app

# 의존성 설치
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production --frozen-lockfile

# 빌드
FROM base AS builder
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# 실행 환경
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### **2.2 Docker Compose**

```yaml
# docker-compose.yml
version: '3.8'

services:
  openmanager:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_APP_URL=http://localhost:3000
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    
  # 선택사항: Redis 캐시
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

### **3. AWS 배포**

#### **3.1 EC2 배포**

```bash
# 1. EC2 인스턴스 설정
sudo yum update -y
sudo yum install -y nodejs npm git

# 2. 프로젝트 클론
git clone <repository-url>
cd openmanager-vibe-v5

# 3. 의존성 설치 및 빌드
npm install
npm run build

# 4. PM2로 프로세스 관리
npm install -g pm2
pm2 start npm --name "openmanager" -- start
pm2 startup
pm2 save
```

#### **3.2 Load Balancer 설정**

```bash
# ALB Health Check 설정
Target: /api/health
Port: 3000
Protocol: HTTP
Success codes: 200
```

---

## 🔧 **운영 가이드**

### **1. 모니터링**

#### **1.1 핵심 메트릭**

**API 성능 모니터링**
```bash
# 순차 서버 생성 API 응답시간
curl -w "%{time_total}" -s -o /dev/null http://localhost:3000/api/servers/next

# AI 에이전트 응답시간
curl -w "%{time_total}" -s -o /dev/null \
  -H "Content-Type: application/json" \
  -d '{"action":"status"}' \
  http://localhost:3000/api/ai-agent/optimized
```

**시스템 리소스**
```bash
# 메모리 사용량
free -h

# CPU 사용률
top -p $(pgrep -f "node.*next")

# 디스크 사용량
df -h
```

#### **1.2 로그 모니터링**

**Vercel 로그**
```bash
# 실시간 로그 확인
vercel logs --follow

# 오류 로그만 필터링
vercel logs --level error
```

**Docker 로그**
```bash
# 컨테이너 로그 확인
docker logs -f openmanager-container

# 로그 파일 로테이션
docker run --log-opt max-size=10m --log-opt max-file=3
```

### **2. 백업 및 복구**

#### **2.1 설정 백업**

```bash
# 환경 변수 백업
cp .env.local .env.backup.$(date +%Y%m%d)

# 빌드 캐시 백업 (선택사항)
tar -czf build-cache-backup.tar.gz .next/cache
```

#### **2.2 데이터베이스 백업**

```bash
# Supabase 백업 (SQL 덤프)
pg_dump "postgresql://user:pass@host:port/db" > backup.sql

# 자동 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump "postgresql://..." > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
```

### **3. 성능 최적화**

#### **3.1 응답 속도 최적화**

**순차 서버 생성 최적화**
```typescript
// 서버 생성 캐싱
const serverCache = new Map();

function getCachedServer(hostname: string) {
  if (serverCache.has(hostname)) {
    return serverCache.get(hostname);
  }
  
  const server = generateServer(hostname);
  serverCache.set(hostname, server);
  return server;
}
```

**AI 응답 캐싱**
```typescript
// Redis 캐싱 (선택사항)
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function getCachedAIResponse(query: string) {
  const cached = await redis.get(`ai:${query}`);
  if (cached) return JSON.parse(cached);
  
  const response = await processAIQuery(query);
  await redis.setex(`ai:${query}`, 300, JSON.stringify(response)); // 5분 캐시
  return response;
}
```

#### **3.2 메모리 최적화**

```javascript
// next.config.ts
const nextConfig = {
  // 프로덕션 최적화
  poweredByHeader: false,
  compress: true,
  
  // 번들 최적화
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion']
  },
  
  // 이미지 최적화
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true
  }
};
```

---

## 🚨 **문제 해결**

### **1. 일반적인 배포 오류**

#### **Vercel 빌드 실패**
```bash
# 로컬에서 빌드 테스트
npm run build

# 의존성 문제 해결
rm -rf node_modules package-lock.json
npm install

# 타입 오류 확인
npm run type-check
```

#### **메모리 초과 오류**
```bash
# Node.js 메모리 증가
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Vercel에서 메모리 설정
vercel env add NODE_OPTIONS "--max-old-space-size=4096"
```

### **2. API 응답 지연**

#### **순차 서버 생성 지연**
```bash
# 서버 생성 리셋
curl -X POST http://localhost:3000/api/servers/next \
  -H "Content-Type: application/json" \
  -d '{"reset": true}'

# VirtualServerManager 재시작
# 애플리케이션 재시작으로 해결
```

#### **AI 에이전트 타임아웃**
```bash
# AI 엔진 상태 확인
curl http://localhost:3000/api/ai-agent/optimized

# Fallback 시스템 확인
curl -X POST http://localhost:3000/api/ai-agent/integrated \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

---

## 📊 **성능 지표**

### **목표 성능**

| 메트릭 | 목표값 | 현재값 |
|--------|--------|--------|
| 순차 서버 생성 API | 100ms 이하 | 50-100ms ✅ |
| AI 에이전트 응답 | 5초 이하 | 2-5초 ✅ |
| 페이지 로드 시간 | 2초 이하 | 1.5초 ✅ |
| Vercel 빌드 시간 | 5분 이하 | 3분 ✅ |
| 메모리 사용량 | 1GB 이하 | 300MB ✅ |

### **모니터링 대시보드**

**주요 KPI**
- API 성공률: 95% 이상
- 평균 응답시간: 1초 이하
- 시스템 가용성: 99.9%
- 오류율: 1% 이하

---

## 🎯 **다음 단계**

### **1. 확장 계획**
- [ ] CDN 연동으로 글로벌 성능 향상
- [ ] 마이크로서비스 아키텍처 전환
- [ ] 실시간 알림 시스템 구축
- [ ] 모바일 API 최적화

### **2. 보안 강화**
- [ ] JWT 인증 시스템 도입
- [ ] Rate Limiting 구현
- [ ] HTTPS 강제 적용
- [ ] API 키 관리 시스템

---

**🎉 이제 OpenManager Vibe V5를 안정적으로 운영할 수 있습니다!**

추가 질문이나 문제가 있으시면 이슈를 생성하거나 개발팀에 문의해주세요.

---

*최종 업데이트: 2025년 1월 27일* 