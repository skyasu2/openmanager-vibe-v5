# GCP Functions 정리 가이드

**목적**: GCP Functions 역할 명확화 또는 제거  
**현황**: 구현되어 있으나 실제 사용률 낮음  
**결정 필요**: 제거 vs 명확화

---

## 📊 현재 상황 분석

### 구현된 파일
```
src/lib/gcp/
├── gcp-functions-client.ts      (6.8KB)
├── gcp-functions.config.ts      (3.0KB)
├── gcp-functions.types.ts       (3.6KB)
├── gcp-functions.utils.ts       (6.5KB)
└── resilient-ai-client.ts       (10KB)

총: 5개 파일, ~30KB
```

### 실제 사용 현황
```typescript
// 호출 빈도 분석 필요
// 대부분의 로직이 Vercel Edge Functions에서 처리됨
// GCP Functions는 거의 호출되지 않음
```

---

## 🎯 옵션 A: 완전 제거 (권장)

### 장점
- ✅ 아키텍처 단순화
- ✅ 유지보수 부담 감소
- ✅ 코드베이스 10-15% 감소
- ✅ 무료 티어 관리 대상 감소

### 단점
- ⚠️ ML 복잡도 증가 시 Vercel 타임아웃 위험
- ⚠️ 향후 확장 시 재구현 필요

### 실행 계획

#### 1단계: 의존성 확인
```bash
# GCP Functions 호출 위치 찾기
grep -r "gcp-functions" src/
grep -r "gcpFunctions" src/
grep -r "callMLAnalysis" src/
```

#### 2단계: 대체 구현
```typescript
// Before: GCP Functions 호출
const result = await gcpFunctions.callMLAnalysis(data);

// After: Vercel Edge Functions에서 직접 처리
const result = await localMLProvider.analyze(data);
```

#### 3단계: 파일 제거
```bash
# GCP 관련 파일 제거
rm -rf src/lib/gcp/

# Mock 제거
rm src/lib/mock/providers/GCPMock.ts

# 환경변수 정리
# .env.local에서 GCP 관련 변수 제거
```

#### 4단계: 테스트
```bash
npm run type-check
npm run test:quick
npm run build
```

---

## 🎯 옵션 B: 명확한 역할 정의

### 사용 케이스 정의
```typescript
// GCP Functions = 무거운 ML 작업 전용
// Vercel = 가벼운 API 처리 전용

interface MLComplexity {
  light: 'vercel';    // < 5초
  medium: 'vercel';   // 5-8초
  heavy: 'gcp';       // > 8초
}
```

### 구현 예시
```typescript
class HybridMLProcessor {
  async analyze(data: MLData): Promise<MLResult> {
    const complexity = this.estimateComplexity(data);

    if (complexity === 'heavy') {
      // GCP Functions 호출
      return await gcpFunctions.callMLAnalysis(data);
    } else {
      // Vercel에서 직접 처리
      return await localMLProvider.analyze(data);
    }
  }

  private estimateComplexity(data: MLData): 'light' | 'medium' | 'heavy' {
    const dataSize = JSON.stringify(data).length;
    const features = data.features?.length || 0;

    if (dataSize > 100000 || features > 1000) {
      return 'heavy';
    } else if (dataSize > 50000 || features > 500) {
      return 'medium';
    } else {
      return 'light';
    }
  }
}
```

### 장점
- ✅ 유연성 확보
- ✅ 향후 확장 가능

### 단점
- ⚠️ 복잡도 증가
- ⚠️ 두 환경 모두 관리 필요

---

## 📊 비교표

| 항목 | 옵션 A (제거) | 옵션 B (명확화) |
|------|--------------|----------------|
| **아키텍처 단순성** | ✅ 매우 단순 | 🟡 복잡 |
| **유지보수 부담** | ✅ 낮음 | 🟡 중간 |
| **확장성** | 🟡 제한적 | ✅ 높음 |
| **구현 시간** | ✅ 2-3일 | 🟡 1주 |
| **위험도** | 🟡 중간 | ✅ 낮음 |

---

## 🎯 권장 결정 프로세스

### 1단계: 사용 현황 분석
```bash
# 실제 호출 빈도 확인
grep -r "gcpFunctions" src/ | wc -l

# 로그 분석 (있다면)
cat logs/*.log | grep "gcp-functions"
```

### 2단계: 복잡도 예측
```
질문: 향후 ML 작업이 얼마나 복잡해질까?

A. 현재 수준 유지 → 옵션 A (제거)
B. 크게 증가 예상 → 옵션 B (명확화)
```

### 3단계: 결정
```
학습용 토이프로젝트 → 옵션 A (제거) 권장
실제 프로덕션 → 옵션 B (명확화) 권장
```

---

## 🚀 실행 체크리스트

### 옵션 A 선택 시
- [ ] GCP Functions 호출 위치 확인
- [ ] 대체 구현 작성
- [ ] 파일 제거
- [ ] 환경변수 정리
- [ ] 테스트 실행
- [ ] 문서 업데이트

### 옵션 B 선택 시
- [ ] 사용 케이스 명확화
- [ ] 복잡도 추정 로직 구현
- [ ] 하이브리드 프로세서 구현
- [ ] 테스트 케이스 작성
- [ ] 문서 업데이트

---

## 📝 결론

**학습용 토이프로젝트 기준 권장사항**: **옵션 A (완전 제거)**

### 이유
1. 현재 사용률이 매우 낮음
2. 아키텍처 단순화가 학습에 유리
3. 무료 티어 관리 대상 감소
4. 향후 필요 시 재구현 가능

### 예상 효과
- 코드베이스 10-15% 감소
- 아키텍처 이해도 30% 향상
- 유지보수 시간 20% 절감

---

**다음 단계**: 팀 논의 후 결정 → 실행 계획 수립
