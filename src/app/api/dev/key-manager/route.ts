import { NextRequest, NextResponse } from 'next/server';
import { devKeyManager } from '@/utils/dev-key-manager';

export async function GET(request: NextRequest) {
    // 🚫 개발 환경에서만 접근 허용
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
            { error: 'Dev endpoints are only available in development' },
            { status: 404 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        switch (action) {
            case 'status':
                const validation = devKeyManager.validateAllKeys();
                return NextResponse.json({
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || 'development',
                    summary: {
                        total: validation.details.length,
                        valid: validation.valid,
                        invalid: validation.invalid,
                        missing: validation.missing,
                        successRate: Math.round((validation.valid / validation.details.length) * 100)
                    },
                    services: validation.details
                });

            case 'report':
                const report = devKeyManager.getStatusReport();
                return NextResponse.json({
                    timestamp: new Date().toISOString(),
                    report: report
                });

            case 'generate-env':
                const envResult = await devKeyManager.generateEnvFile();
                return NextResponse.json({
                    timestamp: new Date().toISOString(),
                    ...envResult
                });

            case 'quick-setup':
                const setupResult = await devKeyManager.quickSetup();
                return NextResponse.json({
                    timestamp: new Date().toISOString(),
                    ...setupResult
                });

            default:
                // 기본: 상태 정보 반환
                const defaultValidation = devKeyManager.validateAllKeys();
                return NextResponse.json({
                    timestamp: new Date().toISOString(),
                    environment: process.env.NODE_ENV || 'development',
                    keyManager: 'DevKeyManager v1.0',
                    summary: {
                        total: defaultValidation.details.length,
                        valid: defaultValidation.valid,
                        invalid: defaultValidation.invalid,
                        missing: defaultValidation.missing,
                        successRate: Math.round((defaultValidation.valid / defaultValidation.details.length) * 100)
                    },
                    availableActions: [
                        'status',
                        'report',
                        'generate-env',
                        'quick-setup'
                    ]
                });
        }
    } catch (error: any) {
        console.error('❌ DevKeyManager API 오류:', error);

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            error: error.message,
            keyManager: 'DevKeyManager v1.0'
        }, { status: 500 });
    }
} 