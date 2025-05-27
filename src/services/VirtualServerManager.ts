/**
 * 🖥️ Virtual Server Manager
 * 
 * 가상 서버 데이터 생성 및 관리 시스템
 * - 5개의 랜덤 서버 페이지 생성
 * - 24시간 데이터를 5초 간격으로 시뮬레이션
 * - Supabase에 실시간 저장
 * - AI 에이전트 연동을 위한 데이터 처리
 */

import { createClient } from '@supabase/supabase-js';
import { getVirtualServerConfig, getDatabaseConfig } from '@/config';
import { ServerMetrics, ExtendedServer, ServerType, Environment, CloudProvider, ServerStatus } from '@/types/common';

export interface VirtualServer extends Omit<ExtendedServer, 'status'> {
  status: ServerStatus;
  baseMetrics: {
    cpu_base: number;
    memory_base: number;
    disk_base: number;
  };
  patterns: {
    business_hours: boolean;
    peak_hours: number[];
    maintenance_window: number;
    failure_rate: number;
  };
}

export class VirtualServerManager {
  private supabase: any;
  private servers: VirtualServer[] = [];
  private isGenerating: boolean = false;
  private generationInterval?: NodeJS.Timeout;
  private config = getVirtualServerConfig();
  private dbConfig = getDatabaseConfig();

  constructor() {
    // Supabase 클라이언트 초기화
    const supabaseUrl = this.dbConfig.url || 'https://dummy-project.supabase.co';
    const supabaseKey = this.dbConfig.key || 'dummy_anon_key';
    
    if (this.dbConfig.enableMockMode || supabaseUrl.includes('dummy')) {
      console.log('🔧 VirtualServerManager: Using dummy Supabase client for development');
      this.supabase = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * 시스템 초기화 - 5개의 가상 서버 페이지 생성
   */
  async initialize(): Promise<void> {
    console.log('🚀 VirtualServerManager 초기화 시작...');
    
    try {
      // 기존 서버 확인
      const existingServers = await this.getExistingServers();
      
      if (existingServers.length >= 5) {
        console.log(`✅ 기존 서버 ${existingServers.length}개 발견, 재사용합니다.`);
        this.servers = existingServers;
      } else {
        console.log('🔄 새로운 가상 서버 생성 중...');
        this.servers = this.generateVirtualServers();
        await this.saveServersToDatabase();
      }

      // 24시간 히스토리 데이터 생성 (한 번만)
      await this.generateHistoryData();
      
      console.log(`✅ VirtualServerManager 초기화 완료 - ${this.servers.length}개 서버`);
      
    } catch (error) {
      console.error('❌ VirtualServerManager 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 빠른 초기화 - Vercel 환경용 (타임아웃 방지)
   */
  async quickInitialize(): Promise<void> {
    console.log('⚡ VirtualServerManager 빠른 초기화 시작...');
    
    try {
      // 메모리에 임시 서버 생성 (DB 조회 없이)
      if (this.servers.length === 0) {
        console.log('🔄 임시 가상 서버 생성...');
        try {
          this.servers = this.generateVirtualServers();
          console.log(`✅ ${this.servers.length}개 임시 서버 생성 완료`);
        } catch (genError) {
          console.error('❌ 가상 서버 생성 실패:', genError);
          // 최소한의 fallback 서버 생성
          this.servers = this.createFallbackServers();
          console.log(`🔄 Fallback 서버 생성: ${this.servers.length}개`);
        }
      }

      console.log(`⚡ VirtualServerManager 빠른 초기화 완료 - ${this.servers.length}개 서버`);
      
    } catch (error) {
      console.error('❌ VirtualServerManager 빠른 초기화 실패:', error);
      // 최종 Fallback: 최소한의 서버라도 생성
      if (this.servers.length === 0) {
        this.servers = this.createFallbackServers();
        console.log(`🔄 최종 Fallback: ${this.servers.length}개 최소 서버 생성`);
      }
    }
  }

  /**
   * 실시간 데이터 생성 시작 (20분간 5초마다)
   */
  async startRealtimeGeneration(): Promise<void> {
    if (this.isGenerating) {
      console.log('⚠️ 이미 실시간 데이터 생성이 진행 중입니다.');
      return;
    }

    console.log('🚀 실시간 데이터 생성 시작 (20분간, 5초 간격)...');
    this.isGenerating = true;

    const startTime = Date.now();
    
    // 첫 번째 데이터 포인트 즉시 생성
    await this.generateRealtimeDataPoint();

    // 5초마다 데이터 생성
    this.generationInterval = setInterval(async () => {
      try {
        await this.generateRealtimeDataPoint();
        
        // 설정된 시간 경과 시 자동 중지
        const elapsed = Date.now() - startTime;
        if (elapsed >= this.config.totalDuration) {
          console.log(`⏰ ${this.config.totalDuration / 60000}분 경과, 실시간 데이터 생성 중지`);
          this.stopRealtimeGeneration();
        }
      } catch (error) {
        console.error('❌ 실시간 데이터 생성 오류:', error);
      }
    }, this.config.generationInterval);

    // 설정된 시간 후 자동 중지 타이머
    setTimeout(() => {
      if (this.isGenerating) {
        this.stopRealtimeGeneration();
      }
    }, this.config.totalDuration);
  }

  /**
   * 실시간 데이터 생성 중지
   */
  stopRealtimeGeneration(): void {
    if (this.generationInterval) {
      clearInterval(this.generationInterval);
      this.generationInterval = undefined;
    }
    this.isGenerating = false;
    console.log('⏹️ 실시간 데이터 생성 중지됨');
  }

  /**
   * 20개의 가상 서버 생성 (온프레미스 7 + 쿠버네티스 6 + AWS 7)
   */
  private generateVirtualServers(): VirtualServer[] {
    const serverTemplates = [
      // === 온프레미스 서버 (7개) - Seoul-IDC-1 ===
      {
        hostname: 'web-prod-01',
        name: 'Production Web Server',
        type: 'web' as const,
        environment: 'production' as const,
        location: 'Seoul-IDC-1',
        provider: 'onpremise' as const,
        specs: { cpu_cores: 8, memory_gb: 32, disk_gb: 500 },
        baseMetrics: { cpu_base: 35, memory_base: 60, disk_base: 45 },
        patterns: {
          business_hours: true,
          peak_hours: [9, 12, 14, 18],
          maintenance_window: 3,
          failure_rate: 0.02
        }
      },
      {
        hostname: 'db-master-01',
        name: 'Database Master Server',
        type: 'database' as const,
        environment: 'production' as const,
        location: 'Seoul-IDC-1',
        provider: 'onpremise' as const,
        specs: { cpu_cores: 16, memory_gb: 64, disk_gb: 2000 },
        baseMetrics: { cpu_base: 45, memory_base: 75, disk_base: 60 },
        patterns: {
          business_hours: true,
          peak_hours: [10, 13, 15, 19],
          maintenance_window: 2,
          failure_rate: 0.01
        }
      },
      {
        hostname: 'cache-redis-01',
        name: 'Redis Cache Server',
        type: 'cache' as const,
        environment: 'production' as const,
        location: 'Seoul-IDC-1',
        provider: 'onpremise' as const,
        specs: { cpu_cores: 8, memory_gb: 128, disk_gb: 1000 },
        baseMetrics: { cpu_base: 20, memory_base: 80, disk_base: 25 },
        patterns: {
          business_hours: true,
          peak_hours: [9, 12, 14, 18],
          maintenance_window: 5,
          failure_rate: 0.015
        }
      },
      {
        hostname: 'backup-storage-01',
        name: 'Backup Storage Server',
        type: 'storage' as const,
        environment: 'production' as const,
        location: 'Seoul-IDC-1',
        provider: 'onpremise' as const,
        specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 5000 },
        baseMetrics: { cpu_base: 15, memory_base: 40, disk_base: 70 },
        patterns: {
          business_hours: false,
          peak_hours: [2, 6, 22],
          maintenance_window: 1,
          failure_rate: 0.005
        }
      },
      {
        hostname: 'mail-server-01',
        name: 'Mail Server',
        type: 'mail' as const,
        environment: 'production' as const,
        location: 'Seoul-IDC-1',
        provider: 'onpremise' as const,
        specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 1000 },
        baseMetrics: { cpu_base: 25, memory_base: 45, disk_base: 35 },
        patterns: {
          business_hours: true,
          peak_hours: [9, 13, 17],
          maintenance_window: 4,
          failure_rate: 0.01
        }
      },
      {
        hostname: 'file-server-nfs',
        name: 'NFS File Server',
        type: 'storage' as const,
        environment: 'production' as const,
        location: 'Seoul-IDC-1',
        provider: 'onpremise' as const,
        specs: { cpu_cores: 6, memory_gb: 32, disk_gb: 10000 },
        baseMetrics: { cpu_base: 18, memory_base: 50, disk_base: 65 },
        patterns: {
          business_hours: true,
          peak_hours: [8, 12, 16, 20],
          maintenance_window: 3,
          failure_rate: 0.008
        }
      },
      {
        hostname: 'proxy-nginx-01',
        name: 'Nginx Proxy Server',
        type: 'proxy' as const,
        environment: 'production' as const,
        location: 'Seoul-IDC-1',
        provider: 'onpremise' as const,
        specs: { cpu_cores: 8, memory_gb: 16, disk_gb: 200 },
        baseMetrics: { cpu_base: 30, memory_base: 55, disk_base: 25 },
        patterns: {
          business_hours: true,
          peak_hours: [9, 12, 15, 18, 21],
          maintenance_window: 5,
          failure_rate: 0.02
        }
      },

      // === 쿠버네티스 클러스터 (6개) - AWS-Seoul-1 EKS ===
      {
        hostname: 'k8s-master-01',
        name: 'Kubernetes Master Node',
        type: 'kubernetes' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 200 },
        baseMetrics: { cpu_base: 40, memory_base: 65, disk_base: 30 },
        patterns: {
          business_hours: true,
          peak_hours: [9, 12, 15, 18],
          maintenance_window: 2,
          failure_rate: 0.005
        }
      },
      {
        hostname: 'k8s-worker-01',
        name: 'Kubernetes Worker Node 1',
        type: 'kubernetes' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 8, memory_gb: 32, disk_gb: 500 },
        baseMetrics: { cpu_base: 50, memory_base: 70, disk_base: 35 },
        patterns: {
          business_hours: true,
          peak_hours: [10, 13, 16, 19],
          maintenance_window: 3,
          failure_rate: 0.01
        }
      },
      {
        hostname: 'k8s-worker-02',
        name: 'Kubernetes Worker Node 2',
        type: 'kubernetes' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 8, memory_gb: 32, disk_gb: 500 },
        baseMetrics: { cpu_base: 45, memory_base: 68, disk_base: 32 },
        patterns: {
          business_hours: true,
          peak_hours: [9, 14, 17, 20],
          maintenance_window: 4,
          failure_rate: 0.01
        }
      },
      {
        hostname: 'k8s-ingress-01',
        name: 'Kubernetes Ingress Controller',
        type: 'kubernetes' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 100 },
        baseMetrics: { cpu_base: 35, memory_base: 60, disk_base: 20 },
        patterns: {
          business_hours: true,
          peak_hours: [8, 11, 14, 17, 21],
          maintenance_window: 5,
          failure_rate: 0.015
        }
      },
      {
        hostname: 'k8s-logging-01',
        name: 'Kubernetes Logging Server',
        type: 'kubernetes' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 6, memory_gb: 24, disk_gb: 1000 },
        baseMetrics: { cpu_base: 25, memory_base: 55, disk_base: 50 },
        patterns: {
          business_hours: false,
          peak_hours: [1, 12, 18],
          maintenance_window: 2,
          failure_rate: 0.008
        }
      },
      {
        hostname: 'k8s-monitoring-01',
        name: 'Kubernetes Monitoring Server',
        type: 'kubernetes' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 6, memory_gb: 24, disk_gb: 500 },
        baseMetrics: { cpu_base: 30, memory_base: 60, disk_base: 40 },
        patterns: {
          business_hours: false,
          peak_hours: [0, 6, 12, 18],
          maintenance_window: 4,
          failure_rate: 0.006
        }
      },

      // === AWS EC2 인스턴스 (7개) ===
      {
        hostname: 'api-gateway-prod',
        name: 'API Gateway Production',
        type: 'api' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 200 },
        baseMetrics: { cpu_base: 25, memory_base: 50, disk_base: 30 },
        patterns: {
          business_hours: true,
          peak_hours: [8, 11, 13, 17, 20],
          maintenance_window: 4,
          failure_rate: 0.03
        }
      },
      {
        hostname: 'analytics-worker',
        name: 'Analytics Worker Server',
        type: 'analytics' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 16, memory_gb: 64, disk_gb: 1000 },
        baseMetrics: { cpu_base: 60, memory_base: 75, disk_base: 45 },
        patterns: {
          business_hours: false,
          peak_hours: [2, 8, 14, 20],
          maintenance_window: 1,
          failure_rate: 0.012
        }
      },
      {
        hostname: 'monitoring-elk',
        name: 'ELK Monitoring Stack',
        type: 'monitoring' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 8, memory_gb: 32, disk_gb: 2000 },
        baseMetrics: { cpu_base: 35, memory_base: 70, disk_base: 55 },
        patterns: {
          business_hours: false,
          peak_hours: [0, 6, 12, 18],
          maintenance_window: 3,
          failure_rate: 0.008
        }
      },
      {
        hostname: 'jenkins-ci-cd',
        name: 'Jenkins CI/CD Server',
        type: 'ci_cd' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 8, memory_gb: 16, disk_gb: 500 },
        baseMetrics: { cpu_base: 20, memory_base: 45, disk_base: 35 },
        patterns: {
          business_hours: true,
          peak_hours: [9, 11, 14, 16],
          maintenance_window: 5,
          failure_rate: 0.015
        }
      },
      {
        hostname: 'grafana-metrics',
        name: 'Grafana Metrics Dashboard',
        type: 'monitoring' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 200 },
        baseMetrics: { cpu_base: 22, memory_base: 48, disk_base: 25 },
        patterns: {
          business_hours: true,
          peak_hours: [9, 12, 15, 18],
          maintenance_window: 2,
          failure_rate: 0.01
        }
      },
      {
        hostname: 'vault-secrets',
        name: 'HashiCorp Vault Secrets',
        type: 'security' as const,
        environment: 'production' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 100 },
        baseMetrics: { cpu_base: 15, memory_base: 35, disk_base: 20 },
        patterns: {
          business_hours: false,
          peak_hours: [0, 12],
          maintenance_window: 4,
          failure_rate: 0.003
        }
      },
      {
        hostname: 'staging-web-01',
        name: 'Staging Web Server',
        type: 'web' as const,
        environment: 'staging' as const,
        location: 'AWS-Seoul-1',
        provider: 'aws' as const,
        specs: { cpu_cores: 4, memory_gb: 8, disk_gb: 200 },
        baseMetrics: { cpu_base: 25, memory_base: 50, disk_base: 30 },
        patterns: {
          business_hours: true,
          peak_hours: [10, 14, 16],
          maintenance_window: 1,
          failure_rate: 0.02
        }
      }
    ];

    return serverTemplates.map((template, index) => ({
      id: `virtual-server-${index + 1}`,
      ...template,
      status: 'healthy' as ServerStatus,
      created_at: new Date()
    }));
  }

  /**
   * 기존 서버 조회
   */
  private async getExistingServers(): Promise<VirtualServer[]> {
    if (!this.supabase) {
      // 개발 환경에서는 로컬 스토리지 사용
      const stored = localStorage.getItem('virtual_servers');
      return stored ? JSON.parse(stored) : [];
    }

    try {
      const { data, error } = await this.supabase
        .from('virtual_servers')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('기존 서버 조회 실패:', error);
      return [];
    }
  }

  /**
   * 서버 정보를 데이터베이스에 저장
   */
  private async saveServersToDatabase(): Promise<void> {
    if (!this.supabase) {
      // 개발 환경에서는 로컬 스토리지 사용
      localStorage.setItem('virtual_servers', JSON.stringify(this.servers));
      console.log('✅ 가상 서버 정보를 로컬 스토리지에 저장');
      return;
    }

    try {
      const { error } = await this.supabase
        .from('virtual_servers')
        .insert(this.servers);

      if (error) throw error;
      console.log('✅ 가상 서버 정보를 Supabase에 저장');
    } catch (error) {
      console.error('❌ 서버 정보 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 24시간 히스토리 데이터 생성
   */
  private async generateHistoryData(): Promise<void> {
    console.log('📊 24시간 히스토리 데이터 생성 중...');
    
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - this.config.historyDuration);
    const interval = 5 * 60 * 1000; // 5분 간격 (실제 24시간 데이터)
    
    const allMetrics: ServerMetrics[] = [];
    
    for (const server of this.servers) {
      let currentTime = new Date(startTime);
      
      while (currentTime <= endTime) {
        const metrics = this.generateMetricsForTime(server, currentTime);
        allMetrics.push(metrics);
        
        currentTime = new Date(currentTime.getTime() + interval);
      }
    }
    
    // 배치로 저장
    await this.saveMetricsBatch(allMetrics);
    console.log(`✅ ${allMetrics.length}개의 히스토리 데이터 포인트 생성 완료`);
  }

  /**
   * 실시간 데이터 포인트 생성
   */
  private async generateRealtimeDataPoint(): Promise<void> {
    const currentTime = new Date();
    const metrics: ServerMetrics[] = [];
    
    for (const server of this.servers) {
      const metric = this.generateMetricsForTime(server, currentTime);
      metrics.push(metric);
    }
    
    await this.saveMetricsBatch(metrics);
    console.log(`📊 실시간 데이터 포인트 생성: ${metrics.length}개 서버`);
  }

  /**
   * 특정 시간에 대한 메트릭 생성
   */
  private generateMetricsForTime(server: VirtualServer, timestamp: Date): ServerMetrics {
    const hour = timestamp.getHours();
    const minute = timestamp.getMinutes();
    
    // 기본 메트릭에서 시작
    let cpu = server.baseMetrics.cpu_base;
    let memory = server.baseMetrics.memory_base;
    let disk = server.baseMetrics.disk_base;
    
    // 비즈니스 시간 패턴 적용
    if (server.patterns.business_hours && hour >= 9 && hour <= 18) {
      cpu += 15;
      memory += 10;
    }
    
    // 피크 시간 적용
    if (server.patterns.peak_hours.includes(hour)) {
      cpu += 20;
      memory += 15;
      disk += 5;
    }
    
    // 유지보수 시간 적용
    if (hour === server.patterns.maintenance_window) {
      cpu *= 0.3;
      memory *= 0.5;
    }
    
    // 랜덤 변동 추가
    cpu += (Math.random() - 0.5) * 20;
    memory += (Math.random() - 0.5) * 15;
    disk += (Math.random() - 0.5) * 10;
    
    // 장애 시뮬레이션
    let status: 'healthy' | 'warning' | 'critical' | 'offline' = 'healthy';
    const alerts: string[] = [];
    
    if (Math.random() < server.patterns.failure_rate) {
      status = 'critical';
      cpu = Math.min(100, cpu + 40);
      memory = Math.min(100, memory + 30);
      alerts.push('High resource usage detected');
    } else if (cpu > 80 || memory > 85) {
      status = 'warning';
      alerts.push('Resource usage above threshold');
    }
    
    // 범위 제한
    cpu = Math.max(0, Math.min(100, cpu));
    memory = Math.max(0, Math.min(100, memory));
    disk = Math.max(0, Math.min(100, disk));
    
    return {
      server_id: server.id,
      timestamp,
      cpu_usage: Math.round(cpu * 10) / 10,
      memory_usage: Math.round(memory * 10) / 10,
      disk_usage: Math.round(disk * 10) / 10,
      network_in: Math.floor(Math.random() * 1000000) + 100000,
      network_out: Math.floor(Math.random() * 800000) + 80000,
      response_time: Math.round((Math.random() * 200 + 50) * 10) / 10,
      active_connections: Math.floor(Math.random() * 500) + 50,
      status,
      alerts
    };
  }

  /**
   * 메트릭 배치 저장
   */
  private async saveMetricsBatch(metrics: ServerMetrics[]): Promise<void> {
    if (!this.supabase) {
      // 개발 환경에서는 메모리에만 저장 (서버사이드 안전)
      console.log(`📊 메트릭 저장 (개발 모드): ${metrics.length}개 항목`);
      return;
    }

    try {
      const { error } = await this.supabase
        .from('server_metrics')
        .insert(metrics);

      if (error) throw error;
    } catch (error) {
      console.error('❌ 메트릭 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 서버 목록 조회
   */
  getServers(): VirtualServer[] {
    return this.servers;
  }

  /**
   * 특정 서버의 최신 메트릭 조회
   */
  async getLatestMetrics(serverId: string): Promise<ServerMetrics | null> {
    if (!this.supabase) {
      // 개발 환경에서는 기본 메트릭 생성
      return {
        server_id: serverId,
        timestamp: new Date(),
        cpu_usage: Math.floor(Math.random() * 30) + 20,
        memory_usage: Math.floor(Math.random() * 40) + 30,
        disk_usage: Math.floor(Math.random() * 30) + 10,
        network_in: Math.floor(Math.random() * 1000000) + 100000,
        network_out: Math.floor(Math.random() * 800000) + 80000,
        response_time: Math.round((Math.random() * 200 + 50) * 10) / 10,
        active_connections: Math.floor(Math.random() * 500) + 50,
        status: 'healthy',
        alerts: []
      };
    }

    try {
      const { data, error } = await this.supabase
        .from('server_metrics')
        .select('*')
        .eq('server_id', serverId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('최신 메트릭 조회 실패:', error);
      return null;
    }
  }

  /**
   * 서버 메트릭 히스토리 조회
   */
  async getMetricsHistory(serverId: string, hours: number = 24): Promise<ServerMetrics[]> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    if (!this.supabase) {
      // 개발 환경에서는 빈 배열 반환
      return [];
    }

    try {
      const { data, error } = await this.supabase
        .from('server_metrics')
        .select('*')
        .eq('server_id', serverId)
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('메트릭 히스토리 조회 실패:', error);
      return [];
    }
  }

  /**
   * 전체 시스템 상태 조회
   */
  async getSystemStatus(): Promise<{
    totalServers: number;
    healthyServers: number;
    warningServers: number;
    criticalServers: number;
    offlineServers: number;
    averageCpu: number;
    averageMemory: number;
    isGenerating: boolean;
  }> {
    const latestMetrics = await Promise.all(
      this.servers.map(server => this.getLatestMetrics(server.id))
    );

    const validMetrics = latestMetrics.filter(m => m !== null) as ServerMetrics[];
    
    const statusCounts = {
      healthy: validMetrics.filter(m => m.status === 'healthy').length,
      warning: validMetrics.filter(m => m.status === 'warning').length,
      critical: validMetrics.filter(m => m.status === 'critical').length,
      offline: validMetrics.filter(m => m.status === 'offline').length
    };

    const averageCpu = validMetrics.length > 0 
      ? validMetrics.reduce((sum, m) => sum + m.cpu_usage, 0) / validMetrics.length 
      : 0;
    
    const averageMemory = validMetrics.length > 0 
      ? validMetrics.reduce((sum, m) => sum + m.memory_usage, 0) / validMetrics.length 
      : 0;

    return {
      totalServers: this.servers.length,
      healthyServers: statusCounts.healthy,
      warningServers: statusCounts.warning,
      criticalServers: statusCounts.critical,
      offlineServers: statusCounts.offline,
      averageCpu: Math.round(averageCpu * 10) / 10,
      averageMemory: Math.round(averageMemory * 10) / 10,
      isGenerating: this.isGenerating
    };
  }

  /**
   * 생성 상태 조회
   */
  getGenerationStatus() {
    return {
      isGenerating: this.isGenerating,
      serversCount: this.servers.length,
      interval: this.config.generationInterval,
      duration: this.config.totalDuration
    };
  }

  /**
   * 최소한의 Fallback 서버 생성 (오류 시 사용)
   */
  private createFallbackServers(): VirtualServer[] {
    console.log('🔄 최소한의 Fallback 서버 생성 중...');
    
    const now = new Date();
    const fallbackServers: VirtualServer[] = [
      {
        id: 'web-prod-01',
        hostname: 'web-prod-01',
        name: 'Production Web Server',
        type: 'web',
        environment: 'production',
        location: 'Seoul',
        provider: 'onpremise',
        status: 'healthy',
        created_at: now,
        specs: { cpu_cores: 8, memory_gb: 32, disk_gb: 500 },
        baseMetrics: { cpu_base: 35, memory_base: 60, disk_base: 45 },
        patterns: {
          business_hours: true,
          peak_hours: [9, 12, 14, 18],
          maintenance_window: 3,
          failure_rate: 0.02
        }
      },
      {
        id: 'db-master-01',
        hostname: 'db-master-01',
        name: 'Database Master Server',
        type: 'database',
        environment: 'production',
        location: 'Seoul',
        provider: 'onpremise',
        status: 'healthy',
        created_at: now,
        specs: { cpu_cores: 16, memory_gb: 64, disk_gb: 2000 },
        baseMetrics: { cpu_base: 45, memory_base: 75, disk_base: 60 },
        patterns: {
          business_hours: true,
          peak_hours: [10, 13, 15, 19],
          maintenance_window: 2,
          failure_rate: 0.01
        }
      },
      {
        id: 'api-gateway-prod',
        hostname: 'api-gateway-prod',
        name: 'API Gateway',
        type: 'gateway',
        environment: 'production',
        location: 'Seoul',
        provider: 'onpremise',
        status: 'healthy',
        created_at: now,
        specs: { cpu_cores: 4, memory_gb: 16, disk_gb: 200 },
        baseMetrics: { cpu_base: 25, memory_base: 45, disk_base: 30 },
        patterns: {
          business_hours: true,
          peak_hours: [9, 12, 14, 18],
          maintenance_window: 4,
          failure_rate: 0.015
        }
      }
    ];

    return fallbackServers;
  }
}

// 싱글톤 인스턴스
export const virtualServerManager = new VirtualServerManager(); 