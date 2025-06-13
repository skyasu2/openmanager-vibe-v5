/**
 * 🔍 실시간 AI 로그 수집기 v2.0
 * 
 * 실제 AI 엔진의 처리 과정을 실시간으로 수집하고 스트리밍
 * - UniversalAILogger와 연동
 * - 실시간 WebSocket 스트리밍
 * - 오픈소스 기술 스택 추적
 * - 관리자 페이지와 사이드바 공용
 */

import { EventEmitter } from 'events';
import { UniversalAILogger } from './UniversalAILogger';
import { aiLogger, LogLevel, LogCategory } from './AILogger';

export interface RealTimeAILog {
    id: string;
    timestamp: string;
    level: 'INFO' | 'DEBUG' | 'PROCESSING' | 'SUCCESS' | 'ERROR' | 'WARNING' | 'ANALYSIS';
    engine: string;
    module: string;
    message: string;
    details?: string;
    progress?: number;
    sessionId: string;
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

export interface AIEngineProcess {
    sessionId: string;
    engineId: string;
    startTime: number;
    currentStep: string;
    progress: number;
    logs: RealTimeAILog[];
    techStack: Set<string>;
}

export class RealTimeAILogCollector extends EventEmitter {
    private static instance: RealTimeAILogCollector | null = null;
    private activeProcesses: Map<string, AIEngineProcess> = new Map();
    private universalLogger: UniversalAILogger;
    private logBuffer: RealTimeAILog[] = [];
    private maxBufferSize = 1000;

    // 오픈소스 기술 매핑
    private techStackMapping: Record<string, string> = {
        'mcp': 'Model Context Protocol',
        'rag': 'Retrieval-Augmented Generation',
        'google-ai': 'Google AI Studio',
        'vector-db': 'Vector Database',
        'transformers': 'Hugging Face Transformers',
        'langchain': 'LangChain',
        'openai': 'OpenAI API',
        'tensorflow': 'TensorFlow',
        'pytorch': 'PyTorch',
        'fastapi': 'FastAPI',
        'redis': 'Redis Cache',
        'supabase': 'Supabase Database',
        'vercel': 'Vercel Edge Functions'
    };

    private constructor() {
        super();
        this.universalLogger = UniversalAILogger.getInstance();
        this.setupUniversalLoggerListeners();
    }

    static getInstance(): RealTimeAILogCollector {
        if (!RealTimeAILogCollector.instance) {
            RealTimeAILogCollector.instance = new RealTimeAILogCollector();
        }
        return RealTimeAILogCollector.instance;
    }

    /**
     * 🎯 UniversalAILogger 이벤트 리스너 설정
     */
    private setupUniversalLoggerListeners(): void {
        // AI 상호작용 시작
        this.universalLogger.on('interaction_started', (data) => {
            this.startProcess(data.sessionId, 'unified-ai', data.query);
        });

        // AI 사고 과정 로깅
        this.universalLogger.on('thinking_logged', (data) => {
            this.addThinkingLog(data.sessionId, data.engineId, data.step);
        });

        // AI 엔진 완료
        this.universalLogger.on('engine_completed', (data) => {
            this.addEngineCompletionLog(data.sessionId, data.engineId, data.status, data.confidence);
        });

        // AI 상호작용 완료
        this.universalLogger.on('interaction_completed', (data) => {
            this.completeProcess(data.sessionId);
        });
    }

    /**
     * 🚀 AI 처리 과정 시작
     */
    startProcess(sessionId: string, engineId: string, query: string): void {
        const process: AIEngineProcess = {
            sessionId,
            engineId,
            startTime: Date.now(),
            currentStep: '초기화',
            progress: 0,
            logs: [],
            techStack: new Set()
        };

        this.activeProcesses.set(sessionId, process);

        // 시작 로그 추가
        this.addLog({
            id: `start_${sessionId}_${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: 'INFO',
            engine: engineId,
            module: 'system',
            message: `AI 처리 시작: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`,
            sessionId,
            progress: 0,
            metadata: {
                technology: 'unified-ai',
                openSource: 'mcp'
            }
        });
    }

    /**
     * 💭 AI 사고 과정 로그 추가
     */
    addThinkingLog(sessionId: string, engineId: string, step: any): void {
        const process = this.activeProcesses.get(sessionId);
        if (!process) return;

        // 기술 스택 감지
        const detectedTech = this.detectTechnology(step.thinking || '', engineId);
        detectedTech.forEach(tech => process.techStack.add(tech));

        const log: RealTimeAILog = {
            id: `thinking_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            level: 'PROCESSING',
            engine: engineId,
            module: 'thinking',
            message: step.thinking || step.content || '사고 과정 진행 중...',
            details: step.details,
            progress: step.progress,
            sessionId,
            metadata: {
                confidence: step.confidence,
                algorithm: step.algorithm,
                technology: detectedTech[0],
                openSource: detectedTech[0]
            }
        };

        this.addLog(log);
        process.currentStep = step.thinking || step.content || '처리 중';
        process.progress = step.progress || 0;
    }

    /**
     * ✅ AI 엔진 완료 로그 추가
     */
    addEngineCompletionLog(sessionId: string, engineId: string, status: string, confidence: number): void {
        const process = this.activeProcesses.get(sessionId);
        if (!process) return;

        const log: RealTimeAILog = {
            id: `completion_${sessionId}_${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: status === 'success' ? 'SUCCESS' : 'ERROR',
            engine: engineId,
            module: 'completion',
            message: status === 'success' ?
                `${engineId} 엔진 처리 완료` :
                `${engineId} 엔진 처리 실패`,
            sessionId,
            progress: status === 'success' ? 1.0 : 0,
            metadata: {
                confidence,
                processingTime: Date.now() - process.startTime,
                technology: engineId,
                openSource: engineId
            }
        };

        this.addLog(log);
    }

    /**
     * 🏁 AI 처리 과정 완료
     */
    completeProcess(sessionId: string): void {
        const process = this.activeProcesses.get(sessionId);
        if (!process) return;

        const log: RealTimeAILog = {
            id: `complete_${sessionId}_${Date.now()}`,
            timestamp: new Date().toISOString(),
            level: 'SUCCESS',
            engine: 'unified-ai',
            module: 'system',
            message: 'AI 처리 완료',
            sessionId,
            progress: 1.0,
            metadata: {
                processingTime: Date.now() - process.startTime,
                techStackCount: process.techStack.size,
                technology: 'unified-ai'
            }
        };

        this.addLog(log);

        // 프로세스 정리 (5분 후)
        setTimeout(() => {
            this.activeProcesses.delete(sessionId);
        }, 5 * 60 * 1000);
    }

    /**
     * 📝 로그 추가 (공통)
     */
    addLog(log: RealTimeAILog): void {
        // 버퍼에 추가
        this.logBuffer.push(log);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }

        // 프로세스에 추가
        const process = this.activeProcesses.get(log.sessionId);
        if (process) {
            process.logs.push(log);
            if (process.logs.length > 100) {
                process.logs.shift();
            }
        }

        // 실시간 이벤트 발송
        this.emit('log_added', log);

        // AI Logger에도 기록
        aiLogger.logAI({
            level: this.mapToAILogLevel(log.level),
            category: LogCategory.AI_ENGINE,
            engine: log.engine,
            message: log.message,
            metadata: {
                sessionId: log.sessionId,
                module: log.module,
                progress: log.progress,
                ...log.metadata
            }
        });
    }

    /**
     * 🔍 기술 스택 감지
     */
    private detectTechnology(message: string, engineId: string): string[] {
        const detected: string[] = [];
        const lowerMessage = message.toLowerCase();

        // 엔진 ID 기반 감지
        if (engineId.includes('mcp')) detected.push('mcp');
        if (engineId.includes('rag')) detected.push('rag');
        if (engineId.includes('google')) detected.push('google-ai');
        if (engineId.includes('vector')) detected.push('vector-db');

        // 메시지 내용 기반 감지
        Object.keys(this.techStackMapping).forEach(tech => {
            if (lowerMessage.includes(tech) || lowerMessage.includes(this.techStackMapping[tech].toLowerCase())) {
                detected.push(tech);
            }
        });

        // 특정 키워드 감지
        if (lowerMessage.includes('vector') || lowerMessage.includes('embedding')) detected.push('vector-db');
        if (lowerMessage.includes('cache') || lowerMessage.includes('redis')) detected.push('redis');
        if (lowerMessage.includes('database') || lowerMessage.includes('supabase')) detected.push('supabase');
        if (lowerMessage.includes('api') || lowerMessage.includes('endpoint')) detected.push('fastapi');

        return [...new Set(detected)];
    }

    /**
     * 📊 로그 레벨 매핑
     */
    private mapToAILogLevel(level: string): LogLevel {
        switch (level) {
            case 'ERROR': return LogLevel.ERROR;
            case 'WARNING': return LogLevel.WARN;
            case 'DEBUG': return LogLevel.DEBUG;
            case 'PROCESSING': return LogLevel.AI_THINKING;
            case 'ANALYSIS': return LogLevel.AI_ANALYSIS;
            default: return LogLevel.INFO;
        }
    }

    /**
     * 📋 세션별 로그 조회
     */
    getSessionLogs(sessionId: string): RealTimeAILog[] {
        const process = this.activeProcesses.get(sessionId);
        if (process) {
            return process.logs;
        }

        // 버퍼에서 검색
        return this.logBuffer.filter(log => log.sessionId === sessionId);
    }

    /**
     * 🔄 실시간 로그 스트림 생성
     */
    createLogStream(sessionId?: string): AsyncGenerator<RealTimeAILog> {
        return this.createAsyncGenerator(sessionId);
    }

    private async *createAsyncGenerator(sessionId?: string): AsyncGenerator<RealTimeAILog> {
        const logQueue: RealTimeAILog[] = [];
        let isActive = true;

        const logHandler = (log: RealTimeAILog) => {
            if (!sessionId || log.sessionId === sessionId) {
                logQueue.push(log);
            }
        };

        this.on('log_added', logHandler);

        try {
            while (isActive) {
                if (logQueue.length > 0) {
                    yield logQueue.shift()!;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        } finally {
            this.off('log_added', logHandler);
        }
    }

    /**
     * 📊 활성 프로세스 통계
     */
    getActiveProcessStats() {
        const processes = Array.from(this.activeProcesses.values());

        return {
            activeCount: processes.length,
            totalLogs: this.logBuffer.length,
            averageProgress: processes.length > 0 ?
                processes.reduce((sum, p) => sum + p.progress, 0) / processes.length : 0,
            techStackUsage: this.getTechStackUsage(processes),
            processingEngines: processes.map(p => p.engineId)
        };
    }

    /**
     * 🛠️ 기술 스택 사용 통계
     */
    private getTechStackUsage(processes: AIEngineProcess[]): Record<string, number> {
        const usage: Record<string, number> = {};

        processes.forEach(process => {
            process.techStack.forEach(tech => {
                usage[tech] = (usage[tech] || 0) + 1;
            });
        });

        return usage;
    }

    /**
     * 🧹 로그 정리
     */
    cleanup(): void {
        // 오래된 프로세스 정리 (1시간 이상)
        const cutoffTime = Date.now() - 60 * 60 * 1000;

        for (const [sessionId, process] of this.activeProcesses.entries()) {
            if (process.startTime < cutoffTime) {
                this.activeProcesses.delete(sessionId);
            }
        }

        // 로그 버퍼 정리
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.splice(0, this.logBuffer.length - this.maxBufferSize);
        }
    }
} 