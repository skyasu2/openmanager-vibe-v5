'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Search, 
  Zap, 
  CheckCircle, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  Activity
} from 'lucide-react';
import { useAIThinking } from '@/stores/useAISidebarStore';
import type { AgentLog } from '@/stores/useAISidebarStore';

interface AgentThinkingPanelProps {
  className?: string;
  showDetails?: boolean;
}

// 🎯 단계별 정보
const STEP_INFO = {
  context: {
    icon: Search,
    title: '컨텍스트 분석',
    description: '서버 상태 데이터를 수집하고 분석하고 있습니다...',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  match: {
    icon: Brain,
    title: '패턴 매칭',
    description: 'AI가 기존 패턴과 매칭하여 최적의 답변을 찾고 있습니다...',
    color: 'text-purple-400', 
    bgColor: 'bg-purple-500/20'
  },
  generate: {
    icon: Zap,
    title: '응답 생성',
    description: '분석된 데이터를 바탕으로 답변을 생성하고 있습니다...',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20'
  },
  validation: {
    icon: CheckCircle,
    title: '검증 및 후처리',
    description: '생성된 답변의 정확성을 검증하고 있습니다...',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
  }
};

export default function AgentThinkingPanel({ 
  className = '',
  showDetails = true 
}: AgentThinkingPanelProps) {
  // TODO: Zustand 타입 에러 해결 후 복원
  const isThinking = false;
  const logs: any[] = [];
  const processingProgress = 0;
  
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isThinking) {
    return (
      <div className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl backdrop-blur-sm p-4 ${className}`}>
        <div className="text-center text-gray-400">
          <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">AI 사고 과정 대기 중...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl backdrop-blur-sm ${className}`}
    >
      {/* 간단한 로딩 표시 */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"
          >
            <Brain className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h3 className="text-white font-medium">AI 사고 과정</h3>
            <p className="text-xs text-gray-400">분석 중...</p>
          </div>
        </div>
        
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${processingProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
} 