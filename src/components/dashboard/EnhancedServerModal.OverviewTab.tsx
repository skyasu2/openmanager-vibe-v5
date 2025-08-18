/**
 * 📊 Enhanced Server Modal Overview Tab
 *
 * Server overview display component:
 * - 3D resource gauges (CPU, Memory, Disk)
 * - System information card
 * - Service status monitoring
 * - Real-time updates with animated indicators
 */

'use client';

import React from 'react';
import { Activity, Server as ServerIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ServerModal3DGauge } from '../shared/UnifiedCircularGauge';
import { ServerData, StatusTheme } from './EnhancedServerModal.types';
import { StatusLED } from './EnhancedServerModal.components';

// framer-motion을 동적 import로 처리
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => ({ default: mod.motion.div })),
  { ssr: false }
);

/**
 * Overview Tab Props
 */
interface OverviewTabProps {
  /** 서버 데이터 */
  server: ServerData;
  /** 상태별 테마 정보 */
  statusTheme: StatusTheme;
}

/**
 * 📋 Overview Tab Component
 *
 * 서버의 전반적인 상태를 한눈에 볼 수 있는 개요 탭
 * - 실시간 리소스 모니터링 (3D 게이지)
 * - 시스템 정보 및 서비스 상태
 * - 반응형 디자인 및 부드러운 애니메이션
 */
export const OverviewTab: React.FC<OverviewTabProps> = ({
  server,
  statusTheme,
}) => {
  return (
    <div className="space-y-6">
      {/* 3D 게이지들 - 개선된 디자인 */}
      <MotionDiv
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-2xl font-bold text-transparent">
            실시간 리소스 모니터링
          </h3>
          <div className="flex items-center gap-2">
            <StatusLED status="running" size={8} animated={true} />
            <span className="text-sm font-medium text-gray-600">
              실시간 업데이트 중
            </span>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 gap-8 rounded-2xl bg-gradient-to-br ${statusTheme.bgLight} border backdrop-blur-sm ${statusTheme.borderColor} p-8 shadow-xl md:grid-cols-3`}
        >
          {/* CPU 게이지 */}
          <MotionDiv
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <ServerModal3DGauge
              value={server.cpu}
              label="CPU"
              type="cpu"
              size={160}
            />
          </MotionDiv>

          {/* 메모리 게이지 */}
          <MotionDiv
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <ServerModal3DGauge
              value={server.memory}
              label="메모리"
              type="memory"
              size={160}
            />
          </MotionDiv>

          {/* 디스크 게이지 */}
          <MotionDiv
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <ServerModal3DGauge
              value={server.disk}
              label="디스크"
              type="disk"
              size={160}
            />
          </MotionDiv>
        </div>
      </MotionDiv>

      {/* 시스템 정보 - 개선된 카드 디자인 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 시스템 정보 카드 */}
        <MotionDiv
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="group"
        >
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
            {/* 배경 그라데이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-50" />

            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                  <ServerIcon className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">시스템 정보</h4>
              </div>

              <div className="space-y-4">
                {[
                  {
                    label: '운영체제',
                    value: server.os || 'Ubuntu 22.04',
                    icon: '🐧',
                  },
                  {
                    label: 'IP 주소',
                    value: server.ip || '192.168.1.100',
                    icon: '🌐',
                  },
                  {
                    label: '업타임',
                    value: server.uptime,
                    icon: '⏱️',
                  },
                  {
                    label: '마지막 업데이트',
                    value: '방금 전',
                    icon: '🔄',
                  },
                ].map((item, idx) => (
                  <MotionDiv
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className="font-medium text-gray-600">
                        {item.label}
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${
                        item.label === 'IP 주소'
                          ? 'rounded bg-gray-100 px-2 py-1 font-mono text-sm'
                          : 'text-gray-800'
                      }`}
                    >
                      {item.value}
                    </span>
                  </MotionDiv>
                ))}
              </div>
            </div>
          </div>
        </MotionDiv>

        {/* 서비스 상태 카드 */}
        <MotionDiv
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          whileHover={{ scale: 1.02, y: -4 }}
          className="group"
        >
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl">
            {/* 배경 그라데이션 효과 */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-50" />

            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2 text-green-600">
                  <Activity className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">서비스 상태</h4>
              </div>

              <div className="space-y-3">
                {server.services && server.services.length > 0 ? (
                  server.services.map((service, index) => (
                    <MotionDiv
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between rounded-lg bg-gradient-to-r from-gray-50 to-transparent p-3 transition-all hover:from-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <StatusLED
                          status={
                            service.status === 'running' ? 'running' : 'stopped'
                          }
                          size={12}
                          animated={service.status === 'running'}
                        />
                        <span className="font-semibold text-gray-700">
                          {service.name}
                        </span>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${
                          service.status === 'running'
                            ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800'
                            : service.status === 'stopped'
                              ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800'
                              : 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800'
                        }`}
                      >
                        {service.status === 'running'
                          ? '✅ 실행중'
                          : service.status === 'stopped'
                            ? '🛑 중지됨'
                            : '⏸️ 대기중'}
                      </span>
                    </MotionDiv>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <div className="mb-2 text-4xl">📭</div>
                    <div className="font-medium text-gray-500">
                      서비스 정보가 없습니다
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
};
