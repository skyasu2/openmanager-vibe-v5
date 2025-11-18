'use client';

import { type FC } from 'react';
/**
 * ⚙️ Enhanced Server Modal Processes Tab
 *
 * Running processes monitoring tab:
 * - Process list with CPU and memory usage
 * - Real-time process monitoring with progress bars
 * - Color-coded usage indicators
 * - Responsive table layout with smooth animations
 */
import { RealtimeData, ProcessData } from './EnhancedServerModal.types';

/**
 * Processes Tab Props
 */
interface ProcessesTabProps {
  /** 실시간 데이터 (프로세스 정보 포함) */
  realtimeData: RealtimeData;
}

/**
 * 📊 CPU/Memory 사용량에 따른 색상 결정
 *
 * @param value - 사용률 (0-100)
 * @returns CSS 클래스 문자열
 */
const getUsageColor = (value: number): string => {
  if (value > 80) return 'bg-red-500';
  if (value > 50) return 'bg-yellow-500';
  return 'bg-blue-500';
};

/**
 * 📊 메모리 전용 색상 (보라색 계열)
 *
 * @param value - 메모리 사용률 (0-100)
 * @returns CSS 클래스 문자열
 */
const getMemoryColor = (value: number): string => {
  if (value > 80) return 'bg-red-500';
  if (value > 50) return 'bg-yellow-500';
  return 'bg-purple-500';
};

/**
 * ⚙️ Processes Tab Component
 *
 * 서버에서 실행 중인 프로세스들을 표시하는 탭
 * - 프로세스명, PID, CPU, Memory 사용률 표시
 * - 사용률 기반 색상 구분 (정상/경고/위험)
 * - 실시간 애니메이션 및 진행률 바
 */
export const ProcessesTab: FC<ProcessesTabProps> = ({ realtimeData }) => {
  return (
    <div className="space-y-6">
      <div>
        {/* 헤더 섹션 */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-2xl font-bold text-transparent">
            실행 중인 프로세스
          </h3>

          {/* 프로세스 개수 표시 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">총 프로세스:</span>
            <span className="font-bold text-gray-800">
              {realtimeData.processes.length}
            </span>
          </div>
        </div>

        {/* 프로세스 테이블 */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* 테이블 헤더 */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
            <div className="grid grid-cols-4 gap-4 font-semibold text-white">
              <div>프로세스 이름</div>
              <div>PID</div>
              <div>CPU 사용률</div>
              <div>메모리 사용률</div>
            </div>
          </div>

          {/* 프로세스 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {realtimeData.processes.length > 0 ? (
              realtimeData.processes.map(
                (process: ProcessData, idx: number) => (
                  <div
                    key={idx}
                    className="grid grid-cols-4 gap-4 border-b border-gray-100 p-4 transition-colors hover:bg-gray-50"
                  >
                    {/* 프로세스 이름 */}
                    <div className="flex items-center gap-2 font-semibold text-gray-800">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      {process.name}
                    </div>

                    {/* PID */}
                    <div className="font-mono text-sm text-gray-600">
                      #{process.pid}
                    </div>

                    {/* CPU 사용률 */}
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full transition-all ${getUsageColor(process.cpu)}`}
                          style={{
                            width: `${Math.min(100, Math.max(0, process.cpu))}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {process.cpu.toFixed(1)}%
                      </span>
                    </div>

                    {/* 메모리 사용률 */}
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full transition-all ${getMemoryColor(process.memory)}`}
                          style={{
                            width: `${Math.min(100, Math.max(0, process.memory))}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {process.memory.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )
              )
            ) : (
              /* 프로세스 없음 상태 */
              <div className="py-12 text-center">
                <div className="mb-4 text-6xl">⚙️</div>
                <div className="mb-2 text-lg font-medium text-gray-500">
                  실행 중인 프로세스가 없습니다
                </div>
                <div className="text-sm text-gray-400">
                  서버가 대기 상태이거나 프로세스 정보를 가져올 수 없습니다
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 프로세스 통계 요약 */}
        {realtimeData.processes.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 총 프로세스 수 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    총 프로세스
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {realtimeData.processes.length}
                  </div>
                </div>
                <div className="rounded-lg bg-blue-100 p-2">
                  <span className="text-2xl">⚙️</span>
                </div>
              </div>
            </div>

            {/* 평균 CPU 사용률 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    평균 CPU
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {(
                      realtimeData.processes.reduce(
                        (sum, p) => sum + p.cpu,
                        0
                      ) / realtimeData.processes.length
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <div className="rounded-lg bg-orange-100 p-2">
                  <span className="text-2xl">🔥</span>
                </div>
              </div>
            </div>

            {/* 평균 메모리 사용률 */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-600">
                    평균 메모리
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {(
                      realtimeData.processes.reduce(
                        (sum, p) => sum + p.memory,
                        0
                      ) / realtimeData.processes.length
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <div className="rounded-lg bg-purple-100 p-2">
                  <span className="text-2xl">💾</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
