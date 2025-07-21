/**
 * ⚡ 최적화 설정 탭 컴포넌트
 *
 * 시스템 성능 최적화 관련 설정을 관리하는 탭
 */

'use client';

import KoreanTimeUtil from '@/utils/koreanTime';
import { motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  CheckCircle,
  Loader2,
  Settings,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface OptimizationSettingsTabProps {
  onOptimizationRun: () => Promise<void>;
  onPerformanceAnalysis: () => Promise<void>;
  onCacheOptimization: () => Promise<void>;
}

export function OptimizationSettingsTab({
  onOptimizationRun,
  onPerformanceAnalysis,
  onCacheOptimization,
}: OptimizationSettingsTabProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [settings, setSettings] = useState({
    autoOptimization: true,
    performanceMode: 'balanced' as 'balanced' | 'performance' | 'efficiency',
    lastOptimized: '2025-06-10 14:30:00',
  });

  const handleOptimizationRun = async () => {
    setIsOptimizing(true);
    try {
      await onOptimizationRun();
      setSettings(prev => ({
        ...prev,
        lastOptimized: KoreanTimeUtil.now(),
      }));
    } catch (err) {
      console.error('최적화 실행 중 오류:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handlePerformanceAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      await onPerformanceAnalysis();
    } catch (err) {
      console.error('성능 분석 중 오류:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='border border-white/10 rounded-lg p-4'>
        <h3 className='text-lg font-semibold text-white mb-4 flex items-center gap-2'>
          <Zap className='w-5 h-5 text-yellow-400' />
          시스템 최적화 상태
        </h3>

        <div className='space-y-4'>
          <div className='grid grid-cols-3 gap-4'>
            <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
              <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-green-400' />
              <p className='text-xs text-gray-400 mb-1'>최적화 상태</p>
              <p className='text-sm font-medium text-white'>최적화됨</p>
            </div>
            <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
              <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-blue-400' />
              <p className='text-xs text-gray-400 mb-1'>성능 모드</p>
              <p className='text-sm font-medium text-white'>
                {settings.performanceMode === 'balanced'
                  ? '균형'
                  : settings.performanceMode === 'performance'
                    ? '성능'
                    : '효율'}
              </p>
            </div>
            <div className='p-3 bg-gray-800/50 rounded-lg text-center'>
              <div className='w-3 h-3 rounded-full mx-auto mb-2 bg-yellow-400' />
              <p className='text-xs text-gray-400 mb-1'>자동 최적화</p>
              <p className='text-sm font-medium text-white'>
                {settings.autoOptimization ? '활성화' : '비활성화'}
              </p>
            </div>
          </div>

          {/* 최적화 실행 버튼들 */}
          <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
            <div className='flex items-center gap-3 mb-3'>
              <Zap className='w-4 h-4 text-yellow-400' />
              <span className='text-sm font-medium text-yellow-300'>
                시스템 최적화 도구
              </span>
            </div>
            <div className='grid grid-cols-1 gap-3'>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOptimizationRun}
                disabled={isOptimizing}
                className='px-4 py-3 bg-yellow-500/20 text-yellow-300 rounded-lg font-medium hover:bg-yellow-500/30 transition-colors text-sm border border-yellow-500/30 disabled:opacity-50'
              >
                <div className='flex items-center justify-center gap-2'>
                  {isOptimizing ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <Zap className='w-4 h-4' />
                  )}
                  <div className='flex flex-col items-center gap-1'>
                    <span className='font-semibold'>
                      {isOptimizing
                        ? '최적화 진행 중...'
                        : '⚡ 전체 시스템 최적화'}
                    </span>
                    <span className='text-xs text-yellow-200'>
                      CPU, 메모리, 네트워크 성능을 종합적으로 최적화합니다
                    </span>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePerformanceAnalysis}
                disabled={isAnalyzing}
                className='px-4 py-3 bg-blue-500/20 text-blue-300 rounded-lg font-medium hover:bg-blue-500/30 transition-colors text-sm border border-blue-500/30 disabled:opacity-50'
              >
                <div className='flex items-center justify-center gap-2'>
                  {isAnalyzing ? (
                    <Loader2 className='w-4 h-4 animate-spin' />
                  ) : (
                    <BarChart3 className='w-4 h-4' />
                  )}
                  <div className='flex flex-col items-center gap-1'>
                    <span className='font-semibold'>
                      {isAnalyzing ? '분석 진행 중...' : '📊 성능 분석'}
                    </span>
                    <span className='text-xs text-blue-200'>
                      시스템 성능을 상세 분석하고 최적화 제안을 제공합니다
                    </span>
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* 성능 모드 설정 */}
          <div className='bg-gray-800/30 rounded-lg p-4'>
            <h4 className='text-white font-medium mb-3 flex items-center gap-2'>
              <Settings className='w-4 h-4' />
              성능 모드 설정
            </h4>
            <div className='grid grid-cols-3 gap-2'>
              {[
                {
                  key: 'balanced',
                  label: '균형',
                  icon: Activity,
                  desc: '균형잡힌 성능',
                },
                {
                  key: 'performance',
                  label: '성능',
                  icon: TrendingUp,
                  desc: '최고 성능 우선',
                },
                {
                  key: 'efficiency',
                  label: '효율',
                  icon: CheckCircle,
                  desc: '효율성 우선',
                },
              ].map(({ key, label, icon: Icon, desc }) => (
                <button
                  key={key}
                  onClick={() =>
                    setSettings(prev => ({
                      ...prev,
                      performanceMode: key as any,
                    }))
                  }
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    settings.performanceMode === key
                      ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-400'
                      : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Icon className='w-4 h-4 mx-auto mb-1' />
                  <div className='text-xs font-medium'>{label}</div>
                  <div className='text-xs opacity-70'>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 자동 최적화 설정 */}
          <div className='flex items-center justify-between p-3 bg-gray-800/50 rounded-lg'>
            <div>
              <div className='text-white text-sm font-medium'>자동 최적화</div>
              <div className='text-gray-400 text-xs'>
                정기적으로 시스템 자동 최적화
              </div>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.autoOptimization}
                onChange={e =>
                  setSettings(prev => ({
                    ...prev,
                    autoOptimization: e.target.checked,
                  }))
                }
                className='sr-only peer'
              />
              <div className='w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500'></div>
            </label>
          </div>

          {/* 최적화 히스토리 */}
          <div className='text-center text-gray-400 text-xs'>
            마지막 최적화: {settings.lastOptimized}
          </div>
        </div>
      </div>
    </div>
  );
}
