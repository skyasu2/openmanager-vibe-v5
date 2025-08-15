# 🎯 Core Web Vitals 성능 최적화 계획

## 📊 현재 상태 분석 (2025-08-14)

### 🚨 심각한 성능 문제 발견

- **총 컴포넌트**: 244개
- **총 성능 이슈**: 182개
- **심각한 이슈**: 20개
- **성능 점수**: 0점 (매우 위험)

### 🔍 주요 문제점

1. **대형 컴포넌트**: 500줄 이상의 매우 큰 컴포넌트 20개
2. **번들 크기**: 개별 컴포넌트가 20-35KB로 과도하게 큼
3. **React 최적화 부족**: memo, useMemo, useCallback 미사용
4. **코드 스플리팅 부족**: 동적 로딩이 적용되지 않음

## 🎯 Core Web Vitals 목표

| 지표        | 현재 예상 | 목표    | 우선순위  |
| ----------- | --------- | ------- | --------- |
| **LCP**     | > 4.0초   | < 2.5초 | 🔴 HIGH   |
| **CLS**     | > 0.3     | < 0.1   | 🔴 HIGH   |
| **FID/TBT** | > 300ms   | < 100ms | 🔴 HIGH   |
| **FCP**     | > 3.0초   | < 1.8초 | 🟡 MEDIUM |
| **SI**      | > 5.0초   | < 3.4초 | 🟡 MEDIUM |
| **TTI**     | > 6.0초   | < 3.8초 | 🟡 MEDIUM |

## 🚀 1단계: 긴급 최적화 (1-2주)

### 1.1 대형 컴포넌트 분리 (LCP 개선)

#### 🔴 최우선 분리 대상

```typescript
// 현재 상태 -> 목표
AISidebarV2.tsx          (937줄, 31KB) -> 5-7개 컴포넌트로 분리
IntelligentMonitoringPage.tsx (923줄, 34KB) -> 4-6개 컴포넌트로 분리
SystemChecklist.tsx     (897줄, 29KB) -> 6-8개 컴포넌트로 분리
```

#### 분리 전략

```typescript
// Before: 하나의 거대한 컴포넌트
const AISidebarV2 = () => {
  // 937줄의 모든 로직...
};

// After: 기능별 분리
const AISidebar = () => (
  <Suspense fallback={<SidebarSkeleton />}>
    <AISidebarHeader />
    <AIChatSection />
    <AIAnalyticsSection />
    <AISettingsSection />
  </Suspense>
);

// 각 섹션을 lazy loading으로 최적화
const AIChatSection = React.lazy(() => import('./sections/AIChatSection'));
const AIAnalyticsSection = React.lazy(() => import('./sections/AIAnalyticsSection'));
```

### 1.2 React.memo 일괄 적용 (TBT 개선)

#### 적용 대상 컴포넌트 (50개+)

```typescript
// Before
const DashboardCard = ({ title, data, isLoading }) => {
  return <div>...</div>;
};

// After
const DashboardCard = React.memo(({ title, data, isLoading }) => {
  return <div>...</div>;
});

// 또는 props 비교 최적화
const DashboardCard = React.memo(({ title, data, isLoading }) => {
  return <div>...</div>;
}, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.isLoading === nextProps.isLoading &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});
```

### 1.3 Dynamic Import 적용 (LCP, FCP 개선)

#### 페이지 레벨 코드 스플리팅

```typescript
// pages/dashboard/page.tsx
const DashboardContent = dynamic(
  () => import('@/components/dashboard/DashboardContent'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false // 클라이언트에서만 로드
  }
);

const AdminDashboard = dynamic(
  () => import('@/components/admin/AdminDashboard'),
  {
    loading: () => <AdminSkeleton />,
    ssr: false
  }
);
```

#### 조건부 컴포넌트 최적화

```typescript
// Before: 항상 번들에 포함
import { HeavyAnalyticsChart } from './charts/HeavyAnalyticsChart';

const Dashboard = ({ showAnalytics }) => (
  <div>
    {showAnalytics && <HeavyAnalyticsChart />}
  </div>
);

// After: 필요할 때만 로드
const HeavyAnalyticsChart = dynamic(() => import('./charts/HeavyAnalyticsChart'));

const Dashboard = ({ showAnalytics }) => (
  <div>
    {showAnalytics && (
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyAnalyticsChart />
      </Suspense>
    )}
  </div>
);
```

## 🛠️ 2단계: 심화 최적화 (2-3주)

### 2.1 useMemo/useCallback 최적화 (TBT 개선)

#### 비용이 큰 연산 최적화

```typescript
const DashboardAnalytics = ({ rawData, filters }) => {
  // Before: 매 렌더링마다 재계산
  const processedData = rawData
    .filter(item => filters.includes(item.category))
    .map(item => ({ ...item, calculated: item.value * 1.2 }))
    .sort((a, b) => b.calculated - a.calculated);

  // After: 의존성이 변할 때만 재계산
  const processedData = useMemo(() => {
    return rawData
      .filter(item => filters.includes(item.category))
      .map(item => ({ ...item, calculated: item.value * 1.2 }))
      .sort((a, b) => b.calculated - a.calculated);
  }, [rawData, filters]);

  // 이벤트 핸들러 최적화
  const handleItemClick = useCallback((itemId: string) => {
    // 핸들러 로직
    onItemSelect(itemId);
  }, [onItemSelect]);

  return (
    <div>
      {processedData.map(item => (
        <Item
          key={item.id}
          data={item}
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
};
```

### 2.2 번들 분석 및 최적화

#### Webpack Bundle Analyzer 활용

```bash
npm run analyze
```

#### 무거운 라이브러리 대체

```typescript
// Before: 전체 lodash import (70KB+)
import _ from 'lodash';

// After: 필요한 함수만 import (5KB)
import { debounce, throttle } from 'lodash-es';

// Before: Moment.js (67KB)
import moment from 'moment';

// After: date-fns (13KB)
import { format, addDays } from 'date-fns';
```

### 2.3 이미지 최적화 (LCP, CLS 개선)

#### Next.js Image 컴포넌트 적용

```typescript
// Before: 일반 img 태그
<img src="/dashboard-chart.png" alt="Dashboard" />

// After: Next.js 최적화 이미지
import Image from 'next/image';

<Image
  src="/dashboard-chart.png"
  alt="Dashboard"
  width={800}
  height={400}
  priority={true} // LCP 개선을 위한 우선 로딩
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

#### WebP 형식 변환 및 lazy loading

```typescript
const OptimizedDashboardImage = () => (
  <Image
    src="/dashboard-chart.webp"
    alt="Dashboard Chart"
    width={800}
    height={400}
    loading="lazy" // 뷰포트에 들어올 때 로드
    quality={85} // 적절한 품질 설정
  />
);
```

## ⚡ 3단계: 고급 최적화 (3-4주)

### 3.1 서버 컴포넌트 전환 (LCP, FCP 개선)

#### 정적 콘텐츠를 서버 컴포넌트로 변환

```typescript
// app/dashboard/page.tsx (서버 컴포넌트)
export default async function DashboardPage() {
  // 서버에서 데이터 페칭
  const serverData = await fetchDashboardData();

  return (
    <div>
      {/* 서버에서 렌더링되는 정적 부분 */}
      <DashboardHeader data={serverData} />

      {/* 클라이언트에서만 필요한 인터랙티브 부분 */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardInteractive initialData={serverData} />
      </Suspense>
    </div>
  );
}

// DashboardInteractive.tsx (클라이언트 컴포넌트)
'use client';
const DashboardInteractive = ({ initialData }) => {
  const [data, setData] = useState(initialData);
  // 인터랙티브 로직...
};
```

### 3.2 가상 스크롤링 (TBT 개선)

#### 대용량 리스트 최적화

```typescript
import { FixedSizeList as List } from 'react-window';

const VirtualizedServerList = ({ servers }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ServerCard server={servers[index]} />
    </div>
  );

  return (
    <List
      height={600} // 컨테이너 높이
      itemCount={servers.length}
      itemSize={120} // 각 아이템 높이
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 3.3 웹팩 설정 최적화

#### next.config.mjs 고급 설정

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 번들 최적화
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'framer-motion',
    ],
    // 부분 사전 렌더링
    ppr: true,
  },

  // 번들 크기 제한
  webpack: (config) => {
    config.optimization.splitChunks.maxSize = 150000; // 150KB
    config.optimization.splitChunks.maxAsyncSize = 200000; // 200KB

    // 중복 제거
    config.optimization.providedExports = true;
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;

    return config;
  },
};
```

## 📊 4단계: 성능 모니터링 (지속적)

### 4.1 실시간 모니터링 설정

#### Core Web Vitals 추적

```typescript
// components/analytics/WebVitalsReporter.tsx
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}

// app/layout.tsx
export default function RootLayout({ children }) {
  useEffect(() => {
    reportWebVitals();
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

#### 성능 예산 설정

```json
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 3
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'largest-contentful-paint': ['error', {maxNumericValue: 2500}],
        'cumulative-layout-shift': ['error', {maxNumericValue: 0.1}],
        'total-blocking-time': ['error', {maxNumericValue: 100}]
      }
    }
  }
};
```

### 4.2 자동화된 성능 테스트

#### GitHub Actions 워크플로우

```yaml
# .github/workflows/performance.yml
name: Performance Monitoring

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start application
        run: npm start &

      - name: Run Lighthouse CI
        run: npx lhci autorun

      - name: Run Core Web Vitals Analysis
        run: node scripts/performance/core-web-vitals-analysis.js
```

## 📈 예상 성능 개선 효과

### Core Web Vitals 개선 예상치

| 단계           | LCP    | CLS   | TBT    | 전체 점수 |
| -------------- | ------ | ----- | ------ | --------- |
| **현재**       | ~4.5초 | ~0.4  | ~400ms | 0점       |
| **1단계 완료** | ~3.2초 | ~0.25 | ~250ms | 45점      |
| **2단계 완료** | ~2.8초 | ~0.15 | ~150ms | 70점      |
| **3단계 완료** | ~2.3초 | ~0.08 | ~80ms  | 90점+     |

### 사용자 경험 개선

1. **초기 로딩 시간**: 6초 → 2.5초 (58% 개선)
2. **상호작용 지연**: 400ms → 80ms (80% 개선)
3. **레이아웃 안정성**: 크게 개선 (CLS 0.4 → 0.08)
4. **번들 크기**: 현재 대비 40% 감소 예상

## 🎯 실행 계획 및 우선순위

### Week 1-2: 긴급 최적화

- [ ] 상위 10개 대형 컴포넌트 분리
- [ ] React.memo 일괄 적용 (50개+ 컴포넌트)
- [ ] Dynamic import 핵심 페이지 적용

### Week 3-4: 심화 최적화

- [ ] useMemo/useCallback 최적화
- [ ] 이미지 최적화 및 WebP 전환
- [ ] 번들 분석 및 무거운 라이브러리 교체

### Week 5-6: 고급 최적화

- [ ] 서버 컴포넌트 전환
- [ ] 가상 스크롤링 적용
- [ ] 웹팩 설정 고도화

### Week 7+: 지속적 모니터링

- [ ] 성능 모니터링 시스템 구축
- [ ] 자동화된 성능 테스트 설정
- [ ] 성능 예산 및 알림 시스템

## 🚨 주의사항 및 리스크

1. **점진적 적용**: 한 번에 모든 최적화를 적용하지 말고 단계적으로 진행
2. **기능 검증**: 성능 최적화 후 모든 기능이 정상 작동하는지 확인
3. **사용자 테스트**: 실제 사용자 환경에서 성능 개선 효과 검증
4. **백업 계획**: 성능 최적화로 인한 문제 발생 시 롤백 계획 수립

---

**📞 담당자**: Performance Optimization Team  
**📅 최종 업데이트**: 2025-08-14  
**🔄 다음 검토**: 2025-08-28
