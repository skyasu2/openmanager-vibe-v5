# 🚀 Vercel + Render 배포 가이드

**➡️ [완전한 배포 정보는 종합 문서에서 확인하세요](./OPENMANAGER_V5_COMPREHENSIVE_DOCUMENTATION.md#-배포-가이드)**

---

## 📋 **현재 설정 상태**

### ✅ **잘 설정된 항목들**
- **Vercel Pro 플랜**: 60초 함수 실행 제한 활용
- **Render 무료 플랜**: 콜드 스타트 대응 완료
- **타임아웃 처리**: AbortController 15초 제한
- **웜업 시스템**: 10분 간격 자동 Python 서비스 웜업
- **보안 헤더**: CSP + HTTPS 강제

---

## 🔷 **Vercel Pro 최적화**

### **현재 설정**
```json
// vercel.json
{
  "functions": {
    "src/app/api/**": {
      "maxDuration": 60  // ✅ Pro 플랜 60초 활용
    }
  },
  "regions": ["icn1"]  // ✅ 서울 리전
}
```

### **Pro 플랜 혜택**
- ✅ **함수 실행**: 60초 (무료 10초 → Pro 60초)
- ✅ **메모리**: 3GB (무료 1GB → Pro 3GB)  
- ✅ **빌드 시간**: 400시간/월
- ✅ **대역폭**: 무제한

---

## 🔶 **Render 무료 플랜 최적화**

### **제한사항 대응**
- ✅ **512MB RAM**: 경량 Python 서비스 설계
- ✅ **15분 자동 종료**: 10분 주기 웜업 설정  
- ✅ **콜드 스타트**: 30-60초 웜업 + 로컬 폴백
- ✅ **월 750시간**: 테스트/시연 시에만 사용

### **웜업 시스템**
```typescript
// 10분 주기 자동 웜업
private schedulePeriodicWarmup(): void {
  this.warmupInterval = setInterval(async () => {
    await this.startWarmupProcess();
  }, 10 * 60 * 1000); // 10분
}
```

---

## 🎯 **빠른 배포**

### **Vercel 배포**
```bash
# CLI 설치
npm i -g vercel

# 배포
vercel --prod

# 환경 변수 설정
vercel env add AI_ENGINE_URL production
```

### **환경 변수**
```bash
AI_ENGINE_URL=https://openmanager-vibe-v5.onrender.com
NODE_ENV=production
PYTHON_SERVICE_TIMEOUT=15000
WARMUP_INTERVAL_MINUTES=10
```

---

## 📊 **비용 최적화**

### **Vercel Pro ($20/월)**
- ✅ Edge Functions 활용으로 함수 호출 감소
- ✅ 이미지 최적화로 대역폭 절약  
- ✅ ISR로 빌드 시간 단축

### **Render 무료 ($0)**
- ✅ 월 750시간 = 31일 (시연/테스트만)
- ✅ 15분 자동 슬립 (웜업으로 대응)
- ✅ 512MB RAM (최적화된 서비스)

---

## 🚨 **트러블슈팅**

### **Render 콜드 스타트**
```bash
# 웜업 실행
npm run test:warmup

# 수동 웜업
curl -X POST https://openmanager-vibe-v5.onrender.com/health
```

### **Vercel 함수 타임아웃**
```typescript
// API Route 타임아웃 처리
export const maxDuration = 60; // Pro 플랜 60초

// AbortController 사용
const controller = new AbortController();
setTimeout(() => controller.abort(), 55000);
```

---

## ✅ **배포 체크리스트**

### **Vercel Pro**
- [x] 60초 함수 실행 시간 설정
- [x] 3GB 메모리 할당
- [x] 서울 리전 (icn1) 설정
- [x] 환경 변수 암호화

### **Render 무료**
- [x] Python 서비스 최적화
- [x] 10분 주기 웜업 설정
- [x] 15초 타임아웃 처리
- [x] 로컬 폴백 활성화

---

**전체 상세 정보**: [종합 문서 보기](./OPENMANAGER_V5_COMPREHENSIVE_DOCUMENTATION.md) 📚 