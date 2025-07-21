/**
 * 🧪 AI 엔진 테스트 페이지
 * SimplifiedQueryEngine 동작 확인용
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Brain, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestAIPage() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'local' | 'google-ai'>('local');

  // 예시 질의들
  const exampleQueries = [
    'CPU 사용률이 높은 서버는?',
    '메모리 확인 명령어는?',
    '전체 서버 상태 요약해줘',
    '서버 성능 최적화 방법은?',
    'db-server-01의 상태는?',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
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
          mode,
          includeContext: true,
          options: {
            includeMCPContext: false,
            useCache: true,
          },
        }),
      });

      const data = await res.json();
      setResponse(data);
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
    <div className='min-h-screen bg-gray-950 text-white p-8'>
      <div className='max-w-4xl mx-auto'>
        {/* 헤더 */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2 flex items-center gap-2'>
            <Brain className='w-8 h-8 text-purple-400' />
            AI 엔진 테스트
          </h1>
          <p className='text-gray-400'>
            SimplifiedQueryEngine 자연어 질의 응답 테스트
          </p>
        </div>

        {/* 모드 선택 */}
        <div className='mb-6 flex gap-4'>
          <button
            onClick={() => setMode('local')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              mode === 'local'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            로컬 모드 (룰 + RAG)
          </button>
          <button
            onClick={() => setMode('google-ai')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              mode === 'google-ai'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Google AI 모드
          </button>
        </div>

        {/* 질의 입력 폼 */}
        <form onSubmit={handleSubmit} className='mb-8'>
          <div className='flex gap-2'>
            <input
              type='text'
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='질문을 입력하세요...'
              className='flex-1 px-4 py-3 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
              disabled={loading}
            />
            <button
              type='submit'
              disabled={loading || !query.trim()}
              className='px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
              {loading ? (
                <Loader2 className='w-5 h-5 animate-spin' />
              ) : (
                <Send className='w-5 h-5' />
              )}
              전송
            </button>
          </div>
        </form>

        {/* 예시 질의 버튼들 */}
        <div className='mb-8'>
          <p className='text-sm text-gray-400 mb-2'>예시 질의:</p>
          <div className='flex flex-wrap gap-2'>
            {exampleQueries.map((example, idx) => (
              <button
                key={idx}
                onClick={() => setQuery(example)}
                className='px-3 py-1 text-sm bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors'
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* 응답 표시 */}
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='space-y-4'
          >
            {/* 상태 표시 */}
            <div
              className={`p-4 rounded-lg ${
                response.success
                  ? 'bg-green-900/20 border border-green-800'
                  : 'bg-red-900/20 border border-red-800'
              }`}
            >
              <div className='flex items-center gap-2'>
                {response.success ? (
                  <CheckCircle className='w-5 h-5 text-green-400' />
                ) : (
                  <AlertCircle className='w-5 h-5 text-red-400' />
                )}
                <span className='font-semibold'>
                  {response.success ? '성공' : '실패'}
                </span>
                {response.engine && (
                  <span className='text-sm text-gray-400'>
                    (엔진: {response.engine})
                  </span>
                )}
              </div>
            </div>

            {/* 응답 내용 */}
            {response.success ? (
              <>
                <div className='p-4 bg-gray-800 rounded-lg'>
                  <h3 className='font-semibold mb-2'>응답:</h3>
                  <pre className='whitespace-pre-wrap text-gray-300'>
                    {response.response}
                  </pre>
                </div>

                {/* 메타데이터 */}
                <div className='p-4 bg-gray-800 rounded-lg'>
                  <h3 className='font-semibold mb-2'>메타데이터:</h3>
                  <div className='space-y-1 text-sm text-gray-400'>
                    <div>신뢰도: {(response.confidence * 100).toFixed(1)}%</div>
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
                  <div className='p-4 bg-gray-800 rounded-lg'>
                    <h3 className='font-semibold mb-2'>생각 과정:</h3>
                    <div className='space-y-2'>
                      {response.thinkingSteps.map((step: any, idx: number) => (
                        <div
                          key={idx}
                          className='flex items-center gap-2 text-sm'
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
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
                            <span className='text-gray-500'>
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
              <div className='p-4 bg-gray-800 rounded-lg'>
                <h3 className='font-semibold mb-2 text-red-400'>에러:</h3>
                <p className='text-gray-300'>
                  {response.error || '알 수 없는 오류'}
                </p>
                {response.message && (
                  <p className='text-sm text-gray-400 mt-2'>
                    {response.message}
                  </p>
                )}
              </div>
            )}

            {/* 원본 응답 (디버그용) */}
            <details className='p-4 bg-gray-900 rounded-lg'>
              <summary className='cursor-pointer text-sm text-gray-400'>
                원본 응답 데이터
              </summary>
              <pre className='mt-2 text-xs overflow-auto'>
                {JSON.stringify(response, null, 2)}
              </pre>
            </details>
          </motion.div>
        )}
      </div>
    </div>
  );
}
