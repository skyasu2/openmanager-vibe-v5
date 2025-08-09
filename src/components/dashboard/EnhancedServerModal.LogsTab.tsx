/**
 * 📋 Enhanced Server Modal Logs Tab
 * 
 * Real-time log streaming tab:
 * - Live log stream with color-coded levels (info/warn/error)
 * - Terminal-style dark theme interface
 * - Smooth animations for log entries
 * - Log level indicators and timestamp formatting
 */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RealtimeData, LogEntry, LogLevel } from './EnhancedServerModal.types';

// framer-motion을 동적 import로 처리
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.div })),
  { ssr: false }
);

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
    case 'info':
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
    return isNaN(date.getTime())
      ? new Date().toLocaleTimeString()
      : date.toLocaleTimeString();
  } catch {
    return new Date().toLocaleTimeString();
  }
};

/**
 * 📋 Logs Tab Component
 * 
 * 서버의 실시간 로그를 터미널 스타일로 표시하는 탭
 * - 로그 레벨별 색상 구분 (INFO/WARN/ERROR)
 * - 어두운 테마의 터미널 스타일
 * - 타임스탬프 및 소스 정보 표시
 * - 스크롤 가능한 로그 스트림
 */
export const LogsTab: React.FC<LogsTabProps> = ({
  realtimeData,
}) => {
  return (
    <div className="space-y-6">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* 헤더 섹션 */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
            실시간 로그 스트림
          </h3>
          
          {/* 로그 레벨 범례 */}
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
              <span className="text-xs text-gray-600">오류</span>
            </div>
          </div>
        </div>

        {/* 로그 콘솔 영역 */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          {/* 터미널 스타일 배경 */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
          
          {/* 로그 스트림 컨테이너 */}
          <div className="relative h-[500px] overflow-y-auto p-6 font-mono text-sm">
            {realtimeData.logs.length > 0 ? (
              realtimeData.logs.map((log: LogEntry, idx: number) => {
                const styles = getLogLevelStyles(log.level);
                
                return (
                  <MotionDiv
                    key={idx}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`mb-3 flex items-start gap-3 p-3 rounded-lg backdrop-blur-sm ${styles.containerClass}`}
                  >
                    {/* 로그 레벨 배지 */}
                    <div className="flex-shrink-0">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${styles.badgeClass}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </div>

                    {/* 로그 내용 */}
                    <div className="flex-1">
                      {/* 타임스탬프 및 소스 */}
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-gray-400 text-xs">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <span className="text-blue-400 text-xs font-semibold">
                          [{log.source}]
                        </span>
                      </div>

                      {/* 로그 메시지 */}
                      <div className={styles.textClass}>
                        {log.message}
                      </div>
                    </div>
                  </MotionDiv>
                );
              })
            ) : (
              /* 로그 없음 상태 */
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4 opacity-50">📋</div>
                  <div className="text-gray-400 font-medium text-lg mb-2">
                    로그 데이터가 없습니다
                  </div>
                  <div className="text-gray-500 text-sm">
                    서버에서 아직 로그가 생성되지 않았거나 로그 수집이 비활성화되어 있습니다
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 스크롤 인디케이터 (하단 그라데이션) */}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
        </div>

        {/* 로그 통계 요약 */}
        {realtimeData.logs.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6"
          >
            {/* 총 로그 수 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 font-medium">총 로그</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {realtimeData.logs.length}
                  </div>
                </div>
                <div className="p-2 bg-gray-100 rounded-lg">
                  <span className="text-2xl">📋</span>
                </div>
              </div>
            </div>

            {/* INFO 로그 수 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 font-medium">정보</div>
                  <div className="text-2xl font-bold text-green-600">
                    {realtimeData.logs.filter(log => log.level === 'info').length}
                  </div>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">ℹ️</span>
                </div>
              </div>
            </div>

            {/* WARN 로그 수 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 font-medium">경고</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {realtimeData.logs.filter(log => log.level === 'warn').length}
                  </div>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">⚠️</span>
                </div>
              </div>
            </div>

            {/* ERROR 로그 수 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 font-medium">오류</div>
                  <div className="text-2xl font-bold text-red-600">
                    {realtimeData.logs.filter(log => log.level === 'error').length}
                  </div>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-2xl">🚨</span>
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </MotionDiv>
    </div>
  );
};