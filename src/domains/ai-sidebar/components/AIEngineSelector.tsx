/**
 * 🎨 AI Engine Selector - 반응형 접근성 적용 + UnifiedAIEngineRouter 통합
 *
 * ✅ 모바일/노트북/데스크톱 대응
 * ✅ 시맨틱 HTML 적용 (select, fieldset 사용)
 * ✅ 키보드 네비게이션 지원
 * ✅ UnifiedAIEngineRouter 모드 동기화
 */

'use client';

import { unifiedAIRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import type { AIMode } from '@/types/ai-types';
import { Brain, Globe, Home, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface AIEngine {
  id: AIMode;
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
  selectedEngine: AIMode;
  onEngineChange: (engineId: AIMode) => void;
}

// 🎯 UnifiedAIEngineRouter와 일치하는 AI 엔진 목록
export const AI_ENGINES: AIEngine[] = [
  {
    id: 'AUTO',
    name: 'AUTO 모드',
    description: 'Supabase RAG + MCP + 하위AI + Google AI 조합 (균형형)',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    features: ['지능형 라우팅', '최적 성능', 'Supabase RAG 중심'],
    status: 'ready',
  },
  {
    id: 'LOCAL',
    name: 'LOCAL 모드',
    description: 'Supabase RAG + MCP + 로컬 AI만 사용 (Google AI 제외)',
    icon: Home,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    features: ['빠른 응답', '오프라인 지원', '프라이버시 보호'],
    status: 'ready',
  },
  {
    id: 'GOOGLE_ONLY',
    name: 'GOOGLE_ONLY 모드',
    description: 'Google AI Studio (Gemini) 우선 + 최소 폴백',
    icon: Globe,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    features: ['자연어 전문', '창의적 응답', 'Google AI 중심'],
    usage: {
      used: 45,
      limit: 300,
      resetTime: '24시간',
    },
    status: 'ready',
  },
  {
    id: 'MONITORING',
    name: 'MONITORING 모드',
    description: '지능형 모니터링 전용 (IntelligentMonitoringService)',
    icon: Brain,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    features: ['장애 감지', '근본 원인 분석', '예측 모니터링'],
    status: 'ready',
  },
];

export const AIEngineSelector: React.FC<AIEngineSelectorProps> = ({
  engines,
  selectedEngine,
  onEngineChange,
}) => {
  const [routerMode, setRouterMode] = useState<AIMode>('AUTO');
  const [isInitialized, setIsInitialized] = useState(false);

  // UnifiedAIEngineRouter 초기화 및 현재 모드 동기화
  useEffect(() => {
    const initializeRouter = async () => {
      try {
        await unifiedAIRouter.initialize();
        const currentMode = unifiedAIRouter.getCurrentMode();
        setRouterMode(currentMode);
        setIsInitialized(true);
        console.log(`🎯 AI 엔진 선택기 초기화 - 현재 모드: ${currentMode}`);
      } catch (error) {
        console.error('UnifiedAIEngineRouter 초기화 실패:', error);
        setIsInitialized(true); // 에러가 있어도 UI는 표시
      }
    };

    initializeRouter();
  }, []);

  // 🔄 모드 변경 핸들러 (UnifiedAIEngineRouter 동기화)
  const handleEngineChange = async (newMode: AIMode) => {
    try {
      // 1. UnifiedAIEngineRouter 모드 변경
      unifiedAIRouter.setMode(newMode);
      setRouterMode(newMode);

      // 2. 부모 컴포넌트에 알림
      onEngineChange(newMode);

      console.log(`🔧 AI 모드 변경: ${selectedEngine} → ${newMode}`);

      // 3. 모든 AI 서비스에 모드 변경 통지 (자동으로 처리됨)
      console.log('✅ 모든 AI 서비스 모드 동기화 완료');

    } catch (error) {
      console.error('AI 모드 변경 실패:', error);
    }
  };

  const selectedEngineData = engines.find(
    engine => engine.id === selectedEngine
  );

  return (
    <fieldset className='border border-gray-200 rounded-lg p-3 sm:p-4 bg-white'>
      <legend className='text-sm font-medium text-gray-700 px-2'>
        🎯 통합 AI 모드 선택
        {isInitialized && (
          <span className="ml-2 text-xs text-green-600">(라우터: {routerMode})</span>
        )}
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

          {/* 기능 표시 */}
          <div className='flex flex-wrap gap-1 mb-2'>
            {selectedEngineData.features.map((feature, index) => (
              <span
                key={index}
                className='inline-block px-2 py-1 text-xs bg-white bg-opacity-80 rounded-md'
              >
                {feature}
              </span>
            ))}
          </div>

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
        모드 변경 (모든 AI 기능에 적용):
      </label>
      <select
        id='ai-engine-select'
        value={selectedEngine}
        onChange={e => handleEngineChange(e.target.value as AIMode)}
        className='w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base'
        aria-describedby='ai-engine-description'
        disabled={!isInitialized}
      >
        {engines.map(engine => (
          <option key={engine.id} value={engine.id}>
            {engine.name} - {engine.description}
          </option>
        ))}
      </select>

      <div className='mt-2 space-y-1'>
        <p id='ai-engine-description' className='text-xs text-gray-500'>
          🎯 이 설정은 모든 AI 기능(채팅, 장애보고서, 지능형모니터링)에 동시 적용됩니다.
        </p>
        <p className='text-xs text-blue-600'>
          💡 AUTO: 균형잡힌 성능 | LOCAL: 빠르고 안전 | GOOGLE_ONLY: 고급 추론 | MONITORING: 전문 모니터링
        </p>
      </div>
    </fieldset>
  );
};
