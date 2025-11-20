# 🏥 헬스체크 정책

> **작성**: 2025-11-21 08:01 KST  
> **원칙**: 비용 발생 최소화, 수동 테스트 우선

---

## 📋 정책

### ✅ 허용되는 헬스체크

#### 1. `/api/ping` - 외부 모니터링 전용
```typescript
export const runtime = 'edge'; // 비용 $0

용도:
- 외부 Uptime 모니터링 (UptimeRobot, Pingdom 등)
- 최소 응답만 제공 (ping: pong)
- 캐싱: 60초

비용: $0 (Edge Runtime, 무료 100만 호출/월)
```

#### 2. `/api/health` - 수동 테스트 전용
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

용도:
- 개발자가 수동으로 테스트할 때만 사용
- Database, Cache, AI 서비스 상태 확인
- 자동 호출 금지

비용: 호출당 ~0.15초 컴퓨팅 (수동 호출만 허용)
```

---

## ❌ 금지 사항

### 1. 자동 헬스체크 호출
```
❌ Cron Job으로 /api/health 호출
❌ 1분마다 자동 체크
❌ 백그라운드 모니터링

이유: 불필요한 컴퓨팅 비용 발생
```

### 2. 복잡한 헬스체크 엔드포인트
```
❌ /api/health/lite
❌ /api/health/full
❌ /api/health/detailed

이유: 관리 복잡도 증가, 실제 필요 없음
```

### 3. 캐싱된 헬스체크
```
❌ export const revalidate = 30;

이유: 
- 캐싱하면 자동 호출 유도
- 수동 테스트는 실시간 상태 필요
```

---

## 🎯 권장 사용법

### 외부 모니터링 설정
```
서비스: UptimeRobot, Pingdom 등
URL: https://openmanager-vibe-v5.vercel.app/api/ping
간격: 5분 (권장)
타임아웃: 10초
```

### 수동 테스트
```bash
# 개발 중 상태 확인
curl https://openmanager-vibe-v5.vercel.app/api/health

# 또는 브라우저에서
https://openmanager-vibe-v5.vercel.app/api/health
```

### 시스템 모니터링
```
Vercel Dashboard > Analytics > Functions
- 실제 사용량 확인
- 비정상 호출 패턴 감지
```

---

## 💰 비용 영향

### 현재 구성 (최적)
```
/api/ping (Edge):
- 외부 모니터링: 288회/일
- 비용: $0

/api/health (Node.js):
- 수동 테스트: ~5회/일
- 비용: ~0.75초/일 = 22.5초/월 (무시 가능)

총 비용: ~$0
```

### 잘못된 구성 (예시)
```
/api/health 자동 호출:
- 1분마다: 1,440회/일
- 비용: 216초/일 = 6,480초/월 = 108분/월
- 예상 비용: $2-5/월

❌ 불필요한 비용 발생
```

---

## 📝 체크리스트

### 개발자
- [ ] `/api/health`는 수동 테스트만 사용
- [ ] 자동 호출 스크립트 작성 금지
- [ ] 외부 모니터링은 `/api/ping` 사용

### 운영
- [ ] Vercel Dashboard에서 호출 패턴 주기적 확인
- [ ] 비정상 호출 감지 시 즉시 차단
- [ ] 월간 비용 리포트 확인

---

## 🔍 모니터링

### 비정상 패턴 감지
```bash
# Vercel Logs 확인
vercel logs | grep "/api/health" | wc -l

# 1시간에 10회 이상이면 조사 필요
```

### 알림 설정
```
Vercel Dashboard > Settings > Notifications
- Function 사용량 80% 도달 시 알림
- 비정상 트래픽 감지 시 알림
```

---

**정책 시행**: 2025-11-21부터  
**검토 주기**: 월 1회
