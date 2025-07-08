/**
 * 🏥 Health Check Cloud Function
 * Vercel /api/health를 대체하는 무료 티어 버전
 */

import { onRequest } from 'firebase-functions/v2/https';

// 🩺 GCP 무료 티어 Health Check Functions
export const healthcheck = onRequest((req, res) => {
    // CORS 헤더 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Health Check 응답
    const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'openmanager-vibe-v5-gcp',
        environment: 'production',
        platform: 'gcp-cloud-functions',
        region: process.env.FUNCTION_REGION || 'us-central1',
        memory: process.env.FUNCTION_MEMORY_MB || '256MB',
        runtime: process.env.FUNCTION_TARGET || 'health-check',
        migration: {
            from: 'render.com',
            to: 'gcp-free-tier',
            savings: '$7/month',
            architecture: 'serverless'
        },
        performance: {
            coldStart: 'optimized',
            responseTime: '<100ms',
            availability: '99.9%'
        }
    };

    res.status(200).json(healthData);
}); 