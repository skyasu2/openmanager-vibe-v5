/**
 * 📈 모니터링 설정 탭 컴포넌트
 *
 * 시스템 모니터링 관련 설정을 관리하는 탭
 */

'use client';

import { motion } from 'framer-motion';
import { Monitor } from 'lucide-react';

interface SettingsData {
  metrics: {
    interval: number;
  };
  scenarios: {
    active: number;
    total: number;
  };
}

interface MonitorSettingsTabProps {
  settingsData: SettingsData;
  onMonitorCheck: () => Promise<void>;
}

export function MonitorSettingsTab({
  settingsData,
  onMonitorCheck,
}: MonitorSettingsTabProps) {
  return (
    <div className='space-y-6'>
      <div className='border border-white/10 rounded-lg p-4'>
        <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
          <Monitor className='w-5 h-5 text-cyan-400' />
          모니터링 상태
        </h3>

        <div className='space-y-4'>
          <div className='grid grid-cols-3 gap-4'>
            <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
              <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-green-400' />
              <p className='text-xs text-gray-400 mb-1'>메트릭 간격</p>
              <p className='text-lg font-medium text-white'>
                {settingsData.metrics.interval}초
              </p>
            </div>
            <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
              <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-cyan-400' />
              <p className='text-xs text-gray-400 mb-1'>활성 시나리오</p>
              <p className='text-lg font-medium text-white'>
                {settingsData.scenarios.active}/{settingsData.scenarios.total}
              </p>
            </div>
            <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
              <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-yellow-400' />
              <p className='text-xs text-gray-400 mb-1'>알림 상태</p>
              <p className='text-sm font-medium text-white'>활성화</p>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3'>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMonitorCheck}
              className='px-4 py-3 bg-cyan-500/20 text-cyan-300 rounded-lg font-medium hover:bg-cyan-500/30 transition-colors text-sm border border-cyan-500/30'
            >
              <div className='flex flex-col items-center gap-1'>
                <span className='font-semibold'>📈 모니터링 최적화</span>
                <span className='text-xs text-cyan-200'>
                  메트릭 수집 간격과 알림 임계값을 자동으로 최적화합니다
                </span>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
