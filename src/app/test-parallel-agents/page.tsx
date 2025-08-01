'use client';

import { useState } from 'react';
import {
  AgentProgressDisplay,
  ParallelTaskDashboard,
} from '@/components/agent/AgentProgressDisplay';
import { agentExecutor } from '@/lib/agent-executor';
import type { SubAgentType } from '@/types/agent-types';

export default function TestParallelAgentsPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runParallelTest = async () => {
    setIsRunning(true);
    setResults([]);

    const parallelTasks = [
      {
        agentType: 'database-administrator' as SubAgentType,
        prompt: 'Upstash Redis 캐시 최적화 분석',
        options: { reportProgress: true, streamOutput: true },
      },
      {
        agentType: 'ux-performance-optimizer' as SubAgentType,
        prompt: 'Core Web Vitals 성능 측정',
        options: { reportProgress: true, streamOutput: true },
      },
      {
        agentType: 'security-auditor' as SubAgentType,
        prompt: '보안 취약점 스캔',
        options: { reportProgress: true, streamOutput: true },
      },
      {
        agentType: 'code-review-specialist' as SubAgentType,
        prompt: 'SOLID 원칙 준수 검사',
        options: { reportProgress: true, streamOutput: true },
      },
    ];

    try {
      const executionResults =
        await agentExecutor.executeParallel(parallelTasks);
      setResults(executionResults);
    } catch (error) {
      console.error('병렬 실행 오류:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-white">
          🚀 서브에이전트 병렬 실행 테스트
        </h1>

        <div className="mb-8 rounded-lg bg-gray-900 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">
            WSL 터미널 최적화 상태
          </h2>
          <ul className="space-y-2 text-gray-300">
            <li>✅ console.clear() 제거 - 화면 깜빡임 방지</li>
            <li>✅ 업데이트 주기 5초로 변경 - CPU 사용량 감소</li>
            <li>✅ 변경된 진행률만 출력 - 불필요한 렌더링 방지</li>
            <li>✅ 병렬 작업 대시보드 - 실시간 모니터링</li>
          </ul>
        </div>

        <div className="mb-8">
          <button
            onClick={runParallelTest}
            disabled={isRunning}
            className={`rounded-lg px-6 py-3 font-medium text-white transition-colors ${
              isRunning
                ? 'cursor-not-allowed bg-gray-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRunning ? '실행 중...' : '병렬 테스트 시작'}
          </button>
        </div>

        {/* 실시간 진행 상황 표시 */}
        <div className="space-y-8">
          <AgentProgressDisplay showCompleted={false} />
          <ParallelTaskDashboard />
        </div>

        {/* 실행 결과 */}
        {results.length > 0 && (
          <div className="mt-8 rounded-lg bg-gray-900 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">실행 결과</h2>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`rounded-lg border p-4 ${
                    result.success
                      ? 'border-green-500 bg-green-950'
                      : 'border-red-500 bg-red-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">
                      {result.agentType}
                    </h3>
                    <span
                      className={`text-sm ${
                        result.success ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {result.success ? '✅ 성공' : '❌ 실패'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-300">
                    실행 시간: {(result.duration / 1000).toFixed(2)}초
                  </p>
                  {result.checkpoints.length > 0 && (
                    <p className="mt-1 text-sm text-gray-400">
                      체크포인트: {result.checkpoints.length}개
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
