/**
 * 🎯 AI 엔진 패널
 *
 * AI 엔진 상태 관리 및 설정
 */

import { motion } from 'framer-motion';
import { Brain, Power, RefreshCw, Settings } from 'lucide-react';
import type { AIEngineDetail } from '../../hooks/useAIEngineStatus';
import { STATUS_COLORS } from '../../UnifiedAdminDashboard.types';

interface AIEnginePanelProps {
  engines: AIEngineDetail[];
  selectedEngine: string | null;
  onSelectEngine: (engineId: string | null) => void;
  onToggleEngine: (engineId: string) => void;
  onUpdateConfig: (
    engineId: string,
    config: Partial<AIEngineDetail['config']>
  ) => void;
  onRestartEngine: (engineId: string) => void;
}

export default function AIEnginePanel({
  engines,
  selectedEngine,
  onSelectEngine,
  onToggleEngine,
  onUpdateConfig,
  onRestartEngine,
}: AIEnginePanelProps) {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      {/* 엔진 리스트 */}
      <div className='lg:col-span-1'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
          <h3 className='text-lg font-semibold mb-4'>AI 엔진 목록</h3>
          <div className='space-y-3'>
            {engines.map(engine => (
              <motion.div
                key={engine.id}
                whileHover={{ scale: 1.02 }}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedEngine === engine.id
                    ? 'bg-blue-50 dark:bg-blue-900 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => onSelectEngine(engine.id)}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Brain
                      className='w-5 h-5'
                      style={{
                        color:
                          engine.status === 'active'
                            ? STATUS_COLORS.active
                            : STATUS_COLORS.inactive,
                      }}
                    />
                    <div>
                      <p className='font-medium'>{engine.name}</p>
                      <p className='text-sm text-gray-600 dark:text-gray-400'>
                        {engine.type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onToggleEngine(engine.id);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      engine.config.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Power className='w-4 h-4' />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 엔진 상세 정보 */}
      <div className='lg:col-span-2'>
        {selectedEngine ? (
          <EngineDetails
            engine={engines.find(e => e.id === selectedEngine)!}
            onUpdateConfig={config => onUpdateConfig(selectedEngine, _config)}
            onRestart={() => onRestartEngine(selectedEngine)}
          />
        ) : (
          <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
            <div className='text-center text-gray-500 dark:text-gray-400'>
              엔진을 선택하여 상세 정보를 확인하세요
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 엔진 상세 정보 컴포넌트
// ============================================================================

interface EngineDetailsProps {
  engine: AIEngineDetail;
  onUpdateConfig: (config: Partial<AIEngineDetail['config']>) => void;
  onRestart: () => void;
}

function EngineDetails({
  engine,
  onUpdateConfig: _onUpdateConfig,
  onRestart,
}: EngineDetailsProps) {
  return (
    <div className='bg-white dark:bg-gray-800 rounded-lg shadow-md p-6'>
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-lg font-semibold'>{engine.name} 상세 정보</h3>
        <div className='flex gap-2'>
          <button
            onClick={onRestart}
            className='flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors'
          >
            <RefreshCw className='w-4 h-4' />
            재시작
          </button>
          <button className='flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors'>
            <Settings className='w-4 h-4' />
            설정
          </button>
        </div>
      </div>

      {/* 메트릭 */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <div className='bg-gray-50 dark:bg-gray-700 p-3 rounded-lg'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>총 요청</p>
          <p className='text-xl font-semibold'>
            {engine.metrics.totalRequests}
          </p>
        </div>
        <div className='bg-gray-50 dark:bg-gray-700 p-3 rounded-lg'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>성공률</p>
          <p className='text-xl font-semibold'>{engine.metrics.successRate}%</p>
        </div>
        <div className='bg-gray-50 dark:bg-gray-700 p-3 rounded-lg'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>응답 시간</p>
          <p className='text-xl font-semibold'>
            {engine.metrics.avgResponseTime}ms
          </p>
        </div>
        <div className='bg-gray-50 dark:bg-gray-700 p-3 rounded-lg'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>에러</p>
          <p className='text-xl font-semibold'>{engine.metrics.errorCount}</p>
        </div>
      </div>

      {/* 헬스 상태 */}
      <div className='space-y-3'>
        <h4 className='font-medium'>시스템 상태</h4>
        <div className='space-y-2'>
          <HealthBar label='CPU' value={engine.health.cpu} />
          <HealthBar label='메모리' value={engine.health.memory} />
          <HealthBar
            label='지연시간'
            value={engine.health.latency}
            max={1000}
            unit='ms'
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 헬스 바 컴포넌트
// ============================================================================

interface HealthBarProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
}

function HealthBar({ label, value, max = 100, unit = '%' }: HealthBarProps) {
  const percentage = (value / max) * 100;
  const color =
    percentage < 50
      ? 'bg-green-500'
      : percentage < 80
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div>
      <div className='flex justify-between text-sm mb-1'>
        <span className='text-gray-600 dark:text-gray-400'>{label}</span>
        <span className='font-medium'>
          {value}
          {unit}
        </span>
      </div>
      <div className='h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
