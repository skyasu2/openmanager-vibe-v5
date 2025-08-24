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
// framer-motion 제거 - CSS 애니메이션 사용
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
  details?: unknown;
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
  {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
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

    eventSource.onmessage = (event) => {
      try {
        const logEntry: RealTimeAILog = JSON.parse(event.data);
        setLogs((prev) => [...prev.slice(-49), logEntry]); // 최대 50개 로그 유지

        // 현재 엔진 업데이트
        if (logEntry.engine) {
          setCurrentEngine(logEntry.engine);
        }

        // 기술 스택 추적
        if (logEntry.source) {
          setTechStack((prev) => new Set([...prev, logEntry.source]));
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

    eventSource.onerror = (error) => {
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
      <div className="rounded-lg border border-red-700/30 bg-red-900/20 p-4">
        <div className="flex items-center gap-2 text-red-300">
          <Shield className="h-5 w-5" />
          <span className="font-medium">관리자 전용 기능</span>
        </div>
        <p className="mt-1 text-sm text-red-400">
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
      INFO: <Info className="h-3 w-3" />,
      DEBUG: <Code className="h-3 w-3" />,
      PROCESSING: <Loader2 className="h-3 w-3 animate-spin" />,
      SUCCESS: <CheckCircle className="h-3 w-3" />,
      ERROR: <AlertTriangle className="h-3 w-3" />,
      WARNING: <AlertTriangle className="h-3 w-3" />,
      ANALYSIS: <Brain className="h-3 w-3" />,
    };
    return icons[level] || <Info className="h-3 w-3" />;
  };

  // 기술 스택 표시
  const renderTechStack = () => {
    const stackIcons: { [key: string]: React.ReactNode } = {
      'AI Engine': <Brain className="h-4 w-4" />,
      Database: <Database className="h-4 w-4" />,
      Cache: <Zap className="h-4 w-4" />,
      Network: <Network className="h-4 w-4" />,
      CPU: <Cpu className="h-4 w-4" />,
      Python: <Code className="h-4 w-4" />,
    };

    return (
      <div className="mb-3 flex flex-wrap gap-2">
        {Array.from(techStack).map((tech) => (
          <div
            key={tech}
            className="flex items-center gap-1 rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-300"
          >
            {stackIcons[tech] || <Terminal className="h-4 w-4" />}
            <span>{tech}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`rounded-lg border border-gray-700 bg-gray-900 ${className}`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-700 p-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-green-400" />
          <span className="font-medium text-white">실시간 AI 사고 과정</span>
          {isProcessing && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">처리 중...</span>
            </div>
          )}
        </div>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-gray-400 transition-colors hover:text-white"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <React.Fragment>
        {isExpanded && (
          <div
            className="overflow-hidden"
          >
            <div className="p-3">
              {/* 기술 스택 표시 */}
              {showTechStack &&
                isExpanded &&
                techStack.size > 0 &&
                renderTechStack()}

              {/* 로그 컨테이너 */}
              <div
                ref={logContainerRef}
                className="h-64 overflow-y-auto rounded-md bg-black p-3 font-mono text-sm"
                style={{ scrollbarWidth: 'thin' }}
              >
                {logs.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    AI 로그를 기다리는 중...
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className="mb-2 last:mb-0"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-xs text-gray-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <div
                          className={`flex items-center gap-1 ${getLogStyle(log.level)}`}
                        >
                          {getLogIcon(log.level)}
                          <span className="text-xs">[{log.level}]</span>
                        </div>
                        <span className="text-xs text-blue-400">
                          {log.source}:
                        </span>
                        <span className="flex-1 text-xs text-white">
                          {log.message}
                        </span>
                        {log.duration && (
                          <span className="text-xs text-gray-500">
                            {log.duration}ms
                          </span>
                        )}
                      </div>
                      {log.details !== undefined && showDetails && (
                        <div className="ml-6 mt-1 text-xs text-gray-400">
                          <pre>{JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* 하단 정보 */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  {currentEngine && <span>엔진: {currentEngine}</span>}
                  <span>로그: {logs.length}/50</span>
                </div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="transition-colors hover:text-white"
                >
                  {showDetails ? '상세 숨김' : '상세 표시'}
                </button>
              </div>
            </div>
          </div>
        )}
      </React.Fragment>
    </div>
  );
};

export default RealTimeThinkingViewer;
