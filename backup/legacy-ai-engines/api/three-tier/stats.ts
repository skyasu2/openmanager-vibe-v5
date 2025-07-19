/**
 * 🚀 3-Tier Router 통계 API 엔드포인트
 * GET /api/ai/three-tier/stats
 */

import { systemLogger } from '@/lib/logger';
import { ThreeTierAIRouter } from '@/services/ai/ThreeTierAIRouter';
import { NextApiRequest, NextApiResponse } from 'next';

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
    const threeTierRouter = ThreeTierAIRouter.getInstance();

    // 3-Tier Router가 초기화되지 않은 경우 초기화
    await threeTierRouter.initialize();

    const stats = threeTierRouter.getStats();

    systemLogger.info('3-Tier Router 통계 조회 완료');

    res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    systemLogger.error('3-Tier Router 통계 조회 실패:', error);

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
