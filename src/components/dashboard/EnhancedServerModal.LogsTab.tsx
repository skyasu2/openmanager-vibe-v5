'use client';

import type { FC } from 'react';
/**
 * 🔔 Enhanced Server Modal System Alerts Tab
 *
 * 메트릭 기반 시스템 알림 탭:
 * - CPU/Memory/Disk/Network 임계값 기반 자동 생성 알림
 * - 실시간 시스템 상태 모니터링
 * - 색상별 알림 레벨 구분 (info/warn/error)
 *
 * ⚠️ 참고: 이 탭은 실제 서버 로그가 아닌 메트릭 기반 자동 생성 알림입니다.
 *
 * @refactored 2025-12-31 - 로그 → 시스템 알림으로 명확화
 */
import type {
  LogEntry,
  LogLevel,
  RealtimeData,
} from './EnhancedServerModal.types';

/**
 * Logs Tab Props
 */
interface LogsTabProps {
  /** 실시간 데이터 (로그 정보 포함) */
  realtimeData: RealtimeData;
}

/**
 * 📊 로그 레벨별 색상 및 스타일 구성
 *
 * @param level - 로그 레벨 ('info' | 'warn' | 'error')
 * @returns 색상 설정 객체
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
 *
 * @param timestamp - ISO 문자열 또는 타임스탬프
 * @returns 포맷된 시간 문자열
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
 * 🔔 System Alerts Tab Component
 *
 * 서버의 메트릭 기반 시스템 알림을 표시하는 탭
 * - 알림 레벨별 색상 구분 (INFO/WARN/ERROR)
 * - 어두운 테마의 모니터링 콘솔 스타일
 * - 타임스탬프 및 소스 정보 표시
 * - 스크롤 가능한 알림 스트림
 *
 * ⚠️ 이 탭은 메트릭 임계값 기반 자동 생성 알림입니다.
 */
export const LogsTab: FC<LogsTabProps> = ({ realtimeData }) => {
  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        {/* 헤더 섹션 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="bg-linear-to-r from-gray-700 to-gray-900 bg-clip-text text-2xl font-bold text-transparent">
              🔔 시스템 알림
            </h3>
            {/* 자동 생성 알림 표시 */}
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              메트릭 기반 자동 생성
            </span>
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
            {realtimeData.logs.length > 0 ? (
              realtimeData.logs.map((log: LogEntry, idx: number) => {
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
              /* 알림 없음 상태 */
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mb-4 text-6xl opacity-50">✅</div>
                  <div className="mb-2 text-lg font-medium text-gray-400">
                    시스템 알림이 없습니다
                  </div>
                  <div className="text-sm text-gray-500">
                    모든 시스템 지표가 정상 범위 내에 있습니다
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 스크롤 인디케이터 (하단 그라데이션) */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-gray-900 to-transparent" />
        </div>

        {/* 알림 통계 요약 */}
        {realtimeData.logs.length > 0 && (
          <div
            className="animate-fade-in mt-6 grid grid-cols-1 gap-4 md:grid-cols-4"
            style={{ animationDelay: '0.3s' }}
          >
            {/* 총 알림 수 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    총 알림
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {realtimeData.logs.length}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-100 p-2">
                  <span className="text-2xl">🔔</span>
                </div>
              </div>
            </div>

            {/* INFO 알림 수 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">정보</div>
                  <div className="text-2xl font-bold text-green-600">
                    {
                      realtimeData.logs.filter((log) => log.level === 'info')
                        .length
                    }
                  </div>
                </div>
                <div className="rounded-lg bg-green-100 p-2">
                  <span className="text-2xl">ℹ️</span>
                </div>
              </div>
            </div>

            {/* WARN 알림 수 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">경고</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {
                      realtimeData.logs.filter((log) => log.level === 'warn')
                        .length
                    }
                  </div>
                </div>
                <div className="rounded-lg bg-yellow-100 p-2">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>

            {/* ERROR 알림 수 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">위험</div>
                  <div className="text-2xl font-bold text-red-600">
                    {
                      realtimeData.logs.filter((log) => log.level === 'error')
                        .length
                    }
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
