/**
 * 🔧 AI 엔진 선택 컴포넌트
 *
 * AIEnhancedChat에서 분리된 엔진 선택 드롭다운
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Database, Zap, type LucideIcon } from 'lucide-react';
import React, { useState } from 'react';

// 타입 임포트
interface AIEngine {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  features: string[];
  status: string;
  usage?: { used: number; limit: number };
}

// 사용 가능한 AI 엔진 목록
export const availableEngines: AIEngine[] = [
  {
    id: 'LOCAL',
    name: 'LOCAL 모드',
    description: '완전 구현된 로컬 AI 시스템 (기본 권장)',
    icon: Database,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    features: ['완전 구현', '프라이버시 보장', '오프라인 동작'],
    status: 'ready',
  },
  {
    id: 'GOOGLE_ONLY',
    name: 'GOOGLE_ONLY 모드',
    description: '자연어 질의 전용 Google AI (성능 비교용)',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    features: ['자연어 처리 특화', '고급 추론', '확장성 테스트'],
    usage: { used: 45, limit: 100 },
    status: 'ready',
  },
];

// AISidebarV2 호환성을 위한 별칭
export const AI_ENGINES = availableEngines;

interface AIEngineSelectorProps {
  selectedEngine: string;
  onEngineChange: (engine: string) => void;
}

export const AIEngineSelector: React.FC<AIEngineSelectorProps> = ({
  selectedEngine,
  onEngineChange,
}) => {
  const [showEngineInfo, setShowEngineInfo] = useState(false);

  // 선택된 엔진 데이터 찾기
  const selectedEngineData = availableEngines.find(
    engine => engine.id === selectedEngine
  );

  if (!selectedEngineData) return null;

  return (
    <div className='relative'>
      <button
        onClick={() => setShowEngineInfo(!showEngineInfo)}
        className='flex items-center space-x-2 px-2 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs'
      >
        {React.createElement(selectedEngineData.icon, {
          className: `w-3 h-3 ${selectedEngineData.color}`,
        })}
        <span className='font-medium'>
          {selectedEngineData.name || '엔진 선택'}
        </span>
        <ChevronDown className='w-3 h-3 text-gray-500' />
      </button>

      {/* 엔진 선택 드롭다운 */}
      <AnimatePresence>
        {showEngineInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className='absolute top-full right-0 mt-2 w-60 sm:w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50'
          >
            <div className='p-3 border-b border-gray-100'>
              <h4 className='text-xs font-semibold text-gray-800'>
                AI 모델 선택
              </h4>
              <p className='text-xs text-gray-600'>
                용도에 맞는 AI 엔진을 선택하세요
              </p>
            </div>

            <div className='max-h-48 overflow-y-auto'>
              {availableEngines.map(engine => (
                <button
                  key={engine.id}
                  onClick={() => {
                    onEngineChange(engine.id);
                    setShowEngineInfo(false);
                  }}
                  className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedEngine === engine.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className='flex items-start space-x-3'>
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${engine.bgColor}`}
                    >
                      {React.createElement(engine.icon, {
                        className: `w-4 h-4 ${engine.color}`,
                      })}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center space-x-2'>
                        <h5 className='text-xs font-semibold text-gray-800'>
                          {engine.name}
                        </h5>
                        {engine.usage && (
                          <span className='text-xs text-gray-500'>
                            {engine.usage.used}/{engine.usage.limit}
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-gray-600 mt-0.5'>
                        {engine.description}
                      </p>
                      <div className='flex flex-wrap gap-1 mt-1'>
                        {engine.features.slice(0, 2).map((feature, idx) => (
                          <span
                            key={idx}
                            className='text-xs px-1 py-0.5 bg-gray-100 text-gray-600 rounded'
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
