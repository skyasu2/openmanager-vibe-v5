/**
 * 🚀 통합 데이터 생성기 API 엔드포인트
 *
 * Strategy Pattern으로 4개 생성기 통합 제어
 */

import { unifiedDataGenerator } from '@/services/data-generator/UnifiedDataGeneratorModule';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = unifiedDataGenerator.getStatus();
        return NextResponse.json({
          success: true,
          data: status,
        });

      case 'generate':
        await unifiedDataGenerator.initialize();
        const data = await unifiedDataGenerator.generateData();
        return NextResponse.json({
          success: true,
          count: data.length,
          data: data.slice(0, 10), // 처음 10개만 반환
          strategy: unifiedDataGenerator.getStatus().currentStrategy,
        });

      case 'processed':
        await unifiedDataGenerator.initialize();
        const processedData =
          await unifiedDataGenerator.generateProcessedData();
        return NextResponse.json({
          success: true,
          ...processedData,
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Unified Data Generator API',
          availableActions: ['status', 'generate'],
          availableStrategies: ['real', 'optimized', 'advanced', 'realistic'],
        });
    }
  } catch (error) {
    console.error('❌ Unified Data Generator API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, strategy, config } = body;

    switch (action) {
      case 'initialize':
        await unifiedDataGenerator.initialize();
        return NextResponse.json({
          success: true,
          message: 'Unified Data Generator 초기화 완료',
          status: unifiedDataGenerator.getStatus(),
        });

      case 'start':
        await unifiedDataGenerator.initialize();
        await unifiedDataGenerator.startAutoGeneration();
        return NextResponse.json({
          success: true,
          message: '자동 데이터 생성 시작됨',
        });

      case 'setStrategy':
        if (!strategy) {
          return NextResponse.json(
            {
              success: false,
              error: 'strategy 파라미터가 필요합니다',
            },
            { status: 400 }
          );
        }

        await unifiedDataGenerator.initialize();
        await unifiedDataGenerator.setStrategy(strategy);
        return NextResponse.json({
          success: true,
          message: `전략이 ${strategy}로 변경되었습니다`,
          currentStrategy: strategy,
        });

      case 'dispose':
        unifiedDataGenerator.dispose();
        return NextResponse.json({
          success: true,
          message: 'Unified Data Generator 정리 완료',
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: '알 수 없는 액션입니다',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ Unified Data Generator POST API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
