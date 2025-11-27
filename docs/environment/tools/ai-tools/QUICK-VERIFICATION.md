# AI 어시스턴트 빠른 검증 가이드

**소요 시간**: 5분  
**목적**: 무료 티어 내 정상 동작 확인

---

## 🚀 1단계: 아키텍처 검증 (30초)

```bash
cd /mnt/d/cursor/openmanager-vibe-v5
./scripts/monitoring/billing/check-free-tier.sh
```

**예상 출력**:

```
=== AI 어시스턴트 무료 티어 검증 ===

1. Vercel Edge Functions (10초 제한)
GOOGLE_AI_TIMEOUT=8000  ✓

2. Supabase 무료 티어
  ✓ URL 설정됨
  ✓ Anon Key 설정됨

3. Google AI API 무료 티어 (1500/일, 15 RPM)
GOOGLE_AI_DAILY_LIMIT=1200  ✓
GOOGLE_AI_MINUTE_LIMIT=10  ✓
GOOGLE_AI_QUOTA_PROTECTION=true  ✓

4. 핵심 구현 파일
  ✓ Query Engine
  ✓ Usage Tracker
  ✓ AI Manager

5. API 라우트
  API 엔드포인트 수: 12

=== 검증 완료 ===
```

---

## 🧪 2단계: 개발 서버 실행 (1분)

```bash
# Node.js 버전 확인
nvm use

# 개발 서버 시작
npm run dev:stable
```

**예상 출력**:

```
▲ Next.js 15.5.5
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.3s
```

---

## 🔍 3단계: API 테스트 (2분)

### 방법 1: 브라우저 테스트

1. 브라우저에서 `http://localhost:3000` 접속
2. AI 어시스턴트 채팅창 열기
3. 다음 질문 입력:
   - "안녕하세요" (간단한 인사)
   - "서버 상태 확인" (RAG 검색)
   - "CPU 사용률이 높은 서버는?" (복잡한 쿼리)

**예상 결과**: 모두 5초 이내 응답

### 방법 2: curl 테스트

```bash
# 터미널 새 창에서 실행

# 1. 간단한 쿼리
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query":"안녕하세요"}'

# 2. 서버 상태 쿼리
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query":"서버 상태 확인"}'

# 3. 캐시 통계
curl http://localhost:3000/api/ai/cache-stats
```

**예상 응답**:

```json
{
  "response": "안녕하세요! 무엇을 도와드릤까요?",
  "cached": false,
  "responseTime": 152,
  "engine": "google-ai"
}
```

---

## 📊 4단계: 성능 확인 (1분)

### 응답 시간 측정

```bash
# 5회 반복 테스트
for i in {1..5}; do
  echo "테스트 $i:"
  time curl -s -X POST http://localhost:3000/api/ai/query \
    -H "Content-Type: application/json" \
    -d "{\"query\":\"테스트 $i\"}" > /dev/null
  sleep 1
done
```

**목표**: 모든 요청이 5초 이내 완료

### 캐싱 효과 확인

```bash
# 동일한 쿼리 2회 실행
echo "첫 번째 요청:"
curl -s -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query":"캐시 테스트"}' | jq '.cached'

sleep 1

echo "두 번째 요청 (캐시 히트 예상):"
curl -s -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query":"캐시 테스트"}' | jq '.cached'
```

**예상 결과**:

```
첫 번째 요청: false
두 번째 요청: true
```

---

## ✅ 5단계: 결과 확인

### 모든 항목이 정상이면:

```
✅ 아키텍처 검증 통과
✅ 개발 서버 정상 실행
✅ API 응답 정상 (5초 이내)
✅ 캐싱 동작 확인
✅ 무료 티어 제한 준수

→ 프로덕션 배포 준비 완료!
```

### 문제가 발생하면:

#### 1. 환경변수 오류

```bash
# .env.local 확인
cat .env.local | grep -E "SUPABASE|GOOGLE_AI"
```

**해결**: 누락된 환경변수 추가

#### 2. 타임아웃 오류

```bash
# 타임아웃 설정 확인
grep "TIMEOUT" .env.local
```

**해결**: `GOOGLE_AI_TIMEOUT=8000` 설정

#### 3. API 키 오류

```bash
# Google AI API 키 확인
grep "GOOGLE_AI_API_KEY" .env.local
```

**해결**: 유효한 API 키 설정

#### 4. Supabase 연결 오류

```bash
# Supabase URL 확인
grep "SUPABASE_URL" .env.local
```

**해결**: 올바른 Supabase URL 설정

---

## 🔧 고급 검증 (선택사항)

### 자동화 테스트 실행

```bash
# Vitest 테스트
npm run test tests/ai-free-tier-validation.test.ts

# E2E 테스트 (Playwright)
npm run test:e2e
```

### 통합 테스트 스크립트

```bash
# 모든 API 엔드포인트 테스트
./scripts/test-ai-integration.sh http://localhost:3000
```

---

## 📚 다음 단계

### 개발 환경

- [개발 가이드](../DEVELOPMENT.md)
- [AI 시스템 아키텍처](../design/current/system-architecture-ai.md)

### 프로덕션 배포

- [배포 가이드](../deployment/README.md)
- [Vercel 배포 설정](../deployment/vercel.md)

### 모니터링

- [성능 모니터링](../monitoring/README.md)
- [사용량 추적](./usage-tracking.md)

---

## 💡 팁

### 빠른 디버깅

```bash
# 로그 확인
tail -f logs/ai-perf/*.log

# 캐시 초기화
curl -X DELETE http://localhost:3000/api/ai/cache-stats
```

### 성능 최적화

```bash
# 캐시 통계 확인
curl http://localhost:3000/api/ai/cache-stats | jq

# Google AI 사용량 확인
curl http://localhost:3000/api/ai/cache-stats | jq '.googleAI'
```

---

**작성일**: 2025-11-19  
**업데이트**: 프로덕션 배포 후  
**문의**: 이슈 트래커 또는 문서 참조
