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
    id: 'UNIFIED',
    name: '통합 AI 엔진',
    description: '모든 AI 엔진 통합 - 최적의 성능과 유연성 제공',
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    features: ['통합 처리', '자동 최적화', '확장성'],
    status: 'ready',
  },
  {
    id: 'GOOGLE_ONLY',
    name: 'Google AI Only',
    description: 'Google AI만 사용 - 고급 자연어 처리와 추론 능력',
    icon: Zap,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    features: ['자연어 처리 특화', '고급 추론', '확장성 테스트'],
    usage: { used: 45, limit: 100 },
    status: 'ready',
  },
  {
    id: 'LOCAL',
    name: '로컬 MCP',
    description: '로컬 MCP 서버 - 프라이버시 보장과 오프라인 동작',
    icon: Database,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    features: ['완전 구현', '프라이버시 보장', '오프라인 동작'],
    status: 'ready',
  },
];

// AISidebarV2 호환성을 위한 별칭
export const AI_ENGINES = availableEngines;

interface AIEngineSelectorProps {
  currentEngine: string;
  onEngineChange: (engine: string) => void;
  disabled?: boolean;
  // 기존 호환성을 위한 별칭
  selectedEngine?: string;
}

export const AIEngineSelector: React.FC<AIEngineSelectorProps> = ({
  currentEngine,
  onEngineChange,
  disabled = false,
  selectedEngine, // 기존 호환성
}) => {
  const [showEngineInfo, setShowEngineInfo] = useState(false);

  // props 호환성 처리
  const activeEngine = currentEngine || selectedEngine || 'UNIFIED';

  // 선택된 엔진 데이터 찾기
  const selectedEngineData = availableEngines.find(
    (engine) => engine.id === activeEngine
  );

  if (!selectedEngineData) return null;

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setShowEngineInfo(!showEngineInfo)}
        disabled={disabled}
        role="button"
        aria-expanded={showEngineInfo}
        aria-haspopup="true"
        className={`flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs transition-colors ${
          disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'hover:bg-gray-50'
        }`}
      >
        {React.createElement(selectedEngineData.icon, {
          className: `w-3 h-3 ${selectedEngineData.color}`,
        })}
        <span className="font-medium">
          {selectedEngineData.name || '엔진 선택'}
        </span>
        <ChevronDown className="h-3 w-3 text-gray-500" />
      </button>

      {/* 엔진 선택 드롭다운 */}
      <AnimatePresence>
        {showEngineInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full z-50 mt-2 w-60 rounded-lg border border-gray-200 bg-white shadow-lg sm:w-72"
          >
            <div className="border-b border-gray-100 p-3">
              <h4 className="text-xs font-semibold text-gray-800">
                AI 모델 선택
              </h4>
              <p className="text-xs text-gray-600">
                용도에 맞는 AI 엔진을 선택하세요
              </p>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {availableEngines.map((engine) => (
                <button
                  key={engine.id}
                  onClick={() => {
                    if (!disabled) {
                      onEngineChange(engine.id);
                      setShowEngineInfo(false);
                    }
                  }}
                  disabled={disabled}
                  role="button"
                  aria-pressed={activeEngine === engine.id}
                  className={`w-full border-b border-gray-100 p-3 text-left transition-colors last:border-b-0 ${
                    disabled 
                      ? 'cursor-not-allowed opacity-50' 
                      : 'hover:bg-gray-50'
                  } ${
                    activeEngine === engine.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${engine.bgColor}`}
                    >
                      {React.createElement(engine.icon, {
                        className: `w-4 h-4 ${engine.color}`,
                      })}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-xs font-semibold text-gray-800">
                          {engine.name}
                        </h5>
                        {engine.usage && (
                          <span className="text-xs text-gray-500">
                            {engine.usage.used}/{engine.usage.limit}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-600">
                        {engine.description}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {engine.features.slice(0, 2).map((feature, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-gray-100 px-1 py-0.5 text-xs text-gray-600"
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
