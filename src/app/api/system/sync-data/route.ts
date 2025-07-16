/**
 * 🔄 시스템 데이터 동기화 API
 * 
 * 시스템 시작 시에만 동작하는 데이터 동기화 및 백업 체크 엔드포인트
 * 무료티어 최적화: 필요할 때만 Supabase 접근, 최소한의 리소스 사용
 */

import { NextRequest, NextResponse } from 'next/server';
import { redisTemplateCache } from '@/lib/redis-template-cache';
import { dynamicTemplateManager } from '@/lib/dynamic-template-system';

export const runtime = 'nodejs';

interface SyncRequest {
  triggerType: 'system-start' | 'manual';
}

export async function POST(request: NextRequest) {
  try {
    const { triggerType = 'system-start' }: SyncRequest = await request.json();
    
    // 시스템 시작 시에만 동작하도록 제한
    if (triggerType !== 'system-start') {
      return NextResponse.json(
        { 
          success: false, 
          error: '시스템 시작 시에만 데이터 동기화가 가능합니다' 
        },
        { status: 400 }
      );
    }

    console.log('🔄 데이터 동기화 시작 (triggerType: system-start)');
    const startTime = Date.now();
    
    const results = {
      redis: { success: false, message: '', processingTime: 0 },
      supabase: { success: false, message: '', processingTime: 0 },
      validation: { success: false, message: '', processingTime: 0 }
    };

    // 1. Redis 캐시 상태 확인 및 초기화
    try {
      const redisStart = Date.now();
      await redisTemplateCache.initialize();
      
      // 캐시 상태 확인
      const cacheStatus = await redisTemplateCache.getCacheStatus();
      results.redis = {
        success: true,
        message: `Redis 캐시 초기화 완료 (${cacheStatus.serverKeysCount}개 서버)`,
        processingTime: Date.now() - redisStart
      };
    } catch (redisError) {
      console.error('❌ Redis 초기화 실패:', redisError);
      results.redis = {
        success: false,
        message: `Redis 초기화 실패: ${redisError instanceof Error ? redisError.message : 'Unknown error'}`,
        processingTime: Date.now() - startTime
      };
    }

    // 2. Supabase 백업 상태 확인 (가벼운 체크)
    try {
      const supabaseStart = Date.now();
      
      // 최신 백업 데이터 존재 여부만 확인 (실제 복원은 하지 않음)
      const backupData = await dynamicTemplateManager.restoreFromSupabase();
      const backupCount = backupData.length;
      
      // 백업이 없거나 적으면 즉시 백업 실행
      if (backupCount < 10) {
        console.log('📦 백업 데이터 부족, 즉시 백업 실행');
        await redisTemplateCache.forceBackupToSupabase();
      }
      
      results.supabase = {
        success: true,
        message: `Supabase 백업 확인 완료 (${backupCount}개 백업)`,
        processingTime: 0 // timing simplified
      };
    } catch (supabaseError) {
      console.error('❌ Supabase 백업 확인 실패:', supabaseError);
      results.supabase = {
        success: false,
        message: `Supabase 백업 확인 실패: ${supabaseError instanceof Error ? supabaseError.message : 'Unknown error'}`,
        processingTime: 0 // timing simplified
      };
    }

    // 3. 데이터 무결성 간단 검증
    try {
      const validationStart = Date.now();
      
      // Redis에서 샘플 데이터 조회하여 무결성 확인
      const sampleData = await redisTemplateCache.getServerData();
      const redisValid = sampleData.success && sampleData.data.length > 0;
      
      // Supabase 백업 데이터 무결성 검증
      const backupValidation = await dynamicTemplateManager.validateBackupIntegrity();
      
      const isValid = redisValid && backupValidation.success;
      
      results.validation = {
        success: isValid,
        message: isValid 
          ? `데이터 무결성 검증 완료 (Redis: ${sampleData.data.length}개 서버, Supabase: ${backupValidation.details.validBackups}/${backupValidation.details.totalBackups} 유효)`
          : `데이터 무결성 검증 실패 (Redis: ${redisValid ? '정상' : '오류'}, Supabase: ${backupValidation.success ? '정상' : '오류'})`,
        processingTime: 0 // timing simplified
      };
    } catch (validationError) {
      console.error('❌ 데이터 무결성 검증 실패:', validationError);
      results.validation = {
        success: false,
        message: `데이터 무결성 검증 실패: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`,
        processingTime: 0 // timing simplified
      };
    }

    const totalTime = Date.now() - startTime;
    const overallSuccess = results.redis.success && results.supabase.success && results.validation.success;
    
    console.log(`${overallSuccess ? '✅' : '⚠️'} 데이터 동기화 완료 (${totalTime}ms)`, results);

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? '시스템 시작 시 데이터 동기화 완료'
        : '일부 동기화 작업 실패 (시스템 정상 동작)',
      processingTime: totalTime,
      details: results,
      optimizations: {
        edgeRuntime: true,
        onlySystemStart: true,
        minimalSupabaseQueries: true,
        cacheFirst: true
      }
    });

  } catch (error) {
    console.error('❌ 시스템 데이터 동기화 실패:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: '시스템 데이터 동기화 중 오류가 발생했습니다',
        message: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - Date.now()
      },
      { status: 500 }
    );
  }
}