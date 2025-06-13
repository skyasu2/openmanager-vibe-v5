/**
 * 🧠 실시간 AI 사고 과정 뷰어 v2.0
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
    Clock,
    CheckCircle,
    AlertTriangle,
    Info,
    Loader2
} from 'lucide-react';

// 실시간 AI 로그 엔트리 타입
export interface RealTimeAILog {
    id: string;
    timestamp: string;
    level: 'INFO' | 'DEBUG' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'ANALYSIS';
    engine: string;
    module: string;
    message: string;
    details?: string;
    progress?: number;
    metadata?: {
        processingTime?: number;
        confidence?: number;
        algorithm?: string;
        technology?: string;
        openSource?: string;
        apiCall?: boolean;
        cacheHit?: boolean;
        [key: string]: any;
    };
}

// 오픈소스 기술 매핑
const TECH_STACK_MAP: Record<string, { name: string; icon: React.ComponentType<any>; color: string }> = {
    'mcp': { name: 'Model Context Protocol', icon: Network, color: 'text-blue-400' },
    'rag': { name: 'Retrieval-Augmented Generation', icon: Database, color: 'text-green-400' },
    'google-ai': { name: 'Google AI Studio', icon: Brain, color: 'text-yellow-400' },
    'vector-db': { name: 'Vector Database', icon: Database, color: 'text-purple-400' },
    'transformers': { name: 'Hugging Face Transformers', icon: Code, color: 'text-orange-400' },
    'langchain': { name: 'LangChain', icon: Code, color: 'text-cyan-400' },
    'openai': { name: 'OpenAI API', icon: Brain, color: 'text-emerald-400' },
    'tensorflow': { name: 'TensorFlow', icon: Cpu, color: 'text-red-400' },
    'pytorch': { name: 'PyTorch', icon: Cpu, color: 'text-pink-400' },
    'fastapi': { name: 'FastAPI', icon: Zap, color: 'text-indigo-400' }
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
    className = ''
}) => {
    const [logs, setLogs] = useState<RealTimeAILog[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentEngine, setCurrentEngine] = useState<string>('');
    const [techStack, setTechStack] = useState<Set<string>>(new Set());
    const [showDetails, setShowDetails] = useState(false);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // 실시간 로그 수집
    useEffect(() => {
        if (!sessionId) return;

        const eventSource = new EventSource(`/api/ai/logging/stream?sessionId=${sessionId}`);

        eventSource.onmessage = (event) => {
            try {
                const logEntry: RealTimeAILog = JSON.parse(event.data);

                setLogs(prev => [...prev, logEntry].slice(-50)); // 최근 50개만 유지
                setCurrentEngine(logEntry.engine);

                // 기술 스택 추가
                if (logEntry.metadata?.technology) {
                    setTechStack(prev => new Set([...prev, logEntry.metadata!.technology!]));
                }
                if (logEntry.metadata?.openSource) {
                    setTechStack(prev => new Set([...prev, logEntry.metadata!.openSource!]));
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

        eventSource.onerror = () => {
            console.warn('AI 로그 스트림 연결 오류');
            setIsProcessing(false);
        };

        return () => {
            eventSource.close();
        };
    }, [sessionId]);

    // 자동 스크롤
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // 로그 레벨별 스타일
    const getLogLevelStyle = (level: string) => {
        switch (level) {
            case 'ERROR':
                return 'text-red-400 bg-red-900/20 border-red-500/30';
            case 'WARNING':
                return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
            case 'SUCCESS':
                return 'text-green-400 bg-green-900/20 border-green-500/30';
            case 'PROCESSING':
                return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
            case 'ANALYSIS':
                return 'text-purple-400 bg-purple-900/20 border-purple-500/30';
            case 'DEBUG':
                return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
            default:
                return 'text-cyan-400 bg-cyan-900/20 border-cyan-500/30';
        }
    };

    // 로그 레벨 아이콘
    const getLogLevelIcon = (level: string) => {
        switch (level) {
            case 'ERROR':
                return <AlertTriangle className="w-3 h-3" />;
            case 'WARNING':
                return <AlertTriangle className="w-3 h-3" />;
            case 'SUCCESS':
                return <CheckCircle className="w-3 h-3" />;
            case 'PROCESSING':
                return <Loader2 className="w-3 h-3 animate-spin" />;
            case 'ANALYSIS':
                return <Brain className="w-3 h-3" />;
            case 'DEBUG':
                return <Code className="w-3 h-3" />;
            default:
                return <Info className="w-3 h-3" />;
        }
    };

    if (logs.length === 0 && !isProcessing) {
        return (
            <div className={`bg-gray-900 rounded-lg border border-gray-700 p-4 ${className}`}>
                <div className="text-center text-gray-400">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">AI 사고 과정 대기 중...</p>
                    <p className="text-xs mt-1 opacity-70">질문을 입력하면 실시간 처리 과정을 확인할 수 있습니다</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-gray-900 rounded-lg border border-gray-700 overflow-hidden ${className}`}>
            {/* 헤더 */}
            <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-400" />
                            <span className="text-white text-sm font-medium">
                                AI 사고 과정 {isProcessing ? '(진행 중)' : '(완료)'}
                            </span>
                            {isProcessing && (
                                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                            )}
                        </div>

                        {currentEngine && (
                            <div className="text-xs text-gray-400">
                                현재: {currentEngine}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {logs.length > 0 && (
                            <span className="text-xs text-gray-400">
                                {logs.length}개 로그
                            </span>
                        )}

                        {onToggle && (
                            <button
                                onClick={onToggle}
                                className="p-1 hover:bg-gray-700 rounded transition-colors"
                                title={isExpanded ? '접기' : '펼치기'}
                            >
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* 기술 스택 표시 */}
                {showTechStack && techStack.size > 0 && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                            <Code className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-400 font-medium">사용 중인 기술</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {Array.from(techStack).map(tech => {
                                const techInfo = TECH_STACK_MAP[tech];
                                if (!techInfo) return null;

                                const IconComponent = techInfo.icon;
                                return (
                                    <div
                                        key={tech}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${techInfo.color} bg-gray-800 border border-gray-600`}
                                        title={techInfo.name}
                                    >
                                        <IconComponent className="w-3 h-3" />
                                        <span>{techInfo.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* 로그 콘솔 */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        {/* 터미널 헤더 */}
                        <div className="bg-black px-3 py-2 border-b border-gray-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    </div>
                                    <Terminal className="w-3 h-3 text-gray-400" />
                                    <span className="text-gray-400 text-xs font-mono">
                                        AI Engine Console - Real-time Logs
                                    </span>
                                </div>

                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="text-green-400 text-xs hover:text-green-300 transition-colors"
                                    title="상세 정보 토글"
                                >
                                    {showDetails ? '간소화' : '상세보기'}
                                </button>
                            </div>
                        </div>

                        {/* 로그 내용 */}
                        <div
                            ref={logContainerRef}
                            className="bg-black p-3 max-h-80 overflow-y-auto font-mono text-xs"
                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #1F2937' }}
                        >
                            <div className="space-y-1">
                                {logs.map((log, index) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group"
                                    >
                                        <div className="flex items-start gap-2 text-white">
                                            {/* 타임스탬프 */}
                                            <span className="text-gray-500 flex-shrink-0 w-20">
                                                {new Date(log.timestamp).toLocaleTimeString('ko-KR', {
                                                    hour12: false,
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </span>

                                            {/* 로그 레벨 */}
                                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${getLogLevelStyle(log.level)}`}>
                                                {getLogLevelIcon(log.level)}
                                                <span>{log.level}</span>
                                            </div>

                                            {/* 엔진/모듈 */}
                                            <span className="text-cyan-400 flex-shrink-0 min-w-0">
                                                [{log.engine}:{log.module}]
                                            </span>

                                            {/* 메시지 */}
                                            <span className="text-gray-300 flex-1 min-w-0">
                                                {log.message}
                                            </span>

                                            {/* 진행률 */}
                                            {log.progress !== undefined && (
                                                <span className="text-yellow-400 flex-shrink-0">
                                                    {Math.round(log.progress * 100)}%
                                                </span>
                                            )}
                                        </div>

                                        {/* 상세 정보 */}
                                        {showDetails && (log.details || log.metadata) && (
                                            <div className="ml-24 mt-1 text-gray-400 text-xs">
                                                {log.details && (
                                                    <div className="mb-1">📝 {log.details}</div>
                                                )}
                                                {log.metadata && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {log.metadata.processingTime && (
                                                            <span className="bg-gray-800 px-1 rounded">
                                                                ⏱️ {log.metadata.processingTime}ms
                                                            </span>
                                                        )}
                                                        {log.metadata.confidence && (
                                                            <span className="bg-gray-800 px-1 rounded">
                                                                🎯 {Math.round(log.metadata.confidence * 100)}%
                                                            </span>
                                                        )}
                                                        {log.metadata.algorithm && (
                                                            <span className="bg-gray-800 px-1 rounded">
                                                                🧮 {log.metadata.algorithm}
                                                            </span>
                                                        )}
                                                        {log.metadata.cacheHit && (
                                                            <span className="bg-green-800 px-1 rounded text-green-300">
                                                                💾 캐시 히트
                                                            </span>
                                                        )}
                                                        {log.metadata.apiCall && (
                                                            <span className="bg-blue-800 px-1 rounded text-blue-300">
                                                                🌐 API 호출
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* 처리 중 인디케이터 */}
                            {isProcessing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2 text-yellow-400 mt-2"
                                >
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>AI가 처리 중입니다...</span>
                                    <div className="flex gap-1">
                                        <motion.div
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                                            className="w-1 h-1 bg-yellow-400 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                                            className="w-1 h-1 bg-yellow-400 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                                            className="w-1 h-1 bg-yellow-400 rounded-full"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}; 