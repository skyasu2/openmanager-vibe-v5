import { MetricCollector, ServerMetrics, ServiceStatus, CollectorConfig } from '../../types/collector';

/**
 * AWS CloudWatch 메트릭 수집기
 * 
 * CloudWatch API를 사용하여 EC2 인스턴스의 메트릭을 수집합니다.
 * AWS SDK v3를 사용하여 구현됩니다.
 */
export class CloudWatchCollector implements MetricCollector {
  private config: CollectorConfig;
  private region: string;
  private credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };

  constructor(config: CollectorConfig) {
    this.config = config;
    this.region = config.credentials?.region || 'us-east-1';
    
    if (!config.credentials?.apiKey || !config.credentials?.secretKey) {
      throw new Error('CloudWatch 수집기에는 AWS credentials가 필요합니다');
    }
    
    this.credentials = {
      accessKeyId: config.credentials.apiKey,
      secretAccessKey: config.credentials.secretKey
    };
  }

  /**
   * 특정 서버(EC2 인스턴스)의 메트릭 수집
   */
  async collectMetrics(serverId: string): Promise<ServerMetrics> {
    try {
      const instanceId = this.getInstanceIdFromServerId(serverId);
      const hostname = await this.getHostname(instanceId);
      const timestamp = new Date();

      // CloudWatch 메트릭을 병렬로 조회
      const [
        cpuMetrics,
        memoryMetrics,
        diskMetrics,
        networkMetrics,
        systemMetrics,
        serviceMetrics
      ] = await Promise.all([
        this.getCPUMetrics(instanceId),
        this.getMemoryMetrics(instanceId),
        this.getDiskMetrics(instanceId),
        this.getNetworkMetrics(instanceId),
        this.getSystemMetrics(instanceId),
        this.getServiceMetrics(instanceId)
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
        metadata: await this.getMetadata(instanceId)
      };
    } catch (error) {
      console.error(`❌ CloudWatch 수집 실패 (${serverId}):`, error);
      throw error;
    }
  }

  /**
   * 모든 EC2 인스턴스 목록 조회
   */
  async getServerList(): Promise<string[]> {
    try {
      // 실제 구현에서는 AWS SDK EC2.describeInstances() 사용
      const response = await this.makeAWSRequest('ec2', 'DescribeInstances', {
        Filters: [
          {
            Name: 'instance-state-name',
            Values: ['running', 'stopped']
          }
        ]
      });

      const servers: string[] = [];
      response.Reservations?.forEach((reservation: any) => {
        reservation.Instances?.forEach((instance: any) => {
          const serverId = this.getServerIdFromInstanceId(instance.InstanceId);
          servers.push(serverId);
        });
      });

      return servers;
    } catch (error) {
      console.error('❌ CloudWatch 서버 목록 조회 실패:', error);
      return [];
    }
  }

  /**
   * EC2 인스턴스 온라인 상태 확인
   */
  async isServerOnline(serverId: string): Promise<boolean> {
    try {
      const instanceId = this.getInstanceIdFromServerId(serverId);
      
      const response = await this.makeAWSRequest('ec2', 'DescribeInstances', {
        InstanceIds: [instanceId]
      });

      const instance = response.Reservations?.[0]?.Instances?.[0];
      return instance?.State?.Name === 'running';
    } catch (error) {
      console.error(`❌ CloudWatch 서버 상태 확인 실패 (${serverId}):`, error);
      return false;
    }
  }

  // Private Methods - CloudWatch 메트릭 조회

  private async getCPUMetrics(instanceId: string) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000); // 5분 전

    // CPU 사용률
    const cpuUsageData = await this.getCloudWatchMetric(
      'AWS/EC2',
      'CPUUtilization',
      'Average',
      instanceId,
      startTime,
      endTime
    );

    // CloudWatch Basic Monitoring에서는 로드 평균 직접 제공 안함
    // CloudWatch Agent나 사용자 정의 메트릭 필요
    
    return {
      usage: cpuUsageData || 0,
      loadAverage: [0, 0, 0], // CloudWatch Agent 필요
      cores: await this.getInstanceCores(instanceId)
    };
  }

  private async getMemoryMetrics(instanceId: string) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);

    // 메모리 사용률 (CloudWatch Agent 필요)
    const memoryUsage = await this.getCloudWatchMetric(
      'CWAgent',
      'mem_used_percent',
      'Average',
      instanceId,
      startTime,
      endTime
    );

    // 인스턴스 타입별 메모리 용량 (하드코딩 또는 별도 API)
    const totalMemory = await this.getInstanceMemory(instanceId);
    const used = totalMemory * (memoryUsage || 0) / 100;

    return {
      total: totalMemory,
      used: Math.round(used),
      available: totalMemory - Math.round(used),
      usage: memoryUsage || 0
    };
  }

  private async getDiskMetrics(instanceId: string) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);

    // 디스크 사용률 (CloudWatch Agent 필요)
    const diskUsage = await this.getCloudWatchMetric(
      'CWAgent',
      'disk_used_percent',
      'Average',
      instanceId,
      startTime,
      endTime,
      { device: '/', fstype: 'ext4' }
    );

    // 디스크 IOPS
    const readOps = await this.getCloudWatchMetric(
      'AWS/EC2',
      'DiskReadOps',
      'Sum',
      instanceId,
      startTime,
      endTime
    );

    const writeOps = await this.getCloudWatchMetric(
      'AWS/EC2',
      'DiskWriteOps',
      'Sum',
      instanceId,
      startTime,
      endTime
    );

    // EBS 볼륨 크기 조회
    const totalDisk = await this.getInstanceDiskSize(instanceId);
    const used = totalDisk * (diskUsage || 0) / 100;

    return {
      total: totalDisk,
      used: Math.round(used),
      available: totalDisk - Math.round(used),
      usage: diskUsage || 0,
      iops: {
        read: Math.round((readOps || 0) / 300), // 5분 합계를 초당으로 변환
        write: Math.round((writeOps || 0) / 300)
      }
    };
  }

  private async getNetworkMetrics(instanceId: string) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);

    const networkIn = await this.getCloudWatchMetric(
      'AWS/EC2',
      'NetworkIn',
      'Sum',
      instanceId,
      startTime,
      endTime
    );

    const networkOut = await this.getCloudWatchMetric(
      'AWS/EC2',
      'NetworkOut',
      'Sum',
      instanceId,
      startTime,
      endTime
    );

    const packetsIn = await this.getCloudWatchMetric(
      'AWS/EC2',
      'NetworkPacketsIn',
      'Sum',
      instanceId,
      startTime,
      endTime
    );

    const packetsOut = await this.getCloudWatchMetric(
      'AWS/EC2',
      'NetworkPacketsOut',
      'Sum',
      instanceId,
      startTime,
      endTime
    );

    return {
      interface: 'eth0',
      bytesReceived: Math.round((networkIn || 0) / 300), // 초당 평균
      bytesSent: Math.round((networkOut || 0) / 300),
      packetsReceived: Math.round((packetsIn || 0) / 300),
      packetsSent: Math.round((packetsOut || 0) / 300),
      errorsReceived: 0, // CloudWatch에서 직접 제공 안함
      errorsSent: 0
    };
  }

  private async getSystemMetrics(instanceId: string) {
    // EC2 인스턴스 정보 조회
    const instanceInfo = await this.getInstanceInfo(instanceId);
    
    const launchTime = new Date(instanceInfo.LaunchTime);
    const uptime = Math.floor((Date.now() - launchTime.getTime()) / 1000);

    return {
      os: this.getOSFromPlatform(instanceInfo.Platform),
      platform: instanceInfo.Platform || 'linux',
      uptime,
      bootTime: launchTime,
      processes: {
        total: 0, // CloudWatch Agent 필요
        running: 0,
        sleeping: 0,
        zombie: 0
      }
    };
  }

  private async getServiceMetrics(instanceId: string): Promise<ServiceStatus[]> {
    // 서비스 상태는 CloudWatch Agent나 Systems Manager 필요
    return [
      { name: 'cloudwatch-agent', status: 'running' }
    ];
  }

  private async getCloudWatchMetric(
    namespace: string,
    metricName: string,
    statistic: string,
    instanceId: string,
    startTime: Date,
    endTime: Date,
    additionalDimensions?: Record<string, string>
  ): Promise<number | null> {
    try {
      const dimensions = [
        { Name: 'InstanceId', Value: instanceId },
        ...Object.entries(additionalDimensions || {}).map(([key, value]) => ({
          Name: key,
          Value: value
        }))
      ];

      const response = await this.makeAWSRequest('cloudwatch', 'GetMetricStatistics', {
        Namespace: namespace,
        MetricName: metricName,
        Dimensions: dimensions,
        StartTime: startTime.toISOString(),
        EndTime: endTime.toISOString(),
        Period: 300, // 5분
        Statistics: [statistic]
      });

      const datapoints = response.Datapoints || [];
      if (datapoints.length === 0) return null;

      // 최신 데이터포인트 사용
      const latest = datapoints.sort((a: any, b: any) => 
        new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
      )[0];

      return latest[statistic] || null;
    } catch (error) {
      console.error(`❌ CloudWatch 메트릭 조회 실패 (${metricName}):`, error);
      return null;
    }
  }

  private async makeAWSRequest(service: string, action: string, params: any): Promise<any> {
    // 실제 구현에서는 AWS SDK v3 사용
    // 예: import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
    
    const endpoint = `https://${service}.${this.region}.amazonaws.com/`;
    const headers = await this.signAWSRequest(service, action, params);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(this.config.timeout * 1000)
    });

    if (!response.ok) {
      throw new Error(`AWS API 오류: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async signAWSRequest(service: string, action: string, params: any): Promise<Record<string, string>> {
    // AWS Signature Version 4 구현 필요
    // 실제로는 AWS SDK가 자동으로 처리
    return {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `${action}`,
      'Authorization': `AWS4-HMAC-SHA256 Credential=${this.credentials.accessKeyId}/...`
    };
  }

  private async getHostname(instanceId: string): Promise<string> {
    const instanceInfo = await this.getInstanceInfo(instanceId);
    return instanceInfo.PrivateDnsName || instanceInfo.PublicDnsName || instanceId;
  }

  private async getInstanceInfo(instanceId: string): Promise<any> {
    const response = await this.makeAWSRequest('ec2', 'DescribeInstances', {
      InstanceIds: [instanceId]
    });
    
    return response.Reservations?.[0]?.Instances?.[0] || {};
  }

  private async getInstanceCores(instanceId: string): Promise<number> {
    const instanceInfo = await this.getInstanceInfo(instanceId);
    const instanceType = instanceInfo.InstanceType;
    
    // 인스턴스 타입별 vCPU 수 매핑 (간소화)
    const cpuMapping: Record<string, number> = {
      't3.micro': 2, 't3.small': 2, 't3.medium': 2, 't3.large': 2,
      'm5.large': 2, 'm5.xlarge': 4, 'm5.2xlarge': 8,
      'c5.large': 2, 'c5.xlarge': 4, 'c5.2xlarge': 8
    };
    
    return cpuMapping[instanceType] || 2;
  }

  private async getInstanceMemory(instanceId: string): Promise<number> {
    const instanceInfo = await this.getInstanceInfo(instanceId);
    const instanceType = instanceInfo.InstanceType;
    
    // 인스턴스 타입별 메모리 매핑 (바이트 단위)
    const memoryMapping: Record<string, number> = {
      't3.micro': 1 * 1024 * 1024 * 1024,
      't3.small': 2 * 1024 * 1024 * 1024,
      't3.medium': 4 * 1024 * 1024 * 1024,
      't3.large': 8 * 1024 * 1024 * 1024,
      'm5.large': 8 * 1024 * 1024 * 1024,
      'm5.xlarge': 16 * 1024 * 1024 * 1024
    };
    
    return memoryMapping[instanceType] || 2 * 1024 * 1024 * 1024;
  }

  private async getInstanceDiskSize(instanceId: string): Promise<number> {
    // EBS 볼륨 크기 조회
    const response = await this.makeAWSRequest('ec2', 'DescribeVolumes', {
      Filters: [
        { Name: 'attachment.instance-id', Values: [instanceId] },
        { Name: 'attachment.device', Values: ['/dev/sda1', '/dev/xvda'] }
      ]
    });
    
    const volume = response.Volumes?.[0];
    return volume ? volume.Size * 1024 * 1024 * 1024 : 20 * 1024 * 1024 * 1024; // 기본 20GB
  }

  private async getMetadata(instanceId: string) {
    const instanceInfo = await this.getInstanceInfo(instanceId);
    
    return {
      location: this.region,
      environment: this.getEnvironmentFromTags(instanceInfo.Tags || []),
      instanceType: instanceInfo.InstanceType,
      provider: 'aws' as const
    };
  }

  private getEnvironmentFromTags(tags: any[]): 'production' | 'staging' | 'development' {
    const envTag = tags.find(tag => tag.Key.toLowerCase() === 'environment');
    const env = envTag?.Value?.toLowerCase();
    
    if (env === 'production' || env === 'prod') return 'production';
    if (env === 'staging' || env === 'stage') return 'staging';
    return 'development';
  }

  private getOSFromPlatform(platform?: string): string {
    if (platform === 'windows') return 'Windows Server';
    return 'Amazon Linux 2';
  }

  private getInstanceIdFromServerId(serverId: string): string {
    // serverId -> instanceId 매핑
    // 실제로는 설정 파일이나 태그 기반 매핑
    return serverId.startsWith('i-') ? serverId : `i-${serverId}`;
  }

  private getServerIdFromInstanceId(instanceId: string): string {
    // instanceId -> serverId 매핑
    return instanceId.replace('i-', 'aws-ec2-');
  }
} 