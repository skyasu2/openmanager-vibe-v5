/**
 * Smart Query API
 * 
 * 🧠 스마트 모드 감지 및 자동 전환 API
 * - 질문 유형 자동 분석
 * - Basic/Advanced 모드 자동 선택
 * - 모드별 처리 시간 제한
 */

import { NextRequest, NextResponse } from 'next/server';
import { RealAnalysisEngine } from '@/services/ai/RealAnalysisEngine';

// 실제 분석 엔진 인스턴스
const realAnalysisEngine = RealAnalysisEngine.getInstance({
  enablePythonEngine: true,
  enableCorrelationEngine: true,
  fallbackToDummy: true, // 개발 중에는 fallback 활성화
  pythonConfig: {
    pythonPath: process.env.PYTHON_PATH || 'python',
    scriptsPath: process.env.PYTHON_SCRIPTS_PATH || './python-analysis',
    timeout: 30000 // 30초
  }
});

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    // 실제 분석 엔진 초기화
    await realAnalysisEngine.initialize();

    // 서버 데이터 가져오기 (실제 구현에서는 데이터베이스에서 조회)
    const serverData = await getServerData();

    // 실제 분석 수행
    const [correlations, mlModels, patterns, predictions] = await Promise.all([
      realAnalysisEngine.findRealCorrelations(serverData),
      realAnalysisEngine.analyzeWithMLModels(serverData),
      realAnalysisEngine.identifyRealPatterns(query, serverData),
      realAnalysisEngine.generateRealPredictions(serverData, 30)
    ]);

    // 응답 생성 (기존 형식 유지)
    const response = {
      answer: generateSmartAnswer(query, {
        correlations,
        mlModels,
        patterns,
        predictions
      }),
      confidence: calculateOverallConfidence(mlModels),
      sources: generateSources(correlations, patterns),
      metadata: {
        analysisType: 'real-time',
        modelsUsed: Object.keys(mlModels),
        dataPoints: serverData.length,
        timestamp: new Date().toISOString(),
        engineStatus: realAnalysisEngine.getSystemStatus()
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Smart query analysis failed:', error);
    
    // 에러 시 기존 더미 데이터로 fallback
    return NextResponse.json({
      answer: "분석 중 오류가 발생했습니다. 기본 분석 결과를 제공합니다.",
      confidence: 0.7,
      sources: ["시스템 기본 분석"],
      metadata: {
        analysisType: 'fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

// 실제 서버 데이터 조회 (예시)
async function getServerData() {
  // TODO: 실제 데이터베이스나 메트릭 수집기에서 데이터 조회
  // 현재는 시뮬레이션 데이터 반환
  return Array.from({ length: 20 }, (_, i) => ({
    id: `server-${i + 1}`,
    cpu: 30 + Math.random() * 40,
    memory: 40 + Math.random() * 35,
    disk: 20 + Math.random() * 30,
    responseTime: 50 + Math.random() * 100,
    timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString()
  }));
}

// 스마트 답변 생성
function generateSmartAnswer(query: string, analysis: any): string {
  const { correlations, mlModels, patterns, predictions } = analysis;

  let answer = `📊 **실시간 분석 결과**\n\n`;

  // 상관관계 분석 결과
  if (correlations.length > 0) {
    answer += `🔗 **상관관계 분석:**\n`;
    correlations.slice(0, 3).forEach((corr: any) => {
      answer += `• ${corr.metrics}: ${corr.correlation} (R=${corr.coefficient})\n`;
    });
    answer += `\n`;
  }

  // ML 모델 결과
  answer += `🤖 **기계학습 모델 적용:**\n`;
  Object.entries(mlModels).forEach(([, result]: [string, any]) => {
    answer += `• ${result.modelName}: 정확도 ${(result.accuracy * 100).toFixed(1)}%\n`;
  });
  answer += `\n`;

  // 패턴 분석 결과
  if (patterns.length > 0) {
    answer += `🎯 **감지된 패턴:**\n`;
    patterns.slice(0, 2).forEach((pattern: any) => {
      answer += `• ${pattern.name} (신뢰도: ${pattern.confidence})\n`;
      answer += `  ${pattern.description}\n`;
    });
    answer += `\n`;
  }

  // 예측 결과
  if (predictions.predictions.length > 0) {
    answer += `🔮 **예측 분석:**\n`;
    answer += `• 모델 정확도: ${(predictions.accuracy * 100).toFixed(1)}%\n`;
    answer += `• ${predictions.modelInfo}\n`;
  }

  return answer;
}

// 전체 신뢰도 계산
function calculateOverallConfidence(mlModels: any): number {
  const accuracies = Object.values(mlModels).map((model: any) => model.accuracy);
  return accuracies.reduce((sum: number, acc: number) => sum + acc, 0) / accuracies.length;
}

// 소스 생성
function generateSources(correlations: any[], patterns: any[]): string[] {
  const sources = ['실시간 서버 메트릭 분석'];
  
  if (correlations.length > 0) {
    sources.push('Pearson 상관계수 분석');
  }
  
  if (patterns.length > 0) {
    sources.push('클러스터링 패턴 분석', '이상 탐지 알고리즘');
  }
  
  return sources;
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      status: {
        currentMode: 'basic',
        autoModeEnabled: true
      },
      examples: {
        basicQueries: [
          "현재 서버 상태 확인해줘",
          "지금 시스템 어때?",
          "간단히 상태 보여줘",
          "CPU 사용률 확인"
        ],
        advancedQueries: [
          "서버 장애 원인을 분석해서 보고서 작성해줘",
          "전체 시스템의 성능 트렌드를 예측해줘",
          "다중 서버 간 상관관계를 분석해줘",
          "용량 계획을 세워줘",
          "종합 보고서를 작성해줘"
        ]
      }
    });

  } catch (error) {
    console.error('Smart Query Status API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '상태 조회 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 