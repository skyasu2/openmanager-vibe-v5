import { NextResponse } from 'next/server';

// 임시 데이터 (실제로는 AdminLogger에서 가져옴)
const mockStats = {
  totalInteractions: 1247,
  totalErrors: 23,
  uptime: 2 * 24 * 60 * 60 * 1000, // 2일
  
  recent24h: {
    interactions: 156,
    errors: 3,
    averageResponseTime: 1250,
    successRate: 98.1
  },
  
  modeStats: {
    basic: { 
      count: 892, 
      avgResponseTime: 980, 
      successRate: 99.2 
    },
    enterprise: { 
      count: 355, 
      avgResponseTime: 1850, 
      successRate: 96.3 
    }
  },
  
  errorStats: {
    byType: {
      'processing': 12,
      'timeout': 6,
      'validation': 3,
      'system': 2
    },
    byHour: [0, 0, 1, 0, 0, 0, 0, 2, 1, 3, 2, 1, 0, 1, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    topErrors: [
      { message: 'NPU processing timeout', count: 8 },
      { message: 'Context validation failed', count: 5 },
      { message: 'MCP connection error', count: 4 },
      { message: 'Memory allocation failed', count: 3 },
      { message: 'Invalid query format', count: 3 }
    ]
  },
  
  performanceStats: {
    averageResponseTime: 1250,
    p95ResponseTime: 2800,
    cacheHitRate: 67.3,
    memoryUsage: 145.7
  }
};

export async function GET() {
  try {
    // 실제 구현에서는 AdminLogger.getInstance().getAdminStats() 호출
    // const adminLogger = AdminLogger.getInstance();
    // const stats = adminLogger.getAdminStats();
    
    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('Failed to get admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to get admin stats' },
      { status: 500 }
    );
  }
} 