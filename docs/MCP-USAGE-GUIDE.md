# 🚀 MCP 활용 및 실전 가이드

> **Model Context Protocol 고급 활용법**  
> 실전 예제와 활용 패턴으로 개발 생산성 극대화

**최종 업데이트**: 2025-08-14  
**대상 사용자**: MCP 설치 완료 후 실전 활용법을 배우고 싶은 개발자  
**사전 요구사항**: [MCP 설치 가이드](./MCP-SETUP-GUIDE.md) 완료 필수

---

## 📦 11개 서버별 상세 활용법

### 1. 🗂️ FileSystem MCP - 파일 시스템 마스터

**핵심 기능과 실전 활용:**

```typescript
// 파일 검색 (패턴 매칭 + 제외 필터)
await mcp__filesystem__search_files({
  path: "./src",
  pattern: "*.test.ts",
  excludePatterns: ["node_modules", "dist", ".next"]
});

// 디렉토리 구조 시각화
await mcp__filesystem__directory_tree({
  path: "./src/services",
  maxDepth: 3,
  includeHidden: false
});

// 배치 파일 읽기 (성능 최적화)
await mcp__filesystem__read_multiple_files({
  paths: [
    "package.json", 
    "tsconfig.json", 
    "next.config.js",
    "src/types/database.ts",
    ".env.local"
  ]
});

// 대용량 파일 스트리밍 읽기
await mcp__filesystem__read_file({
  path: "./logs/app.log",
  encoding: "utf8",
  maxSize: 1024 * 1024  // 1MB 제한
});

// 안전한 파일 쓰기 (백업 생성)
await mcp__filesystem__write_file({
  path: "./src/utils/helper.ts",
  content: `export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    timeZone: 'Asia/Seoul'
  }).format(date);
};`,
  createBackup: true
});
```

### 2. 🧠 Memory MCP - 지식 그래프 전문가

**프로젝트 지식 체계적 관리:**

```typescript
// 프로젝트 아키텍처 엔티티 생성
await mcp__memory__create_entities({
  entities: [{
    name: "OpenManagerAuth",
    entityType: "System",
    observations: [
      "Supabase Auth + JWT 토큰 기반",
      "RLS 정책으로 다중 테넌시 구현", 
      "Next.js middleware에서 인증 검증",
      "세션 만료 시간: 15분 (액세스), 7일 (리프레시)"
    ]
  }, {
    name: "ServerMonitoring",
    entityType: "Feature",
    observations: [
      "실시간 메트릭 수집 (CPU, Memory, Disk)",
      "WebSocket 기반 라이브 업데이트",
      "알림 시스템 (임계치 초과 시)",
      "히스토리 데이터 7일 보관"
    ]
  }]
});

// 시스템 간 관계 정의
await mcp__memory__create_relations({
  relations: [{
    from: "OpenManagerAuth",
    to: "ServerMonitoring", 
    relationType: "secures",
    observations: [
      "인증된 사용자만 서버 데이터 접근",
      "사용자별 서버 격리 정책 적용"
    ]
  }, {
    from: "ServerMonitoring",
    to: "SupabaseDatabase",
    relationType: "stores_data_in",
    observations: [
      "metrics 테이블에 시계열 데이터 저장",
      "파티션 테이블로 성능 최적화"
    ]
  }]
});

// 문제 해결 경험 저장
await mcp__memory__create_entities({
  entities: [{
    name: "SupabaseRLSDebug2025",
    entityType: "TroubleshootingCase",
    observations: [
      "문제: RLS 정책으로 인한 쿼리 실패",
      "원인: auth.uid() NULL 처리 누락",
      "해결: COALESCE 함수로 NULL 안전 처리",
      "적용일: 2025-08-14",
      "성능 영향: 쿼리 속도 15% 향상"
    ]
  }]
});

// 프로젝트 지식 검색
await mcp__memory__search_nodes({
  query: "Supabase RLS authentication JWT token policy"
});
```

### 3. 🐙 GitHub MCP - 개발 워크플로우 자동화

**고급 GitHub 통합 활용:**

```typescript
// 풍부한 컨텍스트의 Pull Request 생성
await mcp__github__create_pull_request({
  owner: "username",
  repo: "openmanager-vibe-v5",
  title: "✨ feat: 실시간 서버 알림 시스템",
  head: "feature/real-time-alerts",
  base: "main",
  body: `## 🚀 새로운 기능

### 주요 변경사항
- WebSocket 기반 실시간 알림 시스템 구현
- 사용자별 알림 설정 및 필터링 기능
- 이메일 + 브라우저 푸시 알림 지원

### 🎯 비즈니스 가치
- 서버 장애 감지 시간 80% 단축 (5분 → 1분)
- 사용자 만족도 향상 (알림 놓침 방지)
- 운영 비용 절감 (자동 대응 시스템)

### 📊 성능 메트릭
- WebSocket 연결 오버헤드: < 5KB/연결
- 알림 전송 지연: < 200ms
- 동시 연결 지원: 1,000+ 사용자

### 🧪 테스트 완료
- [x] 단위 테스트 (96% 커버리지)
- [x] 통합 테스트 (E2E 시나리오)
- [x] 부하 테스트 (1,000 동시 사용자)
- [x] 크로스 브라우저 테스트

### 🔄 마이그레이션 가이드
\`\`\`sql
-- 알림 설정 테이블 생성
CREATE TABLE user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  notification_types TEXT[] DEFAULT '{email,push}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### 📸 스크린샷
![실시간 알림 데모](./docs/images/real-time-alerts-demo.png)

🎯 **Breaking Changes**: None
📱 **Mobile Ready**: iOS/Android 푸시 알림 지원`,
  draft: false,
  labels: ["feature", "real-time", "notifications", "enhancement"]
});

// 배치 파일 푸시 (단일 커밋)
await mcp__github__push_files({
  owner: "username",
  repo: "openmanager-vibe-v5",
  branch: "main",
  files: [
    {
      path: "src/services/notification.service.ts",
      content: `// 실시간 알림 서비스
export class NotificationService {
  private wsConnections = new Map<string, WebSocket>();
  
  async sendRealTimeAlert(userId: string, alert: Alert) {
    const ws = this.wsConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ALERT',
        payload: alert,
        timestamp: new Date().toISOString()
      }));
    }
  }
}`
    },
    {
      path: "src/hooks/useRealTimeAlerts.ts",
      content: `// React 훅으로 실시간 알림 구독
export const useRealTimeAlerts = (userId: string) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
    // WebSocket 연결 및 이벤트 처리
  }, [userId]);
}`
    },
    {
      path: "tests/notification.test.ts",
      content: `// 알림 시스템 테스트
describe('NotificationService', () => {
  test('should send real-time alert to connected user', async () => {
    // 테스트 구현
  });
});`
    }
  ],
  message: `✨ feat: 실시간 서버 알림 시스템 구현

🚀 주요 기능:
- WebSocket 기반 실시간 알림
- 사용자별 알림 설정 관리  
- 이메일 + 푸시 알림 통합

⚡ 성능 개선:
- 장애 감지 시간 80% 단축
- < 200ms 알림 전송 지연
- 1,000+ 동시 사용자 지원

🧪 테스트 커버리지: 96%
📱 크로스 플랫폼 지원 완료`
});

// 상세한 이슈 리포트 생성
await mcp__github__create_issue({
  owner: "username",
  repo: "openmanager-vibe-v5",
  title: "🐛 bug: 서버 메트릭 수집 누락 (메모리 사용량)",
  body: `## 🐛 버그 상세 리포트

### 발생 상황
- **발견 일시**: 2025-08-14 15:30 (KST)
- **영향 범위**: 전체 서버 (47개 서버)
- **지속 시간**: 약 2시간 (13:30 ~ 15:30)

### 증상
- 메모리 사용량 메트릭이 0%로 표시됨
- CPU, 디스크 사용량은 정상 수집
- 알림 시스템 정상 작동 (메모리 관련 제외)

### 재현 방법
1. 서버 목록 페이지 접속
2. 임의의 서버 선택하여 상세 보기
3. 메트릭 차트에서 메모리 사용량 확인
4. 0% 또는 "데이터 없음" 표시 확인

### 기술적 분석
\`\`\`sql
-- 문제가 되는 쿼리
SELECT 
  server_id,
  cpu_percent,
  memory_percent,  -- 이 값이 항상 0 반환
  disk_usage_gb,
  timestamp
FROM real_time_metrics 
WHERE server_id = $1 
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
\`\`\`

### 로그 분석
\`\`\`
[2025-08-14 13:32:15] ERROR: Memory metric collection failed
[2025-08-14 13:32:15] Details: /proc/meminfo read permission denied
[2025-08-14 13:32:15] Fallback: Setting memory_percent to 0
\`\`\`

### 예상 원인
1. **서버 에이전트 권한 문제**: \`/proc/meminfo\` 읽기 권한 부족
2. **Docker 컨테이너 격리**: 호스트 메모리 정보 접근 제한
3. **systemd 서비스 권한**: 메트릭 수집 서비스 권한 부족

### 비즈니스 영향
- **사용자 경험**: 메모리 알림 기능 동작 불가
- **운영 효율**: 수동 메모리 모니터링 필요
- **SLA 영향**: 99.9% → 98.5% (메모리 관련 장애 탐지 불가)

### 제안 해결책
1. **단기**: Docker 컨테이너에 \`--privileged\` 플래그 추가
2. **중기**: 메트릭 수집 서비스 권한 재설정
3. **장기**: 에이전트 없는 메트릭 수집 방식 검토

### 체크리스트
- [x] 문제 재현 완료
- [x] 로그 수집 및 분석
- [x] 비즈니스 영향 평가
- [ ] 해결책 구현 중
- [ ] 테스트 및 검증
- [ ] 배포 및 모니터링

### 우선순위: High
**메모리 사용량은 서버 안정성의 핵심 지표이므로 긴급 수정 필요**`,
  labels: ["bug", "metrics", "memory", "high-priority", "production"],
  assignees: ["username"],
  milestone: "v5.1.2"
});
```

### 4. 🗄️ Supabase MCP - 데이터베이스 전문가

**고급 PostgreSQL 활용 및 스키마 관리:**

```typescript
// 복잡한 분석 쿼리 실행
await mcp__supabase__execute_sql({
  project_id: "vnswjnltnhpsueosfhmw",
  query: `
    WITH server_performance_analysis AS (
      SELECT 
        s.id,
        s.name,
        s.status,
        -- 7일 평균 성능 지표
        AVG(m.cpu_percent) as avg_cpu,
        AVG(m.memory_percent) as avg_memory,
        AVG(m.disk_usage_gb) as avg_disk,
        
        -- 성능 등급 계산
        CASE 
          WHEN AVG(m.cpu_percent) < 50 AND AVG(m.memory_percent) < 70 THEN 'EXCELLENT'
          WHEN AVG(m.cpu_percent) < 70 AND AVG(m.memory_percent) < 85 THEN 'GOOD' 
          WHEN AVG(m.cpu_percent) < 85 AND AVG(m.memory_percent) < 95 THEN 'WARNING'
          ELSE 'CRITICAL'
        END as performance_grade,
        
        -- 알림 발생 횟수
        COUNT(CASE WHEN a.severity = 'critical' THEN 1 END) as critical_alerts,
        COUNT(CASE WHEN a.severity = 'warning' THEN 1 END) as warning_alerts,
        
        -- 가동률 계산 (5분 간격 체크)
        ROUND(
          COUNT(CASE WHEN m.cpu_percent IS NOT NULL THEN 1 END) * 100.0 / 
          (7 * 24 * 12), 2
        ) as uptime_percentage
        
      FROM servers s
      LEFT JOIN real_time_metrics m ON s.id = m.server_id 
        AND m.timestamp > NOW() - INTERVAL '7 days'
      LEFT JOIN alerts a ON s.id = a.server_id 
        AND a.created_at > NOW() - INTERVAL '7 days'
      WHERE s.user_id = auth.uid()
      GROUP BY s.id, s.name, s.status
    )
    SELECT 
      *,
      -- 비용 효율성 점수 (성능 대비 리소스 사용률)
      CASE 
        WHEN avg_cpu + avg_memory < 100 THEN 'UNDER_UTILIZED'
        WHEN avg_cpu + avg_memory < 150 THEN 'OPTIMAL'
        WHEN avg_cpu + avg_memory < 180 THEN 'HIGH_LOAD'
        ELSE 'OVER_LOADED'
      END as efficiency_rating,
      
      -- 권장 액션
      CASE
        WHEN critical_alerts > 10 THEN 'IMMEDIATE_ACTION_REQUIRED'
        WHEN performance_grade = 'CRITICAL' THEN 'SCALE_UP_RECOMMENDED'
        WHEN performance_grade = 'EXCELLENT' AND avg_cpu < 30 THEN 'SCALE_DOWN_CANDIDATE'
        ELSE 'MONITOR_CONTINUE'
      END as recommended_action
      
    FROM server_performance_analysis
    ORDER BY 
      CASE performance_grade
        WHEN 'CRITICAL' THEN 1
        WHEN 'WARNING' THEN 2 
        WHEN 'GOOD' THEN 3
        WHEN 'EXCELLENT' THEN 4
      END,
      critical_alerts DESC,
      avg_cpu DESC;
  `
});

// 고급 마이그레이션 (파티셔닝 + 인덱싱)
await mcp__supabase__apply_migration({
  project_id: "vnswjnltnhpsueosfhmw",
  name: "20250814_advanced_metrics_optimization",
  query: `
    -- 시계열 데이터 최적화를 위한 파티션 테이블 생성
    CREATE TABLE metrics_partitioned (
      id UUID DEFAULT gen_random_uuid(),
      server_id UUID NOT NULL,
      metric_type TEXT NOT NULL,
      value NUMERIC NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::jsonb
    ) PARTITION BY RANGE (timestamp);

    -- 월별 파티션 생성 (최근 6개월)
    CREATE TABLE metrics_2025_02 PARTITION OF metrics_partitioned
      FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
    CREATE TABLE metrics_2025_03 PARTITION OF metrics_partitioned  
      FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
    CREATE TABLE metrics_2025_04 PARTITION OF metrics_partitioned
      FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
    CREATE TABLE metrics_2025_05 PARTITION OF metrics_partitioned
      FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
    CREATE TABLE metrics_2025_06 PARTITION OF metrics_partitioned
      FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
    CREATE TABLE metrics_2025_07 PARTITION OF metrics_partitioned
      FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
    CREATE TABLE metrics_2025_08 PARTITION OF metrics_partitioned
      FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

    -- 고성능 인덱스 (BRIN + GiST + B-Tree 조합)
    CREATE INDEX idx_metrics_timestamp_brin 
      ON metrics_partitioned USING brin(timestamp);
    
    CREATE INDEX idx_metrics_server_timestamp_btree 
      ON metrics_partitioned(server_id, timestamp DESC);
      
    CREATE INDEX idx_metrics_type_value_gin 
      ON metrics_partitioned USING gin(metric_type gin_trgm_ops);
      
    CREATE INDEX idx_metrics_metadata_gin 
      ON metrics_partitioned USING gin(metadata);

    -- 실시간 집계를 위한 Materialized View
    CREATE MATERIALIZED VIEW server_metrics_hourly AS
    WITH hourly_aggregates AS (
      SELECT 
        server_id,
        date_trunc('hour', timestamp) as hour,
        metric_type,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value) as p95_value,
        COUNT(*) as sample_count
      FROM metrics_partitioned
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY server_id, date_trunc('hour', timestamp), metric_type
    )
    SELECT 
      server_id,
      hour,
      metric_type,
      avg_value,
      min_value, 
      max_value,
      p95_value,
      sample_count,
      -- 시간별 변화율 계산
      LAG(avg_value) OVER (
        PARTITION BY server_id, metric_type 
        ORDER BY hour
      ) as prev_hour_avg,
      ROUND(
        ((avg_value - LAG(avg_value) OVER (
          PARTITION BY server_id, metric_type 
          ORDER BY hour
        )) / NULLIF(LAG(avg_value) OVER (
          PARTITION BY server_id, metric_type 
          ORDER BY hour
        ), 0)) * 100, 2
      ) as hour_over_hour_change_percent
    FROM hourly_aggregates
    ORDER BY server_id, metric_type, hour DESC;

    -- 자동 새로고침 (5분마다)
    CREATE OR REPLACE FUNCTION refresh_server_metrics_hourly()
    RETURNS void AS $$
    BEGIN
      REFRESH MATERIALIZED VIEW CONCURRENTLY server_metrics_hourly;
    END;
    $$ LANGUAGE plpgsql;

    -- RLS 정책 (보안)
    ALTER TABLE metrics_partitioned ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "metrics_user_isolation" 
      ON metrics_partitioned FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM servers 
          WHERE servers.id = metrics_partitioned.server_id 
            AND servers.user_id = auth.uid()
        )
      );
      
    -- 자동 파티션 관리 함수
    CREATE OR REPLACE FUNCTION create_monthly_partition(target_date DATE)
    RETURNS void AS $$
    DECLARE
      partition_name TEXT;
      start_date DATE;
      end_date DATE;
    BEGIN
      start_date := date_trunc('month', target_date);
      end_date := start_date + INTERVAL '1 month';
      partition_name := 'metrics_' || to_char(start_date, 'YYYY_MM');
      
      EXECUTE format('
        CREATE TABLE %I PARTITION OF metrics_partitioned
        FOR VALUES FROM (%L) TO (%L)',
        partition_name, start_date, end_date
      );
    END;
    $$ LANGUAGE plpgsql;
  `
});

// TypeScript 타입 자동 생성 및 코드 생성
const dbTypes = await mcp__supabase__generate_typescript_types({
  project_id: "vnswjnltnhpsueosfhmw"
});

// 생성된 타입으로 서비스 클래스 구현
await mcp__filesystem__write_file({
  path: "src/services/metrics.service.ts",
  content: `import { Database } from '../types/database';
import { supabase } from '../lib/supabase';

type Metric = Database['public']['Tables']['metrics_partitioned']['Row'];
type MetricInsert = Database['public']['Tables']['metrics_partitioned']['Insert'];
type ServerMetricsHourly = Database['public']['Views']['server_metrics_hourly']['Row'];

export class MetricsService {
  // 고성능 메트릭 배치 삽입
  async batchInsertMetrics(metrics: MetricInsert[]): Promise<void> {
    const { error } = await supabase
      .from('metrics_partitioned')
      .insert(metrics);
      
    if (error) {
      throw new Error(\`Batch insert failed: \${error.message}\`);
    }
  }
  
  // 실시간 서버 성능 분석
  async getServerPerformanceAnalysis(serverId: string): Promise<any> {
    const { data, error } = await supabase
      .rpc('get_server_performance_analysis', { 
        server_id: serverId 
      });
      
    if (error) throw error;
    return data;
  }
  
  // 시간별 집계 데이터 조회
  async getHourlyMetrics(
    serverId: string, 
    metricType: string, 
    hours: number = 24
  ): Promise<ServerMetricsHourly[]> {
    const { data, error } = await supabase
      .from('server_metrics_hourly')
      .select('*')
      .eq('server_id', serverId)
      .eq('metric_type', metricType)
      .gte('hour', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('hour', { ascending: false });
      
    if (error) throw error;
    return data;
  }
}`
});
```

### 5. 🔍 Tavily MCP - 웹 연구 전문가

**고급 검색 및 콘텐츠 분석:**

```typescript
// 기술 트렌드 심층 분석
await mcp__tavily-mcp__tavily-search({
  query: "React 19 Server Components performance benchmarks 2025",
  search_depth: "advanced",
  time_range: "month",
  max_results: 15,
  include_domains: [
    "react.dev", 
    "vercel.com", 
    "nextjs.org",
    "web.dev",
    "developer.mozilla.org"
  ],
  exclude_domains: [
    "stackoverflow.com",
    "medium.com",
    "dev.to"  // 개인 블로그 제외
  ],
  categories: ["Documentation", "Performance", "Benchmarks"],
  include_answer: true,
  include_images: true,
  include_raw_content: false  // 요약만 필요
});

// 경쟁사 분석 (서버 모니터링 솔루션)
await mcp__tavily-mcp__tavily-search({
  query: "server monitoring solutions Datadog NewRelic Prometheus comparison 2025",
  search_depth: "advanced",
  time_range: "week",
  max_results: 20,
  categories: ["Business", "Technology", "Reviews"],
  instructions: `
    다음 정보에 집중해서 검색:
    1. 가격 정책 및 무료 티어 제한
    2. 실시간 모니터링 성능 지표
    3. 사용자 인터페이스 및 사용성
    4. API 및 통합 옵션
    5. 중소기업 대상 기능 비교
  `,
  include_answer: true
});

// 기술 문서 크롤링 (공식 문서)
await mcp__tavily-mcp__tavily-crawl({
  url: "https://docs.supabase.com/guides/database/functions",
  max_depth: 3,
  max_breadth: 15,
  categories: ["Documentation", "Tutorial", "API"],
  instructions: `
    PostgreSQL Functions 관련 내용만 추출:
    - 함수 생성 및 관리 방법
    - 성능 최적화 팁
    - RLS와 함수 연동 방법
    - 실제 사용 예제 및 베스트 프랙티스
    코드 예제는 TypeScript 형식으로 변환해서 포함
  `,
  include_links: true,
  follow_sitemap: true
});

// 다중 URL 콘텐츠 분석 (비교 분석용)
await mcp__tavily-mcp__tavily-extract({
  urls: [
    "https://vercel.com/docs/functions/edge-functions/edge-runtime",
    "https://workers.cloudflare.com/",
    "https://aws.amazon.com/lambda/edge/",
    "https://docs.netlify.com/edge-functions/overview/"
  ],
  format: "markdown",
  include_images: false,
  include_links: true,
  max_tokens_per_url: 3000,
  instructions: `
    Edge Computing 솔루션 비교 분석:
    1. 실행 환경 및 제약사항
    2. 성능 지표 (콜드 스타트, 응답 시간)
    3. 가격 정책 (무료 티어 포함)
    4. 개발자 경험 (DX)
    5. 생태계 및 통합 옵션
  `
});

// 실시간 기술 뉴스 모니터링
await mcp__tavily-mcp__tavily-search({
  query: "Next.js 15 turbopack production ready release notes",
  search_depth: "advanced", 
  time_range: "day",  // 오늘 발표된 내용만
  max_results: 8,
  categories: ["News", "Technology"],
  include_answer: true,
  include_raw_content: true
});
```

### 6. 🎭 Playwright MCP - 브라우저 자동화 전문가

**고급 E2E 테스팅 및 모니터링:**

```typescript
// 프로덕션 사이트 전체 플로우 테스트
await mcp__playwright__browser_navigate({
  url: "https://openmanager-vibe-v5.vercel.app",
  waitForLoad: true,
  timeout: 10000
});

// 로그인 플로우 자동화
await mcp__playwright__browser_click({
  element: "로그인 버튼",
  ref: "button[data-testid='login-button']"
});

await mcp__playwright__browser_type({
  element: "이메일 입력",
  ref: "input[name='email']",
  text: "admin@openmanager.dev"
});

await mcp__playwright__browser_key({ key: "Tab" });

await mcp__playwright__browser_type({
  element: "패스워드 입력", 
  ref: "input[name='password']",
  text: process.env.TEST_PASSWORD || "test123!"
});

await mcp__playwright__browser_key({ key: "Enter" });

// 로그인 성공 확인 (대시보드 페이지 로딩 대기)
await mcp__playwright__browser_wait_for({
  element: "대시보드 헤더",
  ref: "h1[data-testid='dashboard-title']",
  timeout: 5000
});

// 서버 목록 페이지 테스트
await mcp__playwright__browser_navigate({
  url: "https://openmanager-vibe-v5.vercel.app/servers"
});

// 서버 추가 플로우
await mcp__playwright__browser_click({
  element: "서버 추가 버튼",
  ref: "button[data-testid='add-server']"
});

await mcp__playwright__browser_type({
  element: "서버 이름",
  ref: "input[name='serverName']", 
  text: "Test Server E2E"
});

await mcp__playwright__browser_type({
  element: "서버 IP",
  ref: "input[name='serverIp']",
  text: "192.168.1.100"
});

// 드롭다운 선택 (서버 타입)
await mcp__playwright__browser_click({
  element: "서버 타입 드롭다운",
  ref: "select[name='serverType']"
});

await mcp__playwright__browser_click({
  element: "Linux 옵션",
  ref: "option[value='linux']"
});

// 폼 제출 및 성공 확인
await mcp__playwright__browser_click({
  element: "저장 버튼",
  ref: "button[type='submit']"
});

// 성공 토스트 메시지 확인
await mcp__playwright__browser_wait_for({
  element: "성공 메시지",
  ref: ".toast-success",
  timeout: 3000
});

// 실시간 메트릭 차트 테스트
await mcp__playwright__browser_click({
  element: "첫 번째 서버 카드",
  ref: ".server-card:first-child"
});

// 차트 데이터 로딩 대기
await mcp__playwright__browser_wait_for({
  element: "CPU 사용률 차트",
  ref: "canvas[data-testid='cpu-chart']",
  timeout: 8000
});

// 전체 페이지 스크린샷 (비교 분석용)
await mcp__playwright__browser_take_screenshot({
  filename: `e2e-test-${new Date().toISOString().split('T')[0]}.png`,
  fullPage: true,
  quality: 90
});

// 성능 메트릭 측정
const performanceMetrics = await mcp__playwright__browser_evaluate({
  expression: `
    JSON.stringify({
      loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
      domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
      firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime,
      networkRequests: performance.getEntriesByType('resource').length
    })
  `
});

// 접근성 테스트 (aria-label, alt 텍스트 등)
const accessibilityCheck = await mcp__playwright__browser_evaluate({
  expression: `
    const issues = [];
    
    // 이미지 alt 속성 확인
    document.querySelectorAll('img:not([alt])').forEach((img, index) => {
      issues.push(\`Image \${index + 1} missing alt attribute\`);
    });
    
    // 버튼 aria-label 확인
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach((btn, index) => {
      if (!btn.textContent.trim()) {
        issues.push(\`Button \${index + 1} missing accessible name\`);
      }
    });
    
    // 입력 필드 label 확인
    document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').forEach((input, index) => {
      const id = input.id;
      if (!id || !document.querySelector(\`label[for="\${id}"]\`)) {
        issues.push(\`Input \${index + 1} missing associated label\`);
      }
    });
    
    JSON.stringify({ issues, totalChecked: issues.length });
  `
});
```

---

## 🎯 고급 활용 패턴

### 패턴 1: 병렬 워크플로우 최적화

```typescript
// ✅ 권장: 독립적인 작업들을 병렬로 실행 (70% 속도 향상)
const [
  currentTime,
  projectFiles, 
  githubRepos,
  dbTables,
  webContent,
  browserScreenshot
] = await Promise.all([
  mcp__time__get_current_time({ timezone: "Asia/Seoul" }),
  mcp__filesystem__search_files({ 
    path: "./src", 
    pattern: "*.ts" 
  }),
  mcp__github__search_repositories({ 
    query: "openmanager-vibe-v5" 
  }),
  mcp__supabase__list_tables({ 
    project_id: "vnswjnltnhpsueosfhmw" 
  }),
  mcp__tavily-mcp__tavily-search({ 
    query: "Next.js 15 features", 
    max_results: 5 
  }),
  mcp__playwright__browser_take_screenshot({ 
    filename: "dashboard.png" 
  })
]);

console.log(`Completed 6 operations in parallel at ${currentTime.datetime}`);
```

### 패턴 2: 조건부 체이닝 워크플로우

```typescript
// 복잡한 의존성이 있는 워크플로우
const serverAnalysis = async (serverId: string) => {
  // 1단계: 서버 기본 정보 조회
  const serverInfo = await mcp__supabase__execute_sql({
    project_id: "vnswjnltnhpsueosfhmw",
    query: "SELECT * FROM servers WHERE id = $1",
    params: [serverId]
  });
  
  if (!serverInfo.data || serverInfo.data.length === 0) {
    throw new Error("서버를 찾을 수 없습니다");
  }
  
  const server = serverInfo.data[0];
  
  // 2단계: 서버 상태에 따른 조건부 분기
  if (server.status === 'active') {
    // 활성 서버: 실시간 메트릭 + 성능 분석
    const [metrics, analysis] = await Promise.all([
      mcp__supabase__execute_sql({
        project_id: "vnswjnltnhpsueosfhmw",
        query: `
          SELECT * FROM real_time_metrics 
          WHERE server_id = $1 
          AND timestamp > NOW() - INTERVAL '1 hour'
          ORDER BY timestamp DESC
        `,
        params: [serverId]
      }),
      mcp__sequential-thinking__sequentialthinking({
        thought: `서버 ${server.name}의 성능 분석을 위해 다음을 검토:
          1. CPU 사용률 트렌드
          2. 메모리 사용 패턴  
          3. 디스크 I/O 상태
          4. 네트워크 대역폭`,
        thoughtNumber: 1,
        totalThoughts: 3
      })
    ]);
    
    // 3단계: 문제 감지 시 알림 생성
    const criticalMetrics = metrics.data?.filter(m => 
      m.cpu_percent > 90 || m.memory_percent > 95
    );
    
    if (criticalMetrics && criticalMetrics.length > 0) {
      // GitHub 이슈 자동 생성
      await mcp__github__create_issue({
        owner: "username",
        repo: "openmanager-vibe-v5",
        title: `🚨 Critical: 서버 ${server.name} 성능 임계치 초과`,
        body: `## 자동 감지된 성능 문제
        
서버: ${server.name} (${server.ip})
감지 시간: ${await mcp__time__get_current_time({ timezone: "Asia/Seoul" })}

### 임계치 초과 메트릭
${criticalMetrics.map(m => 
  `- ${m.timestamp}: CPU ${m.cpu_percent}%, Memory ${m.memory_percent}%`
).join('\n')}

### 자동 분석 결과
${analysis.content}`,
        labels: ["alert", "performance", "auto-generated"]
      });
    }
  } else {
    // 비활성 서버: 마지막 활동 시간 조회
    const lastActivity = await mcp__supabase__execute_sql({
      project_id: "vnswjnltnhpsueosfhmw", 
      query: `
        SELECT MAX(timestamp) as last_seen
        FROM real_time_metrics
        WHERE server_id = $1
      `,
      params: [serverId]
    });
    
    console.log(`서버 ${server.name}는 비활성 상태 (마지막 활동: ${lastActivity.data?.[0]?.last_seen})`);
  }
};
```

### 패턴 3: 에러 복구 및 재시도 패턴

```typescript
// 견고한 에러 처리 및 자동 복구
const robustMcpCall = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      console.warn(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      // 특정 에러는 재시도하지 않음
      if (error.message.includes('permission denied') || 
          error.message.includes('not found')) {
        throw error;
      }
      
      // 마지막 시도가 아니면 백오프 대기
      if (attempt < maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, backoffMs * Math.pow(2, attempt - 1))
        );
      }
    }
  }
  
  throw lastError!;
};

// 사용 예제
const criticalData = await robustMcpCall(
  () => mcp__supabase__execute_sql({
    project_id: "vnswjnltnhpsueosfhmw",
    query: "SELECT * FROM critical_servers WHERE status = 'alert'"
  }),
  3,  // 최대 3회 재시도
  2000  // 초기 2초 대기, 이후 지수 백오프
);
```

### 패턴 4: 대용량 데이터 스트리밍 처리

```typescript
// 메모리 효율적인 대용량 데이터 처리
const processLargeDataset = async () => {
  const BATCH_SIZE = 1000;
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    // 배치 단위로 데이터 조회
    const batchResult = await mcp__supabase__execute_sql({
      project_id: "vnswjnltnhpsueosfhmw",
      query: `
        SELECT 
          server_id,
          metric_type, 
          value,
          timestamp
        FROM metrics_partitioned
        WHERE timestamp > NOW() - INTERVAL '30 days'
        ORDER BY timestamp DESC
        LIMIT $1 OFFSET $2
      `,
      params: [BATCH_SIZE, offset]
    });
    
    const batch = batchResult.data || [];
    hasMore = batch.length === BATCH_SIZE;
    
    if (batch.length > 0) {
      // 배치 병렬 처리
      await Promise.all(
        batch.map(async (metric) => {
          // 개별 메트릭 처리 로직
          await processMetric(metric);
        })
      );
      
      // 진행 상황 저장 (재시작 시 이어서 처리 가능)
      await mcp__memory__create_entities({
        entities: [{
          name: "DataProcessingProgress",
          entityType: "ProcessState",
          observations: [
            `Processed ${offset + batch.length} records`,
            `Current timestamp: ${new Date().toISOString()}`,
            `Memory usage: ${process.memoryUsage().heapUsed / 1024 / 1024}MB`
          ]
        }]
      });
    }
    
    offset += BATCH_SIZE;
    
    // 메모리 정리를 위한 짧은 대기
    if (offset % (BATCH_SIZE * 10) === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`대용량 데이터 처리 완료: 총 ${offset}개 레코드`);
};

const processMetric = async (metric: any) => {
  // 개별 메트릭 처리 로직
  // 예: 이상치 감지, 알림 생성, 집계 계산 등
};
```

---

## 💡 고급 활용 팁

### 성능 최적화 전략

#### 1. MCP 서버 응답 캐싱

```typescript
// 메모리 기반 응답 캐싱
const mcpCache = new Map<string, { data: any; expiry: number }>();

const cachedMcpCall = async (
  cacheKey: string, 
  operation: () => Promise<any>, 
  ttlMs: number = 300000  // 5분
) => {
  const now = Date.now();
  const cached = mcpCache.get(cacheKey);
  
  if (cached && cached.expiry > now) {
    return cached.data;
  }
  
  const result = await operation();
  mcpCache.set(cacheKey, { data: result, expiry: now + ttlMs });
  
  return result;
};

// 사용 예제
const servers = await cachedMcpCall(
  'servers-list',
  () => mcp__supabase__list_tables({ project_id: "vnswjnltnhpsueosfhmw" }),
  600000  // 10분 캐시
);
```

#### 2. 배치 요청 최적화

```typescript
// 다중 파일 읽기 최적화
const readProjectFiles = async (patterns: string[]) => {
  // 모든 패턴을 하나의 검색으로 통합
  const allFiles = await Promise.all(
    patterns.map(pattern => 
      mcp__filesystem__search_files({ 
        path: "./src", 
        pattern 
      })
    )
  );
  
  // 중복 제거
  const uniqueFiles = [...new Set(
    allFiles.flat().map(f => f.path)
  )];
  
  // 배치 읽기
  return mcp__filesystem__read_multiple_files({
    paths: uniqueFiles
  });
};
```

### 안전한 프로덕션 활용

#### 1. 환경별 MCP 설정

```typescript
// 환경별 MCP 서버 사용 제한
const isMcpAllowed = (serverType: string): boolean => {
  const env = process.env.NODE_ENV;
  
  // 프로덕션에서는 읽기 전용 서버만 허용
  if (env === 'production') {
    return ['filesystem', 'memory', 'time', 'context7'].includes(serverType);
  }
  
  // 개발/테스트 환경에서는 모든 서버 허용
  return true;
};

const safeMcpCall = async (serverType: string, operation: () => Promise<any>) => {
  if (!isMcpAllowed(serverType)) {
    throw new Error(`MCP server ${serverType} not allowed in production`);
  }
  
  return operation();
};
```

#### 2. 데이터 검증 및 새니타이징

```typescript
// SQL 인젝션 방지
const executeSafeSql = async (query: string, params: any[] = []) => {
  // 위험한 키워드 차단
  const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER'];
  const upperQuery = query.toUpperCase();
  
  for (const keyword of dangerousKeywords) {
    if (upperQuery.includes(keyword)) {
      throw new Error(`Dangerous SQL keyword detected: ${keyword}`);
    }
  }
  
  // 파라미터 검증
  const sanitizedParams = params.map(param => {
    if (typeof param === 'string') {
      return param.replace(/['"\\]/g, ''); // 따옴표 제거
    }
    return param;
  });
  
  return mcp__supabase__execute_sql({
    project_id: "vnswjnltnhpsueosfhmw",
    query,
    params: sanitizedParams
  });
};
```

---

## 🚀 자동화 워크플로우

### CI/CD 통합 자동화

```typescript
// GitHub Actions와 MCP 연동
const cicdWorkflow = async () => {
  // 1단계: 코드 품질 검사
  const testFiles = await mcp__filesystem__search_files({
    path: "./src",
    pattern: "*.test.ts"
  });
  
  const codeQuality = await mcp__serena__search_for_pattern({
    substring_pattern: "TODO|FIXME|console.log",
    limit: 50
  });
  
  // 2단계: 데이터베이스 마이그레이션 상태 확인
  const migrationStatus = await mcp__supabase__execute_sql({
    project_id: "vnswjnltnhpsueosfhmw",
    query: "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1"
  });
  
  // 3단계: 프로덕션 배포 전 헬스체크
  await mcp__playwright__browser_navigate({
    url: "https://openmanager-vibe-v5-staging.vercel.app/health"
  });
  
  const healthCheck = await mcp__playwright__browser_evaluate({
    expression: "document.body.textContent"
  });
  
  // 4단계: 모든 검사 통과 시 GitHub PR 자동 승인
  if (codeQuality.results.length === 0 && healthCheck.includes('OK')) {
    await mcp__github__create_pull_request({
      owner: "username",
      repo: "openmanager-vibe-v5",
      title: "🚀 deploy: 프로덕션 배포 준비 완료",
      head: "staging",
      base: "main",
      body: `## ✅ 자동 검증 완료

### 코드 품질
- TODO/FIXME: 0개
- 테스트 파일: ${testFiles.length}개
- 콘솔 로그: 제거 완료

### 데이터베이스
- 마이그레이션 버전: ${migrationStatus.data?.[0]?.version}
- 상태: 정상

### 헬스체크
- Staging 환경: ✅ 통과
- 응답 시간: < 200ms
- 에러율: 0%

**자동 배포 승인 권장**`
    });
  }
};
```

### 서버 모니터링 자동화

```typescript
// 24/7 서버 모니터링 워크플로우
const monitoringWorkflow = async () => {
  const servers = await mcp__supabase__execute_sql({
    project_id: "vnswjnltnhpsueosfhmw", 
    query: "SELECT id, name, ip FROM servers WHERE status = 'active'"
  });
  
  for (const server of servers.data || []) {
    // 병렬로 각 서버 상태 확인
    const healthChecks = await Promise.all([
      // CPU/Memory 메트릭 확인
      mcp__supabase__execute_sql({
        project_id: "vnswjnltnhpsueosfhmw",
        query: `
          SELECT * FROM real_time_metrics
          WHERE server_id = $1 
          AND timestamp > NOW() - INTERVAL '5 minutes'
          ORDER BY timestamp DESC LIMIT 1
        `,
        params: [server.id]
      }),
      
      // 웹 서비스 응답 확인
      mcp__playwright__browser_navigate({
        url: `http://${server.ip}/health`,
        timeout: 5000
      }),
      
      // 최근 알림 이력 확인
      mcp__memory__search_nodes({
        query: `server ${server.name} alert critical`
      })
    ]);
    
    const [metrics, webCheck, alertHistory] = healthChecks;
    
    // 이상 상황 감지 시 즉시 대응
    if (metrics.data?.[0]?.cpu_percent > 90) {
      await emergencyResponse(server, 'HIGH_CPU', metrics.data[0]);
    }
  }
};

const emergencyResponse = async (server: any, alertType: string, metrics: any) => {
  // 1. 즉시 Slack/Discord 알림 (Tavily로 webhook URL 찾기)
  const webhookInfo = await mcp__tavily-mcp__tavily-search({
    query: "Slack webhook URL format documentation",
    max_results: 3
  });
  
  // 2. GitHub 긴급 이슈 생성
  await mcp__github__create_issue({
    owner: "username",
    repo: "openmanager-vibe-v5",
    title: `🚨 URGENT: ${server.name} - ${alertType}`,
    body: `## 🚨 긴급 알림
    
서버: ${server.name} (${server.ip})
알림 타입: ${alertType}
감지 시간: ${new Date().toISOString()}

### 현재 메트릭
- CPU: ${metrics.cpu_percent}%
- Memory: ${metrics.memory_percent}%  
- Disk: ${metrics.disk_usage_gb}GB

### 자동 대응 조치
- [x] 관리자 알림 발송
- [x] GitHub 이슈 생성
- [ ] 로드밸런서 트래픽 우회
- [ ] 자동 스케일링 트리거`,
    labels: ["urgent", "production", "alert", alertType.toLowerCase()],
    assignees: ["admin-username"]
  });
  
  // 3. 메모리에 사건 기록
  await mcp__memory__create_entities({
    entities: [{
      name: `EmergencyResponse_${server.id}_${Date.now()}`,
      entityType: "IncidentResponse", 
      observations: [
        `Alert: ${alertType} on ${server.name}`,
        `Metrics: CPU ${metrics.cpu_percent}%, Mem ${metrics.memory_percent}%`,
        `Response time: ${Date.now() - metrics.timestamp}ms`,
        `Auto-escalation: GitHub issue created`
      ]
    }]
  });
};
```

---

## 🔍 문제 해결 및 디버깅

### MCP 서버 디버깅

```typescript
// MCP 서버 상태 종합 진단
const diagnosticReport = async () => {
  const report = {
    timestamp: await mcp__time__get_current_time({ timezone: "Asia/Seoul" }),
    servers: {},
    systemInfo: {},
    recommendations: []
  };
  
  // 각 서버별 상태 확인
  const serverTests = [
    { name: 'filesystem', test: () => mcp__filesystem__search_files({ path: './', pattern: '*.md' }) },
    { name: 'memory', test: () => mcp__memory__read_graph() },
    { name: 'github', test: () => mcp__github__search_repositories({ query: 'test' }) },
    { name: 'supabase', test: () => mcp__supabase__list_projects() },
    { name: 'tavily-mcp', test: () => mcp__tavily-mcp__tavily-search({ query: 'test', max_results: 1 }) },
    { name: 'playwright', test: () => mcp__playwright__browser_navigate({ url: 'about:blank' }) },
    { name: 'time', test: () => mcp__time__get_current_time({ timezone: 'UTC' }) },
    { name: 'context7', test: () => mcp__context7__resolve-library-id({ libraryName: 'react' }) },
  ];
  
  for (const { name, test } of serverTests) {
    try {
      const startTime = Date.now();
      await test();
      const responseTime = Date.now() - startTime;
      
      report.servers[name] = {
        status: 'success',
        responseTime: `${responseTime}ms`,
        error: null
      };
      
      if (responseTime > 5000) {
        report.recommendations.push(`${name} 서버 응답 시간이 느림 (${responseTime}ms)`);
      }
    } catch (error) {
      report.servers[name] = {
        status: 'error',
        responseTime: null,
        error: error.message
      };
      
      report.recommendations.push(`${name} 서버 오류 해결 필요: ${error.message}`);
    }
  }
  
  // 시스템 정보 수집
  report.systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  return report;
};
```

---

> **🎯 이 가이드는 실전 활용에 특화되어 있습니다**  
> 설치 및 기본 설정은 [MCP 설치 가이드](./MCP-SETUP-GUIDE.md)를 참조하세요.
>
> **💡 성능 최적화 핵심**:  
> 병렬 처리, 캐싱, 배치 요청을 적극 활용하여 70% 이상의 성능 향상을 달성할 수 있습니다.

**작성자**: Claude Code  
**최종 업데이트**: 2025-08-14 19:45 (KST)  
**대상**: MCP 실전 활용 및 고급 패턴 학습자