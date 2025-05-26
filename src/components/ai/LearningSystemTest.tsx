'use client';

import { useState, useEffect } from 'react';
import { InteractionLogger } from '@/services/ai-agent/logging/InteractionLogger';
import { LearningMetrics, FailurePattern } from '@/types/ai-learning';
import FeedbackButtons from './FeedbackButtons';

export default function LearningSystemTest() {
  const [metrics, setMetrics] = useState<LearningMetrics | null>(null);
  const [failurePatterns, setFailurePatterns] = useState<FailurePattern[]>([]);
  const [testInteractionId, setTestInteractionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const logger = InteractionLogger.getInstance();

  // 컴포넌트 마운트 시 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      logger.loadFromLocalStorage();
      loadMetrics();
      loadFailurePatterns();
    }
  }, []);

  const loadMetrics = async () => {
    try {
      const metricsData = await logger.getLearningMetrics();
      setMetrics(metricsData);
    } catch (error) {
      console.error('메트릭 로드 실패:', error);
    }
  };

  const loadFailurePatterns = async () => {
    try {
      const patterns = await logger.getFailurePatterns();
      setFailurePatterns(patterns);
    } catch (error) {
      console.error('실패 패턴 로드 실패:', error);
    }
  };

  const createTestInteraction = async () => {
    setIsLoading(true);
    try {
      const testQuestions = [
        "서버 상태를 확인해 주세요",
        "CPU 사용률이 높은 서버는 어디인가요?",
        "메모리 부족 문제를 해결해 주세요",
        "네트워크 지연이 발생하고 있나요?",
        "자동 장애 보고서를 생성해 주세요"
      ];

      const randomQuestion = testQuestions[Math.floor(Math.random() * testQuestions.length)];
      const testAnswer = `"${randomQuestion}"에 대한 AI 응답입니다. 이는 테스트용 응답으로, 실제 AI 에이전트의 응답을 시뮬레이션합니다.`;

      const id = await logger.logInteraction({
        query: randomQuestion,
        intent: 'server_status',
        confidence: Math.random() * 0.4 + 0.6, // 0.6 ~ 1.0
        response: testAnswer,
        contextData: {
          serverState: { totalServers: 20, activeServers: 18 },
          activeMetrics: ['cpu', 'memory', 'network'],
          timeOfDay: new Date().toLocaleTimeString(),
          userRole: 'admin',
          sessionId: 'test_session_' + Date.now()
        },
        responseTime: Math.floor(Math.random() * 2000) + 500 // 500ms ~ 2500ms
      });

      setTestInteractionId(id);
      await loadMetrics();
      
      console.log('✅ 테스트 상호작용 생성 완료:', id);
    } catch (error) {
      console.error('❌ 테스트 상호작용 생성 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const csvData = await logger.exportData();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-learning-data.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ 데이터 내보내기 완료');
    } catch (error) {
      console.error('❌ 데이터 내보내기 실패:', error);
    }
  };

  const clearAllData = () => {
    if (confirm('모든 학습 데이터를 삭제하시겠습니까?')) {
      localStorage.removeItem('ai-learning-data');
      setMetrics(null);
      setFailurePatterns([]);
      setTestInteractionId(null);
      console.log('🗑️ 모든 데이터가 삭제되었습니다.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🧠 AI 학습 시스템 테스트
        </h2>
        
        {/* 제어 버튼들 */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={createTestInteraction}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '생성 중...' : '테스트 상호작용 생성'}
          </button>
          
          <button
            onClick={loadMetrics}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md
                     transition-colors"
          >
            메트릭 새로고침
          </button>
          
          <button
            onClick={exportData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md
                     transition-colors"
          >
            데이터 내보내기
          </button>
          
          <button
            onClick={clearAllData}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md
                     transition-colors"
          >
            모든 데이터 삭제
          </button>
        </div>

        {/* 학습 메트릭 표시 */}
        {metrics && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 학습 메트릭</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.totalInteractions}</div>
                <div className="text-sm text-gray-600">총 상호작용</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.successRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">성공률</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.averageResponseTime.toFixed(0)}ms
                </div>
                <div className="text-sm text-gray-600">평균 응답시간</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.userSatisfactionScore.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">사용자 만족도</div>
              </div>
            </div>
          </div>
        )}

        {/* 테스트 피드백 버튼 */}
        {testInteractionId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🧪 테스트 피드백 (ID: {testInteractionId.slice(-8)})
            </h3>
            <FeedbackButtons 
              responseId={testInteractionId}
              onFeedback={(feedback) => {
                console.log('테스트 피드백 수신:', feedback);
                loadMetrics();
                loadFailurePatterns();
              }}
            />
          </div>
        )}

        {/* 실패 패턴 표시 */}
        {failurePatterns.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              ⚠️ 실패 패턴 ({failurePatterns.length}개)
            </h3>
            <div className="space-y-2">
              {failurePatterns.slice(0, 5).map((pattern, index) => (
                <div key={pattern.id} className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-800">
                        패턴: {pattern.pattern}
                      </div>
                      <div className="text-sm text-gray-600">
                        빈도: {pattern.frequency}회 | 신뢰도: {pattern.confidence}
                      </div>
                      <div className="text-sm text-blue-600">
                        {pattern.suggestedImprovement}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {pattern.lastOccurrence.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상태 정보 */}
        <div className="mt-6 text-sm text-gray-600">
          <p>💡 이 컴포넌트는 AI 학습 시스템의 Phase 1 기능을 테스트합니다.</p>
          <p>📝 상호작용 로깅, 피드백 수집, 메트릭 계산, 실패 패턴 분석을 확인할 수 있습니다.</p>
          <p>🔄 데이터는 브라우저의 로컬 스토리지에 저장됩니다.</p>
        </div>
      </div>
    </div>
  );
}