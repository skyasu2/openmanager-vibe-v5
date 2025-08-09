/**
 * ⚙️ Enhanced Server Modal Processes Tab
 * 
 * Running processes monitoring tab:
 * - Process list with CPU and memory usage
 * - Real-time process monitoring with progress bars
 * - Color-coded usage indicators
 * - Responsive table layout with smooth animations
 */

'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RealtimeData, ProcessData } from './EnhancedServerModal.types';

// framer-motion을 동적 import로 처리
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.div })),
  { ssr: false }
);

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
export const ProcessesTab: React.FC<ProcessesTabProps> = ({
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
            실행 중인 프로세스
          </h3>
          
          {/* 프로세스 개수 표시 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">총 프로세스:</span>
            <span className="font-bold text-gray-800">{realtimeData.processes.length}</span>
          </div>
        </div>

        {/* 프로세스 테이블 */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* 테이블 헤더 */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
            <div className="grid grid-cols-4 gap-4 text-white font-semibold">
              <div>프로세스 이름</div>
              <div>PID</div>
              <div>CPU 사용률</div>
              <div>메모리 사용률</div>
            </div>
          </div>

          {/* 프로세스 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {realtimeData.processes.length > 0 ? (
              realtimeData.processes.map((process: ProcessData, idx: number) => (
                <MotionDiv
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  {/* 프로세스 이름 */}
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    {process.name}
                  </div>

                  {/* PID */}
                  <div className="text-gray-600 font-mono text-sm">
                    #{process.pid}
                  </div>

                  {/* CPU 사용률 */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${getUsageColor(process.cpu)}`}
                        style={{ width: `${Math.min(100, Math.max(0, process.cpu))}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {process.cpu.toFixed(1)}%
                    </span>
                  </div>

                  {/* 메모리 사용률 */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${getMemoryColor(process.memory)}`}
                        style={{ width: `${Math.min(100, Math.max(0, process.memory))}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {process.memory.toFixed(1)}%
                    </span>
                  </div>
                </MotionDiv>
              ))
            ) : (
              /* 프로세스 없음 상태 */
              <div className="py-12 text-center">
                <div className="text-6xl mb-4">⚙️</div>
                <div className="text-gray-500 font-medium text-lg mb-2">
                  실행 중인 프로세스가 없습니다
                </div>
                <div className="text-gray-400 text-sm">
                  서버가 대기 상태이거나 프로세스 정보를 가져올 수 없습니다
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 프로세스 통계 요약 */}
        {realtimeData.processes.length > 0 && (
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
          >
            {/* 총 프로세스 수 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 font-medium">총 프로세스</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {realtimeData.processes.length}
                  </div>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">⚙️</span>
                </div>
              </div>
            </div>

            {/* 평균 CPU 사용률 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 font-medium">평균 CPU</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {(
                      realtimeData.processes.reduce((sum, p) => sum + p.cpu, 0) / 
                      realtimeData.processes.length
                    ).toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">🔥</span>
                </div>
              </div>
            </div>

            {/* 평균 메모리 사용률 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 font-medium">평균 메모리</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {(
                      realtimeData.processes.reduce((sum, p) => sum + p.memory, 0) / 
                      realtimeData.processes.length
                    ).toFixed(1)}%
                  </div>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">💾</span>
                </div>
              </div>
            </div>
          </MotionDiv>
        )}
      </MotionDiv>
    </div>
  );
};