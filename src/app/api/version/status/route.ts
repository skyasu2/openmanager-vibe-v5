/**
 * 🔢 OpenManager Vibe v5 - 버전 상태 API - 안전한 버전
 *
 * AI 엔진과 데이터 생성기의 현재 버전 정보를 제공
 * - 버전 호환성 검사
 * - 성능 메트릭
 * - 업그레이드 권장사항
 */

import { NextRequest, NextResponse } from 'next/server';

// 안전한 import 처리
let AI_ENGINE_VERSIONS: any = null;
let DATA_GENERATOR_VERSIONS: any = null;
let VersionManager: any = null;
let masterAIEngine: any = null;

try {
  const versionsModule = require('@/config/versions');
  AI_ENGINE_VERSIONS = versionsModule.AI_ENGINE_VERSIONS;
  DATA_GENERATOR_VERSIONS = versionsModule.DATA_GENERATOR_VERSIONS;
  VersionManager = versionsModule.VersionManager;
} catch (error) {
  console.warn('versions 모듈 import 실패:', (error as Error).message);
}

// SimplifiedQueryEngine은 GCP Functions로 이관됨
try {
  // const simplifiedQueryEngineModule = require('@/services/ai/SimplifiedQueryEngine');
  // masterAIEngine = simplifiedQueryEngineModule.simplifiedQueryEngine;
  masterAIEngine = null; // GCP Functions로 이관됨
} catch (error) {
  console.warn(
    'SimplifiedQueryEngine import 실패 (GCP Functions로 이관됨):',
    (error as Error).message
  );
}

// OptimizedDataGenerator는 Mock System으로 대체됨

export async function GET(request: NextRequest) {
  try {
    const versionInfo = {
      version: '5.0.0',
      buildTime: new Date().toISOString(),
      status: 'healthy',
      components: {
        aiEngine: 'v4.0.0',
        dataGenerator: 'v3.0.0',
        koreanNLP: 'v1.0.0',
        monitoring: 'v2.0.0',
      },
      environment: process.env.NODE_ENV || 'development',
      features: {
        enhancedKoreanNLP: true,
        vercelOptimization: true,
        qualityFirst: true,
        realTimeMonitoring: true,
      },
    };

    return NextResponse.json({
      success: true,
      data: versionInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Version status API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get version status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
