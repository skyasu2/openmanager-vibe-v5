/**
 * SixWPrincipleDisplay Component
 * 
 * 📋 육하원칙(5W1H) 기반 AI 응답을 구조화하여 표시하는 컴포넌트
 * - Who, What, When, Where, Why, How 섹션
 * - 신뢰도 표시 및 소스 정보
 * - 복사 기능 및 상세 보기
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Target, 
  Clock, 
  MapPin, 
  HelpCircle, 
  Settings,
  Copy,
  Check,
  TrendingUp,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { SixWPrincipleResponse } from '@/types/ai-thinking';

interface SixWPrincipleDisplayProps {
  response: SixWPrincipleResponse;
  className?: string;
  showSources?: boolean;
  showConfidence?: boolean;
  enableCopy?: boolean;
  expandable?: boolean;
  onCopy?: (content: string) => void;
}

interface SectionConfig {
  key: keyof SixWPrincipleResponse;
  title: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  description: string;
}

export const SixWPrincipleDisplay: React.FC<SixWPrincipleDisplayProps> = ({
  response,
  className = '',
  showSources = true,
  showConfidence = true,
  enableCopy = true,
  expandable = false,
  onCopy
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(!expandable);

  // 육하원칙 섹션 설정
  const sections: SectionConfig[] = [
    {
      key: 'who',
      title: '누가 (Who)',
      icon: User,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/10 border-blue-500/30',
      description: '담당자 또는 주체'
    },
    {
      key: 'what',
      title: '무엇을 (What)',
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-600/10 border-green-500/30',
      description: '작업 내용 또는 대상'
    },
    {
      key: 'when',
      title: '언제 (When)',
      icon: Clock,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/10 border-purple-500/30',
      description: '시점 또는 기간'
    },
    {
      key: 'where',
      title: '어디서 (Where)',
      icon: MapPin,
      color: 'text-orange-400',
      bgColor: 'bg-orange-600/10 border-orange-500/30',
      description: '위치 또는 환경'
    },
    {
      key: 'why',
      title: '왜 (Why)',
      icon: HelpCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-600/10 border-red-500/30',
      description: '이유 또는 목적'
    },
    {
      key: 'how',
      title: '어떻게 (How)',
      icon: Settings,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-600/10 border-cyan-500/30',
      description: '방법 또는 과정'
    }
  ];

  // 복사 기능
  const handleCopy = useCallback(async (content: string, sectionKey: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(sectionKey);
      setTimeout(() => setCopiedSection(null), 2000);
      onCopy?.(content);
      console.log('✅ 복사 완료:', sectionKey);
    } catch (error) {
      console.error('❌ 복사 실패:', error);
    }
  }, [onCopy]);

  // 전체 내용 복사
  const handleCopyAll = useCallback(async () => {
    const fullContent = sections
      .map(section => `${section.title}: ${response[section.key]}`)
      .join('\n\n');
    
    await handleCopy(fullContent, 'all');
  }, [sections, response, handleCopy]);

  // 신뢰도 색상 계산
  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    if (confidence >= 0.4) return 'text-orange-400';
    return 'text-red-400';
  }, []);

  // 신뢰도 라벨
  const getConfidenceLabel = useCallback((confidence: number) => {
    if (confidence >= 0.8) return '높음';
    if (confidence >= 0.6) return '보통';
    if (confidence >= 0.4) return '낮음';
    return '매우 낮음';
  }, []);

  return (
    <div className={`bg-slate-800/50 rounded-lg border border-purple-500/30 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/30">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Info className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">구조화된 분석 결과</h3>
            <p className="text-xs text-gray-400">육하원칙 기반 응답</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 신뢰도 표시 */}
          {showConfidence && (
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400">신뢰도:</span>
              <span className={getConfidenceColor(response.confidence)}>
                {Math.round(response.confidence * 100)}% ({getConfidenceLabel(response.confidence)})
              </span>
            </div>
          )}

          {/* 전체 복사 버튼 */}
          {enableCopy && (
            <button
              onClick={handleCopyAll}
              className="p-1.5 hover:bg-purple-600/30 rounded text-gray-400 hover:text-white transition-colors"
              title="전체 내용 복사"
            >
              {copiedSection === 'all' ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          )}

          {/* 확장/축소 버튼 */}
          {expandable && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-purple-600/30 rounded text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* 육하원칙 섹션들 */}
            <div className="p-4 space-y-4">
              {sections.map((section, index) => {
                const content = response[section.key] as string;
                const isEmpty = !content || content.trim() === '' || content === '정보 없음';
                
                return (
                  <motion.div
                    key={section.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.1,
                      ease: 'easeOut'
                    }}
                    className={`
                      p-4 rounded-lg border transition-all duration-300
                      ${isEmpty ? 'bg-gray-600/10 border-gray-500/30' : section.bgColor}
                      ${isEmpty ? 'opacity-60' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* 아이콘 및 제목 */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`
                          flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                          ${isEmpty ? 'bg-gray-600/20' : section.bgColor}
                        `}>
                          <section.icon className={`w-4 h-4 ${isEmpty ? 'text-gray-400' : section.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-medium ${isEmpty ? 'text-gray-400' : 'text-white'}`}>
                              {section.title}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {section.description}
                            </span>
                          </div>

                          <div className={`text-sm ${isEmpty ? 'text-gray-500' : 'text-gray-300'}`}>
                            {isEmpty ? (
                              <div className="flex items-center gap-1 italic">
                                <AlertTriangle className="w-3 h-3" />
                                정보가 제공되지 않았습니다
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap break-words">
                                {content}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 복사 버튼 */}
                      {enableCopy && !isEmpty && (
                        <button
                          onClick={() => handleCopy(content, section.key)}
                          className="flex-shrink-0 p-1.5 hover:bg-purple-600/30 rounded text-gray-400 hover:text-white transition-colors"
                          title={`${section.title} 복사`}
                        >
                          {copiedSection === section.key ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 메타데이터 및 소스 정보 */}
            {(showSources || showConfidence) && (
              <div className="p-4 border-t border-purple-500/30 bg-slate-900/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 신뢰도 상세 */}
                  {showConfidence && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-300 mb-2">신뢰도 분석</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">전체 신뢰도:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full ${
                                  response.confidence >= 0.8 ? 'bg-green-400' :
                                  response.confidence >= 0.6 ? 'bg-yellow-400' :
                                  response.confidence >= 0.4 ? 'bg-orange-400' : 'bg-red-400'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${response.confidence * 100}%` }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                              />
                            </div>
                            <span className={getConfidenceColor(response.confidence)}>
                              {Math.round(response.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {response.confidence >= 0.8 && '✅ 높은 신뢰도 - 정확한 정보'}
                          {response.confidence >= 0.6 && response.confidence < 0.8 && '⚠️ 보통 신뢰도 - 검증 권장'}
                          {response.confidence < 0.6 && '❌ 낮은 신뢰도 - 추가 확인 필요'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 데이터 소스 */}
                  {showSources && response.sources && response.sources.length > 0 && (
                    <div>
                      <h5 className="text-xs font-medium text-gray-300 mb-2">데이터 소스</h5>
                      <div className="space-y-1">
                        {response.sources.map((source, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{source}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SixWPrincipleDisplay; 