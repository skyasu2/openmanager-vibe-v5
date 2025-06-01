'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAIChat } from '@/stores/useAISidebarStore';
import type { AIResponse } from '@/stores/useAISidebarStore';

interface FinalResponseProps {
  response?: AIResponse;
  className?: string;
  onRegenerate?: () => void;
  onFeedback?: (type: 'positive' | 'negative') => void;
}

// 🎨 신뢰도별 컬러
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return 'text-green-400';
  if (confidence >= 0.7) return 'text-yellow-400';
  return 'text-orange-400';
};

const getConfidenceIcon = (confidence: number) => {
  if (confidence >= 0.9) return CheckCircle;
  if (confidence >= 0.7) return TrendingUp;
  return AlertTriangle;
};

export default function FinalResponse({ 
  response,
  className = '',
  onRegenerate,
  onFeedback 
}: FinalResponseProps) {
  const { aiResponse } = useAIChat();
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  const currentResponse = response || (aiResponse ? {
    id: 'current',
    question: '',
    answer: aiResponse,
    confidence: 0.85,
    processingTime: 0,
    logs: [],
    timestamp: new Date()
  } as AIResponse : null);

  // 타이프라이터 효과
  useEffect(() => {
    if (!currentResponse?.answer) {
      setDisplayedText('');
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let charIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (charIndex < currentResponse.answer.length) {
        setDisplayedText(currentResponse.answer.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 20); // 20ms마다 한 글자씩

    return () => clearInterval(typeInterval);
  }, [currentResponse?.answer]);

  // 복사 기능
  const handleCopy = useCallback(async () => {
    if (!currentResponse?.answer) return;
    
    try {
      await navigator.clipboard.writeText(currentResponse.answer);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  }, [currentResponse?.answer]);

  // 피드백 처리
  const handleFeedback = useCallback((type: 'positive' | 'negative') => {
    onFeedback?.(type);
    // TODO: 피드백을 서버에 전송하는 로직 추가
  }, [onFeedback]);

  if (!currentResponse) {
    return null;
  }

  const ConfidenceIcon = getConfidenceIcon(currentResponse.confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-lg ${className}`}
    >
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
            >
              <CheckCircle className="w-4 h-4 text-white" />
            </motion.div>
            <div>
              <h3 className="text-gray-900 font-medium">AI 응답 완료</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{currentResponse.timestamp.toLocaleTimeString()}</span>
                {currentResponse.processingTime > 0 && (
                  <>
                    <span>•</span>
                    <Zap className="w-3 h-3" />
                    <span>{currentResponse.processingTime.toFixed(0)}ms</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 신뢰도 표시 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2"
          >
            <ConfidenceIcon className={`w-4 h-4 ${getConfidenceColor(currentResponse.confidence)}`} />
            <span className={`text-sm font-medium ${getConfidenceColor(currentResponse.confidence)}`}>
              {Math.round(currentResponse.confidence * 100)}%
            </span>
          </motion.div>
        </div>
      </div>

      {/* 응답 내용 */}
      <div className="p-4">
        <div className="prose prose-sm max-w-none">
          <motion.div
            className="text-gray-900 leading-relaxed whitespace-pre-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {displayedText}
            {isTyping && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="text-blue-500 font-bold"
              >
                |
              </motion.span>
            )}
          </motion.div>
        </div>

        {/* 메타데이터 토글 */}
        {currentResponse.logs && currentResponse.logs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 pt-4 border-t border-gray-200"
          >
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showMetadata ? '분석 과정 숨기기' : '분석 과정 보기'} ({currentResponse.logs.length}단계)
            </button>
            
            <AnimatePresence>
              {showMetadata && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 space-y-2 overflow-hidden"
                >
                  {currentResponse.logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-md"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === 'completed' ? 'bg-green-400' :
                        log.status === 'processing' ? 'bg-yellow-400' :
                        'bg-red-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-700">{log.step}</span>
                          {log.duration && (
                            <span className="text-xs text-gray-500">{log.duration}ms</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{log.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* 액션 버튼들 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="p-4 border-t border-gray-200 bg-gray-50/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 복사 버튼 */}
            <motion.button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Copy className="w-3 h-3" />
              {isCopied ? '복사됨!' : '복사'}
            </motion.button>

            {/* 재생성 버튼 */}
            {onRegenerate && (
              <motion.button
                onClick={onRegenerate}
                className="flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw className="w-3 h-3" />
                재생성
              </motion.button>
            )}
          </div>

          {/* 피드백 버튼들 */}
          <div className="flex items-center gap-1">
            <motion.button
              onClick={() => handleFeedback('positive')}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ThumbsUp className="w-3 h-3" />
            </motion.button>
            <motion.button
              onClick={() => handleFeedback('negative')}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ThumbsDown className="w-3 h-3" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 