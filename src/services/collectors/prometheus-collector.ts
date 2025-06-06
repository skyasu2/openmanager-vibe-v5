import {
  MetricCollector,
  ServerMetrics,
  ServiceStatus,
  CollectorConfig,
} from '../../types/collector';

/**
 * Prometheus 메트릭 수집기
 *
 * 실제 Prometheus 서버에서 메트릭을 수집하는 수집기
 * PromQL 쿼리를 사용하여 서버 메트릭을 조회합니다.
 */
export class PrometheusCollector implements MetricCollector {
  private config: CollectorConfig;
  private baseUrl: string;
  private headers: Record<string, string>;

  // 상태 속성들
  public isRunning: boolean = false;
  public lastCollection: Date | null = null;
  public errorCount: number = 0;

  constructor(config: CollectorConfig) {
    this.config = config;
    this.baseUrl = config.endpoint || 'http://localhost:9090';
    this.headers = {
      'Content-Type': 'application/json',
      ...(config.credentials?.apiKey && {
        Authorization: `Bearer ${config.credentials.apiKey}`,
      }),
    };
  }

  /**
   * 수집기 시작
   */
  async start(): Promise<void> {
    try {
      // 연결 테스트
      await this.queryPrometheus('up');
      this.isRunning = true;
      this.errorCount = 0;
      console.log(`✅ Prometheus 수집기 시작됨: ${this.baseUrl}`);
    } catch (error) {
      this.errorCount++;
      console.error('❌ Prometheus 수집기 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 수집기 중지
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🛑 Prometheus 수집기 중지됨');
  }

  /**
   * 특정 서버의 메트릭 수집
   */
  async collectMetrics(serverId: string): Promise<ServerMetrics> {
    try {
      const hostname = await this.getHostname(serverId);
      const timestamp = new Date();

      // 병렬로 모든 메트릭 조회
      const [
        cpuMetrics,
        memoryMetrics,
        diskMetrics,
        networkMetrics,
        systemMetrics,
        serviceMetrics,
      ] = await Promise.all([
        this.getCPUMetrics(serverId),
        this.getMemoryMetrics(serverId),
        this.getDiskMetrics(serverId),
        this.getNetworkMetrics(serverId),
        this.getSystemMetrics(serverId),
        this.getServiceMetrics(serverId),
      ]);

      return {
        serverId,
        hostname,
        timestamp,
        cpu: cpuMetrics,
        memory: memoryMetrics,
        disk: diskMetrics,
        network: networkMetrics,
        system: systemMetrics,
        services: serviceMetrics,
        metadata: await this.getMetadata(serverId),
      };
    } catch (error) {
      console.error(`❌ Prometheus 수집 실패 (${serverId}):`, error);
      throw error;
    }
  }

  /**
   * 모든 서버 목록 조회
   */
  async getServerList(): Promise<string[]> {
    try {
      const query = 'up{job=~"node.*"}';
      const response = await this.queryPrometheus(query);

      const servers = new Set<string>();
      response.data.result.forEach((metric: any) => {
        const instance = metric.metric.instance;
        if (instance) {
          // instance에서 서버 ID 추출 (예: 192.168.1.100:9100 -> server-01)
          const serverId = this.extractServerIdFromInstance(instance);
          servers.add(serverId);
        }
      });

      return Array.from(servers);
    } catch (error) {
      console.error('❌ Prometheus 서버 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * 서버 온라인 상태 확인
   */
  async isServerOnline(serverId: string): Promise<boolean> {
    try {
      const instance = this.getInstanceFromServerId(serverId);
      const query = `up{instance="${instance}"}`;
      const response = await this.queryPrometheus(query);

      return (
        response.data.result.length > 0 &&
        response.data.result[0]?.value?.[1] === '1'
      );
    } catch (error) {
      console.error(`❌ Prometheus 서버 상태 확인 실패 (${serverId}):`, error);
      return false;
    }
  }

  // Private Methods - 실제 Prometheus 쿼리

  private async queryPrometheus(query: string, time?: Date): Promise<any> {
    const url = new URL('/api/v1/query', this.baseUrl);
    url.searchParams.set('query', query);
    if (time) {
      url.searchParams.set(
        'time',
        Math.floor(time.getTime() / 1000).toString()
      );
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers,
      signal: AbortSignal.timeout(this.config.timeout * 1000),
    });

    if (!response.ok) {
      throw new Error(
        `Prometheus 쿼리 실패: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    if (data.status !== 'success') {
      throw new Error(`Prometheus 쿼리 에러: ${data.error || 'Unknown error'}`);
    }

    return data;
  }

  private async getCPUMetrics(serverId: string) {
    const instance = this.getInstanceFromServerId(serverId);

    // CPU 사용률 (100 - idle)
    const cpuUsageQuery = `100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle",instance="${instance}"}[5m])) * 100)`;
    const cpuUsageResult = await this.queryPrometheus(cpuUsageQuery);

    // Load Average
    const loadQuery = `node_load1{instance="${instance}"}`;
    const loadResult = await this.queryPrometheus(loadQuery);

    // CPU 코어 수
    const coresQuery = `count by (instance) (node_cpu_seconds_total{mode="idle",instance="${instance}"})`;
    const coresResult = await this.queryPrometheus(coresQuery);

    return {
      usage: parseFloat(cpuUsageResult.data.result[0]?.value[1] || '0'),
      loadAverage: [
        parseFloat(loadResult.data.result[0]?.value[1] || '0'),
        0, // load5와 load15는 별도 쿼리 필요
        0,
      ],
      cores: parseInt(coresResult.data.result[0]?.value[1] || '1'),
    };
  }

  private async getMemoryMetrics(serverId: string) {
    const instance = this.getInstanceFromServerId(serverId);

    // 총 메모리
    const totalQuery = `node_memory_MemTotal_bytes{instance="${instance}"}`;
    const totalResult = await this.queryPrometheus(totalQuery);

    // 사용 가능한 메모리
    const availableQuery = `node_memory_MemAvailable_bytes{instance="${instance}"}`;
    const availableResult = await this.queryPrometheus(availableQuery);

    const total = parseInt(totalResult.data.result[0]?.value[1] || '0');
    const available = parseInt(availableResult.data.result[0]?.value[1] || '0');
    const used = total - available;
    const usage = total > 0 ? (used / total) * 100 : 0;

    return {
      total,
      used,
      available,
      usage: Math.round(usage * 100) / 100,
    };
  }

  private async getDiskMetrics(serverId: string) {
    const instance = this.getInstanceFromServerId(serverId);

    // 루트 파티션 기준
    const totalQuery = `node_filesystem_size_bytes{instance="${instance}",mountpoint="/"}`;
    const totalResult = await this.queryPrometheus(totalQuery);

    const freeQuery = `node_filesystem_free_bytes{instance="${instance}",mountpoint="/"}`;
    const freeResult = await this.queryPrometheus(freeQuery);

    const total = parseInt(totalResult.data.result[0]?.value[1] || '0');
    const free = parseInt(freeResult.data.result[0]?.value[1] || '0');
    const used = total - free;
    const usage = total > 0 ? (used / total) * 100 : 0;

    return {
      total,
      used,
      available: free,
      usage: Math.round(usage * 100) / 100,
      iops: {
        read: 0, // IOPS는 별도 쿼리 필요
        write: 0,
      },
    };
  }

  private async getNetworkMetrics(serverId: string) {
    const instance = this.getInstanceFromServerId(serverId);

    // 기본 네트워크 인터페이스 (eth0 또는 ens 계열)
    const bytesReceivedQuery = `irate(node_network_receive_bytes_total{instance="${instance}",device=~"eth0|ens.*"}[5m])`;
    const bytesReceivedResult = await this.queryPrometheus(bytesReceivedQuery);

    const bytesSentQuery = `irate(node_network_transmit_bytes_total{instance="${instance}",device=~"eth0|ens.*"}[5m])`;
    const bytesSentResult = await this.queryPrometheus(bytesSentQuery);

    return {
      interface: 'eth0',
      bytesReceived: parseInt(
        bytesReceivedResult.data.result[0]?.value[1] || '0'
      ),
      bytesSent: parseInt(bytesSentResult.data.result[0]?.value[1] || '0'),
      packetsReceived: 0, // 별도 쿼리 필요
      packetsSent: 0,
      errorsReceived: 0,
      errorsSent: 0,
    };
  }

  private async getSystemMetrics(serverId: string) {
    const instance = this.getInstanceFromServerId(serverId);

    // 업타임
    const uptimeQuery = `time() - node_boot_time_seconds{instance="${instance}"}`;
    const uptimeResult = await this.queryPrometheus(uptimeQuery);

    const uptime = parseInt(uptimeResult.data.result[0]?.value[1] || '0');
    const bootTime = new Date((Date.now() / 1000 - uptime) * 1000);

    return {
      os: 'Linux', // OS 정보는 레이블에서 추출 가능
      platform: 'linux',
      uptime,
      bootTime,
      processes: {
        total: 0, // 프로세스 메트릭은 별도 exporter 필요
        running: 0,
        sleeping: 0,
        zombie: 0,
      },
    };
  }

  private async getServiceMetrics(_serverId: string): Promise<ServiceStatus[]> {
    // systemd 서비스 상태는 별도 exporter 필요
    return [{ name: 'node_exporter', status: 'running', port: 9100 }];
  }

  private async getHostname(serverId: string): Promise<string> {
    const instance = this.getInstanceFromServerId(serverId);
    // hostname은 보통 레이블에서 제공
    return instance.split(':')[0];
  }

  private async getMetadata(_serverId: string) {
    // 메타데이터는 Prometheus 레이블에서 추출
    return {
      location: 'Unknown',
      environment: 'production' as const,
      provider: 'kubernetes' as const,
    };
  }

  private extractServerIdFromInstance(instance: string): string {
    // 실제 환경에서는 instance -> serverId 매핑 로직 구현
    // 예: prometheus 레이블 또는 DNS 기반 매핑
    return instance.replace(/[:.]/g, '-');
  }

  private getInstanceFromServerId(serverId: string): string {
    // 실제 환경에서는 serverId -> instance 매핑 로직 구현
    // 예: 설정 파일 또는 서비스 디스커버리 기반
    return serverId.replace(/-/g, '.') + ':9100';
  }
}
