export interface RawServerData {
  id?: string;
  name?: string;
  hostname?: string;
  type?: string;
  role?: string;
  environment?: string;
  location?: string;
  region?: string;
  status:
    | 'running'
    | 'warning'
    | 'error'
    | 'stopped'
    | 'maintenance'
    | 'unknown';

  // 원시 메트릭 (실제 서버 또는 생성기가 제공)
  metrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: {
      in?: number;
      out?: number;
    };
  };

  cpu?: number; // 편의 필드(구형 생성기 호환)
  memory?: number;
  disk?: number;
  network?: number;

  uptime?: number | string;
  lastUpdate?: string | number | Date;

  alerts?: number;
  services?: Array<{
    name: string;
    status: 'running' | 'stopped' | 'error';
    port: number;
  }>;

  provider?: string;
  networkStatus?: string;
}
