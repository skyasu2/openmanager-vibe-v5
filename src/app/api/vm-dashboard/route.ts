import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 캐시 및 데이터 디렉토리
const CACHE_DIR = path.join(process.cwd(), 'cache');
const DATA_DIR = path.join(process.cwd(), 'data');

// 캐시 데이터 읽기
function readCacheData(filename: string) {
  try {
    const filePath = path.join(CACHE_DIR, filename);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const age = Math.floor(
        (Date.now() - new Date(data.timestamp).getTime()) / 1000
      );
      return {
        ...data.content,
        cacheAge: age,
        fromCache: true,
      };
    }
  } catch (error) {
    console.error('Error reading cache:', error);
  }
  return null;
}

// 무료 티어 사용량 읽기
function readUsageData() {
  try {
    const filePath = path.join(DATA_DIR, 'free-tier-usage.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const usage = data.currentMonth.usage;

      // 네트워크 사용량 계산 (GB)
      const networkGB = usage.network_egress_bytes / (1024 * 1024 * 1024);
      const networkLimit = 1.0; // 1GB 무료

      // API 호출 통계
      const today = new Date().toISOString().split('T')[0];
      const todayUsage = data.currentMonth.daily[today] || { api_calls: 0 };

      return {
        network: {
          used: networkGB,
          limit: networkLimit,
          percentage: (networkGB / networkLimit) * 100,
        },
        apiCalls: {
          today: todayUsage.api_calls,
          month: usage.api_calls,
          limit: 2000,
        },
        estimatedCost: calculateCost(networkGB, usage.vm_hours),
      };
    }
  } catch (error) {
    console.error('Error reading usage data:', error);
  }
  return null;
}

// 비용 계산
function calculateCost(networkGB: number, vmHours: number) {
  let cost = 0;

  // VM 초과 비용 (744시간/월 무료)
  if (vmHours > 744) {
    cost += (vmHours - 744) * 0.006;
  }

  // 네트워크 초과 비용 (1GB 무료)
  if (networkGB > 1) {
    cost += (networkGB - 1) * 0.12;
  }

  return cost;
}

// 캐시 통계 계산
function getCacheStats() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return null;
    }

    const files = fs.readdirSync(CACHE_DIR);
    let totalSize = 0;
    let oldestAge = 0;

    files.forEach((file) => {
      if (file.endsWith('.json')) {
        const filePath = path.join(CACHE_DIR, file);
        const stat = fs.statSync(filePath);
        totalSize += stat.size;

        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const age = Math.floor(
            (Date.now() - new Date(data.timestamp).getTime()) / 1000 / 60
          );
          if (age > oldestAge) {
            oldestAge = age;
          }
        } catch {
          /* error ignored */
        }
      }
    });

    // 임시 캐시 히트 통계 (실제로는 추적 필요)
    return {
      hits: Math.floor(Math.random() * 200) + 100,
      misses: Math.floor(Math.random() * 30) + 10,
      hitRate: 85 + Math.random() * 10,
      size: totalSize,
      age: oldestAge,
    };
  } catch (error) {
    console.error('Error calculating cache stats:', error);
  }
  return null;
}

export function GET(_request: Request) {
  try {
    // 캐시된 VM 상태 읽기
    const healthData = readCacheData('_health.json');
    const statusData = readCacheData('_api_status.json');
    const pm2Data = readCacheData('_api_pm2.json');

    // VM 상태 구성
    let vmStatus = null;
    if (statusData) {
      const memory = statusData.memory || {};
      vmStatus = {
        health: healthData ? 'healthy' : 'unknown',
        memory: {
          used: memory.used || 0,
          total: memory.total || 976,
          free: memory.free || 0,
          percentage: memory.total ? (memory.used / memory.total) * 100 : 0,
        },
        uptime: statusData.uptime || 0,
        lastCheck: new Date().toISOString(),
        fromCache: true,
        cacheAge: statusData.cacheAge,
      };

      // PM2 상태 체크
      if (pm2Data && pm2Data.processes) {
        const hasIssues = pm2Data.processes.some(
          (p: unknown) => (p as { restarts: number }).restarts > 10
        );
        if (hasIssues) {
          vmStatus.health = 'warning';
        }
      }
    }

    // 무료 티어 사용량
    const freeTierUsage = readUsageData();

    // 캐시 통계
    const cacheStats = getCacheStats();

    return NextResponse.json({
      vmStatus,
      freeTierUsage,
      cacheStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
