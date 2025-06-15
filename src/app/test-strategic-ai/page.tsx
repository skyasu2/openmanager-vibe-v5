'use client';

import { useState } from 'react';

export default function TestStrategicAI() {
  const [query, setQuery] = useState('서버 상태 확인해줘');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testStrategicAI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai-agent/strategic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          context: {
            urgency,
            source: 'test-page'
          },
          options: {
            useCache: false,
            enableThinking: true
          }
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const getSystemStatus = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai-agent/strategic?action=status');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const runTestQuery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai-agent/strategic?action=test');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎯 전략적 AI 엔진 테스트
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">새로운 아키텍처 특징</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded">
              <strong>DataProcessingOrchestrator</strong>
              <p>중앙화된 데이터 처리 관리</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <strong>StrategyFactory</strong>
              <p>4가지 처리 전략 (monitoring_focus, ai_analysis, hybrid, auto_select)</p>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <strong>UnifiedCacheManager</strong>
              <p>다중 레벨 캐싱 (L1/L2/L3)</p>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <strong>ErrorHandlingMiddleware</strong>
              <p>통합 에러 처리 및 복구</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 쿼리 테스트 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">쿼리 테스트</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  질문
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="AI에게 질문하세요..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  긴급도
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="긴급도 선택"
                >
                  <option value="low">낮음</option>
                  <option value="medium">보통</option>
                  <option value="high">높음</option>
                  <option value="critical">긴급</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={testStrategicAI}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '처리 중...' : '🎯 전략적 쿼리 실행'}
                </button>
              </div>
            </div>
          </div>

          {/* 시스템 테스트 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">시스템 테스트</h2>
            
            <div className="space-y-3">
              <button
                onClick={getSystemStatus}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📊 시스템 상태 조회
              </button>

              <button
                onClick={runTestQuery}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🧪 자동 테스트 실행
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <p><strong>시스템 상태:</strong> 전략적 아키텍처 컴포넌트 상태 확인</p>
              <p><strong>자동 테스트:</strong> 랜덤 쿼리로 시스템 성능 테스트</p>
            </div>
          </div>
        </div>

        {/* 결과 표시 */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">오류</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">결과</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* 예제 쿼리 */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">예제 쿼리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              '서버 상태 확인해줘',
              '성능 이상이 있는 서버 찾아줘',
              '전체 시스템 상태 분석해줘',
              '긴급한 문제가 있는지 확인해줘',
              'CPU 사용률이 높은 서버는?',
              '메모리 부족 서버 찾아줘'
            ].map((exampleQuery, index) => (
              <button
                key={index}
                onClick={() => setQuery(exampleQuery)}
                className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
              >
                {exampleQuery}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 