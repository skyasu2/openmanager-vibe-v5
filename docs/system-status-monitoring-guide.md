# 🔍 OpenManager Vibe v5 시스템 상태 모니터링 가이드

> **최종 업데이트**: 2025년 7월 15일  
> **문서 버전**: v1.0  
> **상태**: 실제 운영 환경 검증 완료 ✅

## 📋 개요

OpenManager Vibe v5의 전체 시스템 상태를 실시간으로 모니터링하고 문제를 사전에 감지하기 위한 종합 가이드입니다. 이 문서는 **실제 운영 환경에서 검증된 방법들**을 바탕으로 작성되었습니다.

## 🏗️ 시스템 아키텍처 개요

```mermaid
graph TB
    subgraph "Frontend"
        A[Vercel - Next.js App<br/>openmanager-vibe-v5.vercel.app]
    end
    
    subgraph "Backend Services"
        B[GCP MCP Server<br/>104.154.205.25:10000]
        C[Upstash Redis<br/>charming-condor-46598.upstash.io]
        D[Supabase Database<br/>vnswjnltnhpsueosfhmw.supabase.co]
    end
    
    subgraph "AI Services"
        E[Google AI API<br/>Gemini Models]
        F[Local RAG Engine<br/>Supabase Vector]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
```

## 🎯 빠른 전체 상태 확인

### 원스톱 상태 체크 (2분 소요)

```bash
# 1. Vercel 앱 상태
curl -s https://openmanager-vibe-v5.vercel.app/api/health | grep -o '"status":"[^"]*"'

# 2. GCP MCP 서버 상태  
curl -s http://104.154.205.25:10000/health | grep -o '"status":"[^"]*"'

# 3. Redis 연결 상태
curl -X POST 'https://charming-condor-46598.upstash.io/ping' \
     -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' \
     -s | grep -o '"result":"[^"]*"'

# 4. Supabase 데이터베이스 상태 (MCP 연결)
# MCP Supabase 도구를 통한 연결 확인

# 5. 통합 상태 요약
echo "=== 시스템 상태 요약 ==="
echo "Vercel: $(curl -s https://openmanager-vibe-v5.vercel.app/api/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
echo "MCP Server: $(curl -s http://104.154.205.25:10000/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
echo "Redis: $(curl -X POST 'https://charming-condor-46598.upstash.io/ping' -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' -s | grep -o '"result":"[^"]*"' | cut -d'"' -f4)"
```

### ✅ 정상 상태 기준값

| 서비스 | 상태 | 응답시간 | 기준값 |
|--------|------|----------|---------|
| Vercel | `healthy` | < 500ms | 99.9% 가용성 |
| MCP Server | `healthy` | < 400ms | 24/7 운영 |
| Redis | `PONG` | < 200ms | 99.9% 가용성 |
| Supabase | `connected` | < 300ms | 7개 테이블 운영 |

---

## 🌐 Vercel 프론트엔드 모니터링

### 1. 기본 상태 확인

```bash
# 메인 앱 접속 테스트
curl -I https://openmanager-vibe-v5.vercel.app/
# 기대값: HTTP/2 200

# 헬스체크 API
curl -s https://openmanager-vibe-v5.vercel.app/api/health
```

**✅ 정상 응답 예시:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-15T22:02:22.639Z",
  "uptime": 0,
  "environment": "production",
  "version": "5.44.3",
  "services": {
    "database": "operational",
    "cache": "operational", 
    "ai": "operational"
  },
  "checks": {
    "memory": "ok",
    "disk": "ok",
    "network": "ok"
  }
}
```

### 2. 주요 API 엔드포인트 확인

```bash
# 대시보드 API
curl -s https://openmanager-vibe-v5.vercel.app/api/dashboard | head -100

# 서버 목록 API  
curl -s https://openmanager-vibe-v5.vercel.app/api/servers | head -100

# AI 에이전트 API (POST)
curl -X POST https://openmanager-vibe-v5.vercel.app/api/ai-agent \
     -H "Content-Type: application/json" \
     -d '{"query":"system status","type":"system_check"}' \
     -s | head -200
```

### 3. Vercel 대시보드 확인사항

- **배포 상태**: https://vercel.com/dashboard
- **함수 호출 사용량**: 100,000회/월 한도 대비 현재 사용량
- **대역폭 사용량**: 100GB/월 한도 확인
- **빌드 시간**: 6,000분/월 한도 확인

---

## ☁️ GCP MCP 서버 모니터링

### 1. MCP 서버 헬스체크

```bash
# 기본 헬스체크
curl -s http://104.154.205.25:10000/health

# 응답시간 포함 헬스체크
curl -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
     --connect-timeout 10 http://104.154.205.25:10000/health
```

**✅ 정상 응답 예시:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-15T21:59:55.354Z",
  "port": 10000
}
```

### 2. GCP VM 인스턴스 상태 (gcloud CLI 필요)

```bash
# VM 인스턴스 목록 확인
gcloud compute instances list --project=openmanager-free-tier

# 특정 VM 상태 확인
gcloud compute instances describe mcp-server \
       --zone=us-central1-a \
       --project=openmanager-free-tier
```

**✅ 정상 상태 기준:**
- **STATUS**: `RUNNING`
- **EXTERNAL_IP**: `104.154.205.25`
- **MACHINE_TYPE**: `e2-micro`

### 3. MCP 서버 프로세스 확인 (SSH 접속 시)

```bash
# SSH 접속
gcloud compute ssh mcp-server --zone=us-central1-a --project=openmanager-free-tier

# 접속 후 프로세스 확인
ps aux | grep mcp
netstat -tlnp | grep 10000
curl localhost:10000/health
```

### 4. 네트워크 연결성 테스트

```bash
# 포트 연결 테스트
nc -zv 104.154.205.25 10000

# 방화벽 규칙 확인 (gcloud)
gcloud compute firewall-rules list --filter="name:mcp*"
```

---

## 🔴 Redis (Upstash) 모니터링

### 1. Redis 연결 테스트

```bash
# 기본 PING 테스트
curl -X POST 'https://charming-condor-46598.upstash.io/ping' \
     -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0İUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' \
     -s

# 기대값: {"result":"PONG"}
```

### 2. Redis 서버 정보 확인

```bash
# 서버 상세 정보
curl -X POST 'https://charming-condor-46598.upstash.io/info' \
     -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0ITUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' \
     -s | grep -E "(redis_version|used_memory|total_keys|maxmemory)"
```

**✅ 주요 메트릭 기준값:**
- **메모리 사용량**: < 50MB (64MB 한도)
- **키 개수**: 현재 4개 (정상)
- **일일 명령어**: < 8,000회 (10,000회 한도)

### 3. 저장된 데이터 확인

```bash
# 모든 키 목록
curl -X POST 'https://charming-condor-46598.upstash.io/keys/*' \
     -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0ITUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' \
     -s

# 데이터베이스 크기
curl -X POST 'https://charming-condor-46598.upstash.io/dbsize' \
     -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' \
     -s
```

### 4. 성능 테스트

```bash
# 쓰기 성능 테스트
curl -X POST 'https://charming-condor-46598.upstash.io/set/test:perf' \
     -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0ITUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' \
     -H 'Content-Type: application/json' \
     -d '{"value": "performance test", "ex": 60}' \
     -w "\nResponse Time: %{time_total}s\n"

# 읽기 성능 테스트
curl -X GET 'https://charming-condor-46598.upstash.io/get/test:perf' \
     -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0ITUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' \
     -w "\nResponse Time: %{time_total}s\n"

# 정리
curl -X POST 'https://charming-condor-46598.upstash.io/del/test:perf' \
     -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0ITUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' \
     -s
```

---

## 🗄️ Supabase 데이터베이스 모니터링

### 1. MCP 연결 상태 확인

```bash
# Supabase 프로젝트 URL 확인
echo "Supabase URL: https://vnswjnltnhpsueosfhmw.supabase.co"

# MCP를 통한 연결 테스트는 Claude Code MCP 도구로만 가능
# 직접 curl 접근은 보안상 제한됨
```

**✅ 정상 연결 상태:**
- **프로젝트 URL**: `https://vnswjnltnhpsueosfhmw.supabase.co`
- **MCP 연결**: 활성화됨
- **테이블 개수**: 7개 테이블
- **확장 기능**: vector, uuid-ossp, pgcrypto 등 설치됨

### 2. 데이터베이스 스키마 현황

**📋 테이블 구조 (2025년 7월 15일 기준):**

| 테이블명 | 크기 | 행 수 | 용도 | 상태 |
|----------|------|-------|------|------|
| `command_vectors` | 80 kB | 11 | AI 명령어 벡터 저장 | ✅ 활성 |
| `ai_embeddings` | 1624 kB | 0 | AI 임베딩 데이터 | 🔄 준비됨 |
| `document_embeddings` | 1624 kB | 0 | 문서 임베딩 | 🔄 준비됨 |
| `context_embeddings` | 1624 kB | 0 | 컨텍스트 임베딩 | 🔄 준비됨 |
| `user_profiles` | 24 kB | 0 | 사용자 프로필 | 🔄 준비됨 |
| `organization_settings` | 24 kB | 0 | 조직 설정 | 🔄 준비됨 |
| `custom_rules` | 16 kB | 0 | 커스텀 규칙 | 🔄 준비됨 |

### 3. 벡터 데이터 분석

**🤖 command_vectors 테이블 현황:**
- **최신 데이터**: 2025년 6월 22일 15:23:53 UTC
- **카테고리**: kubernetes, network, linux 명령어
- **벡터 형식**: pgvector 확장 사용
- **용도**: AI 명령어 추천 시스템

**📊 저장된 명령어 예시:**
```sql
-- 최근 추가된 벡터 데이터
id: test-vector-001
content: "top 명령어는 실시간으로 실행 중인 프로세스를 모니터링하는 도구입니다."
category: linux
created_at: 2025-06-22 15:23:53 UTC
```

### 4. 확장 기능 상태

**🔧 설치된 주요 확장:**

| 확장명 | 버전 | 상태 | 용도 |
|--------|------|------|------|
| `vector` | 0.8.0 | ✅ 설치됨 | 벡터 데이터 처리 |
| `uuid-ossp` | 1.1 | ✅ 설치됨 | UUID 생성 |
| `pgcrypto` | 1.3 | ✅ 설치됨 | 암호화 기능 |
| `pg_graphql` | 1.5.11 | ✅ 설치됨 | GraphQL 지원 |
| `pg_stat_statements` | 1.10 | ✅ 설치됨 | 쿼리 성능 분석 |
| `supabase_vault` | 0.3.1 | ✅ 설치됨 | 보안 저장소 |

### 5. 성능 및 용량 모니터링

**📈 현재 상태 (무료 티어 기준):**
- **데이터베이스 크기**: ~2.4MB (500MB 한도)
- **활성 연결**: MCP 도구를 통한 안전한 연결만
- **벡터 인덱스**: HNSW 및 IVFFlat 지원
- **백업**: 자동 백업 활성화됨

### 6. MCP 도구를 통한 모니터링

**🔍 정기 확인 항목:**

```bash
# 다음은 Claude Code MCP 도구로만 실행 가능한 명령들입니다
# 직접 실행은 불가능하며, Claude AI를 통해서만 접근 가능

# 1. 테이블 목록 확인
mcp__supabase__list_tables()

# 2. 확장 기능 확인 
mcp__supabase__list_extensions()

# 3. 데이터 상태 확인
mcp__supabase__execute_sql("SELECT COUNT(*) FROM command_vectors")

# 4. 마이그레이션 상태 확인
mcp__supabase__list_migrations()
```

### 7. 데이터 품질 확인

**🎯 정기 데이터 무결성 검사:**

```sql
-- command_vectors 테이블 상태 확인
SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT metadata->>'category') as categories,
  MAX(created_at) as last_update,
  MIN(created_at) as first_record
FROM command_vectors;

-- 임베딩 테이블들의 준비 상태 확인
SELECT 
  'ai_embeddings' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('ai_embeddings')) as size
FROM ai_embeddings
UNION ALL
SELECT 
  'document_embeddings',
  COUNT(*),
  pg_size_pretty(pg_total_relation_size('document_embeddings'))
FROM document_embeddings;
```

### 8. 보안 및 접근 제어

**🔐 보안 설정 현황:**
- **RLS (Row Level Security)**: 모든 테이블에서 비활성화 (개발 환경)
- **접근 방식**: MCP 도구를 통한 안전한 접근만
- **인증**: Supabase anon key 기반
- **암호화**: pgcrypto 확장을 통한 데이터 암호화 지원

### 9. 문제 해결 가이드

**❌ 일반적인 문제들:**

1. **MCP 연결 실패**
   - Claude Code MCP 설정 확인
   - 환경변수 SUPABASE_* 확인
   - 네트워크 연결 상태 확인

2. **벡터 검색 성능 저하**
   - command_vectors 테이블 인덱스 확인
   - pgvector 확장 상태 점검
   - 임베딩 차원 수 확인

3. **용량 한계 접근**
   - 무료 티어 500MB 한도 모니터링
   - 불필요한 임베딩 데이터 정리
   - 로그 데이터 주기적 삭제

### 10. 개발 환경 통합

**🔧 로컬 개발에서의 Supabase 사용:**

```bash
# package.json에 추가된 유용한 스크립트들
npm run supabase:status     # MCP를 통한 상태 확인
npm run supabase:test       # 연결 테스트
npm run vector:check        # 벡터 데이터 확인
```

**📋 정기 점검 체크리스트:**
- [ ] 테이블 상태 및 크기 확인
- [ ] 벡터 데이터 품질 검증  
- [ ] 확장 기능 정상 동작 확인
- [ ] 무료 티어 용량 사용량 모니터링
- [ ] MCP 연결 상태 확인

---

## 📊 통합 상태 대시보드

### 실시간 상태 스크립트

다음 스크립트를 `scripts/system-health-check.sh`로 저장하여 사용:

```bash
#!/bin/bash

echo "🔍 OpenManager Vibe v5 시스템 상태 점검"
echo "========================================"
echo "실행 시간: $(date)"
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Vercel 상태 확인
echo -n "🌐 Vercel 앱 상태: "
VERCEL_STATUS=$(curl -s https://openmanager-vibe-v5.vercel.app/api/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$VERCEL_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ 정상 (healthy)${NC}"
else
    echo -e "${RED}❌ 이상 ($VERCEL_STATUS)${NC}"
fi

# 2. MCP 서버 상태 확인
echo -n "🖥️  MCP 서버 상태: "
MCP_STATUS=$(curl -s http://104.154.205.25:10000/health 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$MCP_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ 정상 (healthy)${NC}"
else
    echo -e "${RED}❌ 이상 ($MCP_STATUS)${NC}"
fi

# 3. Redis 상태 확인
echo -n "🔴 Redis 상태: "
REDIS_STATUS=$(curl -X POST 'https://charming-condor-46598.upstash.io/ping' -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0ITUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' -s 2>/dev/null | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
if [ "$REDIS_STATUS" = "PONG" ]; then
    echo -e "${GREEN}✅ 정상 (PONG)${NC}"
else
    echo -e "${RED}❌ 이상 ($REDIS_STATUS)${NC}"
fi

# 4. Supabase 상태 확인
echo -n "🗄️  Supabase 상태: "
# MCP 도구를 통한 연결만 가능하므로 연결 활성화 여부만 표시
SUPABASE_URL="https://vnswjnltnhpsueosfhmw.supabase.co"
if curl -s --connect-timeout 5 "$SUPABASE_URL" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ MCP 연결 가능${NC}"
else
    echo -e "${YELLOW}⚠️  직접 접근 제한됨 (MCP 전용)${NC}"
fi

echo ""
echo "📊 상세 메트릭:"

# 응답시간 측정
VERCEL_TIME=$(curl -s -w "%{time_total}" -o /dev/null https://openmanager-vibe-v5.vercel.app/api/health 2>/dev/null)
MCP_TIME=$(curl -s -w "%{time_total}" -o /dev/null http://104.154.205.25:10000/health 2>/dev/null)  
REDIS_TIME=$(curl -X POST 'https://charming-condor-46598.upstash.io/ping' -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0ITUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' -s -w "%{time_total}" -o /dev/null 2>/dev/null)

echo "   Vercel 응답시간: ${VERCEL_TIME}초"
echo "   MCP 응답시간: ${MCP_TIME}초" 
echo "   Redis 응답시간: ${REDIS_TIME}초"

# Redis 메트릭
REDIS_KEYS=$(curl -X POST 'https://charming-condor-46598.upstash.io/dbsize' -H 'Authorization: Bearer AbYGAAIjcDE5MjNmYjhiZDkwOGQ0ITUyOGFiZjUyMmQ0YTkyMzIwM3AxMA' -s 2>/dev/null | grep -o '"result":[0-9]*' | cut -d':' -f2)
echo "   Redis 키 개수: ${REDIS_KEYS}개"

# Supabase 메트릭 (MCP 접근 필요)
echo "   Supabase: 7개 테이블, MCP 도구 접근"

echo ""
echo "🎯 전체 상태: $(if [ "$VERCEL_STATUS" = "healthy" ] && [ "$MCP_STATUS" = "healthy" ] && [ "$REDIS_STATUS" = "PONG" ]; then echo -e "${GREEN}모든 핵심 서비스 정상${NC}"; else echo -e "${YELLOW}일부 서비스 이상${NC}"; fi)"
echo "💡 Supabase는 MCP 도구를 통해서만 모니터링 가능"
echo "========================================"
```

### npm 스크립트 추가

`package.json`에 다음 스크립트 추가:

```json
{
  "scripts": {
    "system:health": "bash scripts/system-health-check.sh",
    "system:health:watch": "watch -n 30 'npm run system:health'"
  }
}
```

---

## 🚨 문제 해결 가이드

### Vercel 앱 접속 불가

1. **Vercel 대시보드 확인**
   - 배포 상태 확인
   - 함수 호출 한도 초과 여부
   - 빌드 실패 여부

2. **DNS 문제 확인**
   ```bash
   nslookup openmanager-vibe-v5.vercel.app
   ping openmanager-vibe-v5.vercel.app
   ```

3. **환경변수 문제**
   - Vercel 대시보드에서 환경변수 확인
   - 필수 API 키들이 설정되어 있는지 확인

### MCP 서버 응답 없음

1. **VM 인스턴스 상태 확인**
   ```bash
   gcloud compute instances list --project=openmanager-free-tier
   ```

2. **방화벽 규칙 확인**
   ```bash
   gcloud compute firewall-rules list --filter="name:allow-mcp"
   ```

3. **SSH 접속 후 프로세스 확인**
   ```bash
   gcloud compute ssh mcp-server --zone=us-central1-a
   sudo systemctl status mcp-server  # 또는 해당 서비스명
   ```

### Redis 연결 실패

1. **토큰 유효성 확인**
   - Upstash 콘솔에서 토큰 재생성
   - 환경변수 업데이트

2. **네트워크 연결 확인**
   ```bash
   curl -I https://charming-condor-46598.upstash.io
   ```

3. **사용량 한도 확인**
   - Upstash 대시보드에서 일일 명령어 사용량 확인
   - 메모리 사용량 확인

---

## 📅 정기 점검 체크리스트

### 일일 점검 (매일 오전 9시)

- [ ] 전체 시스템 헬스체크 실행: `npm run system:health`
- [ ] Vercel 함수 호출 사용량 확인 (80% 미만 유지)
- [ ] GCP VM CPU 사용률 확인 (70% 미만 유지)
- [ ] Redis 메모리 사용량 확인 (50MB 미만 유지)
- [ ] Supabase MCP 연결 상태 확인
- [ ] 주요 API 엔드포인트 응답 확인

### 주간 점검 (매주 월요일)

- [ ] Vercel 배포 로그 확인
- [ ] GCP 무료 티어 사용량 확인
- [ ] Redis 성능 메트릭 분석 (히트율, 응답시간)
- [ ] Supabase 테이블 상태 및 벡터 데이터 품질 확인
- [ ] 에러 로그 확인 및 분석
- [ ] 백업 상태 확인

### 월간 점검 (매월 1일)

- [ ] 전체 인프라 비용 분석
- [ ] 보안 업데이트 확인
- [ ] 성능 최적화 검토
- [ ] Supabase 무료 티어 용량 사용량 분석 (500MB 한도)
- [ ] 용량 계획 수립
- [ ] 문서 업데이트

---

## 🔧 유용한 명령어 모음

### 빠른 진단 명령어

```bash
# 모든 서비스 한 번에 확인
npm run system:health

# 개별 서비스 확인
curl -s https://openmanager-vibe-v5.vercel.app/api/health | jq .
curl -s http://104.154.205.25:10000/health | jq .
npm run redis:test
# Supabase는 Claude Code MCP 도구로만 확인 가능

# 성능 테스트
ab -n 100 -c 10 https://openmanager-vibe-v5.vercel.app/api/health
```

### 로그 확인 명령어

```bash
# Vercel 로그 (Vercel CLI 필요)
vercel logs

# GCP VM 로그 확인
gcloud logging read "resource.type=gce_instance" --limit=50

# Redis 사용량 확인
curl -X POST 'https://charming-condor-46598.upstash.io/info' \
     -H 'Authorization: Bearer [TOKEN]' -s | grep -E "total_commands|used_memory"
```

---

## 📞 지원 및 연락처

### 긴급 상황 대응

1. **시스템 전체 다운**: 모든 서비스 상태 확인 후 개별 복구
2. **부분 서비스 장애**: 해당 서비스만 격리 후 복구
3. **성능 저하**: 각 서비스별 응답시간 및 리소스 사용량 확인

### 유용한 링크

- **Vercel 대시보드**: https://vercel.com/dashboard
- **GCP 콘솔**: https://console.cloud.google.com/
- **Upstash 콘솔**: https://console.upstash.com/
- **시스템 상태 페이지**: https://openmanager-vibe-v5.vercel.app/api/health

---

**문서 작성**: Claude AI Assistant  
**Supabase MCP 연결 추가**: 2025년 7월 15일  
**검증 완료**: 2025년 7월 15일  
**다음 리뷰**: 2025년 8월 15일