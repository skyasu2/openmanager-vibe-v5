import { MetricCollector, ServerMetrics, ServiceStatus, CollectorConfig } from '../../types/collector';

/**
 * Custom API 메트릭 수집기
 * 
 * REST API 엔드포인트에서 메트릭을 수집하는 범용 수집기
 * 온프레미스 서버나 커스텀 모니터링 시스템과 연동할 때 사용합니다.
 */
export class CustomAPICollector implements MetricCollector {
  private config: CollectorConfig;
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: CollectorConfig) {
    this.config = config;
    this.baseUrl = config.endpoint || 'http://localhost:8080';
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'OpenManager-Vibe-Collector/1.0',
      ...(config.credentials?.apiKey && {
        'Authorization': `Bearer ${config.credentials.apiKey}`
      }),
      ...(config.credentials?.secretKey && {
        'X-API-Secret': config.credentials.secretKey
      })
    };
  }

  /**
   * 특정 서버의 메트릭 수집
   */
  async collectMetrics(serverId: string): Promise<ServerMetrics> {
    try {
      // API 엔드포인트: GET /api/servers/{serverId}/metrics
      const url = `${this.baseUrl}/api/servers/${serverId}/metrics`;
      const response = await this.makeAPIRequest('GET', url);

      if (!response.success) {
        throw new Error(`API 응답 오류: ${response.error || 'Unknown error'}`);
      }

      // API 응답을 표준 ServerMetrics 형식으로 변환
      return this.transformAPIResponse(response.data, serverId);
    } catch (error) {
      console.error(`❌ Custom API 수집 실패 (${serverId}):`, error);
      throw error;
    }
  }

  /**
   * 모든 서버 목록 조회
   */
  async getServerList(): Promise<string[]> {
    try {
      // API 엔드포인트: GET /api/servers
      const url = `${this.baseUrl}/api/servers`;
      const response = await this.makeAPIRequest('GET', url);

      if (!response.success) {
        throw new Error(`서버 목록 조회 실패: ${response.error || 'Unknown error'}`);
      }

      // API 응답에서 서버 ID 목록 추출
      if (Array.isArray(response.data)) {
        return response.data.map((server: any) => server.id || server.serverId || server.hostname);
      }

      if (response.data.servers && Array.isArray(response.data.servers)) {
        return response.data.servers.map((server: any) => server.id || server.serverId || server.hostname);
      }

      return [];
    } catch (error) {
      console.error('❌ Custom API 서버 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 서버 온라인 상태 확인
   */
  async isServerOnline(serverId: string): Promise<boolean> {
    try {
      // API 엔드포인트: GET /api/servers/{serverId}/status
      const url = `${this.baseUrl}/api/servers/${serverId}/status`;
      const response = await this.makeAPIRequest('GET', url);

      if (!response.success) {
        return false; // API 호출 실패 시 오프라인으로 간주
      }

      // 응답에서 상태 확인
      const status = response.data?.status || response.data?.state;
      return status === 'online' || status === 'running' || status === 'active';
    } catch (error) {
      console.error(`❌ Custom API 서버 상태 확인 실패 (${serverId}):`, error);
      return false;
    }
  }

  // Private Methods

  private async makeAPIRequest(method: string, url: string, body?: any): Promise<any> {
    const options: RequestInit = {
      method,
      headers: this.headers,
      signal: AbortSignal.timeout(this.config.timeout * 1000)
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return { success: true, data: await response.text() };
  }

  private transformAPIResponse(apiData: any, serverId: string): ServerMetrics {
    const timestamp = new Date(apiData.timestamp || Date.now());

    return {
      serverId,
      hostname: apiData.hostname || apiData.server_name || serverId,
      timestamp,
      
      cpu: {
        usage: this.extractNumber(apiData.cpu?.usage || apiData.cpu_usage, 0),
        loadAverage: this.extractArray(apiData.cpu?.load_average || apiData.load_avg, [0, 0, 0]),
        cores: this.extractNumber(apiData.cpu?.cores || apiData.cpu_cores, 1)
      },
      
      memory: {
        total: this.extractNumber(apiData.memory?.total || apiData.mem_total, 0),
        used: this.extractNumber(apiData.memory?.used || apiData.mem_used, 0),
        available: this.extractNumber(apiData.memory?.available || apiData.mem_available, 0),
        usage: this.extractNumber(apiData.memory?.usage || apiData.mem_usage, 0)
      },
      
      disk: {
        total: this.extractNumber(apiData.disk?.total || apiData.disk_total, 0),
        used: this.extractNumber(apiData.disk?.used || apiData.disk_used, 0),
        available: this.extractNumber(apiData.disk?.available || apiData.disk_available, 0),
        usage: this.extractNumber(apiData.disk?.usage || apiData.disk_usage, 0),
        iops: {
          read: this.extractNumber(apiData.disk?.iops?.read || apiData.disk_read_iops, 0),
          write: this.extractNumber(apiData.disk?.iops?.write || apiData.disk_write_iops, 0)
        }
      },
      
      network: {
        interface: apiData.network?.interface || apiData.net_interface || 'eth0',
        bytesReceived: this.extractNumber(apiData.network?.bytes_received || apiData.net_rx_bytes, 0),
        bytesSent: this.extractNumber(apiData.network?.bytes_sent || apiData.net_tx_bytes, 0),
        packetsReceived: this.extractNumber(apiData.network?.packets_received || apiData.net_rx_packets, 0),
        packetsSent: this.extractNumber(apiData.network?.packets_sent || apiData.net_tx_packets, 0),
        errorsReceived: this.extractNumber(apiData.network?.errors_received || apiData.net_rx_errors, 0),
        errorsSent: this.extractNumber(apiData.network?.errors_sent || apiData.net_tx_errors, 0)
      },
      
      system: {
        os: apiData.system?.os || apiData.operating_system || 'Linux',
        platform: apiData.system?.platform || apiData.platform || 'linux',
        uptime: this.extractNumber(apiData.system?.uptime || apiData.uptime, 0),
        bootTime: new Date(apiData.system?.boot_time || apiData.boot_time || Date.now() - (this.extractNumber(apiData.system?.uptime || apiData.uptime, 0) * 1000)),
        processes: {
          total: this.extractNumber(apiData.system?.processes?.total || apiData.proc_total, 0),
          running: this.extractNumber(apiData.system?.processes?.running || apiData.proc_running, 0),
          sleeping: this.extractNumber(apiData.system?.processes?.sleeping || apiData.proc_sleeping, 0),
          zombie: this.extractNumber(apiData.system?.processes?.zombie || apiData.proc_zombie, 0)
        }
      },
      
      services: this.extractServices(apiData.services || apiData.service_status || []),
      
      metadata: {
        location: apiData.metadata?.location || apiData.location || 'Unknown',
        environment: this.extractEnvironment(apiData.metadata?.environment || apiData.environment),
        cluster: apiData.metadata?.cluster || apiData.cluster,
        zone: apiData.metadata?.zone || apiData.availability_zone,
        instanceType: apiData.metadata?.instance_type || apiData.instance_type,
        provider: this.extractProvider(apiData.metadata?.provider || apiData.provider)
      }
    };
  }

  private extractNumber(value: any, defaultValue: number): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  }

  private extractArray(value: any, defaultValue: number[]): number[] {
    if (Array.isArray(value)) {
      return value.map(v => this.extractNumber(v, 0));
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(v => this.extractNumber(v, 0));
        }
      } catch {
        // JSON 파싱 실패시 기본값 사용
      }
    }
    return defaultValue;
  }

  private extractServices(services: any): ServiceStatus[] {
    if (!Array.isArray(services)) return [];

    return services.map((service: any) => ({
      name: service.name || service.service_name || 'unknown',
      status: this.normalizeServiceStatus(service.status || service.state),
      port: service.port ? this.extractNumber(service.port, 0) : undefined,
      pid: service.pid || service.process_id ? this.extractNumber(service.pid || service.process_id, 0) : undefined,
      memory: service.memory || service.memory_usage ? this.extractNumber(service.memory || service.memory_usage, 0) : undefined,
      cpu: service.cpu || service.cpu_usage ? this.extractNumber(service.cpu || service.cpu_usage, 0) : undefined,
      restartCount: service.restart_count || service.restarts ? this.extractNumber(service.restart_count || service.restarts, 0) : undefined
    }));
  }

  private normalizeServiceStatus(status: string): 'running' | 'stopped' | 'error' | 'unknown' {
    if (!status) return 'unknown';
    
    const normalizedStatus = status.toLowerCase().trim();
    
    if (['running', 'active', 'up', 'online'].includes(normalizedStatus)) {
      return 'running';
    }
    if (['stopped', 'inactive', 'down', 'offline'].includes(normalizedStatus)) {
      return 'stopped';
    }
    if (['error', 'failed', 'crashed', 'dead'].includes(normalizedStatus)) {
      return 'error';
    }
    
    return 'unknown';
  }

  private extractEnvironment(env: any): 'production' | 'staging' | 'development' {
    if (typeof env !== 'string') return 'development';
    
    const normalizedEnv = env.toLowerCase().trim();
    
    if (['production', 'prod', 'live'].includes(normalizedEnv)) {
      return 'production';
    }
    if (['staging', 'stage', 'test'].includes(normalizedEnv)) {
      return 'staging';
    }
    
    return 'development';
  }

  private extractProvider(provider: any): 'aws' | 'gcp' | 'azure' | 'kubernetes' | 'onpremise' {
    if (typeof provider !== 'string') return 'onpremise';
    
    const normalizedProvider = provider.toLowerCase().trim();
    
    if (['aws', 'amazon'].includes(normalizedProvider)) {
      return 'aws';
    }
    if (['gcp', 'google', 'gce'].includes(normalizedProvider)) {
      return 'gcp';
    }
    if (['azure', 'microsoft'].includes(normalizedProvider)) {
      return 'azure';
    }
    if (['kubernetes', 'k8s', 'kube'].includes(normalizedProvider)) {
      return 'kubernetes';
    }
    
    return 'onpremise';
  }
}

/**
 * Custom API 수집기 설정 예제
 * 
 * const config: CollectorConfig = {
 *   type: 'custom',
 *   endpoint: 'https://your-api-server.com',
 *   credentials: {
 *     apiKey: 'your-api-key',
 *     secretKey: 'your-secret-key'
 *   },
 *   interval: 60,  // 60초마다 수집
 *   timeout: 30    // 30초 타임아웃
 * };
 */

/**
 * API 응답 형식 예제
 * 
 * GET /api/servers/{serverId}/metrics 응답:
 * {
 *   "success": true,
 *   "data": {
 *     "hostname": "server-01.company.local",
 *     "timestamp": "2024-01-15T10:30:00Z",
 *     "cpu": {
 *       "usage": 45.2,
 *       "load_average": [1.2, 1.5, 1.8],
 *       "cores": 8
 *     },
 *     "memory": {
 *       "total": 17179869184,
 *       "used": 8589934592,
 *       "available": 8589934592,
 *       "usage": 50.0
 *     },
 *     "disk": {
 *       "total": 107374182400,
 *       "used": 53687091200,
 *       "available": 53687091200,
 *       "usage": 50.0,
 *       "iops": {
 *         "read": 150,
 *         "write": 75
 *       }
 *     },
 *     "network": {
 *       "interface": "eth0",
 *       "bytes_received": 1073741824,
 *       "bytes_sent": 536870912,
 *       "packets_received": 1000000,
 *       "packets_sent": 800000,
 *       "errors_received": 0,
 *       "errors_sent": 0
 *     },
 *     "system": {
 *       "os": "Ubuntu 22.04 LTS",
 *       "platform": "linux",
 *       "uptime": 259200,
 *       "boot_time": "2024-01-12T10:30:00Z",
 *       "processes": {
 *         "total": 150,
 *         "running": 5,
 *         "sleeping": 140,
 *         "zombie": 0
 *       }
 *     },
 *     "services": [
 *       {
 *         "name": "nginx",
 *         "status": "running",
 *         "port": 80,
 *         "pid": 1234,
 *         "memory": 102400,
 *         "cpu": 2.5,
 *         "restart_count": 0
 *       }
 *     ],
 *     "metadata": {
 *       "location": "Seoul DC",
 *       "environment": "production",
 *       "provider": "onpremise"
 *     }
 *   }
 * }
 */ 