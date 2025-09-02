/**
 * 🧪 AI 엔진 테스트 페이지
 * SimplifiedQueryEngine 동작 확인용
 */

'use client';

import { useState, type FormEvent } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import { Send, Loader2, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { MCPQueryResponse, ApiResponse } from '@/types/api-responses';

// AI 테스트 페이지 전용 응답 타입
interface AITestResponse {
  success: boolean;
  engine?: string;
  response?: string;
  confidence?: number;
  metadata?: {
    totalTime: number;
    cacheHit: boolean;
    mcpUsed: boolean;
  };
  thinkingSteps?: Array<{
    status: 'completed' | 'error' | 'pending';
    step: string;
    duration?: number;
  }>;
  error?: string;
  message?: string;
}

// 타입 가드 함수
function isAITestResponse(data: unknown): data is AITestResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'success' in data &&
    typeof (data as any).success === 'boolean'
  );
}

export default function TestAIPage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<AITestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [_mode, setMode] = useState<'local' | 'google-ai'>('local');

  // 예시 질의들
  const exampleQueries = [
    'CPU 사용률이 높은 서버는?',
    '메모리 확인 명령어는?',
    '전체 서버 상태 요약해줘',
    '서버 성능 최적화 방법은?',
    'db-server-01의 상태는?',
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          mode: _mode,
          includeContext: true,
          options: {
            includeMCPContext: false,
            useCache: true,
          },
        }),
      });

      const data = await res.json();
      if (isAITestResponse(data)) {
        setResponse(data);
      } else {
        setResponse({
          success: false,
          error: '응답 형식이 올바르지 않습니다.',
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setResponse({
        success: false,
        error: '요청 처리 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-white">
      <div className="mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="mb-2 flex items-center gap-2 text-3xl font-bold">
            <Brain className="h-8 w-8 text-purple-400" />
            AI 엔진 테스트
          </h1>
          <p className="text-gray-400">
            SimplifiedQueryEngine 자연어 질의 응답 테스트
          </p>
        </div>

        {/* 모드 선택 */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setMode('local')}
            className={`rounded-lg px-4 py-2 transition-colors ${
              _mode === 'local'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            로컬 모드 (룰 + RAG)
          </button>
          <button
            onClick={() => setMode('google-ai')}
            className={`rounded-lg px-4 py-2 transition-colors ${
              _mode === 'google-ai'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Google AI 모드
          </button>
        </div>

        {/* 질의 입력 폼 */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="질문을 입력하세요..."
              className="flex-1 rounded-lg bg-gray-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              전송
            </button>
          </div>
        </form>

        {/* 예시 질의 버튼들 */}
        <div className="mb-8">
          <p className="mb-2 text-sm text-gray-400">예시 질의:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className="rounded-lg bg-gray-800 px-3 py-1 text-sm transition-colors hover:bg-gray-700"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* 응답 표시 */}
        {response && (
          <div className="space-y-4 animate-fade-in">
            {/* framer-motion 제거: CSS 애니메이션 사용 */}
            {/* 상태 표시 */}
            <div
              className={`rounded-lg p-4 ${
                response.success
                  ? 'border border-green-800 bg-green-900/20'
                  : 'border border-red-800 bg-red-900/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {response.success ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
                <span className="font-semibold">
                  {response.success ? '성공' : '실패'}
                </span>
                {response.engine && (
                  <span className="text-sm text-gray-400">
                    (엔진: {response.engine})
                  </span>
                )}
              </div>
            </div>

            {/* 응답 내용 */}
            {response.success ? (
              <>
                <div className="rounded-lg bg-gray-800 p-4">
                  <h3 className="mb-2 font-semibold">응답:</h3>
                  <pre className="whitespace-pre-wrap text-gray-300">
                    {response.response}
                  </pre>
                </div>

                {/* 메타데이터 */}
                <div className="rounded-lg bg-gray-800 p-4">
                  <h3 className="mb-2 font-semibold">메타데이터:</h3>
                  <div className="space-y-1 text-sm text-gray-400">
                    <div>
                      신뢰도: {((response.confidence || 0) * 100).toFixed(1)}%
                    </div>
                    {response.metadata && (
                      <>
                        <div>처리 시간: {response.metadata.totalTime}ms</div>
                        <div>
                          캐시 사용:{' '}
                          {response.metadata.cacheHit ? '예' : '아니오'}
                        </div>
                        <div>
                          MCP 사용:{' '}
                          {response.metadata.mcpUsed ? '예' : '아니오'}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 생각 과정 */}
                {response.thinkingSteps && (
                  <div className="rounded-lg bg-gray-800 p-4">
                    <h3 className="mb-2 font-semibold">생각 과정:</h3>
                    <div className="space-y-2">
                      {response.thinkingSteps.map((step, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div
                            className={`h-2 w-2 rounded-full ${
                              step.status === 'completed'
                                ? 'bg-green-400'
                                : step.status === 'error'
                                  ? 'bg-red-400'
                                  : 'bg-yellow-400'
                            }`}
                          />
                          <span>
                            {idx + 1}. {step.step}
                          </span>
                          {step.duration && (
                            <span className="text-gray-500">
                              ({step.duration}ms)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg bg-gray-800 p-4">
                <h3 className="mb-2 font-semibold text-red-400">에러:</h3>
                <p className="text-gray-300">
                  {response.error || '알 수 없는 오류'}
                </p>
                {response.message && (
                  <p className="mt-2 text-sm text-gray-400">
                    {response.message}
                  </p>
                )}
              </div>
            )}

            {/* 원본 응답 (디버그용) */}
            <details className="rounded-lg bg-gray-900 p-4">
              <summary className="cursor-pointer text-sm text-gray-400">
                원본 응답 데이터
              </summary>
              <pre className="mt-2 overflow-auto text-xs">
                {JSON.stringify(response, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
