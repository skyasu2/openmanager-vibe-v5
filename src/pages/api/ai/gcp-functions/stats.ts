/**
 * 🚀 GCP Functions 통계 API 엔드포인트
 * GET /api/ai/gcp-functions/stats
 */

import { systemLogger } from '@/lib/logger';
import { GCPFunctionsService } from '@/services/ai/GCPFunctionsService';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method not allowed',
            message: 'Only GET method is supported'
        });
    }

    try {
        const gcpFunctionsService = GCPFunctionsService.getInstance();

        // GCP Functions Service가 초기화되지 않은 경우 초기화
        await gcpFunctionsService.initialize();

        const stats = gcpFunctionsService.getUsageStats();

        systemLogger.info('GCP Functions 통계 조회 완료');

        res.status(200).json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        systemLogger.error('GCP Functions 통계 조회 실패:', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        });
    }
} 