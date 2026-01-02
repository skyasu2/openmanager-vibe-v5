# TypeScript Types Collection

## 🏗️ Core Domain Types

```typescript
// Server related types
interface Server {
  id: string;
  name: string;
  hostname: string;
  type: 'web' | 'api' | 'database' | 'cache' | 'storage' | 'loadbalancer';
  status: 'online' | 'offline' | 'warning' | 'critical' | 'maintenance' | 'unknown';
  environment: 'production' | 'staging' | 'development';
  location: string;
  provider: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
  lastUpdate: Date;
  alerts: number;
  services: ServerService[];
  specs?: ServerSpecs;
  os?: string;
  ip?: string;
}

interface ServerService {
  name: string;
  status: 'running' | 'stopped' | 'warning' | 'failed' | 'starting' | 'stopping';
  port: number;
}

interface ServerSpecs {
  cpu_cores: number;
  memory_gb: number;
  disk_gb: number;
  network_speed?: string;
}

// 확장 서버 메트릭 (API 응답용)
interface EnhancedServerMetrics extends Server {
  // 이중 메트릭 (호환성)
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  responseTime: number;
  last_updated: string;

  // 시스템/네트워크 정보
  systemInfo: SystemInfo;
  networkInfo: NetworkInfo;

  // 트렌드 (메트릭 변화 추이)
  trends?: {
    cpu: 'increasing' | 'decreasing' | 'stable';
    memory: 'increasing' | 'decreasing' | 'stable';
    disk: 'increasing' | 'decreasing' | 'stable';
    network: 'increasing' | 'decreasing' | 'stable';
  };

  // 메타데이터
  metadata?: {
    serverType?: string;
    hour?: number;
    minute?: number;
    scenarios?: Array<{ type: string; severity: string; description: string }>;
  };
}

// 로그 엔트리 (syslog 형식)
interface LogEntry {
  timestamp: string;  // ISO 8601
  level: 'info' | 'warn' | 'error';
  message: string;    // syslog 형식: "hostname process[pid]: message"
  source: string;     // nginx, kernel, docker, systemd, mysqld, redis 등
}
```

## 📊 API Response Types

```typescript
// Generic API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Paginated response
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Chart data types
interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

interface TimeSeriesData {
  serverId: string;
  metric: string;
  data: ChartDataPoint[];
  timeRange: string;
}
```

## 🤖 AI System Types

```typescript
// AI analysis types
interface AIAnalysisRequest {
  query: string;
  context: {
    servers?: string[];
    timeRange?: string;
    includeMetrics?: boolean;
    metadata?: Record<string, unknown>;
  };
  mode?: 'UNIFIED'; // legacy values (LOCAL/GOOGLE_ONLY) are ignored
}

interface AIAnalysisResponse {
  analysis: string;
  confidence: number;
  suggestions: Suggestion[];
  charts?: ChartData[];
  metadata?: Record<string, unknown>;
}

interface Suggestion {
  type: 'optimization' | 'alert' | 'maintenance' | 'scaling';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionUrl?: string;
}
```

## 🔔 Alert & Notification Types

```typescript
// Alert system types
interface Alert {
  id: string;
  serverId: string;
  type: 'performance' | 'availability' | 'security' | 'capacity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
}

interface Notification {
  id: string;
  userId?: string;
  type: 'alert' | 'system' | 'maintenance';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}
```

## 🎨 UI Component Types

```typescript
// Component prop types
interface ServerCardProps {
  server: Server;
  metrics: ServerMetric[];
  onServerClick: (serverId: string) => void;
  loading?: boolean;
  error?: string;
}

interface ChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showTooltip?: boolean;
  loading?: boolean;
}

interface StatusBadgeProps {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}
```

## 🔧 Configuration Types

```typescript
// App configuration
interface AppConfig {
  environment: 'development' | 'production' | 'test';
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    aiAnalysis: boolean;
    realTimeUpdates: boolean;
    notifications: boolean;
  };
  limits: {
    maxServers: number;
    maxMetrics: number;
    cacheSize: number;
  };
}

// Database configuration
interface DatabaseConfig {
  url: string;
  apiKey: string;
  maxConnections: number;
  timeout: number;
  ssl: boolean;
}
```

## 📈 Analytics Types

```typescript
// Performance metrics
interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  uptime: number;
  cpuUsage: number;
  memoryUsage: number;
}

// System overview
interface SystemOverview {
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  criticalServers: number;
  avgCpu: number;
  avgMemory: number;
  totalAlerts: number;
  recentEvents: number;
}
```

## 🔐 Authentication Types

```typescript
// User and session types
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: Permission[];
  createdAt: string;
  lastLogin?: string;
}

interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress?: string;
  userAgent?: string;
}

interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete')[];
}
```

## 🎯 Utility Types

```typescript
// Common utility types
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> &
    Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// API error type
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Form types
interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
  validators?: ((value: T) => string | null)[];
}

type FormState<T> = {
  [K in keyof T]: FormField<T[K]>;
};
```

## 🔍 Type Guards

```typescript
// Type guard functions
export const isServer = (obj: unknown): obj is Server => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'type' in obj &&
    'status' in obj
  );
};

export const isApiResponse = <T>(obj: unknown): obj is ApiResponse<T> => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'success' in obj &&
    typeof (obj as ApiResponse<T>).success === 'boolean'
  );
};

export const isAlert = (obj: unknown): obj is Alert => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'serverId' in obj &&
    'severity' in obj &&
    'timestamp' in obj
  );
};
```
