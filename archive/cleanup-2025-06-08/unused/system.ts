'use server';

import { revalidatePath } from 'next/cache';

/**
 * 🚀 System Server Actions
 * 시스템 상태 관리를 위한 Server Actions
 */

// 시스템 상태 가져오기
export async function getSystemStatus() {
  try {
    // 기존 API 로직을 Server Action으로 이동
    const systemStatus = {
      status: 'running',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      health: 'healthy'
    };

    return {
      success: true,
      data: systemStatus
    };
  } catch (error) {
    console.error('System status error:', error);
    return {
      success: false,
      error: 'Failed to get system status'
    };
  }
}

// 시스템 헬스체크
export async function checkSystemHealth() {
  try {
    const memoryUsage = process.memoryUsage();
    const isHealthy = memoryUsage.heapUsed / memoryUsage.heapTotal < 0.9;

    return {
      success: true,
      healthy: isHealthy,
      status: isHealthy ? 'healthy' : 'warning',
      memory: memoryUsage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      success: false,
      healthy: false,
      error: 'Health check failed'
    };
  }
}

// 시스템 메트릭 가져오기
export async function getSystemMetrics() {
  try {
    const metrics = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      pid: process.pid,
      platform: process.platform,
      version: process.version,
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };

    return {
      success: true,
      data: metrics
    };
  } catch (error) {
    console.error('Metrics error:', error);
    return {
      success: false,
      error: 'Failed to get system metrics'
    };
  }
}

// 시스템 상태 갱신 (캐시 무효화 포함)
export async function refreshSystemStatus() {
  try {
    const status = await getSystemStatus();
    
    // 관련 페이지 캐시 무효화
    revalidatePath('/dashboard');
    revalidatePath('/admin');
    
    return status;
  } catch (error) {
    console.error('Refresh system status error:', error);
    return {
      success: false,
      error: 'Failed to refresh system status'
    };
  }
} 