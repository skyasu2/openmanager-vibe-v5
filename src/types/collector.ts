// 데이터 수집기 인터페이스 정의
export interface MetricCollector {
  collectMetrics(serverId: string): Promise<ServerMetrics>;
  getServerList(): Promise<string[]>;
  isServerOnline(serverId: string): Promise<boolean>;
}

// 수집된 원시 메트릭 데이터
export interface ServerMetrics {
  serverId: string;
  hostname: string;
  timestamp: Date;
  
  // 시스템 리소스
  cpu: {
    usage: number;        // 0-100
    loadAverage: number[];  // [1분, 5분, 15분]
    cores: number;
  };
  
  memory: {
    total: number;        // bytes
    used: number;         // bytes
    available: number;    // bytes
    usage: number;        // 0-100
  };
  
  disk: {
    total: number;        // bytes
    used: number;         // bytes
    available: number;    // bytes
    usage: number;        // 0-100
    iops: {
      read: number;
      write: number;
    };
  };
  
  // 네트워크
  network: {
    interface: string;
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
    errorsReceived: number;
    errorsSent: number;
  };
  
  // 시스템 정보
  system: {
    os: string;
    platform: string;
    uptime: number;       // seconds
    bootTime: Date;
    processes: {
      total: number;
      running: number;
      sleeping: number;
      zombie: number;
    };
  };
  
  // 서비스 상태
  services: ServiceStatus[];
  
  // 위치 및 메타데이터
  metadata: {
    location: string;
    environment: 'production' | 'staging' | 'development';
    cluster?: string;
    zone?: string;
    instanceType?: string;
    provider: 'aws' | 'gcp' | 'azure' | 'kubernetes' | 'onpremise';
  };
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'unknown';
  port?: number;
  pid?: number;
  memory?: number;
  cpu?: number;
  restartCount?: number;
}

// 수집기 설정
export interface CollectorConfig {
  type: 'dummy' | 'prometheus' | 'cloudwatch' | 'custom';
  endpoint?: string;
  credentials?: {
    apiKey?: string;
    secretKey?: string;
    region?: string;
  };
  interval: number;      // 수집 간격 (초)
  timeout: number;       // 타임아웃 (초)
}

// 수집기 팩토리 인터페이스
export interface CollectorFactory {
  createCollector(config: CollectorConfig): MetricCollector;
} 