/**
 * System Health Dashboard
 * 
 * 🏥 시스템 상태 실시간 모니터링 컴포넌트
 * - 헬스체크 결과 시각화
 * - 자동 복구 트리거
 * - 상태 히스토리 추적
 */

'use client';

import { useState, useEffect } from 'react';

interface HealthStatus {
  isHealthy: boolean;
  serverCount: number;
  dataSource: 'api' | 'fallback' | 'none';
  lastCheck: string;
  issues: string[];
  actions: string[];
}

export function SystemHealthDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 헬스체크 실행
  const performHealthCheck = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/system/health');
      const data = await response.json();
      
      if (data.success) {
        setHealth(data.health);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // 자동 복구 실행
  const performAutoRecovery = async () => {
    setIsRecovering(true);
    try {
      const response = await fetch('/api/system/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxRetries: 3,
          retryDelayMs: 2000,
          forceInit: true,
          generateFallback: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        await performHealthCheck(); // 복구 후 재확인
      }
    } catch (error) {
      console.error('Auto recovery failed:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  // 자동 새로고침
  useEffect(() => {
    performHealthCheck();
    
    const interval = setInterval(() => {
      performHealthCheck();
    }, 30000); // 30초마다 자동 체크
    
    return () => clearInterval(interval);
  }, []);

  if (!health) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          🏥 시스템 헬스체크
        </h3>
        <div className="flex gap-2">
          <button
            onClick={performHealthCheck}
            disabled={isChecking}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isChecking ? '확인 중...' : '🔍 체크'}
          </button>
          <button
            onClick={performAutoRecovery}
            disabled={isRecovering || health.isHealthy}
            className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {isRecovering ? '복구 중...' : '🔧 자동복구'}
          </button>
        </div>
      </div>

      {/* 전체 상태 */}
      <div className={`p-4 rounded-lg mb-4 ${
        health.isHealthy 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {health.isHealthy ? '✅' : '❌'}
          </span>
          <div>
            <h4 className={`font-semibold ${
              health.isHealthy ? 'text-green-800' : 'text-red-800'
            }`}>
              {health.isHealthy ? '시스템 정상' : '시스템 이상'}
            </h4>
            <p className={`text-sm ${
              health.isHealthy ? 'text-green-600' : 'text-red-600'
            }`}>
              {health.serverCount}개 서버 | 데이터소스: {health.dataSource}
            </p>
          </div>
        </div>
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 문제점 */}
        {health.issues.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="font-medium text-yellow-800 mb-2">⚠️ 발견된 문제</h5>
            <ul className="text-sm text-yellow-700 space-y-1">
              {health.issues.map((issue, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 권장 조치 */}
        {health.actions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-800 mb-2">💡 권장 조치</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              {health.actions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 마지막 업데이트 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          마지막 업데이트: {lastUpdate.toLocaleString()}
        </p>
      </div>
    </div>
  );
} 