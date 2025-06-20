/**
 * 🎨 AI Engine Selector - 반응형 접근성 적용
 *
 * ✅ 모바일/노트북/데스크톱 대응
 * ✅ 시맨틱 HTML 적용 (select, fieldset 사용)
 * ✅ 키보드 네비게이션 지원
 */

'use client';

import React from 'react';
import { Zap, Globe, Brain } from 'lucide-react';

interface AIEngine {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  features: string[];
  usage?: {
    used: number;
    limit: number;
    resetTime?: string;
  };
  status: 'ready' | 'loading' | 'error' | 'disabled';
}

interface AIEngineSelectorProps {
  engines: AIEngine[];
  selectedEngine: string;
  onEngineChange: (engineId: string) => void;
}

// AI 엔진 목록 (3개로 축소)
export const AI_ENGINES: AIEngine[] = [
  {
    id: 'auto',
    name: 'AUTO',
    description: '자동으로 최적 모델 조합 선택 (기본값)',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: ['지능형 라우팅', '최적 성능', '자동 폴백'],
    status: 'ready',
  },
  {
    id: 'google-ai',
    name: 'Google AI',
    description: 'Google AI Studio (Gemini) 전용 모드',
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: ['자연어 전문', '창의적 응답', '다국어 지원'],
    usage: {
      used: 45,
      limit: 300,
      resetTime: '24시간',
    },
    status: 'ready',
  },
  {
    id: 'internal',
    name: 'Internal',
    description: 'MCP + RAG + ML 내부 엔진만 사용',
    icon: Brain,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: ['빠른 응답', '오프라인 지원', '프라이버시'],
    status: 'ready',
  },
];

export const AIEngineSelector: React.FC<AIEngineSelectorProps> = ({
  engines,
  selectedEngine,
  onEngineChange,
}) => {
  const selectedEngineData = engines.find(
    engine => engine.id === selectedEngine
  );

  return (
    <fieldset className='border border-gray-200 rounded-lg p-3 sm:p-4 bg-white'>
      <legend className='text-sm font-medium text-gray-700 px-2'>
        AI 엔진 선택
      </legend>

      {/* 현재 선택된 엔진 표시 - 반응형 */}
      {selectedEngineData && (
        <div className={`${selectedEngineData.bgColor} rounded-lg p-3 mb-3`}>
          <div className='flex items-center gap-2 mb-2'>
            <selectedEngineData.icon
              className={`w-4 h-4 sm:w-5 sm:h-5 ${selectedEngineData.color}`}
              aria-hidden='true'
            />
            <span
              className={`font-medium text-sm sm:text-base ${selectedEngineData.color}`}
            >
              {selectedEngineData.name}
            </span>
          </div>
          <p className='text-xs sm:text-sm text-gray-600 mb-2'>
            {selectedEngineData.description}
          </p>

          {/* 사용량 표시 (Google AI만) */}
          {selectedEngineData.usage && (
            <div className='text-xs text-gray-500'>
              사용량: {selectedEngineData.usage.used}/
              {selectedEngineData.usage.limit}
              (재설정: {selectedEngineData.usage.resetTime})
            </div>
          )}
        </div>
      )}

      {/* 엔진 선택 드롭다운 - 접근성 강화 */}
      <label
        htmlFor='ai-engine-select'
        className='block text-sm font-medium text-gray-700 mb-2'
      >
        엔진 변경:
      </label>
      <select
        id='ai-engine-select'
        value={selectedEngine}
        onChange={e => onEngineChange(e.target.value)}
        className='w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base'
        aria-describedby='ai-engine-description'
      >
        {engines.map(engine => (
          <option key={engine.id} value={engine.id}>
            {engine.name} - {engine.description}
          </option>
        ))}
      </select>

      <p id='ai-engine-description' className='text-xs text-gray-500 mt-2'>
        AI 엔진을 변경하면 응답 방식과 성능이 달라집니다.
      </p>
    </fieldset>
  );
};
