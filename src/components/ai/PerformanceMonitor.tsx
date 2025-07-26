/**
 * 📊 AI 엔진 성능 모니터링 컴포넌트
 */

'use client';

import { useState, useEffect } from 'react';
import { getImprovedQueryEngine } from '@/services/ai/ImprovedQueryEngine';
import type { PerformanceMetrics } from '@/services/ai/ImprovedQueryEngine';

interface EngineStatus {
  local: boolean;
  googleAI: boolean;
  mcp: boolean;
  cacheSize: number;
  metrics: PerformanceMetrics;
}

export function PerformanceMonitor() {
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const engine = getImprovedQueryEngine();

    const updateStatus = async () => {
      try {
        const newStatus = await engine.getEngineStatus();
        setStatus(newStatus);
        setIsLoading(false);
      } catch (error) {
        console.error('상태 업데이트 실패:', error);
      }
    };

    // 초기 로드
    updateStatus();

    // 5초마다 업데이트
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading || !status) {
    return (
      <div className='p-4 bg-gray-50 rounded-lg animate-pulse'>
        <div className='h-4 bg-gray-200 rounded w-1/2 mb-2'></div>
        <div className='h-4 bg-gray-200 rounded w-3/4'></div>
      </div>
    );
  }

  const cacheHitPercentage = (status.metrics.cacheHitRate * 100).toFixed(1);
  const localUsagePercentage =
    status.metrics.engineUsage.local > 0
      ? (
          (status.metrics.engineUsage.local /
            (status.metrics.engineUsage.local +
              status.metrics.engineUsage.googleAI)) *
          100
        ).toFixed(1)
      : '0';

  return (
    <div className='p-6 bg-white rounded-lg shadow-sm border border-gray-200'>
      <h3 className='text-lg font-semibold mb-4'>AI 엔진 성능 모니터</h3>

      {/* 엔진 상태 */}
      <div className='grid grid-cols-3 gap-4 mb-6'>
        <StatusIndicator
          label='Local RAG'
          status={status.local}
          detail={`${status.metrics.engineUsage.local}회 사용`}
        />
        <StatusIndicator
          label='Google AI'
          status={status.googleAI}
          detail={`${status.metrics.engineUsage.googleAI}회 사용`}
        />
        <StatusIndicator
          label='MCP Context'
          status={status.mcp}
          detail='보조 도구'
        />
      </div>

      {/* 성능 메트릭 */}
      <div className='space-y-3'>
        <MetricRow
          label='캐시 적중률'
          value={`${cacheHitPercentage}%`}
          color={parseFloat(cacheHitPercentage) > 50 ? 'green' : 'yellow'}
        />
        <MetricRow
          label='평균 응답 시간'
          value={`${status.metrics.avgResponseTime.toFixed(0)}ms`}
          color={status.metrics.avgResponseTime < 200 ? 'green' : 'yellow'}
        />
        <MetricRow
          label='Local 엔진 사용률'
          value={`${localUsagePercentage}%`}
          color='blue'
        />
        <MetricRow
          label='자동 전환 횟수'
          value={`${status.metrics.autoSwitchCount}회`}
          color='purple'
        />
        <MetricRow
          label='캐시 크기'
          value={`${status.cacheSize}/100`}
          color={status.cacheSize < 80 ? 'green' : 'yellow'}
        />
      </div>

      {/* 최적화 제안 */}
      {status.metrics.avgResponseTime > 500 && (
        <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded'>
          <p className='text-sm text-yellow-800'>
            💡 평균 응답 시간이 높습니다. 캐시 활용을 늘리거나 쿼리 복잡도를
            낮추는 것을 고려해보세요.
          </p>
        </div>
      )}

      {parseFloat(cacheHitPercentage) < 30 && (
        <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded'>
          <p className='text-sm text-blue-800'>
            💡 캐시 적중률이 낮습니다. 자주 사용되는 쿼리를 분석하여 프리로딩을
            고려해보세요.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusIndicator({
  label,
  status,
  detail,
}: {
  label: string;
  status: boolean;
  detail: string;
}) {
  return (
    <div className='text-center'>
      <div
        className={`w-3 h-3 rounded-full mx-auto mb-1 ${
          status ? 'bg-green-500' : 'bg-gray-300'
        }`}
      />
      <div className='text-sm font-medium'>{label}</div>
      <div className='text-xs text-gray-500'>{detail}</div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colorClasses = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  };

  return (
    <div className='flex justify-between items-center'>
      <span className='text-sm text-gray-600'>{label}</span>
      <span
        className={`text-sm font-medium ${colorClasses[color as keyof typeof colorClasses]}`}
      >
        {value}
      </span>
    </div>
  );
}
