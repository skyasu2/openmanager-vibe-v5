# 서버 카드 디자인 진화 분석 및 장단점 비교

**작성일**: 2025-10-20
**분석 대상**: ServerDashboard 서버 카드 렌더링 방식
**분석 목적**: "8개 고정" 레거시 코드 정리 및 성능 최적화 전략 평가

---

## 📊 1. 디자인 진화 타임라인

### Phase 1: 페이지네이션 방식 (초기 구현)

**구현 위치**: `src/components/dashboard/ServerDashboard.tsx`

**특징**:

- 드롭다운으로 페이지 크기 선택 (4개/6개/8개/12개/15개)
- 고정된 그리드 레이아웃 (responsive CSS Grid)
- 전통적인 페이지네이션 UX

**코드 구조** (Lines 242-253):

```typescript
<select
  value={paginationInfo.pageSize}
  onChange={(e) => changePageSize(Number(e.target.value))}
  className="rounded border border-blue-300 bg-blue-100 px-2 py-1 text-sm text-blue-700"
>
  <option value={4}>4개씩</option>
  <option value={6}>6개씩</option>
  <option value={8}>8개씩</option>
  <option value={12}>12개씩</option>
  <option value={15}>모두 보기</option>
</select>
```

---

### Phase 2: react-window 가상 스크롤 시도 (2025-10-14 09:05:44)

**커밋**: c6bba66d - "Added react-window virtual scrolling"

**시도한 이유**:

- 15개 서버 전체 렌더링 시 성능 우려
- 대규모 리스트 최적화 필요성 인식
- react-window 라이브러리 도입 (v2.2.1)

**구현 방식**:

- FixedSizeList 컴포넌트 사용
- 아이템 높이 고정 (350px)
- 윈도우 기반 가상화

---

### Phase 3: "더보기" 버튼 방식으로 전환 (2025-10-14 09:57:41)

**커밋**: 18853e71 - "Removed react-window, added 더보기 button"

**전환 시점**: react-window 도입 후 **52분 만에 제거** 🔥

**새로운 구현**: `src/components/dashboard/VirtualizedServerList.tsx`

**핵심 로직**:

```typescript
// 1. 동적 카드 수 계산 (viewport 기반)
const [expanded, setExpanded] = useState(false);
const [cardsPerRow, setCardsPerRow] = useState(4);

useEffect(() => {
  const calculateCardsPerRow = () => {
    const containerWidth = window.innerWidth - 64; // 좌우 패딩 제외
    const cardWidth = 380; // 카드 최소 너비
    const gap = 16; // 카드 간격
    const cards = Math.floor((containerWidth + gap) / (cardWidth + gap));
    setCardsPerRow(Math.max(1, cards)); // 최소 1개
  };

  calculateCardsPerRow();
  window.addEventListener('resize', calculateCardsPerRow);
  return () => window.removeEventListener('resize', calculateCardsPerRow);
}, []);

// 2. 조건부 렌더링
const visibleCount = expanded ? servers.length : cardsPerRow;
```

**"더보기" 버튼** (Lines 189-214):

```typescript
{remainingCount > 0 && !expanded && (
  <div className="mt-6 flex justify-center">
    <button onClick={() => setExpanded(true)} className="...">
      <span className="flex items-center gap-2">
        <svg>...</svg>
        더보기 ({remainingCount}개 더 보기)
      </span>
    </button>
  </div>
)}
```

---

### Phase 4: Dual Strategy (현재 구현)

**조건부 렌더링** (ServerDashboard.tsx Lines 264-271):

```typescript
{pageSize >= 15 && sortedServers.length >= 15 ? (
  // ⚡ 15개 전체 보기: VirtualizedServerList + "더보기" 버튼
  <VirtualizedServerList
    servers={sortedServers}
    handleServerSelect={handleServerSelect}
  />
) : (
  // 📊 일반 보기 (4/6/8/12개): 페이지네이션 그리드
  <div className="grid gap-4 ...">
    {paginatedServers.map(renderServerCard)}
  </div>
)}
```

**전략**:

- **15개 미만**: 페이지네이션 드롭다운 (4/6/8/12개)
- **15개 전체**: VirtualizedServerList + "더보기" 버튼

---

## 🎯 2. 방식별 장단점 비교

### 방식 1: 페이지네이션 드롭다운 (4/6/8/12개)

#### ✅ 장점

1. **단순성**: 구현이 직관적이고 유지보수 쉬움
2. **메모리 효율**: 선택한 개수만 렌더링 (4-12개)
3. **예측 가능**: 사용자가 명시적으로 개수 선택
4. **성능 안정**: 렌더링 부하 예측 가능
5. **접근성**: 표준 HTML select 사용

#### ❌ 단점

1. **제한적 UX**: 전체 보기 위해 드롭다운 조작 필요
2. **클릭 부담**: "15개 - 모두 보기" 선택 필수
3. **모바일 비효율**: 작은 화면에서 드롭다운 선택 어려움
4. **정보 분산**: 페이지 이동으로 전체 맥락 파악 어려움

#### 📊 평가

- **성능**: ⭐⭐⭐⭐⭐ (5/5) - 매우 효율적
- **UX**: ⭐⭐⭐ (3/5) - 보통
- **유지보수**: ⭐⭐⭐⭐⭐ (5/5) - 매우 쉬움
- **모바일**: ⭐⭐ (2/5) - 불편함
- **종합**: ⭐⭐⭐⭐ (4/5)

---

### 방식 2: VirtualizedServerList + "더보기" 버튼 (15개)

#### ✅ 장점

1. **반응형 설계**: viewport 기반 동적 카드 수 계산 (1-5개/줄)
2. **자연스러운 UX**: "더보기" 버튼으로 직관적 확장
3. **초기 성능**: 첫 줄만 렌더링 (4-5개) → 빠른 FCP
4. **모바일 최적화**: 작은 화면에서 1개/줄 자동 조정
5. **전체 보기 가능**: 버튼 클릭으로 15개 모두 확인
6. **메모리 효율**: 초기 렌더링 최소화 (expanded=false)
7. **시각적 피드백**: "더보기 (N개 더 보기)" - 남은 개수 표시

#### ❌ 단점

1. **복잡한 로직**: window resize 이벤트 핸들링 필요
2. **상태 관리**: expanded, cardsPerRow 2개 state 관리
3. **테스트 어려움**: viewport 크기별 동작 검증 필요
4. **성능 오버헤드**: resize 이벤트 리스너 (debounce 없음)
5. **메모리 증가**: expanded=true 시 15개 전체 렌더링

#### 📊 평가

- **성능**: ⭐⭐⭐⭐ (4/5) - 초기 빠름, 확장 시 보통
- **UX**: ⭐⭐⭐⭐⭐ (5/5) - 매우 직관적
- **유지보수**: ⭐⭐⭐ (3/5) - 복잡한 로직
- **모바일**: ⭐⭐⭐⭐⭐ (5/5) - 완벽 대응
- **종합**: ⭐⭐⭐⭐ (4/5)

---

### 방식 3: react-window 가상 스크롤 (제거됨)

#### ✅ 장점 (시도한 이유)

1. **이론적 성능**: 수백 개 아이템도 효율적 렌더링
2. **메모리 절약**: 화면에 보이는 아이템만 DOM 생성
3. **무한 확장**: 1,000개 이상도 처리 가능
4. **검증된 라이브러리**: react-window v2.2.1 안정 버전

#### ❌ 단점 (52분 만에 제거한 이유)

1. **과도한 엔지니어링**: 15개 서버에는 오버킬 🔥
2. **복잡도 증가**: FixedSizeList 설정, 아이템 높이 계산
3. **UX 저하**: 고정 높이 (350px)로 반응형 불가
4. **스크롤 부자연**: 가상 스크롤 특유의 부드럽지 않은 느낌
5. **의존성 추가**: 불필요한 라이브러리 (13KB minified)
6. **디버깅 어려움**: react-window 내부 동작 이해 필요
7. **접근성 문제**: 스크린 리더 대응 추가 작업 필요

#### 📊 평가

- **성능**: ⭐⭐⭐⭐⭐ (5/5) - 이론적으로 완벽
- **UX**: ⭐⭐ (2/5) - 부자연스러움
- **유지보수**: ⭐⭐ (2/5) - 복잡함
- **모바일**: ⭐⭐⭐ (3/5) - 고정 높이로 제한적
- **적합성**: ⭐ (1/5) - 15개 규모에 부적합 🚨
- **종합**: ⭐⭐ (2/5) - **52분 만에 제거 결정 타당** ✅

#### 🔍 왜 제거했나?

**핵심 판단 기준**: **"15개 서버에 virtual scrolling이 필요한가?"**

**결론**: **NO** ❌

**근거**:

- 15개 × 350px = 5,250px 총 높이 → 스크롤 가능 범위
- 초기 렌더링 4-5개 카드 (1,400-1,750px) → FCP 충분히 빠름
- Virtual scrolling의 이점 (메모리 절약)이 **복잡도 증가**를 상쇄하지 못함
- "더보기" 버튼이 더 직관적이고 자연스러운 UX 제공

**타이밍 분석**:

- 09:05:44 - react-window 도입 시도
- 09:57:41 - 제거 및 "더보기" 방식 전환
- **52분간 테스트 후 빠른 결정** → 실용적 판단력 ✅

---

### 방식 4: 현재 Dual Strategy (조건부 렌더링)

#### ✅ 장점

1. **유연성**: 사용자 선택에 따라 최적 방식 제공
2. **성능 균형**: 작은 규모는 단순, 큰 규모는 "더보기"
3. **호환성**: 기존 페이지네이션 유지 → 점진적 개선
4. **선택권**: 사용자가 4/6/8/12/15 중 선택 가능

#### ❌ 단점

1. **중복 구현**: 두 가지 렌더링 방식 유지보수
2. **복잡도**: 조건부 로직 (pageSize >= 15) 추가
3. **일관성 부족**: 15개 선택 시 다른 UI/UX 제공
4. **혼란 가능성**: 사용자가 "모두 보기" 선택 시 방식 전환 인지 어려움

#### 📊 평가

- **성능**: ⭐⭐⭐⭐ (4/5) - 규모별 최적화
- **UX**: ⭐⭐⭐⭐ (4/5) - 선택권 제공
- **유지보수**: ⭐⭐⭐ (3/5) - 두 방식 관리
- **확장성**: ⭐⭐⭐⭐⭐ (5/5) - 서버 증가 대응 가능
- **종합**: ⭐⭐⭐⭐ (4/5) - **현재 15개 규모에 적합** ✅

---

## 📝 3. "8개 고정" 레거시 코드 분석

### 발견된 Dead Code

#### 🚨 Issue 1: serverConfig.ts Lines 100-119 (Dead Conditional Block)

**문제점**: 조건문이 **절대 true가 될 수 없음** ❌

```typescript
// Line 60
export const DEFAULT_SERVER_COUNT = 15; // Not 8!

// Lines 100-119
serverTypes:
  serverCount === 8  // ❌ ALWAYS FALSE (serverCount = 15)
    ? {
        orderedTypes: ['web', 'app', 'api', 'database', 'cache', 'storage', 'load-balancer', 'backup'],
        statusMapping: {
          critical: [3, 6],
          warning: [1, 4, 7],
          normal: [0, 2, 5],
        },
      }
    : undefined,
```

**왜 Dead Code인가?**:

- `DEFAULT_SERVER_COUNT = 15` 고정
- `serverCount === 8` 조건은 **절대 성립 불가**
- serverTypes 블록은 **항상 undefined**

**영향**:

- 실제 동작에는 영향 없음 (undefined로 처리됨)
- 코드 혼란 야기 (왜 8개 분기가 있지?)
- 번들 크기 증가 (불필요한 20줄)

---

#### 🐛 Issue 2: serverConfig.ts Line 326 (Hardcoded Bug)

**문제점**: 하드코딩된 `8`이 `ACTIVE_SERVER_CONFIG.maxServers` 무시

```typescript
export function getAllServersInfo() {
  return Array.from({ length: 8 }, (_, index) => getServerInfoByIndex(index));
  //                          ^^^ 🐛 Should use ACTIVE_SERVER_CONFIG.maxServers
}
```

**왜 버그인가?**:

- `ACTIVE_SERVER_CONFIG.maxServers = 15` 설정 무시
- **항상 8개만 반환** (나머지 7개 서버 누락)
- 설정 변경 시 동기화 안 됨

**수정 방법**:

```typescript
export function getAllServersInfo() {
  return Array.from({ length: ACTIVE_SERVER_CONFIG.maxServers }, (_, index) =>
    getServerInfoByIndex(index)
  );
}
```

---

#### ⚠️ Issue 3: ServerDashboard.tsx Line 266 (Outdated Comment)

**문제점**: 주석과 실제 코드 불일치

```typescript
// 현재 주석 (WRONG):
// ⚡ 15개 전체 보기: 가상 스크롤 (react-window)

// 실제 구현:
<VirtualizedServerList /> // 내부는 CSS Grid + "더보기" 버튼
```

**왜 문제인가?**:

- react-window는 커밋 18853e71에서 **제거됨** (52분 전)
- 개발자 혼란 야기 ("어? react-window 어디있지?")
- 코드 리뷰 시 오해 가능

**수정 방법**:

```typescript
// ⚡ 15개 전체 보기: 반응형 그리드 + 더보기 버튼
```

---

## 🎯 4. 개선 제안

### 제안 1: Dead Code 제거 (우선순위: 높음)

**대상**: serverConfig.ts Lines 100-119

**제거 이유**:

- 조건 `serverCount === 8` 절대 성립 불가
- 20줄 코드 절약 (번들 크기 감소)
- 코드 가독성 향상

**영향도**: ✅ 없음 (이미 항상 undefined)

---

### 제안 2: getAllServersInfo() 버그 수정 (우선순위: 높음)

**현재 문제**: 하드코딩된 `8` → 7개 서버 누락

**수정 전**:

```typescript
return Array.from({ length: 8 }, ...);
```

**수정 후**:

```typescript
return Array.from({ length: ACTIVE_SERVER_CONFIG.maxServers }, ...);
```

**영향도**: ⚠️ 주의 - 반환 배열 크기 변경 (8 → 15)

---

### 제안 3: Outdated Comment 업데이트 (우선순위: 중간)

**대상**: ServerDashboard.tsx Line 266

**수정 전**:

```typescript
// ⚡ 15개 전체 보기: 가상 스크롤 (react-window)
```

**수정 후**:

```typescript
// ⚡ 15개 전체 보기: 반응형 그리드 + 더보기 버튼 (VirtualizedServerList)
```

**추가 JSDoc 제안**:

```typescript
/**
 * 🎯 페이지 크기에 따른 렌더링 전략
 *
 * - pageSize < 15: 페이지네이션 드롭다운 (4/6/8/12개)
 *   - 고정 그리드 레이아웃 (responsive CSS Grid)
 *   - 메모리 효율적 (선택한 개수만 렌더링)
 *
 * - pageSize >= 15: VirtualizedServerList + "더보기" 버튼
 *   - 초기 렌더링: viewport 기반 첫 줄만 (4-5개)
 *   - 확장 시: 전체 15개 표시
 *   - 모바일 최적화: 자동 1개/줄 조정
 *
 * 참고: react-window는 커밋 18853e71에서 제거됨 (2025-10-14)
 */
```

---

## 📊 5. 종합 평가

### 현재 Dual Strategy 점수: ⭐⭐⭐⭐ (4/5)

**평가 근거**:

- ✅ 15개 규모에 적합한 설계
- ✅ 사용자 선택권 보장 (4-15개)
- ✅ 모바일 최적화 완료
- ✅ react-window 제거 결정 타당 (52분 빠른 판단)
- ⚠️ 두 가지 렌더링 방식 유지보수 부담
- ⚠️ Dead code 정리 필요

---

### 핵심 교훈

1. **Over-engineering 경계**: 15개 서버에 virtual scrolling은 과도함
2. **빠른 실험 & 피봇**: 52분 만에 방향 전환 → 실용적 접근
3. **UX 우선**: 이론적 성능보다 사용자 경험 중시
4. **코드 정리 중요**: Dead code는 혼란 야기 (8개 vs 15개)

---

### 다음 단계 제안

**즉시 처리 (Breaking Changes 없음)**:

1. ✅ Dead code 제거 (serverConfig.ts Lines 100-119)
2. ✅ Comment 업데이트 (ServerDashboard.tsx Line 266)

**주의 필요 (Breaking Changes 가능)**: 3. ⚠️ getAllServersInfo() 수정 (8 → 15) - 호출부 영향도 확인 필수

**장기 고려사항**: 4. 🔄 resize 이벤트 debounce 추가 (VirtualizedServerList 성능 개선) 5. 🔄 서버 30개 이상 확장 시 react-window 재검토

---

## 📚 참고 자료

### 관련 파일

- `src/components/dashboard/ServerDashboard.tsx` (Lines 264-271: Dual Strategy)
- `src/components/dashboard/VirtualizedServerList.tsx` (Lines 25-40, 189-214)
- `src/config/serverConfig.ts` (Lines 60, 100-119, 326)

### Git Commits

- `c6bba66d` (2025-10-14 09:05:44) - react-window 도입
- `18853e71` (2025-10-14 09:57:41) - react-window 제거, "더보기" 전환

### 관련 문서

- CLAUDE.md - 코딩 표준 및 파일 크기 정책
- docs/claude/standards/typescript-rules.md - TypeScript 규칙

---

**작성자**: Claude Code (Sonnet 4.5)
**분석 기준일**: 2025-10-20
**다음 리뷰 예정**: 2025-11-20 (서버 규모 변경 시)
