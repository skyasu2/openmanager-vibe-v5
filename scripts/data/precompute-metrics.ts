#!/usr/bin/env tsx
/**
 * Pre-compute Metrics Pipeline
 *
 * hourly-data/*.json (Prometheus 포맷) → processed-metrics/ (가공 데이터)
 *
 * 출력:
 *   public/processed-metrics/
 *   ├── timeseries.json        # uPlot용 24h 시계열
 *   ├── hourly/hour-{00..23}.json  # 시간대별 집계+알림+건강도+AI
 *   └── metadata.json          # 서버 목록, 라벨, 시나리오
 *
 * 사용법:
 *   npx tsx scripts/data/precompute-metrics.ts
 *
 * @created 2026-02-04
 */

import fs from 'fs';
import path from 'path';

// ============================================================================
// Types (스크립트 전용 - 런타임 import 불가하므로 여기서 정의)
// ============================================================================

type PrometheusMetrics = {
  up: 0 | 1;
  node_cpu_usage_percent: number;
  node_memory_usage_percent: number;
  node_filesystem_usage_percent: number;
  node_network_transmit_bytes_rate: number;
  node_load1: number;
  node_load5: number;
  node_boot_time_seconds: number;
  node_procs_running: number;
  node_http_request_duration_milliseconds: number;
};

type PrometheusLabels = {
  hostname: string;
  datacenter: string;
  environment: string;
  server_type: string;
  os: string;
  os_version: string;
};

type PrometheusTarget = {
  job: string;
  instance: string;
  labels: PrometheusLabels;
  metrics: PrometheusMetrics;
  nodeInfo: { cpu_cores: number; memory_total_bytes: number; disk_total_bytes: number };
  logs: string[];
};

type HourlyDataPoint = {
  timestampMs: number;
  targets: Record<string, PrometheusTarget>;
};

type HourlyData = {
  hour: number;
  scrapeConfig: { scrapeInterval: string; evaluationInterval: string; source: string };
  _scenario?: string;
  dataPoints: HourlyDataPoint[];
};

// Alert types (AlertManager 로직 재사용)
type AlertSeverity = 'warning' | 'critical';
type Alert = {
  id: string;
  serverId: string;
  instance: string;
  labels: Record<string, string>;
  metric: string;
  value: number;
  threshold: number;
  severity: AlertSeverity;
  state: 'firing' | 'resolved';
  firedAt: string;
  duration: number;
};

type StatusCounts = {
  total: number;
  online: number;
  warning: number;
  critical: number;
  offline: number;
};

type ServerTypeStats = {
  serverType: string;
  count: number;
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  avgNetwork: number;
  maxCpu: number;
  maxMemory: number;
  onlineCount: number;
  warningCount: number;
  criticalCount: number;
};

type TopServer = {
  serverId: string;
  instance: string;
  serverType: string;
  value: number;
};

type AggregatedMetrics = {
  statusCounts: StatusCounts;
  byServerType: ServerTypeStats[];
  topCpu: TopServer[];
  topMemory: TopServer[];
  avgCpu: number;
  avgMemory: number;
  avgDisk: number;
  avgNetwork: number;
};

type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';
type HealthReport = {
  score: number;
  grade: HealthGrade;
  penalties: {
    criticalAlerts: number;
    warningAlerts: number;
    highCpuAvg: number;
    longFiringAlerts: number;
  };
};

// Output types
type PrecomputedTimeSeries = {
  serverIds: string[];
  timestamps: number[];
  metrics: {
    cpu: number[][];
    memory: number[][];
    disk: number[][];
    network: number[][];
    up: (0 | 1)[][];
  };
};

type PrecomputedHourly = {
  hour: number;
  scenario: string;
  aggregated: AggregatedMetrics;
  alerts: Alert[];
  health: HealthReport;
  aiContext: string;
};

type MetricsMetadata = {
  serverIds: string[];
  serverLabels: Record<string, PrometheusLabels>;
  scenarios: Array<{ hour: number; description: string }>;
  availableMetrics: string[];
  scrapeConfig: { interval: string; source: string };
};

// ============================================================================
// Thresholds (AlertManager SSOT)
// ============================================================================

const THRESHOLDS: Record<string, { warning: number; critical: number }> = {
  cpu: { warning: 80, critical: 90 },
  memory: { warning: 80, critical: 90 },
  disk: { warning: 80, critical: 90 },
  network: { warning: 70, critical: 85 },
};

// ============================================================================
// Helper: Instance → ServerId
// ============================================================================

function extractServerId(instance: string): string {
  return instance.replace(/:9100$/, '');
}

// ============================================================================
// Helper: Status determination
// ============================================================================

function determineStatus(
  cpu: number,
  memory: number,
  disk: number,
  network: number
): 'online' | 'warning' | 'critical' | 'offline' {
  if (cpu >= 90 || memory >= 90 || disk >= 90 || network >= 85) return 'critical';
  if (cpu >= 80 || memory >= 80 || disk >= 80 || network >= 70) return 'warning';
  return 'online';
}

// ============================================================================
// Alert Evaluation (AlertManager.evaluate 로직 재현)
// ============================================================================

function evaluateAlerts(
  targets: Record<string, PrometheusTarget>,
  hour: number,
  slotIndex: number
): Alert[] {
  const alerts: Alert[] = [];
  const timestamp = new Date(2026, 0, 1, hour, slotIndex * 10).toISOString();

  for (const [instanceKey, target] of Object.entries(targets)) {
    const serverId = extractServerId(instanceKey);
    const metricPairs: Array<{ key: string; value: number }> = [
      { key: 'cpu', value: target.metrics.node_cpu_usage_percent },
      { key: 'memory', value: target.metrics.node_memory_usage_percent },
      { key: 'disk', value: target.metrics.node_filesystem_usage_percent },
      { key: 'network', value: target.metrics.node_network_transmit_bytes_rate },
    ];

    for (const { key, value } of metricPairs) {
      const threshold = THRESHOLDS[key];
      if (!threshold) continue;

      let severity: AlertSeverity | null = null;
      let thresholdValue = 0;

      if (value >= threshold.critical) {
        severity = 'critical';
        thresholdValue = threshold.critical;
      } else if (value >= threshold.warning) {
        severity = 'warning';
        thresholdValue = threshold.warning;
      }

      if (severity) {
        alerts.push({
          id: `${serverId}-${key}`,
          serverId,
          instance: instanceKey,
          labels: {
            server_type: target.labels.server_type,
            datacenter: target.labels.datacenter,
          },
          metric: key,
          value,
          threshold: thresholdValue,
          severity,
          state: 'firing',
          firedAt: timestamp,
          duration: 0,
        });
      }
    }
  }

  return alerts;
}

// ============================================================================
// Metrics Aggregation (MetricsAggregator.aggregate 로직 재현)
// ============================================================================

type SimpleMetric = {
  serverId: string;
  serverType: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: 'online' | 'warning' | 'critical' | 'offline';
};

function targetsToSimpleMetrics(
  targets: Record<string, PrometheusTarget>
): SimpleMetric[] {
  return Object.entries(targets).map(([instanceKey, target]) => {
    const cpu = target.metrics.node_cpu_usage_percent;
    const memory = target.metrics.node_memory_usage_percent;
    const disk = target.metrics.node_filesystem_usage_percent;
    const network = target.metrics.node_network_transmit_bytes_rate;
    const status = target.metrics.up === 0
      ? 'offline' as const
      : determineStatus(cpu, memory, disk, network);

    return {
      serverId: extractServerId(instanceKey),
      serverType: target.labels.server_type,
      cpu,
      memory,
      disk,
      network,
      status,
    };
  });
}

function aggregate(allMetrics: SimpleMetric[]): AggregatedMetrics {
  const statusCounts: StatusCounts = {
    total: allMetrics.length,
    online: 0,
    warning: 0,
    critical: 0,
    offline: 0,
  };
  for (const m of allMetrics) {
    statusCounts[m.status]++;
  }

  const count = allMetrics.length || 1;
  const totalCpu = allMetrics.reduce((s, m) => s + m.cpu, 0);
  const totalMemory = allMetrics.reduce((s, m) => s + m.memory, 0);
  const totalDisk = allMetrics.reduce((s, m) => s + m.disk, 0);
  const totalNetwork = allMetrics.reduce((s, m) => s + m.network, 0);

  // Group by server_type
  const typeMap = new Map<string, SimpleMetric[]>();
  for (const m of allMetrics) {
    const list = typeMap.get(m.serverType) ?? [];
    list.push(m);
    typeMap.set(m.serverType, list);
  }

  const byServerType: ServerTypeStats[] = [];
  for (const [serverType, servers] of typeMap) {
    const n = servers.length;
    byServerType.push({
      serverType,
      count: n,
      avgCpu: Math.round(servers.reduce((s, m) => s + m.cpu, 0) / n),
      avgMemory: Math.round(servers.reduce((s, m) => s + m.memory, 0) / n),
      avgDisk: Math.round(servers.reduce((s, m) => s + m.disk, 0) / n),
      avgNetwork: Math.round(servers.reduce((s, m) => s + m.network, 0) / n),
      maxCpu: Math.max(...servers.map((m) => m.cpu)),
      maxMemory: Math.max(...servers.map((m) => m.memory)),
      onlineCount: servers.filter((m) => m.status === 'online').length,
      warningCount: servers.filter((m) => m.status === 'warning').length,
      criticalCount: servers.filter((m) => m.status === 'critical').length,
    });
  }

  const topCpu: TopServer[] = [...allMetrics]
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, 5)
    .map((m) => ({
      serverId: m.serverId,
      instance: `${m.serverId}:9100`,
      serverType: m.serverType,
      value: m.cpu,
    }));

  const topMemory: TopServer[] = [...allMetrics]
    .sort((a, b) => b.memory - a.memory)
    .slice(0, 5)
    .map((m) => ({
      serverId: m.serverId,
      instance: `${m.serverId}:9100`,
      serverType: m.serverType,
      value: m.memory,
    }));

  return {
    statusCounts,
    byServerType,
    topCpu,
    topMemory,
    avgCpu: Math.round(totalCpu / count),
    avgMemory: Math.round(totalMemory / count),
    avgDisk: Math.round(totalDisk / count),
    avgNetwork: Math.round(totalNetwork / count),
  };
}

// ============================================================================
// Health Calculation (HealthCalculator.calculate 로직 재현)
// ============================================================================

function getGrade(score: number): HealthGrade {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function calculateHealth(aggregated: AggregatedMetrics, firingAlerts: Alert[]): HealthReport {
  const criticalCount = firingAlerts.filter((a) => a.severity === 'critical').length;
  const warningCount = firingAlerts.filter((a) => a.severity === 'warning').length;

  const criticalPenalty = criticalCount * 15;
  const warningPenalty = warningCount * 5;
  const avgCpuPenalty = aggregated.avgCpu >= 70 ? Math.round((aggregated.avgCpu - 70) * 0.5) : 0;
  const longFiringPenalty = 0; // pre-compute에서는 duration 추적 불가

  const score = Math.max(0, Math.min(100, 100 - criticalPenalty - warningPenalty - avgCpuPenalty - longFiringPenalty));

  return {
    score,
    grade: getGrade(score),
    penalties: {
      criticalAlerts: criticalPenalty,
      warningAlerts: warningPenalty,
      highCpuAvg: avgCpuPenalty,
      longFiringAlerts: longFiringPenalty,
    },
  };
}

// ============================================================================
// AI Context Generation (MonitoringContext.getLLMContext 로직 재현)
// ============================================================================

function buildAIContext(
  hour: number,
  scenario: string,
  health: HealthReport,
  aggregated: AggregatedMetrics,
  firingAlerts: Alert[]
): string {
  const timeStr = `${hour.toString().padStart(2, '0')}:00 KST`;

  let ctx = `[Monitoring Report - ${timeStr}]\n`;
  ctx += `Scenario: ${scenario}\n`;
  ctx += `System Health: ${health.score}/100 (${health.grade})\n`;
  ctx += `Scrape: node-exporter | ${aggregated.statusCounts.total} targets, ${aggregated.statusCounts.online} UP\n\n`;

  if (firingAlerts.length > 0) {
    ctx += `Active Alerts (${firingAlerts.length}):\n`;
    const sorted = [...firingAlerts].sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return b.value - a.value;
    });
    for (const alert of sorted.slice(0, 5)) {
      ctx += `- ${alert.instance} ${alert.metric}=${alert.value}% [${alert.severity.toUpperCase()}]\n`;
    }
    ctx += '\n';
  }

  ctx += 'By Type: ';
  ctx += aggregated.byServerType
    .map((t) => `${t.serverType}(${t.count}) avg CPU ${t.avgCpu}%`)
    .join(' | ');
  ctx += '\n';

  if (aggregated.topCpu.length > 0) {
    ctx += 'Top CPU: ';
    ctx += aggregated.topCpu
      .slice(0, 3)
      .map((t) => `${t.instance}(${t.value}%)`)
      .join(', ');
    ctx += '\n';
  }

  return ctx;
}

// ============================================================================
// Main Pipeline
// ============================================================================

function main(): void {
  const projectRoot = path.resolve(__dirname, '../..');
  const hourlyDataDir = path.join(projectRoot, 'public/hourly-data');
  const outputDir = path.join(projectRoot, 'public/processed-metrics');
  const hourlyOutputDir = path.join(outputDir, 'hourly');

  console.log('=== Pre-compute Metrics Pipeline ===\n');

  // Output directories
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(hourlyOutputDir, { recursive: true });

  // Load all 24 hourly files
  const allHourlyData: HourlyData[] = [];
  for (let h = 0; h < 24; h++) {
    const filename = `hour-${h.toString().padStart(2, '0')}.json`;
    const filepath = path.join(hourlyDataDir, filename);

    if (!fs.existsSync(filepath)) {
      console.error(`  Missing: ${filename}`);
      process.exit(1);
    }

    const raw = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(raw) as HourlyData;
    allHourlyData.push(data);
  }
  console.log(`  Loaded: ${allHourlyData.length} hourly files\n`);

  // ====================================================================
  // 1. Build TimeSeries (uPlot용)
  // ====================================================================
  console.log('[1/3] Building timeseries.json...');

  // serverIds from first file's first dataPoint
  const firstTargets = allHourlyData[0]!.dataPoints[0]!.targets;
  const serverIds = Object.keys(firstTargets).map(extractServerId).sort();
  const serverIndexMap = new Map<string, number>();
  serverIds.forEach((id, idx) => serverIndexMap.set(id, idx));

  const timestamps: number[] = [];
  const cpuSeries: number[][] = serverIds.map(() => []);
  const memorySeries: number[][] = serverIds.map(() => []);
  const diskSeries: number[][] = serverIds.map(() => []);
  const networkSeries: number[][] = serverIds.map(() => []);
  const upSeries: (0 | 1)[][] = serverIds.map(() => []);

  for (const hourlyData of allHourlyData) {
    for (const dp of hourlyData.dataPoints) {
      // Unix seconds (uPlot standard)
      timestamps.push(Math.floor(dp.timestampMs / 1000));

      for (const serverId of serverIds) {
        const idx = serverIndexMap.get(serverId)!;
        const target = dp.targets[`${serverId}:9100`];

        if (target) {
          cpuSeries[idx]!.push(target.metrics.node_cpu_usage_percent);
          memorySeries[idx]!.push(target.metrics.node_memory_usage_percent);
          diskSeries[idx]!.push(target.metrics.node_filesystem_usage_percent);
          networkSeries[idx]!.push(target.metrics.node_network_transmit_bytes_rate);
          upSeries[idx]!.push(target.metrics.up as 0 | 1);
        } else {
          // Missing target - fill with 0
          cpuSeries[idx]!.push(0);
          memorySeries[idx]!.push(0);
          diskSeries[idx]!.push(0);
          networkSeries[idx]!.push(0);
          upSeries[idx]!.push(0);
        }
      }
    }
  }

  const timeseries: PrecomputedTimeSeries = {
    serverIds,
    timestamps,
    metrics: {
      cpu: cpuSeries,
      memory: memorySeries,
      disk: diskSeries,
      network: networkSeries,
      up: upSeries,
    },
  };

  const tsPath = path.join(outputDir, 'timeseries.json');
  fs.writeFileSync(tsPath, JSON.stringify(timeseries));
  const tsSize = (fs.statSync(tsPath).size / 1024).toFixed(1);
  console.log(`  -> timeseries.json (${timestamps.length} points x ${serverIds.length} servers, ${tsSize}KB)\n`);

  // ====================================================================
  // 2. Build Hourly Pre-computed Data
  // ====================================================================
  console.log('[2/3] Building hourly pre-computed data...');

  const scenarios: Array<{ hour: number; description: string }> = [];

  for (const hourlyData of allHourlyData) {
    const hour = hourlyData.hour;
    const scenario = (hourlyData as HourlyData & { _scenario?: string })._scenario || `${hour}시 정상 운영`;

    // Use the middle dataPoint (index 3) as representative
    const repIndex = Math.min(3, hourlyData.dataPoints.length - 1);
    const repDataPoint = hourlyData.dataPoints[repIndex]!;

    // Evaluate alerts
    const alerts = evaluateAlerts(repDataPoint.targets, hour, repIndex);

    // Aggregate metrics
    const simpleMetrics = targetsToSimpleMetrics(repDataPoint.targets);
    const aggregated = aggregate(simpleMetrics);

    // Calculate health
    const health = calculateHealth(aggregated, alerts);

    // Build AI context
    const aiContext = buildAIContext(hour, scenario, health, aggregated, alerts);

    const hourlyOutput: PrecomputedHourly = {
      hour,
      scenario,
      aggregated,
      alerts,
      health,
      aiContext,
    };

    const hourFilename = `hour-${hour.toString().padStart(2, '0')}.json`;
    const hourPath = path.join(hourlyOutputDir, hourFilename);
    fs.writeFileSync(hourPath, JSON.stringify(hourlyOutput, null, 2));

    const hourSize = (fs.statSync(hourPath).size / 1024).toFixed(1);
    const icon = health.grade === 'A' ? '  ' : health.grade <= 'B' ? '  ' : '  ';
    console.log(`${icon} ${hourFilename} - ${scenario} (Health: ${health.score}/${health.grade}, ${hourSize}KB)`);

    scenarios.push({ hour, description: scenario });
  }
  console.log('');

  // ====================================================================
  // 3. Build Metadata
  // ====================================================================
  console.log('[3/3] Building metadata.json...');

  const serverLabels: Record<string, PrometheusLabels> = {};
  for (const [instanceKey, target] of Object.entries(firstTargets)) {
    const serverId = extractServerId(instanceKey);
    serverLabels[serverId] = target.labels;
  }

  const availableMetrics = [
    'node_cpu_usage_percent',
    'node_memory_usage_percent',
    'node_filesystem_usage_percent',
    'node_network_transmit_bytes_rate',
    'node_load1',
    'node_load5',
    'node_boot_time_seconds',
    'node_procs_running',
    'node_http_request_duration_milliseconds',
    'up',
  ];

  const metadata: MetricsMetadata = {
    serverIds,
    serverLabels,
    scenarios,
    availableMetrics,
    scrapeConfig: {
      interval: allHourlyData[0]!.scrapeConfig.scrapeInterval,
      source: allHourlyData[0]!.scrapeConfig.source,
    },
  };

  const metaPath = path.join(outputDir, 'metadata.json');
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  const metaSize = (fs.statSync(metaPath).size / 1024).toFixed(1);
  console.log(`  -> metadata.json (${serverIds.length} servers, ${scenarios.length} scenarios, ${metaSize}KB)\n`);

  // ====================================================================
  // Summary
  // ====================================================================
  const totalSize = [tsPath, metaPath]
    .map((p) => fs.statSync(p).size)
    .reduce((a, b) => a + b, 0);

  // Add hourly files size
  let hourlyTotalSize = 0;
  for (let h = 0; h < 24; h++) {
    const hourPath = path.join(hourlyOutputDir, `hour-${h.toString().padStart(2, '0')}.json`);
    hourlyTotalSize += fs.statSync(hourPath).size;
  }

  console.log('=== Summary ===');
  console.log(`  Output: public/processed-metrics/`);
  console.log(`  Files: 1 timeseries + 24 hourly + 1 metadata = 26 files`);
  console.log(`  Total: ${((totalSize + hourlyTotalSize) / 1024).toFixed(1)}KB`);
  console.log(`  Servers: ${serverIds.length}`);
  console.log(`  Time points: ${timestamps.length} (${timestamps.length / 6}h x 6 slots)`);
  console.log('\nDone.');
}

main();
