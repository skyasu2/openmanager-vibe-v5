'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Sparkles,
  Clock,
  MessageSquare,
  Volume2,
  VolumeX
} from 'lucide-react';

export default function FinalResponse({ 
  response, 
  onFeedback
}: any) {
  // 간단한 상태 관리
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Mock response for display
  const currentResponse = response || {
    content: '현재 시스템 상태를 분석한 결과, 전반적으로 안정적인 상태입니다. CPU 사용률은 평균 45%, 메모리 사용률은 68%로 정상 범위 내에 있습니다.',
    confidence: 0.95,
    timestamp: new Date().toISOString(),
    metadata: {
      processingTime: 2.5,
      sources: ['서버 메트릭', '로그 분석', 'AI 예측 모델']
    }
  };

  // 타이핑 애니메이션
  useEffect(() => {
    if (currentResponse.content) {
      setIsTyping(true);
      let index = 0;
      const text = currentResponse.content;
      
      const timer = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, 30);

      return () => clearInterval(timer);
    }
  }, [currentResponse.content]);

  // 복사 기능
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentResponse.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  if (!currentResponse) {
    return (
      <div className="text-center text-gray-500 py-8">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">아직 응답이 없습니다.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900">AI 분석 결과</h3>
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              {Math.round(currentResponse.confidence * 100)}% 신뢰도
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
              title="복사"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-4">
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {displayedText}
            {isTyping && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-0.5 h-4 bg-purple-500 ml-1"
              />
            )}
          </p>
        </div>

        {/* 메타데이터 */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(currentResponse.timestamp).toLocaleTimeString()}
            </div>
            <div>
              처리시간: {currentResponse.metadata?.processingTime || 2.5}초
            </div>
          </div>
          
          {/* 피드백 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFeedback?.('positive')}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="도움이 됨"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onFeedback?.('negative')}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="도움이 안됨"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 