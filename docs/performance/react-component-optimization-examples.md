# 🛠️ React 컴포넌트 최적화 실전 예시

## 🎯 대형 컴포넌트 분리 전략

### 1. AISidebarV2.tsx 최적화 (937줄 → 분리)

#### 🔴 Before: 거대한 단일 컴포넌트

```typescript
// src/domains/ai-sidebar/components/AISidebarV2.tsx (937줄)
export const AISidebarV2 = ({ isOpen, onClose }) => {
  // 937줄의 모든 로직과 UI...
  const [chatMessages, setChatMessages] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // 수백 줄의 이벤트 핸들러들...
  const handleChatSubmit = (message) => { /* ... */ };
  const handleAnalyticsRefresh = () => { /* ... */ };
  const handleSettingsChange = (key, value) => { /* ... */ };

  return (
    <div className="sidebar">
      {/* 채팅 섹션 */}
      <div className="chat-section">
        {/* 200+ 줄의 채팅 UI */}
      </div>

      {/* 분석 섹션 */}
      <div className="analytics-section">
        {/* 300+ 줄의 분석 UI */}
      </div>

      {/* 설정 섹션 */}
      <div className="settings-section">
        {/* 200+ 줄의 설정 UI */}
      </div>
    </div>
  );
};
```

#### ✅ After: 최적화된 분리 구조

```typescript
// src/domains/ai-sidebar/components/AISidebar.tsx (메인 컴포넌트)
import { Suspense } from 'react';

// 동적 import로 코드 스플리팅
const AIChatSection = React.lazy(() => import('./sections/AIChatSection'));
const AIAnalyticsSection = React.lazy(() => import('./sections/AIAnalyticsSection'));
const AISettingsSection = React.lazy(() => import('./sections/AISettingsSection'));

export const AISidebar = React.memo(({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="sidebar">
      <AISidebarHeader onClose={onClose} />

      <Suspense fallback={<SectionSkeleton />}>
        <AIChatSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <AIAnalyticsSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <AISettingsSection />
      </Suspense>
    </div>
  );
});

// src/domains/ai-sidebar/components/sections/AIChatSection.tsx (~150줄)
export default function AIChatSection() {
  const { messages, sendMessage, isLoading } = useAIChat();

  const handleSubmit = useCallback((message: string) => {
    sendMessage(message);
  }, [sendMessage]);

  return (
    <div className="chat-section">
      <ChatMessages messages={messages} />
      <ChatInput onSubmit={handleSubmit} disabled={isLoading} />
    </div>
  );
}

// src/domains/ai-sidebar/components/sections/AIAnalyticsSection.tsx (~180줄)
export default function AIAnalyticsSection() {
  const { data, isLoading, refetch } = useAIAnalytics();

  const chartData = useMemo(() => {
    return processAnalyticsData(data);
  }, [data]);

  return (
    <div className="analytics-section">
      <AnalyticsHeader onRefresh={refetch} isLoading={isLoading} />
      <AnalyticsCharts data={chartData} />
    </div>
  );
}
```

### 2. IntelligentMonitoringPage.tsx 최적화 (923줄 → 분리)

#### 🔴 Before: 하나의 거대한 페이지

```typescript
// src/components/ai/pages/IntelligentMonitoringPage.tsx (923줄)
export default function IntelligentMonitoringPage() {
  // 모든 상태를 한 곳에서 관리
  const [analysisState, setAnalysisState] = useState({...});
  const [anomalies, setAnomalies] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [insights, setInsights] = useState([]);

  // 수백 줄의 로직...

  return (
    <div>
      {/* 923줄의 모든 UI... */}
    </div>
  );
}
```

#### ✅ After: 페이지 + 섹션으로 분리

```typescript
// src/app/monitoring/page.tsx (서버 컴포넌트)
export default async function MonitoringPage() {
  // 서버에서 초기 데이터 페칭
  const initialData = await fetchMonitoringData();

  return (
    <Suspense fallback={<MonitoringPageSkeleton />}>
      <IntelligentMonitoringClient initialData={initialData} />
    </Suspense>
  );
}

// src/components/monitoring/IntelligentMonitoringClient.tsx (~100줄)
'use client';
import { MonitoringProvider } from './context/MonitoringContext';

export default function IntelligentMonitoringClient({ initialData }) {
  return (
    <MonitoringProvider initialData={initialData}>
      <div className="monitoring-page">
        <MonitoringHeader />

        <div className="monitoring-content">
          <AnomalyDetectionSection />
          <PredictiveAnalysisSection />
          <AIInsightsSection />
        </div>
      </div>
    </MonitoringProvider>
  );
}

// src/components/monitoring/sections/AnomalyDetectionSection.tsx (~150줄)
export function AnomalyDetectionSection() {
  const { anomalies, detectAnomalies } = useMonitoringContext();

  const handleDetection = useCallback(async () => {
    await detectAnomalies();
  }, [detectAnomalies]);

  return (
    <Section title="이상 탐지">
      <AnomalyDetectionControls onDetect={handleDetection} />
      <AnomalyList anomalies={anomalies} />
    </Section>
  );
}
```

## ⚡ React 최적화 패턴 적용

### 3. React.memo 최적화

#### 🔴 Before: 불필요한 리렌더링 발생

```typescript
// 부모 컴포넌트가 리렌더링될 때마다 DashboardCard도 리렌더링됨
const DashboardCard = ({ title, value, trend, isLoading }) => {
  console.log(`DashboardCard ${title} rendered`); // 매번 실행됨

  return (
    <div className="dashboard-card">
      <h3>{title}</h3>
      <div className="value">{value}</div>
      {trend && <div className="trend">{trend}</div>}
      {isLoading && <LoadingSpinner />}
    </div>
  );
};

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [serverData, setServerData] = useState([]);

  // 1초마다 시간 업데이트 -> 모든 DashboardCard가 리렌더링됨!
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <div>현재 시간: {currentTime.toLocaleTimeString()}</div>
      {serverData.map(server => (
        <DashboardCard
          key={server.id}
          title={server.name}
          value={server.status}
          trend={server.trend}
          isLoading={server.isLoading}
        />
      ))}
    </div>
  );
};
```

#### ✅ After: React.memo로 최적화

```typescript
// props가 변경되지 않으면 리렌더링하지 않음
const DashboardCard = React.memo(({ title, value, trend, isLoading }) => {
  console.log(`DashboardCard ${title} rendered`); // props 변경시에만 실행

  return (
    <div className="dashboard-card">
      <h3>{title}</h3>
      <div className="value">{value}</div>
      {trend && <div className="trend">{trend}</div>}
      {isLoading && <LoadingSpinner />}
    </div>
  );
});

// 복잡한 객체 비교를 위한 커스텀 비교 함수
const DashboardCardWithCustomComparison = React.memo(
  ({ server, onAction }) => {
    return (
      <div className="dashboard-card">
        <h3>{server.name}</h3>
        <div className="value">{server.status}</div>
        <button onClick={() => onAction(server.id)}>Action</button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // server 객체의 주요 필드만 비교
    return (
      prevProps.server.id === nextProps.server.id &&
      prevProps.server.name === nextProps.server.name &&
      prevProps.server.status === nextProps.server.status &&
      prevProps.onAction === nextProps.onAction
    );
  }
);
```

### 4. useMemo/useCallback 최적화

#### 🔴 Before: 매 렌더링마다 재계산

```typescript
const ServerAnalytics = ({ servers, filters, sortBy }) => {
  // 매 렌더링마다 재계산됨 (매우 비용이 큼)
  const filteredServers = servers
    .filter(server => {
      return filters.status.includes(server.status) &&
             filters.region.includes(server.region) &&
             server.metrics.cpu < filters.maxCpu;
    })
    .map(server => ({
      ...server,
      score: calculateServerScore(server), // 복잡한 계산
      healthStatus: determineHealthStatus(server) // 복잡한 계산
    }))
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  // 매 렌더링마다 새로운 함수 생성됨
  const handleServerClick = (serverId) => {
    onServerSelect(serverId);
  };

  const handleRefresh = () => {
    refreshData();
  };

  return (
    <div>
      <button onClick={handleRefresh}>새로고침</button>
      {filteredServers.map(server => (
        <ServerCard
          key={server.id}
          server={server}
          onClick={handleServerClick} // 새로운 함수 참조로 인해 ServerCard 리렌더링
        />
      ))}
    </div>
  );
};
```

#### ✅ After: useMemo/useCallback으로 최적화

```typescript
const ServerAnalytics = ({ servers, filters, sortBy, onServerSelect, refreshData }) => {
  // 의존성이 변경될 때만 재계산
  const filteredServers = useMemo(() => {
    console.log('필터링 및 정렬 재계산'); // 의존성 변경시에만 실행

    return servers
      .filter(server => {
        return filters.status.includes(server.status) &&
               filters.region.includes(server.region) &&
               server.metrics.cpu < filters.maxCpu;
      })
      .map(server => ({
        ...server,
        score: calculateServerScore(server),
        healthStatus: determineHealthStatus(server)
      }))
      .sort((a, b) => {
        if (sortBy === 'score') return b.score - a.score;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [servers, filters, sortBy]); // 이 값들이 변경될 때만 재계산

  // 함수 참조가 안정적으로 유지됨
  const handleServerClick = useCallback((serverId: string) => {
    onServerSelect(serverId);
  }, [onServerSelect]);

  const handleRefresh = useCallback(() => {
    refreshData();
  }, [refreshData]);

  // 통계 계산도 메모이제이션
  const analytics = useMemo(() => {
    return {
      totalServers: filteredServers.length,
      averageScore: filteredServers.reduce((sum, s) => sum + s.score, 0) / filteredServers.length,
      healthyCount: filteredServers.filter(s => s.healthStatus === 'healthy').length
    };
  }, [filteredServers]);

  return (
    <div>
      <div className="analytics-summary">
        <span>총 서버: {analytics.totalServers}</span>
        <span>평균 점수: {analytics.averageScore.toFixed(1)}</span>
        <span>정상 서버: {analytics.healthyCount}</span>
      </div>

      <button onClick={handleRefresh}>새로고침</button>

      {filteredServers.map(server => (
        <ServerCard
          key={server.id}
          server={server}
          onClick={handleServerClick} // 안정적인 함수 참조
        />
      ))}
    </div>
  );
};
```

## 📦 코드 스플리팅 및 Lazy Loading

### 5. 동적 Import 최적화

#### 🔴 Before: 모든 컴포넌트가 초기 번들에 포함

```typescript
// 모든 import가 초기 로딩 시 포함됨
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { ReportsPage } from '@/components/reports/ReportsPage';
import { UserManagement } from '@/components/users/UserManagement';

const App = ({ currentPage, userRole }) => {
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <AdminDashboard />;
      case 'analytics': return <AnalyticsPage />;
      case 'settings': return <SettingsPanel />;
      case 'reports': return <ReportsPage />;
      case 'users': return <UserManagement />;
      default: return <div>Not Found</div>;
    }
  };

  return (
    <div>
      {renderPage()}
    </div>
  );
};
```

#### ✅ After: 동적 로딩으로 최적화

```typescript
// 필요할 때만 로드되는 컴포넌트들
const AdminDashboard = dynamic(() => import('@/components/admin/AdminDashboard'), {
  loading: () => <AdminDashboardSkeleton />,
  ssr: false // 클라이언트에서만 로드
});

const AnalyticsPage = dynamic(() => import('@/components/analytics/AnalyticsPage'), {
  loading: () => <AnalyticsPageSkeleton />
});

const SettingsPanel = dynamic(() => import('@/components/settings/SettingsPanel'), {
  loading: () => <SettingsSkeleton />
});

const ReportsPage = dynamic(() => import('@/components/reports/ReportsPage'), {
  loading: () => <ReportsSkeleton />
});

const UserManagement = dynamic(() => import('@/components/users/UserManagement'), {
  loading: () => <UsersSkeleton />
});

const App = ({ currentPage, userRole }) => {
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Suspense fallback={<AdminDashboardSkeleton />}>
            <AdminDashboard />
          </Suspense>
        );
      case 'analytics':
        return (
          <Suspense fallback={<AnalyticsPageSkeleton />}>
            <AnalyticsPage />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<SettingsSkeleton />}>
            <SettingsPanel />
          </Suspense>
        );
      // ... 다른 경우들
      default: return <div>Not Found</div>;
    }
  };

  return (
    <div>
      {renderPage()}
    </div>
  );
};

// 조건부 로딩도 최적화
const ConditionalComponents = ({ showAdvanced, showCharts }) => {
  return (
    <div>
      {showAdvanced && (
        <Suspense fallback={<div>고급 설정 로딩 중...</div>}>
          <AdvancedSettings />
        </Suspense>
      )}

      {showCharts && (
        <Suspense fallback={<div>차트 로딩 중...</div>}>
          <HeavyChartsComponent />
        </Suspense>
      )}
    </div>
  );
};

const AdvancedSettings = dynamic(() => import('./AdvancedSettings'));
const HeavyChartsComponent = dynamic(() => import('./charts/HeavyCharts'));
```

### 6. 가상 스크롤링 (Virtual Scrolling)

#### 🔴 Before: 모든 항목을 DOM에 렌더링

```typescript
const ServerList = ({ servers }) => {
  // 1000개 서버가 있으면 1000개 DOM 요소 생성 -> 성능 저하
  return (
    <div className="server-list">
      {servers.map(server => (
        <ServerItem key={server.id} server={server} />
      ))}
    </div>
  );
};
```

#### ✅ After: 가상 스크롤링으로 최적화

```typescript
import { FixedSizeList as List } from 'react-window';
import { memo } from 'react';

// 개별 서버 아이템 메모이제이션
const ServerItem = memo(({ server, style }) => (
  <div style={style} className="server-item">
    <h3>{server.name}</h3>
    <div className="status">{server.status}</div>
    <div className="metrics">
      CPU: {server.cpu}% | Memory: {server.memory}%
    </div>
  </div>
));

const VirtualizedServerList = ({ servers }) => {
  const Row = useCallback(({ index, style }) => (
    <ServerItem
      style={style}
      server={servers[index]}
    />
  ), [servers]);

  return (
    <List
      height={600} // 보이는 영역 높이
      itemCount={servers.length} // 전체 항목 수
      itemSize={120} // 각 항목 높이
      width="100%"
      itemData={servers} // 데이터 전달
    >
      {Row}
    </List>
  );
};
```

## 🖼️ 이미지 최적화

### 7. Next.js Image 최적화

#### 🔴 Before: 일반 img 태그 사용

```typescript
const ServerDashboard = ({ servers }) => {
  return (
    <div>
      {servers.map(server => (
        <div key={server.id} className="server-card">
          <img
            src={`/server-icons/${server.type}.png`}
            alt={server.name}
            width="64"
            height="64"
          />
          <h3>{server.name}</h3>
          <img
            src={server.chartImage}
            alt="Server metrics"
            className="metrics-chart"
          />
        </div>
      ))}
    </div>
  );
};
```

#### ✅ After: Next.js Image로 최적화

```typescript
import Image from 'next/image';

const ServerDashboard = ({ servers }) => {
  return (
    <div>
      {servers.map(server => (
        <div key={server.id} className="server-card">
          <Image
            src={`/server-icons/${server.type}.webp`} // WebP 형식
            alt={server.name}
            width={64}
            height={64}
            priority={server.isPriority} // 중요한 서버는 우선 로딩
            placeholder="blur" // 블러 placeholder
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." // 인라인 블러
          />
          <h3>{server.name}</h3>
          <Image
            src={server.chartImage}
            alt="Server metrics"
            width={400}
            height={300}
            loading="lazy" // 지연 로딩
            quality={85} // 적절한 품질 설정
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ))}
    </div>
  );
};
```

### 8. 이미지 Placeholder 및 Progressive Loading

```typescript
import { useState } from 'react';
import Image from 'next/image';

const ProgressiveImage = ({ src, alt, width, height }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative">
      {/* 스켈레톤 로더 */}
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}

      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,..."
      />

      {/* 에러 상태 */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400">이미지 로드 실패</span>
        </div>
      )}
    </div>
  );
};
```

## 📊 성능 측정 및 모니터링

### 9. 컴포넌트 성능 프로파일링

```typescript
import { Profiler } from 'react';

const PerformanceProfiler = ({ id, children }) => {
  const onRender = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    // 성능 데이터를 분석 서비스로 전송
    if (actualDuration > 16) { // 16ms 이상이면 성능 이슈
      console.warn(`[Performance] ${id} took ${actualDuration}ms to render`);

      // 실제 환경에서는 analytics 서비스로 전송
      analytics.track('component_performance', {
        componentId: id,
        phase,
        duration: actualDuration,
        timestamp: Date.now()
      });
    }
  };

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
};

// 사용 예시
const Dashboard = () => (
  <PerformanceProfiler id="Dashboard">
    <div>
      <PerformanceProfiler id="ServerList">
        <ServerList />
      </PerformanceProfiler>

      <PerformanceProfiler id="Analytics">
        <AnalyticsPanel />
      </PerformanceProfiler>
    </div>
  </PerformanceProfiler>
);
```

### 10. 리렌더링 디버깅

```typescript
import { useEffect, useRef } from 'react';

// 리렌더링 원인을 찾는 커스텀 훅
const useWhyDidYouUpdate = (name, props) => {
  const previousProps = useRef();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps = {};

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log('[Why-Did-You-Update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
};

// 사용 예시
const ServerCard = (props) => {
  useWhyDidYouUpdate('ServerCard', props);

  return <div>...</div>;
};
```

---

**📝 참고**: 이 예시들을 점진적으로 적용하여 성능 개선 효과를 측정하면서 진행하세요. 한 번에 모든 최적화를 적용하기보다는 단계적으로 적용하여 각 최적화의 효과를 검증하는 것이 중요합니다.
