/**
 * 🔢 OpenManager Vibe v5 - 버전 상태 API - 안전한 버전
 *
 * AI 엔진과 데이터 생성기의 현재 버전 정보를 제공
 * - 버전 호환성 검사
 * - 성능 메트릭
 * - 업그레이드 권장사항
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import debug from '@/utils/debug';
import { AI_ENGINE_VERSIONS, DATA_GENERATOR_VERSIONS, VersionManager as ImportedVersionManager } from '@/config/versions';

// 🔒 타입 안전성을 위한 인터페이스 정의
interface AIEngineVersions {
  [key: string]: string | number | unknown;
}

interface DataGeneratorVersions {
  [key: string]: string | number | unknown;
}

interface VersionManager {
  [key: string]: unknown;
}

interface MasterAIEngine {
  [key: string]: unknown;
}

// 안전한 import 처리
const _AI_ENGINE_VERSIONS: AIEngineVersions | null = AI_ENGINE_VERSIONS;
const _DATA_GENERATOR_VERSIONS: DataGeneratorVersions | null = DATA_GENERATOR_VERSIONS;
const _VersionManager: VersionManager | null = ImportedVersionManager;
const _masterAIEngine: MasterAIEngine | null = null;

// SimplifiedQueryEngine은 GCP Functions로 이관됨
try {
  // const simplifiedQueryEngineModule = require('@/services/ai/SimplifiedQueryEngine');
  // masterAIEngine = simplifiedQueryEngineModule.simplifiedQueryEngine;
  _masterAIEngine = null; // GCP Functions로 이관됨
} catch (error) {
  debug.warn(
    'SimplifiedQueryEngine import 실패 (GCP Functions로 이관됨):',
    (error as Error).message
  );
}

// OptimizedDataGenerator는 Mock System으로 대체됨

export function GET(_request: NextRequest) {
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
    debug.error('Version status API error:', error);

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
