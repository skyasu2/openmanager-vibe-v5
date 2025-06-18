/**
 * 🔧 환경변수 자동 복구 API
 * 
 * 엔드포인트: /api/env/auto-recovery
 * 기능: 환경변수 상태 확인 및 자동 복구
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnvAutoRecoveryService } from '@/services/system/env-auto-recovery';

export const runtime = 'nodejs';

/**
 * GET: 환경변수 상태 조회
 */
export async function GET(request: NextRequest) {
    try {
        const envService = getEnvAutoRecoveryService();
        const status = envService.getStatus();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: status,
            message: status.validation.isValid
                ? '모든 환경변수가 정상입니다'
                : `${status.validation.missing.length}개 환경변수 누락됨`
        });

    } catch (error) {
        console.error('환경변수 상태 조회 실패:', error);

        return NextResponse.json({
            success: false,
            timestamp: new Date().toISOString(),
            error: '환경변수 상태 조회 실패',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * POST: 환경변수 수동 복구 실행
 */
export async function POST(request: NextRequest) {
    try {
        const envService = getEnvAutoRecoveryService();

        // 요청 본문에서 복구할 변수들 읽기
        let targetVars: string[] = [];
        try {
            const body = await request.json();
            targetVars = body.variables || [];
        } catch {
            // 요청 본문이 없으면 모든 누락된 변수 복구
        }

        // 현재 상태 확인
        const validation = envService.validateEnvironment();

        if (validation.isValid && targetVars.length === 0) {
            return NextResponse.json({
                success: true,
                timestamp: new Date().toISOString(),
                message: '모든 환경변수가 이미 정상입니다',
                data: {
                    recovered: [],
                    failed: [],
                    method: 'none',
                    validation
                }
            });
        }

        // 복구할 변수 결정
        const varsToRecover = targetVars.length > 0 ? targetVars : validation.missing;

        if (varsToRecover.length === 0) {
            return NextResponse.json({
                success: true,
                timestamp: new Date().toISOString(),
                message: '복구할 환경변수가 없습니다',
                data: {
                    recovered: [],
                    failed: [],
                    method: 'none',
                    validation
                }
            });
        }

        // 자동 복구 실행
        const recoveryResult = await envService.attemptAutoRecovery(varsToRecover);

        // 복구 후 재검증
        const finalValidation = envService.validateEnvironment();

        return NextResponse.json({
            success: recoveryResult.success,
            timestamp: new Date().toISOString(),
            message: recoveryResult.message,
            data: {
                ...recoveryResult,
                validation: finalValidation,
                requestedVars: varsToRecover
            }
        });

    } catch (error) {
        console.error('환경변수 수동 복구 실패:', error);

        return NextResponse.json({
            success: false,
            timestamp: new Date().toISOString(),
            error: '환경변수 복구 실행 실패',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

/**
 * PUT: 환경변수 서비스 재초기화
 */
export async function PUT(request: NextRequest) {
    try {
        const envService = getEnvAutoRecoveryService();

        // 서비스 재초기화
        envService.destroy();
        await envService.initialize();

        const status = envService.getStatus();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            message: '환경변수 자동 복구 서비스가 재초기화되었습니다',
            data: status
        });

    } catch (error) {
        console.error('환경변수 서비스 재초기화 실패:', error);

        return NextResponse.json({
            success: false,
            timestamp: new Date().toISOString(),
            error: '서비스 재초기화 실패',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 