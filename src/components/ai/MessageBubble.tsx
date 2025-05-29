'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Brain } from 'lucide-react';

interface ThinkingProcess {
  steps: string[];
  confidence: number;
  duration: number;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'thinking';
  content: string;
  thinking?: ThinkingProcess;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showThinking, setShowThinking] = useState(true);
  
  if (message.type === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] px-4 py-2 bg-purple-500 text-white rounded-lg">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-2"
    >
      {/* AI 생각 과정 - 인라인 표시 */}
      {message.thinking && (
        <div className="bg-blue-50 rounded-lg p-3">
          <button
            onClick={() => setShowThinking(!showThinking)}
            className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
          >
            <motion.div
              animate={{ rotate: showThinking ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
            <Brain className="w-4 h-4" />
            AI 생각 과정 ({message.thinking.confidence * 100}% 신뢰도)
          </button>
          
          <AnimatePresence>
            {showThinking && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 space-y-1 overflow-hidden"
              >
                {message.thinking.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-xs text-gray-600 flex items-start gap-2"
                  >
                    <span className="text-blue-500">•</span>
                    <span>{step}</span>
                  </motion.div>
                ))}
                <div className="mt-2 text-xs text-gray-500">
                  처리 시간: {message.thinking.duration}초
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* AI 응답 */}
      <div className="max-w-[80%] px-4 py-2 bg-gray-100 rounded-lg">
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div className="text-xs text-gray-500 mt-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
} 