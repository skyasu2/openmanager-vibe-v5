'use client';

import type { FC } from 'react';
import { useEffect, useState } from 'react';
/**
 * 📋 Enhanced Server Modal Logs Tab (v3.0 - 시나리오 기반)
 *
 * 서버 로그 탭:
 * - 시나리오 기반 로그 생성 (DB 비용 0원)
 * - 메트릭 기반 시스템 알림
 * - 색상별 로그 레벨 구분 (info/warn/error)
 *
 * ✅ v3.0 변경사항:
 * - Supabase 조회 제거 → 시나리오 기반 생성
 * - hourly-data의 scenario 필드 활용
 * - 비용 절감 (API 호출 0)
 *
 * @refactored 2026-01-03 - 시나리오 기반 로그 생성
 */
import {
  generateScenarioLogs,
  getCurrentScenario,
} from '@/services/scenario/scenario-loader';
import type {
  LogEntry,
  LogLevel,
  RealtimeData,
} from './EnhancedServerModal.types';

/**
 * Logs Tab Props
 */
interface LogsTabProps {
  /** 서버 ID */
  serverId: string;
  /** 서버 메트릭 */
  serverMetrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  /** 실시간 데이터 (시스템 알림용) */
  realtimeData: RealtimeData;
}

/**
 * 📊 로그 레벨별 색상 및 스타일 구성
 */
const getLogLevelStyles = (level: LogLevel) => {
  switch (level) {
    case 'error':
      return {
        containerClass: 'bg-red-500/10 border-l-4 border-red-500',
        badgeClass: 'bg-red-500 text-white',
        textClass: 'text-red-300',
      };
    case 'warn':
      return {
        containerClass: 'bg-yellow-500/10 border-l-4 border-yellow-500',
        badgeClass: 'bg-yellow-500 text-white',
        textClass: 'text-yellow-300',
      };
    default:
      return {
        containerClass: 'bg-green-500/10 border-l-4 border-green-500',
        badgeClass: 'bg-green-500 text-white',
        textClass: 'text-green-300',
      };
  }
};

/**
 * 🕐 안전한 타임스탬프 포맷팅
 */
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime())
      ? new Date().toLocaleTimeString()
      : date.toLocaleTimeString();
  } catch {
    return new Date().toLocaleTimeString();
  }
};

/**
 * 📋 Logs Tab Component (v3.0)
 *
 * 시나리오 기반 로그를 표시하는 탭
 * - 시나리오 로그: hourly-data 기반 동적 생성
 * - 시스템 알림: 메트릭 임계값 기반 자동 생성
 */
export const LogsTab: FC<LogsTabProps> = ({
  serverId,
  serverMetrics,
  realtimeData,
}) => {
  const [activeView, setActiveView] = useState<'scenario' | 'alerts'>(
    'scenario'
  );
  const [_currentScenario, setCurrentScenario] = useState<string>('');
  const [scenarioLogs, setScenarioLogs] = useState<LogEntry[]>([]);

  // 시나리오 로그 생성
  useEffect(() => {
    const loadScenario = async () => {
      const scenario = await getCurrentScenario();
      if (scenario) {
        setCurrentScenario(scenario.scenario);
        const logs = generateScenarioLogs(
          scenario.scenario,
          serverMetrics,
          serverId
        );
        setScenarioLogs(logs);
      }
    };

    loadScenario();

    // 1분마다 갱신
    const interval = setInterval(loadScenario, 60000);
    return () => clearInterval(interval);
  }, [serverId, serverMetrics]);

  // 표시할 로그 결정
  const displayLogs =
    activeView === 'scenario' ? scenarioLogs : realtimeData.logs;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        {/* 헤더 섹션 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="bg-linear-to-r from-gray-700 to-gray-900 bg-clip-text text-2xl font-bold text-transparent">
              📋 서버 로그
            </h3>
            {/* 뷰 전환 버튼 */}
            <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setActiveView('scenario')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  activeView === 'scenario'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                📝 실시간 로그
              </button>
              <button
                type="button"
                onClick={() => setActiveView('alerts')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  activeView === 'alerts'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🔔 시스템 알림
              </button>
            </div>
            {/* 현재 상태 표시 - 내부용으로만 사용 */}
          </div>

          {/* 알림 레벨 범례 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-600">정보</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-xs text-gray-600">경고</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-xs text-gray-600">위험</span>
            </div>
          </div>
        </div>

        {/* 로그 콘솔 영역 */}
        <div className="relative overflow-hidden rounded-2xl shadow-2xl">
          {/* 터미널 스타일 배경 */}
          <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-gray-800 to-black" />

          {/* 로그 스트림 컨테이너 */}
          <div className="relative h-[500px] overflow-y-auto p-6 font-mono text-sm">
            {displayLogs.length > 0 ? (
              displayLogs.map((log: LogEntry, idx: number) => {
                const styles = getLogLevelStyles(log.level);

                return (
                  <div
                    key={idx}
                    className={`animate-fade-in mb-3 flex items-start gap-3 rounded-lg p-3 backdrop-blur-sm ${styles.containerClass}`}
                    style={{ animationDelay: `${idx * 0.02}s` }}
                  >
                    {/* 로그 레벨 배지 */}
                    <div className="shrink-0">
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-bold ${styles.badgeClass}`}
                      >
                        {log.level.toUpperCase()}
                      </span>
                    </div>

                    {/* 로그 내용 */}
                    <div className="flex-1">
                      {/* 타임스탬프 및 소스 */}
                      <div className="mb-1 flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className="text-xs font-semibold text-blue-400">
                          [{log.source || 'system'}]
                        </span>
                      </div>

                      {/* 로그 메시지 */}
                      <div className={styles.textClass}>{log.message}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              /* 로그 없음 상태 */
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 text-6xl opacity-50">
                    {activeView === 'scenario' ? '📋' : '✅'}
                  </div>
                  <div className="mb-2 text-lg font-medium text-gray-400">
                    {activeView === 'scenario'
                      ? '로그 로딩 중...'
                      : '시스템 알림이 없습니다'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {activeView === 'scenario'
                      ? '서버 상태에 맞는 로그를 가져오는 중입니다'
                      : '모든 시스템 지표가 정상 범위 내에 있습니다'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 스크롤 인디케이터 */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-gray-900 to-transparent" />
        </div>

        {/* 로그 통계 요약 */}
        {displayLogs.length > 0 && (
          <div
            className="animate-fade-in mt-6 grid grid-cols-1 gap-4 md:grid-cols-4"
            style={{ animationDelay: '0.3s' }}
          >
            {/* 총 로그 수 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    {activeView === 'scenario' ? '실시간 로그' : '총 알림'}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {displayLogs.length}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-100 p-2">
                  <span className="text-2xl">
                    {activeView === 'scenario' ? '📋' : '🔔'}
                  </span>
                </div>
              </div>
            </div>

            {/* INFO 수 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">정보</div>
                  <div className="text-2xl font-bold text-green-600">
                    {displayLogs.filter((log) => log.level === 'info').length}
                  </div>
                </div>
                <div className="rounded-lg bg-green-100 p-2">
                  <span className="text-2xl">ℹ️</span>
                </div>
              </div>
            </div>

            {/* WARN 수 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">경고</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {displayLogs.filter((log) => log.level === 'warn').length}
                  </div>
                </div>
                <div className="rounded-lg bg-yellow-100 p-2">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>

            {/* ERROR 수 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">위험</div>
                  <div className="text-2xl font-bold text-red-600">
                    {displayLogs.filter((log) => log.level === 'error').length}
                  </div>
                </div>
                <div className="rounded-lg bg-red-100 p-2">
                  <span className="text-2xl">🚨</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
