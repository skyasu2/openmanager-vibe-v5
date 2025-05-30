/**
 * 📊 Prometheus 메트릭 포맷터
 * 
 * 기존 서버 메트릭을 Prometheus 표준 형식으로 변환
 * - 표준 메트릭 네이밍 컨벤션
 * - 라벨 기반 메트릭 구조
 * - Counter, Gauge, Histogram 지원
 * - 실제 /metrics 엔드포인트 호환
 */

export interface PrometheusMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  labels: Record<string, string>;
  value: number;
  timestamp?: number;
}

export interface PrometheusHistogramBucket {
  le: string;
  value: number;
}

export interface PrometheusHistogramMetric extends Omit<PrometheusMetric, 'value'> {
  type: 'histogram';
  buckets: PrometheusHistogramBucket[];
  count: number;
  sum: number;
}

export interface ServerMetricsForPrometheus {
  id: string;
  hostname: string;
  environment: string;
  role: string;
  status: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  response_time: number;
  uptime: number;
  pattern_info?: any;
  correlation_metrics?: any;
}

export class PrometheusMetricsFormatter {
  private static instance: PrometheusMetricsFormatter;

  static getInstance(): PrometheusMetricsFormatter {
    if (!PrometheusMetricsFormatter.instance) {
      PrometheusMetricsFormatter.instance = new PrometheusMetricsFormatter();
    }
    return PrometheusMetricsFormatter.instance;
  }

  /**
   * 🔄 서버 메트릭을 Prometheus 형식으로 변환
   */
  formatServerMetrics(server: ServerMetricsForPrometheus): PrometheusMetric[] {
    const timestamp = Date.now();
    const baseLabels = {
      server_id: server.id,
      hostname: server.hostname,
      environment: server.environment,
      role: server.role,
      status: server.status
    };

    const metrics: PrometheusMetric[] = [];

    // 🖥️ CPU 메트릭 (표준 Prometheus 형식)
    metrics.push({
      name: 'node_cpu_usage_percent',
      type: 'gauge',
      help: 'Current CPU usage percentage',
      labels: { ...baseLabels, mode: 'total' },
      value: server.cpu_usage,
      timestamp
    });

    // CPU 시간 누적 (실제 Prometheus node_exporter 스타일)
    const cpuSeconds = (server.uptime * 3600 * server.cpu_usage) / 100;
    metrics.push({
      name: 'node_cpu_seconds_total',
      type: 'counter',
      help: 'Seconds the CPUs spent in each mode',
      labels: { ...baseLabels, cpu: '0', mode: 'user' },
      value: cpuSeconds * 0.6, // 60% user mode
      timestamp
    });

    metrics.push({
      name: 'node_cpu_seconds_total',
      type: 'counter',
      help: 'Seconds the CPUs spent in each mode',
      labels: { ...baseLabels, cpu: '0', mode: 'system' },
      value: cpuSeconds * 0.3, // 30% system mode
      timestamp
    });

    metrics.push({
      name: 'node_cpu_seconds_total',
      type: 'counter',
      help: 'Seconds the CPUs spent in each mode',
      labels: { ...baseLabels, cpu: '0', mode: 'idle' },
      value: (server.uptime * 3600) - cpuSeconds, // 나머지는 idle
      timestamp
    });

    // 💾 메모리 메트릭
    const totalMemory = 8 * 1024 * 1024 * 1024; // 8GB 가정
    const usedMemory = (totalMemory * server.memory_usage) / 100;

    metrics.push({
      name: 'node_memory_MemTotal_bytes',
      type: 'gauge',
      help: 'Memory information field MemTotal_bytes',
      labels: baseLabels,
      value: totalMemory,
      timestamp
    });

    metrics.push({
      name: 'node_memory_MemAvailable_bytes',
      type: 'gauge',
      help: 'Memory information field MemAvailable_bytes',
      labels: baseLabels,
      value: totalMemory - usedMemory,
      timestamp
    });

    metrics.push({
      name: 'node_memory_MemUsed_bytes',
      type: 'gauge',
      help: 'Memory information field MemUsed_bytes',
      labels: baseLabels,
      value: usedMemory,
      timestamp
    });

    metrics.push({
      name: 'node_memory_usage_percent',
      type: 'gauge',
      help: 'Memory usage percentage',
      labels: baseLabels,
      value: server.memory_usage,
      timestamp
    });

    // 💿 디스크 메트릭
    const totalDisk = 500 * 1024 * 1024 * 1024; // 500GB 가정
    const usedDisk = (totalDisk * server.disk_usage) / 100;

    metrics.push({
      name: 'node_filesystem_size_bytes',
      type: 'gauge',
      help: 'Filesystem size in bytes',
      labels: { ...baseLabels, device: '/dev/sda1', fstype: 'ext4', mountpoint: '/' },
      value: totalDisk,
      timestamp
    });

    metrics.push({
      name: 'node_filesystem_avail_bytes',
      type: 'gauge',
      help: 'Filesystem space available to non-root users in bytes',
      labels: { ...baseLabels, device: '/dev/sda1', fstype: 'ext4', mountpoint: '/' },
      value: totalDisk - usedDisk,
      timestamp
    });

    metrics.push({
      name: 'node_filesystem_free_bytes',
      type: 'gauge',
      help: 'Filesystem free space in bytes',
      labels: { ...baseLabels, device: '/dev/sda1', fstype: 'ext4', mountpoint: '/' },
      value: totalDisk - usedDisk,
      timestamp
    });

    metrics.push({
      name: 'node_disk_usage_percent',
      type: 'gauge',
      help: 'Disk usage percentage',
      labels: { ...baseLabels, device: '/dev/sda1' },
      value: server.disk_usage,
      timestamp
    });

    // 🌐 네트워크 메트릭
    const networkBytesIn = server.network_in * 1024 * 1024; // MB를 bytes로
    const networkBytesOut = server.network_out * 1024 * 1024;

    metrics.push({
      name: 'node_network_receive_bytes_total',
      type: 'counter',
      help: 'Network device statistic receive_bytes',
      labels: { ...baseLabels, device: 'eth0' },
      value: networkBytesIn * server.uptime, // 누적값으로 변환
      timestamp
    });

    metrics.push({
      name: 'node_network_transmit_bytes_total',
      type: 'counter',
      help: 'Network device statistic transmit_bytes',
      labels: { ...baseLabels, device: 'eth0' },
      value: networkBytesOut * server.uptime,
      timestamp
    });

    metrics.push({
      name: 'node_network_receive_rate_mbps',
      type: 'gauge',
      help: 'Current network receive rate in Mbps',
      labels: { ...baseLabels, device: 'eth0' },
      value: server.network_in,
      timestamp
    });

    metrics.push({
      name: 'node_network_transmit_rate_mbps',
      type: 'gauge',
      help: 'Current network transmit rate in Mbps',
      labels: { ...baseLabels, device: 'eth0' },
      value: server.network_out,
      timestamp
    });

    // ⚡ 응답 시간 메트릭 (Histogram으로 구성)
    metrics.push({
      name: 'http_request_duration_seconds',
      type: 'gauge',
      help: 'HTTP request latency in seconds',
      labels: { ...baseLabels, method: 'GET', handler: 'api' },
      value: server.response_time / 1000, // ms를 초로 변환
      timestamp
    });

    // 🔄 업타임 메트릭
    metrics.push({
      name: 'node_boot_time_seconds',
      type: 'gauge',
      help: 'Node boot time, in unixtime',
      labels: baseLabels,
      value: timestamp/1000 - (server.uptime * 3600), // 현재시간 - 업타임
      timestamp
    });

    metrics.push({
      name: 'node_uptime_seconds',
      type: 'gauge',
      help: 'System uptime in seconds',
      labels: baseLabels,
      value: server.uptime * 3600, // 시간을 초로 변환
      timestamp
    });

    // 🤖 AI 패턴 메트릭 (커스텀)
    if (server.pattern_info) {
      metrics.push({
        name: 'openmanager_server_load_level',
        type: 'gauge',
        help: 'Current server load level (0=low, 1=medium, 2=high)',
        labels: { ...baseLabels, load_type: server.pattern_info.current_load },
        value: server.pattern_info.current_load === 'low' ? 0 : 
               server.pattern_info.current_load === 'medium' ? 1 : 2,
        timestamp
      });

      metrics.push({
        name: 'openmanager_time_multiplier',
        type: 'gauge',
        help: 'Time-based load multiplier from AI pattern engine',
        labels: baseLabels,
        value: server.pattern_info.time_multiplier || 1.0,
        timestamp
      });

      metrics.push({
        name: 'openmanager_seasonal_multiplier',
        type: 'gauge',
        help: 'Seasonal load multiplier from AI pattern engine',
        labels: baseLabels,
        value: server.pattern_info.seasonal_multiplier || 1.0,
        timestamp
      });

      metrics.push({
        name: 'openmanager_burst_active',
        type: 'gauge',
        help: 'Whether server is experiencing burst activity (0=no, 1=yes)',
        labels: baseLabels,
        value: server.pattern_info.burst_active ? 1 : 0,
        timestamp
      });
    }

    // 📊 상관관계 메트릭
    if (server.correlation_metrics) {
      metrics.push({
        name: 'openmanager_cpu_memory_correlation',
        type: 'gauge',
        help: 'CPU-Memory correlation coefficient (-1 to 1)',
        labels: baseLabels,
        value: server.correlation_metrics.cpu_memory_correlation || 0,
        timestamp
      });

      metrics.push({
        name: 'openmanager_stability_score',
        type: 'gauge',
        help: 'Server stability score (0 to 1)',
        labels: baseLabels,
        value: server.correlation_metrics.stability_score || 0,
        timestamp
      });
    }

    return metrics;
  }

  /**
   * 📝 Prometheus 텍스트 형식으로 출력
   */
  formatToPrometheusText(metrics: PrometheusMetric[]): string {
    const metricGroups: Record<string, PrometheusMetric[]> = {};
    
    // 메트릭 이름별로 그룹화
    metrics.forEach(metric => {
      if (!metricGroups[metric.name]) {
        metricGroups[metric.name] = [];
      }
      metricGroups[metric.name].push(metric);
    });

    let output = '';
    
    Object.entries(metricGroups).forEach(([metricName, metricList]) => {
      // HELP 및 TYPE 정보 (한 번만)
      const firstMetric = metricList[0];
      output += `# HELP ${metricName} ${firstMetric.help}\n`;
      output += `# TYPE ${metricName} ${firstMetric.type}\n`;
      
      // 각 메트릭 값들
      metricList.forEach(metric => {
        const labelString = Object.entries(metric.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');
        
        const timestamp = metric.timestamp ? ` ${metric.timestamp}` : '';
        output += `${metricName}{${labelString}} ${metric.value}${timestamp}\n`;
      });
      
      output += '\n'; // 메트릭 그룹 간 구분
    });

    return output;
  }

  /**
   * 📊 응답 시간 히스토그램 생성
   */
  createResponseTimeHistogram(
    server: ServerMetricsForPrometheus,
    responseTime: number
  ): PrometheusHistogramMetric {
    const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]; // seconds
    const responseTimeSeconds = responseTime / 1000;
    
    const histogramBuckets: PrometheusHistogramBucket[] = buckets.map(le => ({
      le: le.toString(),
      value: responseTimeSeconds <= le ? 1 : 0
    }));

    // +Inf 버킷 추가
    histogramBuckets.push({
      le: '+Inf',
      value: 1
    });

    return {
      name: 'http_request_duration_seconds',
      type: 'histogram',
      help: 'HTTP request latency histogram',
      labels: {
        server_id: server.id,
        hostname: server.hostname,
        environment: server.environment,
        role: server.role,
        method: 'GET',
        handler: 'api'
      },
      buckets: histogramBuckets,
      count: 1,
      sum: responseTimeSeconds,
      timestamp: Date.now()
    };
  }

  /**
   * 🔍 메트릭 필터링 (라벨 기반)
   */
  filterMetrics(
    metrics: PrometheusMetric[],
    filters: Record<string, string>
  ): PrometheusMetric[] {
    return metrics.filter(metric => {
      return Object.entries(filters).every(([key, value]) => 
        metric.labels[key] === value
      );
    });
  }

  /**
   * 📈 메트릭 집계 (동일한 이름의 메트릭들)
   */
  aggregateMetrics(
    metrics: PrometheusMetric[],
    operation: 'sum' | 'avg' | 'max' | 'min' = 'sum'
  ): Record<string, number> {
    const aggregated: Record<string, number[]> = {};
    
    metrics.forEach(metric => {
      if (!aggregated[metric.name]) {
        aggregated[metric.name] = [];
      }
      aggregated[metric.name].push(metric.value);
    });

    const result: Record<string, number> = {};
    
    Object.entries(aggregated).forEach(([name, values]) => {
      switch (operation) {
        case 'sum':
          result[name] = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          result[name] = values.reduce((sum, val) => sum + val, 0) / values.length;
          break;
        case 'max':
          result[name] = Math.max(...values);
          break;
        case 'min':
          result[name] = Math.min(...values);
          break;
      }
    });

    return result;
  }

  /**
   * 🏷️ 라벨 정규화
   */
  normalizeLabels(labels: Record<string, any>): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    Object.entries(labels).forEach(([key, value]) => {
      // Prometheus 라벨 규칙에 맞게 정규화
      const normalizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
      const normalizedValue = String(value).replace(/["\n\r\\]/g, '');
      normalized[normalizedKey] = normalizedValue;
    });

    return normalized;
  }

  /**
   * 📊 시스템 전체 요약 메트릭
   */
  generateSystemSummaryMetrics(servers: ServerMetricsForPrometheus[]): PrometheusMetric[] {
    const timestamp = Date.now();
    const metrics: PrometheusMetric[] = [];

    // 전체 서버 수
    metrics.push({
      name: 'openmanager_total_servers',
      type: 'gauge',
      help: 'Total number of monitored servers',
      labels: {},
      value: servers.length,
      timestamp
    });

    // 환경별 서버 수
    const envCounts: Record<string, number> = {};
    servers.forEach(server => {
      envCounts[server.environment] = (envCounts[server.environment] || 0) + 1;
    });

    Object.entries(envCounts).forEach(([env, count]) => {
      metrics.push({
        name: 'openmanager_servers_by_environment',
        type: 'gauge',
        help: 'Number of servers by environment',
        labels: { environment: env },
        value: count,
        timestamp
      });
    });

    // 평균 메트릭
    const avgCpu = servers.reduce((sum, s) => sum + s.cpu_usage, 0) / servers.length;
    const avgMemory = servers.reduce((sum, s) => sum + s.memory_usage, 0) / servers.length;
    const avgDisk = servers.reduce((sum, s) => sum + s.disk_usage, 0) / servers.length;

    metrics.push(
      {
        name: 'openmanager_avg_cpu_usage_percent',
        type: 'gauge',
        help: 'Average CPU usage across all servers',
        labels: {},
        value: Math.round(avgCpu * 100) / 100,
        timestamp
      },
      {
        name: 'openmanager_avg_memory_usage_percent',
        type: 'gauge',
        help: 'Average memory usage across all servers',
        labels: {},
        value: Math.round(avgMemory * 100) / 100,
        timestamp
      },
      {
        name: 'openmanager_avg_disk_usage_percent',
        type: 'gauge',
        help: 'Average disk usage across all servers',
        labels: {},
        value: Math.round(avgDisk * 100) / 100,
        timestamp
      }
    );

    return metrics;
  }
}

// 싱글톤 인스턴스
export const prometheusFormatter = PrometheusMetricsFormatter.getInstance(); 