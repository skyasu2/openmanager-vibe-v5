import fs from 'fs/promises';
import path from 'path';
import {
  safeServerEnvironment,
  safeServerRole,
} from '../../lib/utils/type-converters';
import { RealisticVariationGenerator } from '../../lib/metrics/variation-generator';
import type { EnhancedServerMetrics, HourlyServerData, RawServerData } from '../../types/server-metrics';

/**
 * Load Hourly Scenario Data directly from JSON files
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

    const segmentInHour = Math.floor(currentMinute / 5);
    const rotationMinute = segmentInHour * 5;

    // Read JSON file
    const hourStr = currentHour.toString().padStart(2, '0');
    // In Cloud Run, the working directory is /app
    // We copied data/hourly-data to ./data/hourly-data in the new service root
    const filePath = path.join(process.cwd(), 'data', 'hourly-data', `hour-${hourStr}.json`);
    
    let hourlyData: HourlyServerData;
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        hourlyData = JSON.parse(fileContent);
    } catch (e) {
        console.error(`Failed to read scenario file: ${filePath}`, e);
        // Fallback to empty
        hourlyData = { servers: {} };
    }

    return convertFixedRotationData(
      hourlyData,
      currentHour,
      rotationMinute,
      segmentInHour
    );
  } catch (error) {
    console.error('Scenario loader error:', error);
    return [];
  }
}

function convertFixedRotationData(
  hourlyData: HourlyServerData,
  currentHour: number,
  rotationMinute: number,
  _segmentInHour: number
): EnhancedServerMetrics[] {
  const servers = hourlyData.servers || {};
  const _scenario = hourlyData.scenario || `${currentHour}시 고정 패턴`;

  // Auto-fill to 15 servers logic
  if (Object.keys(servers).length < 15) {
    const missingCount = 15 - Object.keys(servers).length;
    for (let i = 0; i < missingCount; i++) {
        const serverIndex = Object.keys(servers).length + i + 1;
        const serverTypes = ['security', 'backup', 'proxy', 'gateway'];
        const serverType = serverTypes[i % serverTypes.length] ?? 'gateway';
        const serverId = `${serverType}-server-${serverIndex}`;

        servers[serverId] = {
            id: serverId,
            name: `${serverType.charAt(0).toUpperCase() + serverType.slice(1)} Server #${serverIndex}`,
            hostname: `${serverType}-${serverIndex.toString().padStart(2, '0')}.prod.example.com`,
            status: 'online' as const,
            type: serverType,
            cpu: 20, memory: 30, disk: 40, network: 10, uptime: 10000,
            role: serverType, environment: 'production'
        };
    }
  }

  return Object.values(servers).map((serverData: RawServerData, index) => {
    const minuteFactor = rotationMinute / 55;
    const fixedOffset = Math.sin(minuteFactor * 2 * Math.PI) * 2;
    const serverOffset = (index * 3.7) % 10;
    
    const deterministicNoise =
      RealisticVariationGenerator.generateNaturalVariance(
        0,
        `server-${index}-noise`
      ) * 0.05;
      
    const fixedVariation =
      1 + (fixedOffset + serverOffset + deterministicNoise) / 100;

    const enhanced: EnhancedServerMetrics = {
      id: serverData.id || `server-${index}`,
      name: serverData.name || `Unknown Server ${index + 1}`,
      hostname: serverData.hostname || serverData.name || `server-${index}`,
      status: serverData.status as
        | 'online'
        | 'warning'
        | 'critical'
        | 'maintenance'
        | 'offline'
        | 'unknown',
      cpu: Math.round((serverData.cpu || 0) * fixedVariation),
      cpu_usage: Math.round((serverData.cpu || 0) * fixedVariation),
      memory: Math.round((serverData.memory || 0) * fixedVariation),
      memory_usage: Math.round((serverData.memory || 0) * fixedVariation),
      disk: Math.round((serverData.disk || 0) * fixedVariation),
      disk_usage: Math.round((serverData.disk || 0) * fixedVariation),
      network: Math.round((serverData.network || 20) * fixedVariation),
      network_in: Math.round((serverData.network || 20) * 0.6 * fixedVariation),
      network_out: Math.round(
        (serverData.network || 20) * 0.4 * fixedVariation
      ),
      uptime: serverData.uptime || 86400,
      responseTime: Math.round(
        (serverData.responseTime || 200) * fixedVariation
      ),
      last_updated: new Date().toISOString(),
      location: serverData.location || '서울',
      alerts: [],
      ip: serverData.ip || `192.168.1.${100 + index}`,
      os: serverData.os || 'Ubuntu 22.04 LTS',
      type: serverData.type || 'web',
      role: safeServerRole(serverData.role || serverData.type),
      environment: safeServerEnvironment(serverData.environment),
      provider: `DataCenter-${currentHour.toString().padStart(2, '0')}${rotationMinute.toString().padStart(2, '0')}`,
      specs: {
        cpu_cores: serverData.specs?.cpu_cores || 4,
        memory_gb: serverData.specs?.memory_gb || 8,
        disk_gb: serverData.specs?.disk_gb || 200,
        network_speed: '1Gbps',
      },
      lastUpdate: new Date().toISOString(),
      services: serverData.services || [],
      systemInfo: {
        os: serverData.os || 'Ubuntu 22.04 LTS',
        uptime: `${Math.floor((serverData.uptime || 86400) / 3600)}h`,
        processes: (serverData.processes || 120) + Math.floor(serverOffset),
        zombieProcesses:
          serverData.status === 'critical'
            ? 3
            : serverData.status === 'warning'
              ? 1
              : 0,
        loadAverage: `${(((serverData.cpu || 0) * fixedVariation) / 20).toFixed(2)}, ${(((serverData.cpu || 0) * fixedVariation - 5) / 20).toFixed(2)}, ${(((serverData.cpu || 0) * fixedVariation - 10) / 20).toFixed(2)}`,
        lastUpdate: new Date().toISOString(),
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: `${((serverData.network || 20) * 0.6 * fixedVariation).toFixed(1)} MB`,
        sentBytes: `${((serverData.network || 20) * 0.4 * fixedVariation).toFixed(1)} MB`,
        receivedErrors:
          serverData.status === 'critical'
            ? Math.floor(serverOffset % 5) + 1
            : 0,
        sentErrors:
          serverData.status === 'critical'
            ? Math.floor(serverOffset % 3) + 1
            : 0,
        status: serverData.status as
          | 'online'
          | 'warning'
          | 'critical'
          | 'maintenance'
          | 'offline'
          | 'unknown',
      },
    };

    return enhanced;
  });
}

/**
 * Load Historical Context for a Server (Past N hours)
 * Used by Analyst Agent for consistent trend analysis
 */
export async function loadHistoricalContext(
  serverId: string,
  hours: number = 24
): Promise<Array<{ timestamp: number; cpu: number; memory: number; disk: number }>> {
  try {
    const koreaTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Seoul',
    });
    const now = new Date(koreaTime);
    const history: Array<{ timestamp: number; cpu: number; memory: number; disk: number }> = [];

    // Load past N hours
    for (let i = 0; i < hours; i++) {
        // Calculate target time (Now - i hours)
        const targetTime = new Date(now.getTime() - i * 60 * 60 * 1000);
        const targetHour = targetTime.getHours();
        const targetMinute = targetTime.getMinutes();
        const segmentInHour = Math.floor(targetMinute / 5);
        const rotationMinute = segmentInHour * 5;

        // Determine file path
        const hourStr = targetHour.toString().padStart(2, '0');
        const filePath = path.join(process.cwd(), 'data', 'hourly-data', `hour-${hourStr}.json`);

        try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const hourlyData: HourlyServerData = JSON.parse(fileContent);
            
            // Convert to enhanced metrics using that hour's specific rotation logic
            const servers = convertFixedRotationData(
                hourlyData, 
                targetHour, 
                rotationMinute, 
                segmentInHour
            );

            const server = servers.find(s => s.id === serverId);
            if (server) {
                history.push({
                    timestamp: targetTime.getTime(),
                    cpu: server.cpu,
                    memory: server.memory,
                    disk: server.disk
                });
            }
        } catch {
            // If file missing or error, skip this point
            continue;
        }
    }

    return history.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('History loader error:', error);
    return [];
  }
}
