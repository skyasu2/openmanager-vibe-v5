/**
 * 🔄 OpenManager Vibe v5 - AI 에이전트 마이그레이션 API
 *
 * 기존 AI 에이전트 시스템을 마스터 AI 엔진으로 통합하는 API
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  aiAgentMigrator,
  MigrationResult,
} from '../../../../services/ai/AIAgentMigrator';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { action, options } = body;

    console.log(`🔄 AI 에이전트 마이그레이션 API 요청: ${action}`);

    switch (action) {
      case 'migrate_all':
        return await handleMigrateAll(options);

      case 'migrate_logs':
        return await handleMigrateLogs(options);

      case 'migrate_patterns':
        return await handleMigratePatterns(options);

      case 'migrate_ab_tests':
        return await handleMigrateABTests(options);

      case 'migrate_metrics':
        return await handleMigrateMetrics(options);

      case 'status':
        return await handleMigrationStatus();

      case 'cleanup':
        return await handleCleanup();

      default:
        return NextResponse.json(
          {
            success: false,
            error: `알 수 없는 액션: ${action}`,
            available_actions: [
              'migrate_all',
              'migrate_logs',
              'migrate_patterns',
              'migrate_ab_tests',
              'migrate_metrics',
              'status',
              'cleanup',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('❌ AI 에이전트 마이그레이션 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * 🎯 전체 마이그레이션 실행
 */
async function handleMigrateAll(options: any = {}): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    console.log('🚀 전체 AI 에이전트 마이그레이션 시작');

    const result: MigrationResult = await aiAgentMigrator.migrateAll();

    const response = {
      success: result.success,
      message: '전체 마이그레이션 완료',
      result: {
        migrated_items: result.migratedItems,
        summary: result.summary,
        errors: result.errors,
        migration_log: aiAgentMigrator.getMigrationLog().slice(-10), // 최근 10개 로그만
      },
      performance: {
        duration: Date.now() - startTime,
        items_per_second:
          result.migratedItems / ((Date.now() - startTime) / 1000),
      },
      timestamp: new Date().toISOString(),
    };

    if (result.success) {
      console.log(`✅ 전체 마이그레이션 성공: ${result.migratedItems}개 항목`);
      return NextResponse.json(response);
    } else {
      console.warn(`⚠️ 마이그레이션 부분 실패: ${result.errors.length}개 오류`);
      return NextResponse.json(response, { status: 207 }); // Multi-Status
    }
  } catch (error: any) {
    console.error('❌ 전체 마이그레이션 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * 📝 유닥 로그 마이그레이션
 */
async function handleMigrateLogs(options: any = {}): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    console.log('📝 유닥 로그 마이그레이션 시작');

    const result = await aiAgentMigrator.migrateUserLogs();

    return NextResponse.json({
      success: result.errors.length === 0,
      message: '유닥 로그 마이그레이션 완료',
      migrated_count: result.migratedCount,
      errors: result.errors,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * 🔍 패턴 마이그레이션
 */
async function handleMigratePatterns(options: any = {}): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    console.log('🔍 패턴 마이그레이션 시작');

    const result = await aiAgentMigrator.migratePatterns();

    return NextResponse.json({
      success: result.errors.length === 0,
      message: '패턴 마이그레이션 완료',
      migrated_count: result.migratedCount,
      errors: result.errors,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * 🧪 A/B 테스트 마이그레이션
 */
async function handleMigrateABTests(options: any = {}): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    console.log('🧪 A/B 테스트 마이그레이션 시작');

    const result = await aiAgentMigrator.migrateABTests();

    return NextResponse.json({
      success: result.errors.length === 0,
      message: 'A/B 테스트 마이그레이션 완료',
      migrated_count: result.migratedCount,
      errors: result.errors,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 성능 지표 마이그레이션
 */
async function handleMigrateMetrics(options: any = {}): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    console.log('📊 성능 지표 마이그레이션 시작');

    const result = await aiAgentMigrator.migratePerformanceMetrics();

    return NextResponse.json({
      success: result.errors.length === 0,
      message: '성능 지표 마이그레이션 완료',
      migrated_count: result.migratedCount,
      errors: result.errors,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * 📋 마이그레이션 상태 확인
 */
async function handleMigrationStatus(): Promise<NextResponse> {
  try {
    const migrationLog = aiAgentMigrator.getMigrationLog();

    return NextResponse.json({
      success: true,
      status: 'ready',
      migration_log: migrationLog.slice(-20), // 최근 20개 로그
      log_count: migrationLog.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * 🧹 마이그레이션 정리
 */
async function handleCleanup(): Promise<NextResponse> {
  try {
    aiAgentMigrator.cleanup();

    return NextResponse.json({
      success: true,
      message: '마이그레이션 정리 완료',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'status';

    if (action === 'status') {
      return await handleMigrationStatus();
    }

    return NextResponse.json({
      success: true,
      message: 'AI 에이전트 마이그레이션 API',
      available_actions: {
        POST: [
          'migrate_all',
          'migrate_logs',
          'migrate_patterns',
          'migrate_ab_tests',
          'migrate_metrics',
          'cleanup',
        ],
        GET: ['status'],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
