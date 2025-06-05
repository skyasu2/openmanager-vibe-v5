import { NextRequest, NextResponse } from 'next/server';
import { EnhancedAIEngine } from '@/services/ai/enhanced-ai-engine';
import { getCurrentEnvironment } from '@/config/environment';

/**
 * 🧪 Enhanced AI Engine 상세 테스트 API
 * 
 * ✅ Memory MCP 서버 참조 제거 확인
 * ✅ 문서 검색 로직 개선 확인
 * ✅ 한글 인코딩 문제 해결 확인
 * ✅ 성능 최적화 확인
 * ✅ 환경별 동작 확인
 */

// Enhanced AI Engine 싱글톤 인스턴스
let enhancedAIEngine: EnhancedAIEngine | null = null;

async function getEnhancedAIEngine(): Promise<EnhancedAIEngine> {
  if (!enhancedAIEngine) {
    enhancedAIEngine = new EnhancedAIEngine();
    await enhancedAIEngine.initialize();
  }
  return enhancedAIEngine;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { testType = 'comprehensive', query = '테스트', sessionId = 'test-session' } = body;

    console.log(`🧪 Enhanced AI 테스트 시작: ${testType}`);

    // Enhanced AI Engine 인스턴스 가져오기
    const aiEngine = await getEnhancedAIEngine();

    const testResults = {
      testType,
      timestamp: new Date().toISOString(),
      environment: getCurrentEnvironment(),
      results: {} as any,
      performance: {} as any,
      issues: [] as string[],
      success: true
    };

    // 1. 환경 감지 테스트
    if (testType === 'comprehensive' || testType === 'environment') {
      console.log('🌍 환경 감지 테스트...');
      testResults.results.environment = {
        detected: getCurrentEnvironment(),
        nodeEnv: process.env.NODE_ENV || 'undefined',
        vercel: process.env.VERCEL || 'undefined',
        vercelEnv: process.env.VERCEL_ENV || 'undefined'
      };
    }

    // 2. 문서 검색 테스트
    if (testType === 'comprehensive' || testType === 'documents') {
      console.log('📚 문서 검색 테스트...');
      const docTestStart = Date.now();
      
      // 환경 설정 관련 쿼리
      const envResult = await aiEngine.processSmartQuery('환경별 설정 확인', sessionId);
      
      testResults.results.documentSearch = {
        query: '환경별 설정 확인',
        documentsFound: envResult.sources.length,
        confidence: envResult.confidence,
        keywords: envResult.sources.flatMap(doc => doc.keywords?.slice(0, 3) || []),
        processingTime: Date.now() - docTestStart
      };

      if (envResult.sources.length === 0) {
        testResults.issues.push('문서 검색 결과 없음 - 인덱싱 문제');
      }
    }

    // 3. 한글 처리 테스트
    if (testType === 'comprehensive' || testType === 'encoding') {
      console.log('🎯 한글 인코딩 테스트...');
      const encodingTestStart = Date.now();
      
      const koreanQueries = [
        '환경별 설정 방법',
        'MCP 서버 연결 확인'
      ];

      const encodingResults = [];
      for (const koreanQuery of koreanQueries) {
        const result = await aiEngine.processSmartQuery(koreanQuery, `${sessionId}-korean`);
        encodingResults.push({
          query: koreanQuery,
          success: result.success,
          confidence: result.confidence,
          hasValidAnswer: result.answer.length > 10
        });
      }

      testResults.results.encoding = {
        tested: koreanQueries.length,
        successful: encodingResults.filter(r => r.success).length,
        results: encodingResults,
        processingTime: Date.now() - encodingTestStart
      };
    }

    // 4. 성능 최적화 테스트
    if (testType === 'comprehensive' || testType === 'performance') {
      console.log('⚡ 성능 최적화 테스트...');
      const perfTestStart = Date.now();
      
      // 여러 쿼리를 연속으로 실행하여 성능 측정
      const perfQueries = [
        'MCP 시스템 개요',
        'AI 엔진 상태',
        '환경 설정 확인'
      ];

      const perfResults = [];
      for (const perfQuery of perfQueries) {
        const queryStart = Date.now();
        const result = await aiEngine.processSmartQuery(perfQuery, `${sessionId}-perf`);
        const queryTime = Date.now() - queryStart;
        
        perfResults.push({
          query: perfQuery,
          responseTime: queryTime,
          success: result.success,
          efficiency: result.processingTime / queryTime
        });
      }

      const avgResponseTime = perfResults.reduce((sum, r) => sum + r.responseTime, 0) / perfResults.length;
      
      testResults.results.performance = {
        queries: perfResults.length,
        averageResponseTime: avgResponseTime,
        fastestResponse: Math.min(...perfResults.map(r => r.responseTime)),
        slowestResponse: Math.max(...perfResults.map(r => r.responseTime)),
        allSuccessful: perfResults.every(r => r.success),
        results: perfResults,
        totalTime: Date.now() - perfTestStart
      };

      // 성능 이슈 확인
      if (avgResponseTime > 1000) {
        testResults.issues.push(`평균 응답 시간 느림: ${avgResponseTime}ms`);
      }
    }

    // 5. Memory MCP 서버 제거 확인
    if (testType === 'comprehensive' || testType === 'memory') {
      console.log('🗑️ Memory MCP 서버 제거 확인...');
      const memoryTestStart = Date.now();
      
      // 여러 세션으로 컨텍스트 저장 테스트
      const memoryResults = [];
      for (let i = 0; i < 3; i++) {
        try {
          const result = await aiEngine.processSmartQuery(
            `메모리 테스트 ${i}`, 
            `memory-test-${i}`
          );
          memoryResults.push({
            session: `memory-test-${i}`,
            success: result.success,
            hasMemoryError: result.reasoning.some(r => r.includes('memory') && r.includes('실패'))
          });
        } catch (error: any) {
          memoryResults.push({
            session: `memory-test-${i}`,
            success: false,
            error: error.message
          });
        }
      }

      testResults.results.memory = {
        tested: memoryResults.length,
        successful: memoryResults.filter(r => r.success).length,
        hasMemoryErrors: memoryResults.some(r => r.hasMemoryError),
        results: memoryResults,
        processingTime: Date.now() - memoryTestStart
      };

      if (memoryResults.some(r => r.hasMemoryError)) {
        testResults.issues.push('Memory MCP 서버 참조가 여전히 존재함');
      }
    }

    // 전체 성능 메트릭
    const totalTime = Date.now() - startTime;
    testResults.performance = {
      totalTestTime: totalTime,
      averageQueryTime: totalTime / Object.keys(testResults.results).length,
      memoryUsage: process.memoryUsage(),
      success: testResults.issues.length === 0
    };

    // 최종 결과
    testResults.success = testResults.issues.length === 0;

    console.log(`✅ Enhanced AI 테스트 완료: ${testResults.success ? '성공' : '일부 이슈 발견'}`);

    // UTF-8 인코딩 헤더 설정
    const response = NextResponse.json(testResults);
    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    return response;

  } catch (error: any) {
    console.error('❌ Enhanced AI 테스트 실패:', error);

    const response = NextResponse.json({
      success: false,
      testType: 'failed',
      error: {
        message: error.message || '테스트 실행 실패',
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });

    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    return response;
  }
}

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      status: 'active',
      testAPI: 'Enhanced AI Test API v1.0',
      availableTests: [
        'comprehensive - 전체 테스트',
        'environment - 환경 감지 테스트',
        'documents - 문서 검색 테스트',
        'encoding - 한글 인코딩 테스트'
      ],
      usage: {
        method: 'POST',
        body: {
          testType: 'comprehensive',
          query: '테스트할 쿼리',
          sessionId: 'test-session'
        }
      },
      environment: getCurrentEnvironment(),
      timestamp: new Date().toISOString()
    });

    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    return response;

  } catch (error: any) {
    console.error('❌ 테스트 API 오류:', error);

    const response = NextResponse.json({
      success: false,
      error: error.message || '테스트 API 실행 실패'
    }, { status: 500 });

    response.headers.set('Content-Type', 'application/json; charset=utf-8');
    return response;
  }
} 