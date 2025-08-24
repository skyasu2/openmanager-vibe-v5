/**
 * AI 엔진 선택 드롭다운 컴포넌트
 * AI 모델 선택 및 엔진 정보 표시
 */

import React from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import { ChevronDown } from 'lucide-react';
import { availableEngines } from './AIEngineSelector';
import type { AIMode } from '@/types/ai-types';

interface AIEngineDropdownProps {
  selectedEngine: AIMode;
  showEngineInfo: boolean;
  onEngineSelect: (engine: AIMode) => void;
  onToggleEngineInfo: () => void;
  currentEngine?: string;
}

export const AIEngineDropdown: React.FC<AIEngineDropdownProps> = ({
  selectedEngine,
  showEngineInfo,
  onEngineSelect,
  onToggleEngineInfo,
  currentEngine,
}) => {
  // 현재 선택된 엔진 정보 가져오기
  const selectedEngineInfo =
    availableEngines.find((e) => e.id === selectedEngine) ||
    availableEngines[0];

  return (
    <div className="relative flex items-center">
      <button
        onClick={onToggleEngineInfo}
        className="flex items-center space-x-1 rounded-md bg-gray-100 px-2 py-1 text-xs transition-colors hover:bg-gray-200"
        title="엔진 선택"
      >
        <div
          className={`h-4 w-4 rounded ${selectedEngineInfo.bgColor} flex items-center justify-center`}
        >
          {React.createElement(selectedEngineInfo.icon, {
            className: `w-2.5 h-2.5 ${selectedEngineInfo.color}`,
          })}
        </div>
        <span className="font-medium text-gray-700">
          {selectedEngineInfo.name}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-gray-500 transition-transform ${
            showEngineInfo ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* 현재 엔진 상태 표시 */}
      {currentEngine && (
        <div className="ml-2 flex items-center space-x-1">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
          <span className="text-xs text-gray-500">
            {currentEngine === 'mcp-local' ? 'Local' : currentEngine}
          </span>
        </div>
      )}

      {/* 엔진 선택 드롭다운 */}
      <React.Fragment>
        {showEngineInfo && (
          <div
            className="absolute right-0 top-full z-50 mt-2 w-60 rounded-lg border border-gray-200 bg-white shadow-lg sm:w-72"
            style={{
              right: '0',
              maxWidth: 'calc(100vw - 2rem)',
              transform: 'translateX(0)',
            }}
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
                    console.log(
                      `🔧 AI 모드 변경: ${selectedEngine} → ${engine.id}`
                    );
                    onEngineSelect(engine.id as AIMode);
                  }}
                  className={`w-full border-b border-gray-50 p-2 text-left transition-colors last:border-b-0 hover:bg-gray-50 ${
                    selectedEngine === engine.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <div
                      className={`h-6 w-6 rounded ${engine.bgColor} flex items-center justify-center`}
                    >
                      {React.createElement(engine.icon, {
                        className: `w-3 h-3 ${engine.color}`,
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="text-xs font-medium text-gray-800">
                          {engine.name}
                        </h5>
                        {engine.usage && (
                          <span className="text-xs text-gray-500">
                            {engine.usage.used}/{engine.usage.limit}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
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
          </div>
        )}
      </React.Fragment>
    </div>
  );
};
