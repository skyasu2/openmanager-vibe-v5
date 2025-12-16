import {
  FIXED_24H_DATASETS,
  getDataAtMinute,
} from '../../data/fixed-24h-metrics';
import type { EnhancedServerMetrics } from '../../types/server-metrics';

/**
 * Load Server Data directly from Fixed 24h Dataset (SSOT)
 */
export async function loadHourlyScenarioData(): Promise<
  EnhancedServerMetrics[]
> {
  try {
    // KST (Asia/Seoul)
    const koreaTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Seoul',
    });
    const koreaDate = new Date(koreaTime);
    const currentHour = koreaDate.getHours(); // 0-23
    const currentMinute = koreaDate.getMinutes(); // 0-59
    const minuteOfDay = currentHour * 60 + currentMinute;

    return FIXED_24H_DATASETS.map((dataset) => {
      const metric = getDataAtMinute(dataset, minuteOfDay);

      // Default to 0 if not found
      const cpu = metric?.cpu ?? 0;
      const memory = metric?.memory ?? 0;
      const disk = metric?.disk ?? 0;
      const network = metric?.network ?? 0;
      const logs = metric?.logs ?? [];

      // Determine Status
      let status: 'online' | 'warning' | 'critical' = 'online';
      if (cpu >= 80) status = 'critical';
      else if (cpu >= 60) status = 'warning';

      return {
        id: dataset.serverId,
        name: dataset.serverId,
        hostname: `${dataset.serverId.toLowerCase()}.internal`,
        status,
        cpu,
        cpu_usage: cpu,
        memory,
        memory_usage: memory,
        disk,
        disk_usage: disk,
        network,
        network_in: network * 0.6,
        network_out: network * 0.4,
        uptime: 86400 * 30, // 30 days fixed
        responseTime: 50 + cpu * 2,
        last_updated: new Date().toISOString(),
        location: dataset.location,
        alerts: [],
        ip: `10.0.1.${Math.floor(Math.random() * 255)}`,
        os: 'Ubuntu 22.04 LTS',
        type: dataset.serverType,
        role: dataset.serverType,
        environment: 'production',
        provider: 'On-Premise',
        specs: {
          cpu_cores: 8,
          memory_gb: 32,
          disk_gb: 512,
          network_speed: '1Gbps',
        },
        services: [],
        systemInfo: {
          os: 'Ubuntu 22.04 LTS',
          uptime: '720h',
          processes: 120 + Math.floor(cpu),
          loadAverage: `${(cpu / 20).toFixed(2)}`,
          lastUpdate: new Date().toISOString(),
        },
        networkInfo: {
          interface: 'eth0',
          receivedBytes: `${(network * 0.6).toFixed(1)} MB`,
          sentBytes: `${(network * 0.4).toFixed(1)} MB`,
          status: 'online',
        },
      } as EnhancedServerMetrics;
    });
  } catch (error) {
    console.error('Scenario loader error:', error);
    return [];
  }
}

/**
 * Load Historical Context for a Server (Past N hours)
 * Used by Analyst Agent for consistent trend analysis
 */
export async function loadHistoricalContext(
  serverId: string,
  hours: number = 24
): Promise<
  Array<{ timestamp: number; cpu: number; memory: number; disk: number }>
> {
  try {
    const dataset = FIXED_24H_DATASETS.find((d) => d.serverId === serverId);
    if (!dataset) return [];

    const history: Array<{
      timestamp: number;
      cpu: number;
      memory: number;
      disk: number;
    }> = [];

    // KST (Asia/Seoul)
    const koreaTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Seoul',
    });
    const now = new Date(koreaTime);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinuteOfDay = currentHour * 60 + currentMinute;

    // Retrieve data for past hours
    for (let i = 0; i < hours; i++) {
      const targetTime = new Date(now.getTime() - i * 60 * 60 * 1000); // i hours ago
      // Adjust minutes to look up in the fixed dataset ring buffer
      let targetMinuteOfDay = currentMinuteOfDay - i * 60;

      // Handle wrapping (yesterday)
      while (targetMinuteOfDay < 0) {
        targetMinuteOfDay += 1440;
      }

      const metric = getDataAtMinute(dataset, targetMinuteOfDay);
      if (metric) {
        history.push({
          timestamp: targetTime.getTime(),
          cpu: metric.cpu,
          memory: metric.memory,
          disk: metric.disk,
        });
      }
    }

    return history.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('History loader error:', error);
    return [];
  }
}
