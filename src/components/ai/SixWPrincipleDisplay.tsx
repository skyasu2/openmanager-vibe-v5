/**
 * SixWPrincipleDisplay Component
 *
 * 📋 육하원칙(5W1H) 기반 구조화된 AI 응답 표시 컴포넌트
 * - Who, What, When, Where, Why, How 구조
 * - 복사 가능한 텍스트
 * - 신뢰도 표시
 * - 데이터 출처 표시
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  FileText,
  Clock,
  MapPin,
  HelpCircle,
  Settings,
  Copy,
  CheckCircle,
  BarChart3,
  Info,
  Shield,
  Star,
  AlertTriangle,
} from 'lucide-react';
import type { SixWPrincipleResponse } from '@/types/ai-thinking';

interface SixWPrincipleDisplayProps {
  response: SixWPrincipleResponse;
  showCopyButtons?: boolean;
  showConfidence?: boolean;
  showSources?: boolean;
  className?: string;
  onCopy?: (content: string, type: string) => void;
}

const principleConfig = [
  {
    key: 'who' as keyof SixWPrincipleResponse,
    icon: User,
    title: 'Who (누가)',
    description: '담당자/시스템',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    key: 'what' as keyof SixWPrincipleResponse,
    icon: FileText,
    title: 'What (무엇을)',
    description: '작업 내용',
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  {
    key: 'when' as keyof SixWPrincipleResponse,
    icon: Clock,
    title: 'When (언제)',
    description: '시점/기간',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    key: 'where' as keyof SixWPrincipleResponse,
    icon: MapPin,
    title: 'Where (어디서)',
    description: '위치/환경',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  {
    key: 'why' as keyof SixWPrincipleResponse,
    icon: HelpCircle,
    title: 'Why (왜)',
    description: '이유/목적',
    color: 'text-red-600 bg-red-50 border-red-200',
  },
  {
    key: 'how' as keyof SixWPrincipleResponse,
    icon: Settings,
    title: 'How (어떻게)',
    description: '방법/과정',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  },
];

export const SixWPrincipleDisplay: React.FC<SixWPrincipleDisplayProps> = ({
  response,
  showCopyButtons = true,
  showConfidence = true,
  showSources = true,
  className = '',
  onCopy,
}) => {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 복사 기능
  const handleCopy = useCallback(
    async (content: string, type: string) => {
      try {
        await navigator.clipboard.writeText(content);
        setCopiedItems((prev) => new Set([...prev, type]));

        // 2초 후 복사 상태 제거
        setTimeout(() => {
          setCopiedItems((prev) => {
            const newSet = new Set(prev);
            newSet.delete(type);
            return newSet;
          });
        }, 2000);

        onCopy?.(content, type);
      } catch (error) {
        console.error('복사 실패:', error);
      }
    },
    [onCopy]
  );

  // 전체 응답 복사
  const handleCopyAll = useCallback(() => {
    const fullResponse = principleConfig
      .map((config) => `${config.title}: ${response[config.key]}`)
      .join('\n\n');

    handleCopy(fullResponse, 'all');
  }, [response, handleCopy]);

  // 아이템 확장/축소
  const toggleExpanded = useCallback((key: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  // 신뢰도 색상 계산
  const getConfidenceColor = useCallback((confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  }, []);

  // 신뢰도 아이콘
  const getConfidenceIcon = useCallback((confidence: number) => {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return Star;
    return AlertTriangle;
  }, []);

  // 애니메이션 설정
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    hover: {
      scale: 1.02,
      transition: {
        duration: 0.2,
      },
    },
  };

  const _itemVariants: unknown = {
    hidden: { opacity: 0, x: -20 },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    }),
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">육하원칙 분석 결과</h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* 전체 복사 버튼 */}
          {showCopyButtons && (
            <button
              onClick={handleCopyAll}
              className="flex items-center space-x-1 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              {copiedItems.has('all') ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>{copiedItems.has('all') ? '복사됨' : '전체 복사'}</span>
            </button>
          )}

          {/* 신뢰도 표시 */}
          {showConfidence && (
            <div
              className={`flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium ${getConfidenceColor(response.confidence)}`}
            >
              {React.createElement(getConfidenceIcon(response.confidence), {
                className: 'w-3 h-3',
              })}
              <span>신뢰도 {Math.round(response.confidence * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* 6W 원칙 카드들 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnimatePresence>
          {principleConfig.map((config, index) => {
            const {
              key,
              icon: IconComponent,
              title,
              description,
              color,
            } = config;
            const content = String(response[key] || '정보 없음');
            const isExpanded = expandedItems.has(key);
            const isCopied = copiedItems.has(key);

            return (
              <motion.div
                key={key}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className={`rounded-lg border-2 p-4 ${color} transition-all duration-200`}
              >
                <div className="space-y-3">
                  {/* 카드 헤더 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5" />
                      <div>
                        <h4 className="text-sm font-medium">{title}</h4>
                        <p className="text-xs opacity-70">{description}</p>
                      </div>
                    </div>

                    {showCopyButtons && (
                      <button
                        onClick={() => handleCopy(content, key)}
                        className="rounded-md p-1.5 transition-colors hover:bg-white hover:bg-opacity-50"
                      >
                        {isCopied ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 opacity-60 hover:opacity-100" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* 내용 */}
                  <div className="relative">
                    <motion.p
                      initial={false}
                      animate={{
                        height: isExpanded ? 'auto' : 'auto',
                      }}
                      className={`text-sm leading-relaxed ${
                        content.length > 100 && !isExpanded
                          ? 'line-clamp-3'
                          : ''
                      }`}
                    >
                      {content}
                    </motion.p>

                    {/* 확장/축소 버튼 */}
                    {content.length > 100 && (
                      <button
                        onClick={() => toggleExpanded(key)}
                        className="mt-2 text-xs underline opacity-70 hover:opacity-100"
                      >
                        {isExpanded ? '축소' : '더보기'}
                      </button>
                    )}
                  </div>

                  {/* 복사 피드백 */}
                  <AnimatePresence>
                    {isCopied && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 flex items-center justify-center rounded-lg bg-white bg-opacity-90"
                      >
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">복사됨!</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 추가 정보 */}
      <div className="space-y-3">
        {/* 데이터 출처 */}
        {showSources && response.sources && response.sources.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
          >
            <div className="mb-2 flex items-center space-x-2">
              <Info className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">
                데이터 출처
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {response.sources.map((source, index) => (
                <span
                  key={index}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600"
                >
                  <Shield className="mr-1 h-3 w-3" />
                  {source}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* 응답 요약 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="rounded-lg border border-blue-200 bg-blue-50 p-3"
        >
          <div className="mb-2 flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">분석 요약</span>
          </div>
          <p className="text-sm text-blue-800">
            AI가 제공한 정보를 육하원칙에 따라 구조화하여 표시했습니다. 각
            항목을 개별적으로 복사하거나 전체 내용을 한번에 복사할 수 있습니다.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SixWPrincipleDisplay;
