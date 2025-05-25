/**
 * Smart Query API
 * 
 * 🧠 스마트 모드 감지 및 자동 전환 API
 * - 질문 유형 자동 분석
 * - Basic/Advanced 모드 자동 선택
 * - 모드별 처리 시간 제한
 */

import { NextRequest, NextResponse } from 'next/server';
import { SmartModeDetector } from '../../../../modules/ai-agent/core/SmartModeDetector';
import { EnhancedModeManager } from '../../../../modules/ai-agent/core/EnhancedModeManager';
import { ModePrompts } from '../../../../modules/ai-agent/prompts/ModePrompts';

// 스마트 모드 감지기 인스턴스
const modeDetector = new SmartModeDetector();
const modeManager = new EnhancedModeManager();

export async function POST(request: NextRequest) {
  try {
    const { query, context = {}, serverData = null, forceMode = null } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: '질문이 필요합니다.'
      }, { status: 400 });
    }

    const startTime = Date.now();

    // 1. 쿼리 분석 및 모드 선택
    let analysis;
    if (forceMode) {
      modeManager.setMode(forceMode);
      analysis = {
        detectedMode: forceMode,
        confidence: 100,
        triggers: ['manual'],
        reasoning: `수동으로 ${forceMode} 모드 설정`
      };
    } else {
      analysis = modeManager.analyzeAndSetMode(query);
    }

    const modeConfig = modeManager.getModeConfig();

    // 2. 모드별 프롬프트 생성
    let prompt;
    let responseStyle;
    
    if (analysis.detectedMode === 'basic') {
      prompt = ModePrompts.getBasicPrompt(query, context);
      responseStyle = {
        maxLength: 300,
        format: 'concise',
        processingTime: '3초 이내'
      };
    } else {
      prompt = ModePrompts.getAdvancedPrompt(query, context, analysis);
      responseStyle = {
        maxLength: 2000,
        format: 'comprehensive',
        processingTime: '10초 이내'
      };
    }

    // 3. 특별 케이스 감지
    const isIncidentReport = isIncidentReportRequest(query);
    const isPerformanceAnalysis = isPerformanceAnalysisRequest(query);
    const isLogAnalysis = isLogAnalysisRequest(query);

    // 4. 시뮬레이션된 응답 생성
    const response = generateSimulatedResponse(query, analysis, {
      isIncidentReport,
      isPerformanceAnalysis,
      isLogAnalysis,
      serverData
    });

    const processingTime = Date.now() - startTime;

    // 5. 모드 히스토리 업데이트 (실제로는 modeManager에서 자동 처리됨)
    const modeStats = modeManager.getModeStats();

    return NextResponse.json({
      success: true,
      query,
      analysis: {
        detectedMode: analysis.detectedMode,
        confidence: analysis.confidence,
        triggers: analysis.triggers,
        reasoning: analysis.reasoning
      },
      modeConfig: {
        maxProcessingTime: modeConfig.maxProcessingTime,
        contextLength: modeConfig.contextLength,
        responseDepth: modeConfig.responseDepth,
        enableAdvancedAnalysis: modeConfig.enableAdvancedAnalysis,
        enablePredictiveAnalysis: modeConfig.enablePredictiveAnalysis,
        enableMultiServerCorrelation: modeConfig.enableMultiServerCorrelation
      },
      responseStyle,
      response,
      specialCases: {
        isIncidentReport,
        isPerformanceAnalysis,
        isLogAnalysis
      },
      metadata: {
        processingTime,
        timestamp: new Date().toISOString(),
        engineVersion: '2.0.0',
        sessionId: `smart_${Date.now()}`
      },
      modeStats,
      optimizationSuggestions: modeManager.getOptimizationSuggestions()
    });

  } catch (error) {
    console.error('Smart Query API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '스마트 쿼리 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // 모드 관리자 상태 조회
    const modeStats = modeManager.getModeStats();
    const currentMode = modeManager.getCurrentMode();
    const autoModeEnabled = modeManager.isAutoModeEnabled();
    const optimizationSuggestions = modeManager.getOptimizationSuggestions();

    return NextResponse.json({
      success: true,
      status: {
        currentMode,
        autoModeEnabled,
        modeStats,
        optimizationSuggestions
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
        ],
        incidentReports: [
          "장애 보고서 작성해줘",
          "인시던트 리포트 생성",
          "자동 장애 분석 보고서"
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

// 헬퍼 함수들
function isIncidentReportRequest(query: string): boolean {
  const incidentKeywords = [
    '장애 보고서', '인시던트 리포트', 'incident report',
    '종합 보고서', '자동 보고서', '장애 분석'
  ];
  
  return incidentKeywords.some(keyword => 
    query.toLowerCase().includes(keyword.toLowerCase())
  );
}

function isPerformanceAnalysisRequest(query: string): boolean {
  const performanceKeywords = [
    '성능 분석', 'performance analysis', '성능 튜닝', 'performance tuning',
    '병목', 'bottleneck', '최적화', 'optimization', '용량 계획'
  ];
  
  return performanceKeywords.some(keyword => 
    query.toLowerCase().includes(keyword.toLowerCase())
  );
}

function isLogAnalysisRequest(query: string): boolean {
  const logKeywords = [
    '로그 분석', 'log analysis', '에러 분석', 'error analysis',
    '로그 확인', '오류 분석', '장애 원인'
  ];
  
  return logKeywords.some(keyword => 
    query.toLowerCase().includes(keyword.toLowerCase())
  );
}

function generateSimulatedResponse(query: string, analysis: any, options: any): string {
  const { detectedMode } = analysis;
  const { isIncidentReport, isPerformanceAnalysis, isLogAnalysis, serverData } = options;

  if (isIncidentReport) {
    return `🚨 **자동 장애 보고서**

## 🔍 상황 분석
질문: "${query}"
감지된 모드: ${detectedMode} (신뢰도: ${analysis.confidence}%)

## 📊 장애 개요
- 발생 시간: ${new Date().toLocaleString()}
- 영향 범위: 전체 시스템
- 심각도: High

## 🌐 시스템 상관관계
다중 서버 간 상관관계 분석을 통해 장애 전파 경로를 추적했습니다.

## 🔮 예측 및 트렌드
향후 유사 장애 발생 가능성과 예방 방안을 제시합니다.

## ⚙️ 상세 권장사항
1. 즉시 조치 사항
2. 단기 개선 방안
3. 장기 예방 대책

---
**🧠 AI 분석 정보**
- 감지된 모드: ${detectedMode}
- 신뢰도: ${analysis.confidence}%
- 분석 근거: ${analysis.reasoning}`;
  }

  if (detectedMode === 'basic') {
    return `## 현재 상태
질문: "${query}"
모드: Basic (빠른 응답)

## 주요 발견사항
- 간결한 정보 제공
- 3초 이내 응답
- 핵심 포인트 위주

## 권장 조치
즉시 실행 가능한 조치 1-2개를 제안합니다.`;
  } else {
    return `## 🔍 상황 분석
질문: "${query}"
감지된 모드: ${detectedMode} (신뢰도: ${analysis.confidence}%)

${analysis.reasoning}

## 📊 데이터 분석
${isPerformanceAnalysis ? '성능 메트릭 종합 분석을 수행했습니다.' : ''}
${isLogAnalysis ? '로그 패턴 및 에러 분석을 수행했습니다.' : ''}
관련 메트릭과 수치를 기반으로 상세 분석을 제공합니다.

## 🌐 시스템 상관관계
다중 시스템/서버 간 영향도를 분석하여 전체적인 관점에서 평가했습니다.

## 🔮 예측 및 트렌드
향후 전망과 시나리오를 분석하여 예측 정보를 제공합니다.

## ⚙️ 상세 권장사항
1. 단계별 해결방안
2. 최적화 제안
3. 모니터링 강화 방안

## 📈 모니터링 포인트
지속적 관찰이 필요한 핵심 지표들을 식별했습니다.

---
**🧠 AI 분석 정보**
- 감지된 모드: ${detectedMode}
- 신뢰도: ${analysis.confidence}%
- 분석 근거: ${analysis.reasoning}
- 트리거: ${analysis.triggers.join(', ')}`;
  }
} 