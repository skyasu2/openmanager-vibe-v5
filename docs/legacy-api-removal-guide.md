# 🗑️ 레거시 API 제거 가이드

> **OpenManager VIBE v5 - 불필요한 레거시 API 안전 제거**

## 📋 제거 대상 API 목록

### 1. **GCP 관련 API (우선 제거)**

```
❌ /api/gcp/real-servers
❌ /api/gcp/server-data
❌ /api/gcp/data-generator
```

### 2. **중복된 서버 API**

```
⚠️ /api/servers/realtime  → /api/servers-optimized로 통합
⚠️ /api/servers/all       → /api/servers-optimized로 통합
⚠️ /api/servers/next      → 제거 (사용되지 않음)
```

### 3. **레거시 시스템 API**

```
⚠️ /api/system/initialize → 템플릿 시스템이 자동 처리
```

## 🔍 제거 전 확인사항

### 1. 의존성 확인

```bash
# 레거시 API를 호출하는 코드 검색
grep -r "api/gcp" src/
grep -r "servers/realtime" src/
grep -r "servers/all" src/
grep -r "system/initialize" src/
```

### 2. AI 엔진 의존성 확인

```bash
# AI 엔진들의 API 호출 확인
grep -r "fetch.*api/servers" src/app/api/ai/
grep -r "fetch.*api/gcp" src/services/ai/
```

## 🛠️ 단계별 제거 프로세스

### Step 1: 코드 업데이트

#### 1.1 AI 엔진 엔드포인트 변경

```javascript
// src/app/api/ai/anomaly/route.ts
// 기존
const serversResponse = await fetch(
  `${request.nextUrl.origin}/api/servers?limit=50`
);

// 변경
const serversResponse = await fetch(
  `${request.nextUrl.origin}/api/servers-optimized?limit=50`
);
```

#### 1.2 React 컴포넌트 업데이트

```javascript
// src/hooks/useServerData.ts
// 기존
const { data } = useSWR('/api/servers/realtime');

// 변경
const { data } = useSWR('/api/servers-optimized');
```

### Step 2: 리다이렉트 설정 (안전장치)

```javascript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/api/gcp/:path*',
        destination: '/api/servers-optimized',
        permanent: true,
      },
      {
        source: '/api/servers/realtime',
        destination: '/api/servers-optimized',
        permanent: true,
      },
      {
        source: '/api/servers/all',
        destination: '/api/servers-optimized',
        permanent: true,
      },
    ];
  },
};
```

### Step 3: 파일 제거

```bash
# 백업 생성 (안전을 위해)
mkdir -p backup/api
cp -r src/app/api/gcp backup/api/
cp -r src/app/api/servers backup/api/

# GCP 관련 파일 제거
rm -rf src/app/api/gcp/

# 중복 서버 API 제거
rm -f src/app/api/servers/realtime/route.ts
rm -f src/app/api/servers/all/route.ts
rm -f src/app/api/servers/next/route.ts

# 레거시 시스템 API 제거
rm -f src/app/api/system/initialize/route.ts

# 관련 서비스 파일 제거
rm -rf src/services/gcp/
```

### Step 4: 환경 변수 정리

```env
# .env.local에서 제거할 변수들
# ❌ 제거
GCP_PROJECT_ID=xxx
GCP_SERVICE_ACCOUNT=xxx
FIRESTORE_COLLECTION=xxx
CLOUD_FUNCTIONS_URL=xxx

# ✅ 유지
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## 🧪 제거 후 테스트

### 1. 기능 테스트

```bash
# 서버 데이터 조회 테스트
curl http://localhost:3000/api/servers-optimized

# AI 이상징후 감지 테스트
curl http://localhost:3000/api/ai/anomaly

# 대시보드 데이터 테스트
curl http://localhost:3000/api/dashboard-optimized
```

### 2. 성능 테스트

```bash
# 벤치마크 실행
curl http://localhost:3000/api/performance-test?action=benchmark&iterations=10

# 부하 테스트
curl http://localhost:3000/api/performance-test?action=load_test&concurrent=5
```

### 3. 리다이렉트 테스트

```bash
# 레거시 URL이 새 URL로 리다이렉트되는지 확인
curl -I http://localhost:3000/api/gcp/real-servers
# Expected: 301 Moved Permanently

curl -I http://localhost:3000/api/servers/realtime
# Expected: 301 Moved Permanently
```

## ⚠️ 롤백 계획

문제 발생 시:

```bash
# 1. 백업에서 복원
cp -r backup/api/gcp src/app/api/
cp -r backup/api/servers/* src/app/api/servers/

# 2. Git에서 복원 (권장)
git checkout HEAD -- src/app/api/gcp
git checkout HEAD -- src/app/api/servers

# 3. A/B 테스트로 레거시 모드 활성화
curl -X POST http://localhost:3000/api/ab-test \
  -H "Content-Type: application/json" \
  -d '{"action": "emergency_rollback", "reason": "API 제거 후 오류"}'
```

## 📊 예상 효과

| 항목              | 제거 전 | 제거 후 | 개선 |
| ----------------- | ------- | ------- | ---- |
| API 엔드포인트 수 | 15개    | 8개     | -47% |
| 코드 복잡도       | 높음    | 낮음    | -    |
| 유지보수 부담     | 높음    | 낮음    | -    |
| 빌드 크기         | 큼      | 작음    | -20% |

## ✅ 제거 체크리스트

- [ ] 모든 의존성 코드 업데이트 완료
- [ ] 리다이렉트 설정 추가
- [ ] 백업 생성
- [ ] 파일 제거
- [ ] 환경 변수 정리
- [ ] 기능 테스트 통과
- [ ] 성능 테스트 통과
- [ ] 배포 전 최종 확인

## 📅 권장 제거 일정

1. **Week 1**: 코드 업데이트 및 리다이렉트 설정
2. **Week 2**: 스테이징 환경에서 테스트
3. **Week 3**: 프로덕션 배포 및 모니터링
4. **Week 4**: 파일 실제 제거 및 정리

## 🎯 최종 목표

- 단일하고 통합된 API 구조
- 명확한 책임 분리
- 높은 성능과 안정성
- 쉬운 유지보수

---

**레거시 API를 안전하게 제거하여 깔끔하고 효율적인 시스템을 만드세요! 🎉**
