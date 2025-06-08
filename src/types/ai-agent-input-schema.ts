/**
 * OpenManager 7.0 AI Agent Input Schema
 * 고급 데이터 생성 및 분석을 위한 타입 정의
 */

export interface ServerMetadata {
  id: string;
  name: string;
  serverType: 'K8s' | 'Host' | 'Cloud' | 'Container' | 'VM' | 'Edge';
  location: {
    region: string;
    zone: string;
    datacenter?: string;
    cloud?: 'AWS' | 'GCP' | 'Azure' | 'On-Premise';
  };
  os: {
    type: 'Linux' | 'Windows' | 'macOS';
    distribution?: string;
    version: string;
    architecture: 'x64' | 'arm64' | 'x86';
  };
  usageProfile: {
    type: 'Web' | 'API' | 'Database' | 'Cache' | 'ML' | 'Analytics' | 'CDN' | 'Gateway';
    tier: 'Development' | 'Staging' | 'Production' | 'Testing';
    criticality: 'Low' | 'Medium' | 'High' | 'Critical';
    scalingType: 'Manual' | 'Auto' | 'Scheduled' | 'Event-Driven';
  };
  resources: {
    cpu: { cores: number; model: string; clockSpeed: number };
    memory: { total: number; type: 'DDR4' | 'DDR5' };
    storage: { total: number; type: 'SSD' | 'HDD' | 'NVMe' };
    network: { bandwidth: number; type: '1G' | '10G' | '25G' | '100G' };
  };
  tags: Record<string, string>;
  created: Date;
  lastUpdate: Date;
}

export interface TimeSeriesMetrics {
  timestamp: Date;
  serverId: string;
  system: {
    cpu: {
      usage: number; // 0-100
      load1: number;
      load5: number;
      load15: number;
      processes: number;
      threads: number;
    };
    memory: {
      used: number; // bytes
      available: number;
      buffers: number;
      cached: number;
      swap: { used: number; total: number };
    };
    disk: {
      io: { read: number; write: number }; // IOPS
      throughput: { read: number; write: number }; // MB/s
      utilization: number; // 0-100
      queue: number;
    };
    network: {
      io: { rx: number; tx: number }; // bytes/s
      packets: { rx: number; tx: number };
      errors: { rx: number; tx: number };
      connections: { active: number; established: number };
    };
  };
  application: {
    requests: {
      total: number;
      success: number;
      errors: number;
      latency: { p50: number; p95: number; p99: number };
    };
    database: {
      connections: { active: number; idle: number };
      queries: { total: number; slow: number };
      locks: number;
      deadlocks: number;
    };
    cache: {
      hits: number;
      misses: number;
      evictions: number;
      memory: number;
    };
  };
  infrastructure: {
    containers?: {
      running: number;
      stopped: number;
      cpu: number;
      memory: number;
    };
    kubernetes?: {
      pods: { running: number; pending: number; failed: number };
      nodes: { ready: number; notReady: number };
      resources: { cpu: number; memory: number };
    };
    cloud?: {
      credits: number;
      costs: { hourly: number; daily: number };
      scaling: { instances: number; target: number };
    };
  };
}

export interface LogEntry {
  timestamp: Date;
  serverId: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  component: string;
  message: string;
  metadata: {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    ip?: string;
    userAgent?: string;
    duration?: number;
    statusCode?: number;
    method?: string;
    endpoint?: string;
    stack?: string;
  };
  structured: {
    category: 'Security' | 'Performance' | 'Business' | 'System' | 'Application';
    tags: string[];
    context: Record<string, any>;
  };
  analysis: {
    anomaly: boolean;
    sentiment?: 'Positive' | 'Neutral' | 'Negative';
    pattern?: string;
    correlationId?: string;
  };
}

export interface TraceData {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serverId: string;
  serviceName: string;
  operationName: string;
  timestamp: Date;
  duration: number; // microseconds
  status: 'OK' | 'ERROR' | 'TIMEOUT';
  tags: Record<string, string>;
  logs: Array<{
    timestamp: Date;
    fields: Record<string, any>;
  }>;
  dependencies: {
    upstream: string[];
    downstream: string[];
  };
  performance: {
    dbQueries: number;
    apiCalls: number;
    cacheHits: number;
    cacheMisses: number;
  };
}

export interface AIAnalysisDataset {
  metadata: {
    generationTime: Date;
    timeRange: { start: Date; end: Date };
    serverCount: number;
    dataPoints: number;
    version: string;
  };
  servers: ServerMetadata[];
  metrics: TimeSeriesMetrics[];
  logs: LogEntry[];
  traces: TraceData[];
  patterns: {
    anomalies: Array<{
      type: string;
      serverId: string;
      timestamp: Date;
      severity: 'Low' | 'Medium' | 'High' | 'Critical';
      description: string;
      metrics: string[];
    }>;
    correlations: Array<{
      servers: string[];
      metrics: string[];
      coefficient: number;
      timelag: number;
    }>;
    trends: Array<{
      metric: string;
      servers: string[];
      direction: 'Increasing' | 'Decreasing' | 'Stable' | 'Volatile';
      confidence: number;
    }>;
  };
}

export interface StorageStructure {
  redis: {
    keys: {
      metrics: `metrics:${string}:${number}`; // serverId:timestamp
      logs: `logs:${string}:${number}`;
      traces: `traces:${string}:${string}`; // serverId:traceId
      realtime: `realtime:${string}`;
    };
    ttl: {
      metrics: 1200; // 20 minutes
      logs: 1800; // 30 minutes
      traces: 3600; // 1 hour
      realtime: 300; // 5 minutes
    };
    intervals: {
      metrics: 5; // 5 seconds
      logs: 1; // 1 second
      traces: 1; // 1 second
    };
  };
  supabase: {
    tables: {
      servers: 'om_servers';
      metrics_5m: 'om_metrics_5m';
      metrics_1h: 'om_metrics_1h';
      metrics_1d: 'om_metrics_1d';
      logs: 'om_logs';
      traces: 'om_traces';
      anomalies: 'om_anomalies';
      correlations: 'om_correlations';
    };
    retention: {
      metrics_5m: '24 hours';
      metrics_1h: '7 days';
      metrics_1d: '90 days';
      logs: '30 days';
      traces: '7 days';
      anomalies: '90 days';
      correlations: '30 days';
    };
    aggregation: {
      from_5s_to_5m: 'avg, max, min, count';
      from_5m_to_1h: 'avg, max, min, count';
      from_1h_to_1d: 'avg, max, min, count';
    };
  };
}

export interface DataGenerationConfig {
  servers: {
    count: number;
    types: Record<ServerMetadata['serverType'], number>;
    regions: string[];
  };
  patterns: {
    dailyCycle: boolean;
    weeklyCycle: boolean;
    anomalyRate: number; // 0-1
    correlationStrength: number; // 0-1
  };
  performance: {
    batchSize: number;
    intervalMs: number;
    bufferSize: number;
  };
  ai: {
    analysisInterval: number; // minutes
    modelType: 'hybrid' | 'transformers' | 'statistical';
    features: string[];
  };
}

// Natural Language Analysis Interface
export interface NLAnalysisQuery {
  query: string;
  context: {
    timeRange?: { start: Date; end: Date };
    servers?: string[];
    metrics?: string[];
    language: 'ko' | 'en';
  };
  intent: {
    type: 'status' | 'anomaly' | 'prediction' | 'comparison' | 'summary';
    entities: string[];
    confidence: number;
  };
}

export interface NLAnalysisResponse {
  answer: string;
  data: {
    charts?: any[];
    tables?: any[];
    metrics?: Record<string, number>;
  };
  confidence: number;
  sources: string[];
  suggestions: string[];
  language: 'ko' | 'en';
} 