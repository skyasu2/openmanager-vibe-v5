/**
 * 🔧 Environment Backup & Recovery API v1.0
 *
 * OpenManager v5.44.1 - 환경변수 백업 및 긴급 복구 시스템
 * GET: 백업 상태 확인
 * POST: 백업 생성 또는 복구 실행
 */

import { NextRequest, NextResponse } from 'next/server';
import EnvBackupManager from '@/lib/env-backup-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 🔍 환경변수 백업 상태 확인
 */
export async function GET(request: NextRequest) {
  try {
    const envBackupManager = EnvBackupManager.getInstance();

    const validation = envBackupManager.validateEnvironment();
    const backupStatus = envBackupManager.getBackupStatus();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      validation,
      backup: backupStatus,
      recommendations: generateRecommendations(validation, backupStatus),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 환경변수 백업 생성 또는 복구 실행
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, priority = 'critical' } = body;

    const envBackupManager = EnvBackupManager.getInstance();

    switch (action) {
      case 'backup':
        const backupResult = await envBackupManager.createBackup();
        return NextResponse.json({
          success: backupResult,
          action: 'backup',
          message: backupResult ? '백업 생성 완료' : '백업 생성 실패',
          timestamp: new Date().toISOString(),
          backupStatus: envBackupManager.getBackupStatus(),
        });

      case 'restore':
        const restoreResult = await envBackupManager.emergencyRestore(priority);
        return NextResponse.json({
          success: restoreResult.success,
          action: 'restore',
          priority,
          result: restoreResult,
          timestamp: new Date().toISOString(),
          validation: envBackupManager.validateEnvironment(),
        });

      case 'validate':
        const validation = envBackupManager.validateEnvironment();
        return NextResponse.json({
          success: true,
          action: 'validate',
          validation,
          timestamp: new Date().toISOString(),
          recommendations: generateRecommendations(
            validation,
            envBackupManager.getBackupStatus()
          ),
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `지원하지 않는 액션: ${action}`,
            supportedActions: ['backup', 'restore', 'validate'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🎯 권장사항 생성
 */
function generateRecommendations(validation: any, backupStatus: any): string[] {
  const recommendations: string[] = [];

  // 환경변수 문제 권장사항
  if (!validation.isValid) {
    if (validation.priority === 'critical') {
      recommendations.push('🚨 Critical 환경변수 누락 - 즉시 복구 필요');
      recommendations.push(
        '💡 자동 복구: POST /api/admin/env-backup {"action": "restore", "priority": "critical"}'
      );
    } else if (validation.priority === 'important') {
      recommendations.push('⚠️ Important 환경변수 누락 - 복구 권장');
      recommendations.push(
        '💡 자동 복구: POST /api/admin/env-backup {"action": "restore", "priority": "important"}'
      );
    }

    if (validation.missing.length > 0) {
      recommendations.push(
        `📋 누락된 환경변수: ${validation.missing.join(', ')}`
      );
    }

    if (validation.invalid.length > 0) {
      recommendations.push(
        `❌ 잘못된 환경변수: ${validation.invalid.join(', ')}`
      );
    }
  }

  // 백업 상태 권장사항
  if (!backupStatus.exists) {
    recommendations.push('💾 환경변수 백업이 없습니다 - 백업 생성 권장');
    recommendations.push(
      '💡 백업 생성: POST /api/admin/env-backup {"action": "backup"}'
    );
  } else if (!backupStatus.isValid) {
    recommendations.push('🔧 백업 파일이 손상되었습니다 - 새 백업 생성 필요');
  } else {
    const lastBackup = new Date(backupStatus.lastBackup);
    const daysSinceBackup = Math.floor(
      (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceBackup > 7) {
      recommendations.push(
        `📅 백업이 ${daysSinceBackup}일 전입니다 - 새 백업 권장`
      );
    }
  }

  // 성공 메시지
  if (validation.isValid && backupStatus.exists && backupStatus.isValid) {
    recommendations.push('✅ 환경변수 및 백업 시스템 모두 정상');
  }

  return recommendations;
}

/**
 * 🔧 CORS 처리
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
