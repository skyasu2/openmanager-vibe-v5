# 🚀 Vercel + Render 최적화 설정 가이드

## 📋 **현재 설정 상태 분석**

### ✅ **잘 설정된 항목들**
- **Vercel 유료 플랜**: 60초 함수 실행 제한 활용
- **Render 무료 플랜**: 콜드 스타트 대응 완료
- **타임아웃 처리**: AbortController 15초 제한
- **웜업 시스템**: 자동 Python 서비스 웜업
- **보안 헤더**: CSP + HTTPS 강제

### ⚠️ **개선 완료 항목들**
- **함수 실행 시간**: 30초 → 60초 증가 (유료 플랜 활용)
- **주기적 웜업**: 10분 간격 Render 서비스 웜업 추가

## 🔷 **Vercel 유료 플랜 최적화**

### **현재 설정**
```json
// vercel.json
{
  "functions": {
    "src/app/api/**": {
      "maxDuration": 60  // ✅ 유료 플랜 60초 활용
    }
  },
  "regions": ["icn1"]  // ✅ 서울 리전 (한국 최적화)
}
```

### **환경 변수 설정**
```bash
# Vercel Dashboard → Settings → Environment Variables
AI_ENGINE_URL=https://openmanager-vibe-v5.onrender.com
NODE_ENV=production
PYTHON_SERVICE_TIMEOUT=15000
WARMUP_INTERVAL_MINUTES=10
```

### **유료 플랜 혜택 활용**
- ✅ **함수 실행**: 60초 (무료 10초 → 유료 60초)
- ✅ **메모리**: 3GB (무료 1GB → 유료 3GB)
- ✅ **빌드 시간**: 400시간/월 (무료 100시간 → 유료 400시간)
- ✅ **대역폭**: 무제한 (무료 100GB → 유료 무제한)

## 🔶 **Render 무료 플랜 최적화**

### **제한사항 대응**
```yaml
무료 플랜 제한:
- 512MB RAM ✅ 경량 Python 서비스 설계
- 15분 비활성 자동 종료 ✅ 10분 주기 웜업 설정
- 콜드 스타트 30-60초 ✅ 웜업 시스템 + 로컬 폴백
- 월 750시간 (31일) ✅ 테스트/시연 시에만 사용
```

### **웜업 시스템 설정**
```typescript
// 자동 웜업 (10분 주기)
private schedulePeriodicWarmup(): void {
  this.warmupInterval = setInterval(async () => {
    await this.startWarmupProcess();
  }, 10 * 60 * 1000); // 10분 = 600초
}
```

### **콜드 스타트 대응**
```typescript
// 15초 타임아웃 + 2회 재시도 + 로컬 폴백
private defaultTimeout: number = 15000;
private retryCount: number = 2;

// AbortController로 타임아웃 처리
const controller = new AbortController();
setTimeout(() => controller.abort(), requestTimeout);
```

## 🎯 **테스트 & 시연 최적화**

### **온/오프 운영 전략**
```typescript
// 시연 전 웜업 스크립트
npm run test:warmup

// 상태 확인
curl https://openmanager-vibe-v5.onrender.com/health

// 시연 후 자동 슬립 (15분 후)
```

### **모니터링 대시보드**
```bash
# Vercel 대시보드
https://vercel.com/dashboard

# Render 대시보드  
https://dashboard.render.com

# 헬스체크 엔드포인트
GET /api/health
```

## 📊 **비용 최적화 현황**

### **Vercel (유료 1개월)**
```yaml
예상 비용: $20/월
최적화:
- ✅ Edge Functions 활용으로 함수 호출 감소
- ✅ 이미지 최적화로 대역폭 절약  
- ✅ ISR로 빌드 시간 단축
```

### **Render (무료)**
```yaml
비용: $0
제한 관리:
- ✅ 월 750시간 = 31일 (시연/테스트만 사용)
- ✅ 15분 자동 슬립 (웜업으로 대응)
- ✅ 512MB RAM (최적화된 Python 서비스)
```

## 🔄 **배포 및 운영 체크리스트**

### **Vercel 배포**
```bash
# 1. 환경 변수 설정
vercel env add AI_ENGINE_URL production

# 2. 배포
vercel --prod

# 3. 도메인 확인
https://openmanager-vibe-v5.vercel.app
```

### **Render 배포**
```yaml
# render.yaml (자동 배포)
services:
  - type: web
    name: openmanager-ai-engine
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "gunicorn app:app"
    healthCheckPath: /health
    autoDeploy: true
```

### **통합 테스트**
```bash
# 웜업 테스트
npm run test:warmup

# 통합 테스트
npm run test:integration

# 성능 테스트
npm run test:performance
```

## 🚨 **트러블슈팅**

### **Render 콜드 스타트 해결**
```bash
# 웜업 스크립트 실행
bash scripts/test-warmup.sh

# 수동 웜업
curl -X POST https://openmanager-vibe-v5.onrender.com/health
```

### **Vercel 함수 타임아웃**
```typescript
// API Route에서 타임아웃 처리
export const maxDuration = 60; // 유료 플랜 60초

// AbortController 사용
const controller = new AbortController();
setTimeout(() => controller.abort(), 55000); // 5초 여유
```

### **환경 변수 누락**
```bash
# 확인
vercel env ls

# 추가  
vercel env add KEY value production
```

## ✅ **최종 체크리스트**

### **Vercel 유료 플랜**
- [x] 60초 함수 실행 시간 설정
- [x] 3GB 메모리 할당
- [x] 서울 리전 (icn1) 설정
- [x] CSP 헤더 보안 설정
- [x] 환경 변수 암호화

### **Render 무료 플랜**
- [x] 15초 타임아웃 설정
- [x] 10분 주기 웜업 시스템
- [x] 헬스체크 엔드포인트
- [x] 자동 배포 설정
- [x] 로컬 폴백 시스템

### **통합 최적화**
- [x] AbortController 타임아웃 처리
- [x] 재시도 로직 (2회)
- [x] 캐싱 시스템 (5분 TTL)
- [x] 모니터링 메트릭
- [x] 에러 핸들링

---

**🎯 결과**: 현재 설정이 Vercel 유료 + Render 무료 환경에 **100% 최적화**되어 있으며, 테스트/시연용 온/오프 운영에 완벽하게 대응됩니다!

### 📞 **운영 지원**
- **상태 확인**: `/api/health`
- **웜업 실행**: `npm run test:warmup`
- **모니터링**: Vercel + Render 대시보드 