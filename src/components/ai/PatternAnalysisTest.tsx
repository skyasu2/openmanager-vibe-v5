'use client';

import { useState, useEffect } from 'react';
import { AnalysisReport } from '@/services/ai-agent/PatternAnalysisService';

export default function PatternAnalysisTest() {
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);

  // 컴포넌트 마운트 시 최신 보고서 로드
  useEffect(() => {
    loadLatestReport();
  }, []);

  const loadLatestReport = async () => {
    try {
      const response = await fetch('/api/ai-agent/learning/analysis?action=latest-report');
      const result = await response.json();
      
      if (result.success) {
        setAnalysisReport(result.data);
      } else {
        console.log('최신 보고서가 없습니다.');
      }
    } catch (error) {
      console.error('최신 보고서 로드 실패:', error);
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai-agent/learning/analysis?action=run-analysis');
      const result = await response.json();
      
      if (result.success) {
        setAnalysisReport(result.data);
        console.log('✅ 패턴 분석 완료:', result.data);
      } else {
        console.error('❌ 패턴 분석 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 패턴 분석 요청 실패:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const approveSuggestion = async (suggestionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-agent/learning/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve-suggestion',
          data: { suggestionId }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 패턴 제안 승인:', suggestionId);
        await loadLatestReport(); // 보고서 새로고침
      } else {
        console.error('❌ 패턴 제안 승인 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 패턴 제안 승인 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rejectSuggestion = async (suggestionId: string, reason?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-agent/learning/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject-suggestion',
          data: { suggestionId, reason }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('❌ 패턴 제안 거부:', suggestionId);
        await loadLatestReport(); // 보고서 새로고침
      } else {
        console.error('❌ 패턴 제안 거부 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 패턴 제안 거부 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startABTest = async (suggestion: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-agent/learning/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-test',
          data: { suggestion }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('🧪 A/B 테스트 시작:', result.data);
        await loadLatestReport(); // 보고서 새로고침
      } else {
        console.error('❌ A/B 테스트 시작 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ A/B 테스트 시작 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const bulkApprove = async () => {
    if (selectedSuggestions.length === 0) {
      alert('승인할 제안을 선택하세요.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-agent/learning/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-approve',
          data: { suggestionIds: selectedSuggestions }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ 일괄 승인 완료:', result.data);
        setSelectedSuggestions([]);
        await loadLatestReport(); // 보고서 새로고침
      } else {
        console.error('❌ 일괄 승인 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 일괄 승인 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const autoApproveHighConfidence = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-agent/learning/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'auto-approve-high-confidence',
          data: { confidenceThreshold: 0.8 }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('🤖 자동 승인 완료:', result.data);
        await loadLatestReport(); // 보고서 새로고침
      } else {
        console.error('❌ 자동 승인 실패:', result.error);
      }
    } catch (error) {
      console.error('❌ 자동 승인 요청 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuggestionSelection = (suggestionId: string) => {
    setSelectedSuggestions(prev => 
      prev.includes(suggestionId) 
        ? prev.filter(id => id !== suggestionId)
        : [...prev, suggestionId]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🔍 패턴 분석 시스템 (Phase 2)
        </h2>
        
        {/* 제어 버튼들 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? '분석 중...' : '패턴 분석 실행'}
          </button>
          
          <button
            onClick={loadLatestReport}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            최신 보고서 로드
          </button>
          
          {selectedSuggestions.length > 0 && (
            <button
              onClick={bulkApprove}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              선택된 제안 일괄 승인 ({selectedSuggestions.length})
            </button>
          )}
          
          <button
            onClick={autoApproveHighConfidence}
            disabled={isLoading || !analysisReport}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            고신뢰도 제안 자동 승인
          </button>
        </div>

        {/* 분석 보고서 표시 */}
        {analysisReport && (
          <div className="space-y-6">
            {/* 보고서 헤더 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  📊 분석 보고서 (ID: {analysisReport.id.slice(-8)})
                </h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(analysisReport.priority)}`}>
                  우선순위: {analysisReport.priority.toUpperCase()}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                생성 시간: {new Date(analysisReport.timestamp).toLocaleString()}
              </div>
            </div>

            {/* 분석 결과 요약 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">📈 분석 결과</h4>
                <div className="space-y-1 text-sm">
                  <div>총 상호작용: {analysisReport.analysisResult.totalInteractions}</div>
                  <div>낮은 신뢰도: {analysisReport.analysisResult.lowConfidenceCount}</div>
                  <div>평균 신뢰도: {(analysisReport.analysisResult.averageConfidence * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">🎯 패턴 분석</h4>
                <div className="space-y-1 text-sm">
                  <div>실패 패턴: {analysisReport.patternAnalysis.negativePatterns.length}</div>
                  <div>개선 기회: {analysisReport.patternAnalysis.improvementOpportunities.length}</div>
                  <div>예상 효과: {analysisReport.patternAnalysis.estimatedImpact}%</div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">💡 제안 & 테스트</h4>
                <div className="space-y-1 text-sm">
                  <div>패턴 제안: {analysisReport.suggestions.length}</div>
                  <div>활성 테스트: {analysisReport.activeTests.length}</div>
                  <div>질문 유형: {analysisReport.questionTypes.length}</div>
                </div>
              </div>
            </div>

            {/* 권장사항 */}
            {analysisReport.recommendations.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">💡 권장사항</h4>
                <ul className="space-y-1 text-sm">
                  {analysisReport.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 패턴 제안 목록 */}
            {analysisReport.suggestions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-4">🎯 패턴 제안 ({analysisReport.suggestions.length}개)</h4>
                <div className="space-y-3">
                  {analysisReport.suggestions.map((suggestion, index) => (
                    <div key={suggestion.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <input
                              type="checkbox"
                              checked={selectedSuggestions.includes(suggestion.id)}
                              onChange={() => toggleSuggestionSelection(suggestion.id)}
                              className="rounded"
                            />
                            <span className="font-medium">제안 #{index + 1}</span>
                            <span className={`text-sm font-medium ${getConfidenceColor(suggestion.confidenceScore)}`}>
                              신뢰도: {(suggestion.confidenceScore * 100).toFixed(1)}%
                            </span>
                            <span className="text-sm text-green-600">
                              예상 개선: {suggestion.estimatedImprovement}%
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <strong>패턴:</strong> <code className="bg-gray-100 px-1 rounded">{suggestion.suggestedPattern}</code>
                          </div>
                          <div className="text-xs text-gray-500">
                            기반 상호작용: {suggestion.basedOnInteractions.length}개 | 
                            상태: {suggestion.status} | 
                            생성: {new Date(suggestion.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => approveSuggestion(suggestion.id)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded
                                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => rejectSuggestion(suggestion.id, '테스트 거부')}
                            disabled={isLoading}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded
                                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            거부
                          </button>
                          <button
                            onClick={() => startABTest(suggestion)}
                            disabled={isLoading}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded
                                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            A/B 테스트
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 활성 테스트 */}
            {analysisReport.activeTests.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-4">🧪 활성 A/B 테스트 ({analysisReport.activeTests.length}개)</h4>
                <div className="space-y-3">
                  {analysisReport.activeTests.map((test, index) => (
                    <div key={test.testId} className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">테스트 #{index + 1}</span>
                        <span className="text-sm text-blue-600">{test.status}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>샘플 크기: {test.sampleSize}</div>
                        <div>성공률: {(test.metrics.conversionRate * 100).toFixed(1)}%</div>
                        <div>만족도: {(test.metrics.userSatisfactionRate * 100).toFixed(1)}%</div>
                        <div>응답시간: {test.metrics.responseTime.toFixed(0)}ms</div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        시작: {new Date(test.startDate).toLocaleString()} | 
                        패턴 ID: {test.patternId.slice(-8)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 질문 유형 분석 */}
            {analysisReport.questionTypes.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-4">❓ 미처리 질문 유형 ({analysisReport.questionTypes.length}개)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisReport.questionTypes.map((type, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="font-medium mb-2">{type.category}</div>
                      <div className="text-sm text-gray-600 mb-2">
                        빈도: {type.frequency} | 커버리지: {type.currentCoverage}%
                      </div>
                      <div className="text-xs text-gray-500">
                        예시: {type.examples.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 상태 정보 */}
        <div className="mt-6 text-sm text-gray-600">
          <p>💡 이 컴포넌트는 AI 학습 시스템의 Phase 2 기능을 테스트합니다.</p>
          <p>🔍 실패 패턴 분석, 자동 패턴 제안, A/B 테스트 관리 기능을 확인할 수 있습니다.</p>
          <p>🤖 높은 신뢰도의 패턴 제안은 자동으로 승인하거나 A/B 테스트를 통해 검증할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
} 