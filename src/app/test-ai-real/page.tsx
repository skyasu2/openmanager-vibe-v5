'use client';

import React, { useState, useEffect } from 'react';
import { useRealAI } from '@/hooks/api/useRealAI';

export default function TestAIRealPage() {
  const [query, setQuery] = useState('');
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<'analysis' | 'monitoring' | 'prediction' | 'optimization' | 'troubleshooting'>('analysis');

  const {
    isAnalyzing,
    isHealthChecking,
    lastResponse,
    systemHealth,
    error,
    analyze,
    checkHealth,
    askQuestion,
    cancelAnalysis,
    reset,
    getPerformanceInfo,
    getSystemSummary,
    hasResponse,
    isHealthy,
    confidence,
    urgency
  } = useRealAI({
    enablePython: true,
    enableMCP: true,
    aiModel: 'local-analyzer',
    realTime: true
  });

  // 시작 시 시스템 상태 확인
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    await analyze({
      query,
      type: selectedAnalysisType,
      includeMetrics: true,
      includeLogs: selectedAnalysisType === 'troubleshooting'
    });
  };

  const handleQuickQuestion = async (question: string) => {
    setQuery(question);
    await askQuestion(question);
  };

  const performanceInfo = getPerformanceInfo();
  const systemSummary = getSystemSummary();

  const quickQuestions = [
    '현재 서버 상태가 어떤가요?',
    '시스템 성능이 느린 것 같은데 확인해주세요',
    'CPU 사용률이 높은 이유를 분석해주세요',
    '메모리 사용량 최적화 방법을 알려주세요',
    '앞으로 시스템 리소스 사용량을 예측해주세요',
    '로그에서 오류가 있는지 확인해주세요'
  ];

  const analysisTypes = [
    { value: 'analysis', label: '종합 분석' },
    { value: 'monitoring', label: '모니터링' },
    { value: 'prediction', label: '예측 분석' },
    { value: 'optimization', label: '최적화' },
    { value: 'troubleshooting', label: '문제 해결' }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">🧠 실제 AI 서비스 테스트</h1>
          <p className="text-gray-600">OpenManager Vibe v5 - 실제 동작하는 AI 엔진 시연</p>
        </div>

        {/* 시스템 상태 카드 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🔥 시스템 상태
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            {systemHealth && Object.entries(systemHealth).map(([service, status]) => {
              if (service === 'overall') return null;
              const isHealthy = typeof status === 'object' && (status.status === 'healthy' || status.status === 'connected');
              return (
                <div key={service} className="text-center">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {service}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">{typeof status === 'object' ? status.status : 'unknown'}</p>
                </div>
              );
            })}
          </div>
          
          {systemSummary && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>시스템 건강도</span>
                <span>{systemSummary.healthPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all" 
                  style={{ width: `${systemSummary.healthPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {systemSummary.healthyServices}/{systemSummary.totalServices} 서비스 정상
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button 
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              onClick={checkHealth}
              disabled={isHealthChecking}
            >
              {isHealthChecking ? '⏳' : '🔄'} 새로고침
            </button>
            <button 
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
              onClick={reset}
            >
              🧹 초기화
            </button>
          </div>
        </div>

        {/* AI 분석 인터페이스 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 입력 패널 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">AI 분석 요청</h2>
            <p className="text-gray-600 mb-4">질문을 입력하거나 빠른 질문을 선택하세요</p>
            
            <div className="space-y-4">
              {/* 분석 타입 선택 */}
              <div>
                <label className="text-sm font-medium mb-2 block">분석 타입</label>
                <div className="grid grid-cols-2 gap-2">
                  {analysisTypes.map(({ value, label }) => (
                    <button
                      key={value}
                      className={`px-3 py-2 text-sm rounded border ${
                        selectedAnalysisType === value 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedAnalysisType(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 질문 입력 */}
              <div>
                <label className="text-sm font-medium mb-2 block">질문</label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="시스템에 대한 질문을 입력하세요..."
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
                  rows={3}
                />
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <button 
                  className={`flex-1 px-4 py-2 rounded text-white ${
                    isAnalyzing || !query.trim() 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !query.trim()}
                >
                  {isAnalyzing ? '⏳ 분석 중...' : '▶️ 분석 시작'}
                </button>
                {isAnalyzing && (
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    onClick={cancelAnalysis}
                  >
                    ⏹️
                  </button>
                )}
              </div>

              {/* 빠른 질문 */}
              <div>
                <label className="text-sm font-medium mb-2 block">빠른 질문</label>
                <div className="space-y-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-2 text-xs border border-gray-200 rounded hover:bg-gray-50"
                      onClick={() => handleQuickQuestion(question)}
                      disabled={isAnalyzing}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 결과 패널 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">분석 결과</h2>
            <p className="text-gray-600 mb-4">
              {hasResponse ? `마지막 분석: ${new Date(lastResponse!.timestamp).toLocaleTimeString()}` : '분석 결과가 여기에 표시됩니다'}
            </p>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {lastResponse && (
              <div className="space-y-4">
                {/* 분석 헤더 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded text-xs ${
                    urgency === 'critical' ? 'bg-red-100 text-red-800' : 
                    urgency === 'high' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    {urgency}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                    신뢰도: {Math.round(confidence * 100)}%
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {lastResponse.metadata.model}
                  </span>
                </div>

                {/* 요약 */}
                <div>
                  <h4 className="font-medium mb-2">요약</h4>
                  <p className="text-sm text-gray-700">{lastResponse.analysis.summary}</p>
                </div>

                {/* 세부사항 */}
                {lastResponse.analysis.details.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">세부 분석</h4>
                    <ul className="space-y-1">
                      {lastResponse.analysis.details.map((detail, index) => (
                        <li key={index} className="text-sm text-gray-600">• {detail}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 추천사항 */}
                {lastResponse.data.recommendations && lastResponse.data.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">추천사항</h4>
                    <ul className="space-y-1">
                      {lastResponse.data.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-600">💡 {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <hr className="my-4" />

                {/* 성능 정보 */}
                {performanceInfo && (
                  <div>
                    <h4 className="font-medium mb-2">성능 정보</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>처리 시간: {performanceInfo.totalTime}ms</div>
                      <div>AI 시간: {performanceInfo.aiTime}ms</div>
                      <div>데이터 수집: {performanceInfo.dataCollectionTime}ms</div>
                      <div>캐시 적중: {performanceInfo.cacheHits}</div>
                      <div>폴백: {performanceInfo.fallbacks}</div>
                      <div>캐시됨: {performanceInfo.cached ? '예' : '아니오'}</div>
                    </div>
                  </div>
                )}

                {/* 소스 정보 */}
                <div>
                  <h4 className="font-medium mb-2">데이터 소스</h4>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(lastResponse.sources).map(([source, used]) => (
                      <span 
                        key={source} 
                        className={`px-2 py-1 rounded text-xs ${
                          used ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!hasResponse && !isAnalyzing && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-6xl mb-4">🗃️</div>
                <p>질문을 입력하고 분석을 시작하세요</p>
              </div>
            )}
          </div>
        </div>

        {/* 기술 정보 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">기술 스택</h2>
          <p className="text-gray-600 mb-4">실제 사용 중인 기술들</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-2">AI 모델</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Local Analyzer</li>
                <li>• GPT-3.5-turbo</li>
                <li>• Claude 3 Haiku</li>
                <li>• Gemini 1.5 Flash</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">데이터 수집</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Prometheus</li>
                <li>• 시스템 메트릭</li>
                <li>• Docker Stats</li>
                <li>• 로그 수집</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">백엔드</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Python FastAPI</li>
                <li>• Redis 캐싱</li>
                <li>• MCP 도구</li>
                <li>• PostgreSQL</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">배포</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Vercel (Frontend)</li>
                <li>• Render (Python)</li>
                <li>• Redis Cloud</li>
                <li>• 무료 tier</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 