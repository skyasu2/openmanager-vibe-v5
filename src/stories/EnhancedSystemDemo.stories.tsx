import type { Meta, StoryObj } from '@storybook/nextjs';
import React from 'react';

// Enhanced System Demo Component
const EnhancedSystemDemo: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-white mb-4'>
            🚀 Enhanced OpenManager System Demo
          </h1>
          <p className='text-xl text-gray-300 mb-8'>
            Enhanced Unified AI Engine + Enhanced Real Server Data Generator
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 text-left'>
            <div className='bg-gray-800/50 backdrop-blur rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-blue-400 mb-3'>
                🧠 Enhanced Unified AI Engine
              </h3>
              <ul className='text-sm text-gray-300 space-y-2'>
                <li>• 14개 AI 엔진 통합</li>
                <li>• 실시간 사고과정 로그 시스템</li>
                <li>• 지능형 캐싱 (엔진별 TTL 3-15분)</li>
                <li>• Graceful Degradation</li>
                <li>• 성능 최적화 (메모리 추적)</li>
              </ul>
            </div>
            <div className='bg-gray-800/50 backdrop-blur rounded-lg p-6'>
              <h3 className='text-lg font-semibold text-green-400 mb-3'>
                📊 Enhanced Real Server Data Generator
              </h3>
              <ul className='text-sm text-gray-300 space-y-2'>
                <li>• 8개 서버 아키텍처</li>
                <li>• Redis 통합 (실시간 캐싱)</li>
                <li>• 24시간 베이스라인 최적화</li>
                <li>• 5가지 데모 시나리오</li>
                <li>• 고급 메트릭 (시계열, 로그, 트레이스)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className='bg-gray-800/70 backdrop-blur rounded-lg p-6 mb-8'>
          <h3 className='text-lg font-semibold text-purple-400 mb-4'>
            📈 System Status
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-400'>14</div>
              <div className='text-sm text-gray-400'>AI Engines</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-400'>8</div>
              <div className='text-sm text-gray-400'>Server Types</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-400'>85%</div>
              <div className='text-sm text-gray-400'>Cache Hit Rate</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-400'>245ms</div>
              <div className='text-sm text-gray-400'>Avg Response</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof EnhancedSystemDemo> = {
  title: 'System/Enhanced System Demo',
  component: EnhancedSystemDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '🚀 Enhanced OpenManager 시스템 통합 데모',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
