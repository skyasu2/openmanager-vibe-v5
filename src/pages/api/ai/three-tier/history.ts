/**
 * 🚀 3-Tier Router 히스토리 API 엔드포인트
 * GET /api/ai/three-tier/history
 */

import { systemLogger } from '@/lib/logger';
import { NextApiRequest, NextApiResponse } from 'next';

// 임시 히스토리 데이터 생성 (실제로는 데이터베이스나 로그에서 가져옴)
function generateHistoricalData() {
  const data = [];
  const now = new Date();

  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);

    // 시뮬레이션된 데이터
    const baseRequests = Math.floor(Math.random() * 100) + 50;
    const gcpRatio = 0.7 + Math.random() * 0.2; // 70-90% GCP 사용

    data.push({
      timestamp: timestamp.toISOString(),
      totalRequests: baseRequests,
      gcpRequests: Math.floor(baseRequests * gcpRatio),
      localRequests: Math.floor(baseRequests * (1 - gcpRatio) * 0.8),
      googleRequests: Math.floor(baseRequests * (1 - gcpRatio) * 0.2),
      vercelLoadReduction: Math.min(75, gcpRatio * 100),
      aiPerformanceImprovement: Math.min(
        50,
        gcpRatio * 60 + Math.random() * 10
      ),
      averageResponseTime: 2000 + Math.random() * 3000,
      successRate: 95 + Math.random() * 5,
    });
  }

  return data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET method is supported',
    });
  }

  try {
    const { period = '24h', resolution = '1h' } = req.query;

    // 쿼리 파라미터 검증
    const validPeriods = ['1h', '6h', '24h', '7d', '30d'];
    const validResolutions = ['5m', '15m', '1h', '6h', '1d'];

    if (!validPeriods.includes(period as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period',
        message: `Period must be one of: ${validPeriods.join(', ')}`,
      });
    }

    if (!validResolutions.includes(resolution as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid resolution',
        message: `Resolution must be one of: ${validResolutions.join(', ')}`,
      });
    }

    // 히스토리 데이터 생성
    const historicalData = generateHistoricalData();

    systemLogger.info(
      `3-Tier Router 히스토리 조회 완료 (${period}, ${resolution})`
    );

    res.status(200).json({
      success: true,
      data: historicalData,
      meta: {
        period,
        resolution,
        dataPoints: historicalData.length,
        startTime: historicalData[0]?.timestamp,
        endTime: historicalData[historicalData.length - 1]?.timestamp,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    systemLogger.error('3-Tier Router 히스토리 조회 실패:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
