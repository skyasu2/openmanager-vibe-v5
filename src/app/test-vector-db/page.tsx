'use client';

import { useState } from 'react';

interface TestResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message?: string;
  data?: any;
  error?: string;
}

interface TestSummary {
  status: string;
  passed: number;
  total: number;
  message: string;
  error?: string;
}

export default function TestVectorDBPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);

    try {
      const response = await fetch('/api/test-vector-db');
      const data = await response.json();

      setResults(data.tests || []);
      setSummary(data.summary);
    } catch (error) {
      console.error('테스트 실행 실패:', error);
      setResults([
        {
          name: '테스트 실행',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const resetVectorDB = async () => {
    setIsRunning(true);

    try {
      const response = await fetch('/api/test-vector-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      const data = await response.json();
      alert(
        data.success ? '벡터 DB 초기화 완료' : `초기화 실패: ${data.error}`
      );
    } catch (error) {
      alert(`초기화 실패: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '⭕';
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-4xl mx-auto'>
        {/* 헤더 */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            🧪 벡터 DB & RAG 시스템 테스트
          </h1>
          <p className='text-gray-600'>
            PostgresVectorDB와 LocalRAGEngine의 동작을 테스트합니다.
          </p>
        </div>

        {/* 컨트롤 버튼 */}
        <div className='mb-6 flex gap-4'>
          <button
            onClick={runTests}
            disabled={isRunning}
            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {isRunning ? '🔄 테스트 진행 중...' : '🚀 테스트 실행'}
          </button>

          <button
            onClick={resetVectorDB}
            disabled={isRunning}
            className='px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {isRunning ? '🔄 처리 중...' : '🧹 벡터 DB 초기화'}
          </button>
        </div>

        {/* 요약 결과 */}
        {summary && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              summary.status === 'all_passed'
                ? 'bg-green-50 border-green-200'
                : summary.status === 'partial_success'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
            }`}
          >
            <h2 className='text-lg font-semibold mb-2'>📊 테스트 요약</h2>
            <p className='text-sm'>
              <strong>상태:</strong> {summary.status} |<strong> 통과:</strong>{' '}
              {summary.passed}/{summary.total} |<strong> 메시지:</strong>{' '}
              {summary.message}
            </p>
            {summary.error && (
              <p className='text-red-600 text-sm mt-1'>
                <strong>에러:</strong> {summary.error}
              </p>
            )}
          </div>
        )}

        {/* 테스트 결과 */}
        <div className='space-y-4'>
          {results.map((result, index) => (
            <div key={index} className='bg-white rounded-lg shadow border p-6'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
                  {getStatusIcon(result.status)}
                  {result.name}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}
                >
                  {result.status.toUpperCase()}
                </span>
              </div>

              {result.message && (
                <p className='text-gray-600 text-sm mb-3'>{result.message}</p>
              )}

              {result.error && (
                <p className='text-red-600 text-sm mb-3'>
                  <strong>에러:</strong> {result.error}
                </p>
              )}

              {result.data && (
                <details className='mt-3'>
                  <summary className='text-sm text-gray-500 cursor-pointer hover:text-gray-700'>
                    📋 상세 데이터 보기
                  </summary>
                  <pre className='mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40'>
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && !isRunning && (
          <div className='text-center py-12 text-gray-500'>
            <p className='text-lg mb-2'>🎯 테스트 준비 완료</p>
            <p>
              위의 &quot;테스트 실행&quot; 버튼을 클릭하여 벡터 DB 테스트를
              시작하세요.
            </p>
          </div>
        )}

        {/* 설명 */}
        <div className='mt-12 bg-white rounded-lg shadow border p-6'>
          <h3 className='text-lg font-semibold mb-3'>🔍 테스트 항목</h3>
          <ul className='space-y-2 text-sm text-gray-600'>
            <li>
              <strong>✅ PostgresVectorDB 초기화:</strong> Supabase PostgreSQL +
              pgvector 초기화
            </li>
            <li>
              <strong>❤️ 헬스 체크:</strong> 벡터 DB 상태 및 연결 확인
            </li>
            <li>
              <strong>🔄 LocalVectorDB 위임:</strong> 레거시 API가
              PostgresVectorDB로 위임되는지 확인
            </li>
            <li>
              <strong>📄 문서 저장:</strong> 벡터 문서 저장 기능 테스트
            </li>
            <li>
              <strong>🔍 벡터 검색:</strong> 코사인 유사도 기반 검색 테스트
            </li>
            <li>
              <strong>📊 통계 확인:</strong> 벡터 DB 통계 정보 조회
            </li>
            <li>
              <strong>🔄 레거시 호환성:</strong> 기존 API와의 호환성 확인
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
