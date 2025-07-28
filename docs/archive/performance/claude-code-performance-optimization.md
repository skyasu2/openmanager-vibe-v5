# ⚡ Claude Code 사용 최적화 가이드

**작성일**: 2025-01-27  
**목적**: 토큰 효율성 극대화 및 비용 최적화  
**상위 문서**: [성능 최적화 완전 가이드](/docs/performance-optimization-complete-guide.md)

## 📊 사용량 모니터링

```bash
# 핵심 모니터링 명령어
npx ccusage@latest blocks --live    # 실시간 모니터링
npm run ccusage:live              # 단축 명령어
```

## 🎯 핵심 최적화 전략

### 1. 구체적 프롬프트 작성

```bash
# ❌ 비효율적 (5000+ 토큰)
"전체 프로젝트 분석 및 리팩토링 계획 수립"

# ✅ 효율적 (500 토큰)
"src/services/ai-engine.ts 성능 병목점 3가지 분석"
```

### 2. 작업 분할 및 단계적 접근

```bash
# 대규모 작업을 작은 단위로 분할
1. 특정 모듈 분석     # 500 토큰
2. 개선점 구현        # 500 토큰  
3. 테스트 작성        # 500 토큰
# 총 1,500 토큰 (vs 한번에 3,000+ 토큰)
```

## 🤝 Claude + Gemini 협업 전략

### 역할 분담

| 작업 유형   | Claude Code | Gemini CLI | 절감률 |
| ----------- | ----------- | ---------- | ------ |
| 코드 생성   | ✅ 주력     | 보조       | -      |
| 코드 분석   | 보조        | ✅ 주력    | 60%    |
| 문서 작성   | ✅ 주력     | 검토       | -      |
| 테스트 작성 | ✅ 주력     | 실행       | -      |
| 리팩토링    | 설계        | ✅ 실행    | 40%    |
| 디버깅      | 분석        | ✅ 해결    | 50%    |

### 실전 예시

```bash
# 1단계: Gemini로 코드 분석 (무료)
gemini analyze src/services --complexity

# 2단계: Claude로 핵심 부분만 개선 (토큰 절약)
"complexity가 높은 processData 함수만 리팩토링해줘"

# 3단계: Gemini로 결과 검증 (무료)
gemini review --changes
```

## 📈 성능 메트릭스

### 토큰 사용 효율성

```javascript
// 토큰 효율성 계산
const tokenEfficiency = {
  before: {
    tokensUsed: 50000,
    tasksCompleted: 10,
    efficiency: 5000, // 작업당 토큰
  },
  after: {
    tokensUsed: 30000,
    tasksCompleted: 15,
    efficiency: 2000, // 60% 개선
  },
};
```

### 응답 시간 최적화

```typescript
// MCP 서버 병렬 처리
async function optimizedQuery() {
  const results = await Promise.all([
    filesystemMCP.search(pattern),
    memoryMCP.recall(context),
    contextMCP.find(query),
  ]);
  return combineResults(results);
}
```

## 🔧 고급 최적화 기법

### 1. **캐싱 전략**

```typescript
// 자주 사용하는 컨텍스트 캐싱
const contextCache = new Map();

function getCachedContext(key: string) {
  if (contextCache.has(key)) {
    console.log('캐시 히트! 토큰 절약');
    return contextCache.get(key);
  }
  // 캐시 미스 시 로드
}
```

### 2. **스마트 파일 선택**

```bash
# ❌ 모든 파일 분석
"프로젝트 전체 분석"  # 10,000+ 토큰

# ✅ 관련 파일만 선택
"package.json과 tsconfig.json 기반으로
 주요 엔트리 포인트만 분석"  # 1,000 토큰
```

### 3. **점진적 탐색**

```typescript
// 1. 얕은 탐색으로 시작
'src/ 디렉토리의 주요 모듈 목록만';

// 2. 필요한 부분만 깊게 탐색
'ai-engine 모듈의 핵심 함수 분석';

// 3. 구체적인 수정
'processQuery 함수의 성능 개선';
```

## 💡 토큰 절약 팁 Top 10

1. **구체적인 파일/함수명 지정** - 70% 절약
2. **줄 번호 범위 지정** - 80% 절약
3. **작업 단위 축소** - 50% 절약
4. **캐싱 활용** - 90% 절약
5. **Gemini와 협업** - 60% 절약
6. **불필요한 컨텍스트 제거** - 40% 절약
7. **증분 변경 방식** - 30% 절약
8. **템플릿 재사용** - 70% 절약
9. **배치 처리** - 20% 절약
10. **오프 피크 시간 활용** - 응답 속도 개선

## 📉 사용량 제한 대응 전략

### 일일 한도 도달 시

```bash
# 1. 현재 사용량 확인
npx ccusage@latest blocks --active

# 2. Gemini CLI로 전환
gemini chat "나머지 작업 수행"

# 3. 다음날 우선순위 계획
echo "TODO: 복잡한 작업" >> tomorrow.md
```

### 월간 한도 관리

```javascript
// 월간 사용량 추적
const monthlyUsage = {
  week1: { limit: 25, used: 23 }, // 92%
  week2: { limit: 25, used: 20 }, // 80%
  week3: { limit: 25, used: 18 }, // 72%
  week4: { limit: 25, reserve: 14 }, // 여유분
};
```

## 🚀 성능 최적화 체크리스트

### 작업 시작 전

- [ ] 현재 사용량 확인
- [ ] 작업 복잡도 평가
- [ ] Claude/Gemini 역할 분담 결정
- [ ] 필요한 파일만 식별

### 작업 중

- [ ] 토큰 사용량 모니터링
- [ ] 불필요한 컨텍스트 제거
- [ ] 증분 방식으로 진행
- [ ] 캐싱 기회 활용

### 작업 후

- [ ] 사용량 통계 기록
- [ ] 효율성 개선점 식별
- [ ] 다음 작업 계획 수립
- [ ] 문서 업데이트

## 📊 성과 측정

### KPI (Key Performance Indicators)

```typescript
interface PerformanceKPI {
  tokenEfficiency: number; // 작업당 토큰 수
  completionRate: number; // 일일 작업 완료율
  responseTime: number; // 평균 응답 시간
  errorRate: number; // 오류 발생률
  costPerTask: number; // 작업당 비용
}

// 목표치
const targets: PerformanceKPI = {
  tokenEfficiency: 2000, // 2000 토큰/작업
  completionRate: 95, // 95% 완료
  responseTime: 5000, // 5초 이내
  errorRate: 2, // 2% 미만
  costPerTask: 0.1, // $0.10/작업
};
```

## 🎯 실전 최적화 시나리오

### 시나리오 1: 대규모 리팩토링

```bash
# 비최적화 (20,000 토큰)
"전체 프로젝트 리팩토링"

# 최적화 (5,000 토큰)
1. Gemini: "복잡도 분석" (무료)
2. Claude: "상위 3개 모듈만 리팩토링" (3,000)
3. Gemini: "변경사항 검증" (무료)
4. Claude: "통합 테스트 작성" (2,000)
```

### 시나리오 2: 버그 수정

```bash
# 비최적화 (5,000 토큰)
"버그 찾아서 수정해줘"

# 최적화 (1,000 토큰)
1. 로그 분석 (수동)
2. Claude: "auth.ts:150-200 버그 수정"
3. 테스트 실행 (자동)
```

## 📅 지속적 개선

### 주간 리뷰

- 토큰 사용 패턴 분석
- 병목 구간 식별
- 프로세스 개선

### 월간 최적화

- 도구 업데이트
- 새로운 기법 도입
- ROI 분석

## 🏆 베스트 프랙티스

1. **"적을수록 좋다"** - 최소한의 컨텍스트로 최대 결과
2. **"측정할 수 없으면 개선할 수 없다"** - 지속적 모니터링
3. **"협업이 답이다"** - Claude + Gemini + Human
4. **"자동화가 왕이다"** - 반복 작업 자동화
5. **"학습하고 적응하라"** - 지속적 개선

---

**참고**: 이 가이드는 2025년 1월 기준이며, Claude Code의 업데이트에 따라 내용이 변경될 수 있습니다.
