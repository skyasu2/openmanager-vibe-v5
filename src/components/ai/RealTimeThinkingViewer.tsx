/**
 * 🧠 실시간 AI 사고 과정 뷰어 v2.0 (관리자 전용)
 *
 * ⚠️ 주의: 이 컴포넌트는 관리자 페이지에서만 사용하도록 제한됩니다.
 * 일반 사용자 인터페이스에서는 사용하지 마세요.
 *
 * 실제 AI 엔진의 처리 과정을 실시간으로 수집하고 표시
 * - 실제 AI 엔진 로그 기반
 * - 오픈소스 기술 스택 표시
 * - 관리자 페이지와 사이드바 공용
 * - 검은색 배경, 흰색 글씨 터미널 스타일
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Terminal,
  Cpu,
  Database,
  Network,
  Code,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
  Shield,
} from 'lucide-react';

// 관리자 권한 체크
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';

// 실시간 AI 로그 엔트리 타입
interface RealTimeAILog {
  id: string;
  timestamp: Date;
  level:
    | 'INFO'
    | 'DEBUG'
    | 'PROCESSING'
    | 'SUCCESS'
    | 'ERROR'
    | 'WARNING'
    | 'ANALYSIS';
  source: string;
  message: string;
  details?: any;
  engine?: string;
  duration?: number;
  metadata?: {
    requestId?: string;
    sessionId?: string;
    userId?: string;
    model?: string;
    confidence?: number;
    tokens?: number;
  };
}

// 오픈소스 기술 매핑
const _TECH_STACK_MAP: Record<
  string,
  { name: string; icon: React.ComponentType<any>; color: string }
> = {
  mcp: {
    name: 'Model Context Protocol',
    icon: Network,
    color: 'text-blue-400',
  },
  rag: {
    name: 'Retrieval-Augmented Generation',
    icon: Database,
    color: 'text-green-400',
  },
  'google-ai': {
    name: 'Google AI Studio',
    icon: Brain,
    color: 'text-yellow-400',
  },
  'vector-db': {
    name: 'Vector Database',
    icon: Database,
    color: 'text-purple-400',
  },
  transformers: {
    name: 'Hugging Face Transformers',
    icon: Code,
    color: 'text-orange-400',
  },
  langchain: { name: 'LangChain', icon: Code, color: 'text-cyan-400' },
  openai: { name: 'OpenAI API', icon: Brain, color: 'text-emerald-400' },
  tensorflow: { name: 'TensorFlow', icon: Cpu, color: 'text-red-400' },
  pytorch: { name: 'PyTorch', icon: Cpu, color: 'text-pink-400' },
  fastapi: { name: 'FastAPI', icon: Zap, color: 'text-indigo-400' },
};

interface RealTimeThinkingViewerProps {
  sessionId?: string;
  isExpanded?: boolean;
  onToggle?: () => void;
  showTechStack?: boolean;
  mode?: 'sidebar' | 'admin';
  className?: string;
}

export const RealTimeThinkingViewer: React.FC<RealTimeThinkingViewerProps> = ({
  sessionId,
  isExpanded = true,
  onToggle,
  showTechStack = true,
  mode = 'sidebar',
  className = '',
}) => {
  // 모든 훅을 먼저 호출 (조건부 반환 전에)
  const [logs, setLogs] = useState<RealTimeAILog[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentEngine, setCurrentEngine] = useState<string>('');
  const [techStack, setTechStack] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // 🔒 관리자 권한 체크
  const { adminMode } = useUnifiedAdminStore();

  // 실시간 로그 수집
  useEffect(() => {
    if (!adminMode || !sessionId) return;

    const eventSource = new EventSource(
      `/api/ai/logs/stream?sessionId=${sessionId}`
    );

    eventSource.onmessage = event => {
      try {
        const logEntry: RealTimeAILog = JSON.parse(event._data);
        setLogs(prev => [...prev.slice(-49), logEntry]); // 최대 50개 로그 유지

        // 현재 엔진 업데이트
        if (logEntry.engine) {
          setCurrentEngine(logEntry.engine);
        }

        // 기술 스택 추적
        if (logEntry.source) {
          setTechStack(prev => new Set([...prev, logEntry.source]));
        }

        // 처리 상태 업데이트
        if (logEntry.level === 'PROCESSING') {
          setIsProcessing(true);
        } else if (logEntry.level === 'SUCCESS' || logEntry.level === 'ERROR') {
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('로그 파싱 오류:', error);
      }
    };

    eventSource.onerror = error => {
      console.error('EventSource 오류:', error);
      setIsProcessing(false);
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId, adminMode]);

  // 자동 스크롤
  useEffect(() => {
    if (!adminMode) return;

    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, adminMode]);

  // 관리자가 아니면 접근 제한 UI 표시
  if (!adminMode) {
    return (
      <div className='bg-red-900/20 border border-red-700/30 rounded-lg p-4'>
        <div className='flex items-center gap-2 text-red-300'>
          <Shield className='w-5 h-5' />
          <span className='font-medium'>관리자 전용 기능</span>
        </div>
        <p className='text-red-400 text-sm mt-1'>
          실시간 AI 사고 과정 뷰어는 관리자만 접근할 수 있습니다.
        </p>
      </div>
    );
  }

  // 로그 레벨별 스타일
  const getLogStyle = (level: RealTimeAILog['level']) => {
    const styles = {
      INFO: 'text-gray-300',
      DEBUG: 'text-blue-300',
      PROCESSING: 'text-yellow-300',
      SUCCESS: 'text-green-300',
      ERROR: 'text-red-300',
      WARNING: 'text-orange-300',
      ANALYSIS: 'text-purple-300',
    };
    return styles[level] || 'text-gray-300';
  };

  // 로그 레벨별 아이콘
  const getLogIcon = (level: RealTimeAILog['level']) => {
    const icons = {
      INFO: <Info className='w-3 h-3' />,
      DEBUG: <Code className='w-3 h-3' />,
      PROCESSING: <Loader2 className='w-3 h-3 animate-spin' />,
      SUCCESS: <CheckCircle className='w-3 h-3' />,
      ERROR: <AlertTriangle className='w-3 h-3' />,
      WARNING: <AlertTriangle className='w-3 h-3' />,
      ANALYSIS: <Brain className='w-3 h-3' />,
    };
    return icons[level] || <Info className='w-3 h-3' />;
  };

  // 기술 스택 표시
  const renderTechStack = () => {
    const stackIcons: { [key: string]: React.ReactNode } = {
      'AI Engine': <Brain className='w-4 h-4' />,
      Database: <Database className='w-4 h-4' />,
      Cache: <Zap className='w-4 h-4' />,
      Network: <Network className='w-4 h-4' />,
      CPU: <Cpu className='w-4 h-4' />,
      Python: <Code className='w-4 h-4' />,
    };

    return (
      <div className='flex flex-wrap gap-2 mb-3'>
        {Array.from(techStack).map(tech => (
          <motion.div
            key={tech}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className='flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-md text-xs text-gray-300'
          >
            {stackIcons[tech] || <Terminal className='w-4 h-4' />}
            <span>{tech}</span>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`bg-gray-900 border border-gray-700 rounded-lg ${className}`}
    >
      {/* 헤더 */}
      <div className='flex items-center justify-between p-3 border-b border-gray-700'>
        <div className='flex items-center gap-2'>
          <Terminal className='w-5 h-5 text-green-400' />
          <span className='text-white font-medium'>실시간 AI 사고 과정</span>
          {isProcessing && (
            <div className='flex items-center gap-1 text-yellow-400'>
              <Loader2 className='w-4 h-4 animate-spin' />
              <span className='text-xs'>처리 중...</span>
            </div>
          )}
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className='text-gray-400 hover:text-white transition-colors'
          >
            {isExpanded ? (
              <ChevronUp className='w-4 h-4' />
            ) : (
              <ChevronDown className='w-4 h-4' />
            )}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className='overflow-hidden'
          >
            <div className='p-3'>
              {/* 기술 스택 표시 */}
              {showTechStack &&
                isExpanded &&
                techStack.size > 0 &&
                renderTechStack()}

              {/* 로그 컨테이너 */}
              <div
                ref={logContainerRef}
                className='bg-black rounded-md p-3 h-64 overflow-y-auto font-mono text-sm'
                style={{ scrollbarWidth: 'thin' }}
              >
                {logs.length === 0 ? (
                  <div className='text-gray-500 text-center py-8'>
                    AI 로그를 기다리는 중...
                  </div>
                ) : (
                  logs.map(log => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='mb-2 last:mb-0'
                    >
                      <div className='flex items-start gap-2'>
                        <span className='text-gray-500 text-xs mt-0.5'>
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <div
                          className={`flex items-center gap-1 ${getLogStyle(log.level)}`}
                        >
                          {getLogIcon(log.level)}
                          <span className='text-xs'>[{log.level}]</span>
                        </div>
                        <span className='text-blue-400 text-xs'>
                          {log.source}:
                        </span>
                        <span className='text-white text-xs flex-1'>
                          {log.message}
                        </span>
                        {log.duration && (
                          <span className='text-gray-500 text-xs'>
                            {log.duration}ms
                          </span>
                        )}
                      </div>
                      {log.details && showDetails && (
                        <div className='ml-6 mt-1 text-gray-400 text-xs'>
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>

              {/* 하단 정보 */}
              <div className='flex items-center justify-between mt-3 text-xs text-gray-400'>
                <div className='flex items-center gap-4'>
                  {currentEngine && <span>엔진: {currentEngine}</span>}
                  <span>로그: {logs.length}/50</span>
                </div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className='hover:text-white transition-colors'
                >
                  {showDetails ? '상세 숨김' : '상세 표시'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RealTimeThinkingViewer;
