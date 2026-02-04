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
 * @updated 2026-02-04 - 타입 중앙화 + 파이프라인 헬퍼 분리
 */

import fs from 'fs';
import path from 'path';
import {
  aggregateMetrics,
  buildAIContext,
  calculateHealth,
  evaluateAlerts,
  extractServerId,
  targetsToSimpleMetrics,
} from './pipeline-helpers';
import type {
  HourlyData,
  MetricsMetadata,
  PrecomputedHourly,
  PrecomputedTimeSeries,
  PrometheusLabels,
} from './types';

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
    const aggregated = aggregateMetrics(simpleMetrics);

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
