import { detectEnvironment } from '@/config/environment';
import { ERROR_STATE_METADATA } from '@/config/fallback-data';
import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';
import { NextRequest, NextResponse } from 'next/server';

// 이 라우트는 환경에 따라 다른 응답을 반환하므로 동적
export const dynamic = 'force-dynamic';

/**
 * 🌐 GCP 실제 서버 데이터 API
 * ⚠️ Silent fallback 금지 - 명시적 에러 상태만 반환
 */
export async function GET(request: NextRequest) {
  try {
    const env = detectEnvironment();

    // 🚫 로컬 환경에서는 명시적 에러 반환
    if (!env.IS_VERCEL) {
      return NextResponse.json(
        {
          success: false,
          error: 'GCP_NOT_AVAILABLE_LOCALLY',
          message: '🚫 GCP 실제 데이터는 로컬 환경에서 사용할 수 없습니다',
          userMessage: '⚠️ 이 기능은 Vercel 배포 환경에서만 사용 가능합니다',
          environment: 'local',
          isErrorState: true,
          errorMetadata: {
            ...ERROR_STATE_METADATA,
            errorType: 'ENVIRONMENT_RESTRICTION',
            errorMessage: '로컬 환경에서는 GCP 실제 데이터 접근 불가',
          },
          recommendations: [
            'Vercel에 배포된 환경에서 시도하세요',
            '로컬에서는 목업 데이터를 사용하세요',
          ],
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    console.log('🌐 GCP 실제 서버 데이터 API 호출');

    // GCP 실제 데이터 서비스 초기화
    const gcpService = GCPRealDataService.getInstance();

    try {
      // 서비스 초기화 시도
      await gcpService.initialize();
    } catch (initError) {
      console.error('❌ GCP 서비스 초기화 실패:', initError);

      return NextResponse.json(
        {
          success: false,
          error: 'GCP_INITIALIZATION_FAILED',
          message: '🚨 GCP 서비스 초기화 실패',
          userMessage: '⚠️ Google Cloud와 연결할 수 없습니다',
          environment: 'vercel',
          isErrorState: true,
          errorMetadata: {
            ...ERROR_STATE_METADATA,
            errorType: 'INITIALIZATION_FAILURE',
            originalError:
              initError instanceof Error
                ? initError.message
                : String(initError),
          },
          recommendations: [
            'GCP 설정을 확인하세요',
            'API 키와 권한을 점검하세요',
            '시스템 관리자에게 문의하세요',
          ],
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    // GCP 실제 메트릭 조회
    try {
      const realDataResponse = await gcpService.getRealServerMetrics();

      // 성공적으로 실제 데이터 조회
      if (realDataResponse.success && !realDataResponse.isErrorState) {
        return NextResponse.json({
          success: true,
          data: realDataResponse.data,
          totalServers: realDataResponse.totalServers,
          source: realDataResponse.source,
          message: '✅ GCP 실제 서버 데이터 조회 성공',
          environment: 'vercel',
          isErrorState: false,
          timestamp: realDataResponse.timestamp,
        });
      }

      // ❌ GCP 데이터 조회 실패 - 명시적 에러 응답
      return NextResponse.json(
        {
          success: false,
          data: realDataResponse.data, // 정적 에러 서버 데이터
          totalServers: realDataResponse.totalServers,
          source: realDataResponse.source,
          error: 'GCP_DATA_FETCH_FAILED',
          message: '🚨 GCP 실제 데이터 조회 실패',
          userMessage: '⚠️ Google Cloud에서 서버 데이터를 가져올 수 없습니다',
          environment: 'vercel',
          isErrorState: true,
          errorMetadata: realDataResponse.errorMetadata,
          recommendations: [
            'GCP 서비스 상태를 확인하세요',
            'API 할당량을 점검하세요',
            '잠시 후 다시 시도하세요',
            '문제가 지속되면 관리자에게 문의하세요',
          ],
          timestamp: realDataResponse.timestamp,
        },
        { status: 503 }
      );
    } catch (fetchError) {
      console.error('❌ GCP 메트릭 조회 중 오류:', fetchError);

      return NextResponse.json(
        {
          success: false,
          error: 'GCP_FETCH_ERROR',
          message: '🚨 GCP 메트릭 조회 중 오류 발생',
          userMessage: '⚠️ 서버 데이터를 불러오는 중 오류가 발생했습니다',
          environment: 'vercel',
          isErrorState: true,
          errorMetadata: {
            ...ERROR_STATE_METADATA,
            errorType: 'FETCH_ERROR',
            originalError:
              fetchError instanceof Error
                ? fetchError.message
                : String(fetchError),
          },
          recommendations: [
            '네트워크 연결을 확인하세요',
            'GCP 서비스 상태를 점검하세요',
            '잠시 후 다시 시도하세요',
          ],
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ GCP 실제 서버 API 치명적 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'CRITICAL_API_ERROR',
        message: '🚨 API 치명적 오류 발생',
        userMessage: '⚠️ 서버에서 심각한 오류가 발생했습니다',
        environment: 'vercel',
        isErrorState: true,
        errorMetadata: {
          ...ERROR_STATE_METADATA,
          severity: 'CRITICAL',
          errorType: 'API_CRITICAL_ERROR',
          originalError: error instanceof Error ? error.message : String(error),
        },
        recommendations: [
          '페이지를 새로고침하세요',
          '잠시 후 다시 시도하세요',
          '즉시 시스템 관리자에게 문의하세요',
        ],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 평균 CPU 사용률 계산
 */
function calculateAverageCpuUsage(servers: any[]): number {
  if (servers.length === 0) return 0;

  const totalCpuUsage = servers.reduce((sum, server) => {
    return sum + (server.metrics?.cpu?.usage || 0);
  }, 0);

  return Math.round(totalCpuUsage / servers.length);
}

/**
 * 📊 평균 메모리 사용률 계산
 */
function calculateAverageMemoryUsage(servers: any[]): number {
  if (servers.length === 0) return 0;

  const totalMemoryUsage = servers.reduce((sum, server) => {
    return sum + (server.metrics?.memory?.usage || 0);
  }, 0);

  return Math.round(totalMemoryUsage / servers.length);
}
