/**
 * 🚀 Initialization Manager v1.0
 * 
 * AI 엔진 초기화 전담 모듈
 * - 순차적 초기화 관리
 * - 백그라운드 초기화 처리
 * - 지연 로딩 패턴 구현
 */

import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import { TensorFlowAIEngine } from '../../tensorflow-engine';
import { KoreanAIEngine } from '../../korean-ai-engine';
import { TransformersEngine } from '../../transformers-engine';
import { LocalVectorDB } from '../../local-vector-db';
import {
    IInitializationManager,
    InitializationStatus,
    AIEngineError
} from '../types/EnhancedAITypes';

export class InitializationManager implements IInitializationManager {
    private mcpClient: RealMCPClient;
    private tensorflowEngine: TensorFlowAIEngine;
    private koreanEngine: KoreanAIEngine;
    private transformersEngine: TransformersEngine;
    private vectorDB: LocalVectorDB;

    private initializationStatus: InitializationStatus;
    private initializationStartTime: number = 0;
    private isFullyInitialized: boolean = false;

    constructor(
        mcpClient: RealMCPClient,
        tensorflowEngine: TensorFlowAIEngine,
        koreanEngine: KoreanAIEngine,
        transformersEngine: TransformersEngine,
        vectorDB: LocalVectorDB
    ) {
        this.mcpClient = mcpClient;
        this.tensorflowEngine = tensorflowEngine;
        this.koreanEngine = koreanEngine;
        this.transformersEngine = transformersEngine;
        this.vectorDB = vectorDB;

        this.initializationStatus = {
            mcpClient: false,
            koreanEngine: false,
            tensorflowEngine: false,
            transformersEngine: false,
            vectorDB: false,
            documentIndex: false,
            isFullyInitialized: false,
            initializationTime: 0
        };
    }

    /**
     * 🧠 Enhanced AI 엔진 초기화 (한국어 특화)
     */
    async initialize(): Promise<void> {
        if (this.isFullyInitialized) {
            console.log('🧠 Enhanced AI Engine 이미 초기화 완료');
            return;
        }

        this.initializationStartTime = Date.now();
        console.log('🧠 Enhanced AI Engine v5.0 초기화 시작...');

        try {
            // 1. 한국어 AI 엔진 우선 초기화 (최고 우선순위)
            await this.initializeKoreanEngine();

            // 2. MCP 클라이언트 초기화 (필수)
            await this.initializeMCPClient();

            // 3. Vector DB 초기화 (기본 검색 기능용)
            await this.initializeVectorDB();

            // 4. 백그라운드에서 TensorFlow.js 엔진 초기화 (지연 로딩)
            this.initializeTensorFlowInBackground();

            this.isFullyInitialized = true;
            this.initializationStatus.isFullyInitialized = true;
            this.initializationStatus.initializationTime = Date.now() - this.initializationStartTime;

            console.log('✅ Enhanced AI Engine v5.0 초기화 완료 (한국어 NLP 모드)');
            console.log(`⏱️ 초기화 시간: ${this.initializationStatus.initializationTime}ms`);

        } catch (error) {
            console.error('❌ Enhanced AI Engine 초기화 실패:', error);
            throw new AIEngineError(
                'AI Engine 초기화 실패',
                'INITIALIZATION_FAILED',
                error
            );
        }
    }

    /**
     * 🇰🇷 한국어 AI 엔진 초기화
     */
    private async initializeKoreanEngine(): Promise<void> {
        try {
            await this.koreanEngine.initialize();
            this.initializationStatus.koreanEngine = true;
            console.log('✅ 한국어 AI 엔진 초기화 완료');
        } catch (error) {
            console.error('❌ 한국어 AI 엔진 초기화 실패:', error);
            // 한국어 엔진 실패는 치명적이지 않음
            this.initializationStatus.koreanEngine = false;
        }
    }

    /**
     * 🔗 MCP 클라이언트 초기화
     */
    private async initializeMCPClient(): Promise<void> {
        try {
            await this.mcpClient.initialize();
            this.initializationStatus.mcpClient = true;
            console.log('✅ MCP 클라이언트 초기화 완료');
        } catch (error) {
            console.error('❌ MCP 클라이언트 초기화 실패:', error);
            // MCP 실패는 치명적이지 않음 (폴백 가능)
            this.initializationStatus.mcpClient = false;
        }
    }

    /**
     * 🗃️ Vector DB 초기화
     */
    private async initializeVectorDB(): Promise<void> {
        try {
            await this.vectorDB.initialize();
            this.initializationStatus.vectorDB = true;
            console.log('✅ Vector DB 초기화 완료');
        } catch (error) {
            console.error('❌ Vector DB 초기화 실패:', error);
            this.initializationStatus.vectorDB = false;
        }
    }

    /**
     * 🚀 TensorFlow.js 엔진 백그라운드 초기화 (성능 최적화)
     */
    async initializeTensorFlowInBackground(): Promise<void> {
        try {
            // 100ms 지연으로 메인 스레드 블로킹 방지
            setTimeout(async () => {
                try {
                    await this.tensorflowEngine.initialize();
                    this.initializationStatus.tensorflowEngine = true;
                    console.log('✅ TensorFlow.js 엔진 백그라운드 초기화 완료');
                } catch (error) {
                    console.warn('⚠️ TensorFlow.js 백그라운드 초기화 실패 (기본 모드로 동작):', error);
                    this.initializationStatus.tensorflowEngine = false;
                }
            }, 100);
        } catch (error) {
            console.warn('⚠️ TensorFlow.js 백그라운드 초기화 스케줄링 실패:', error);
            this.initializationStatus.tensorflowEngine = false;
        }
    }

    /**
     * 🔄 TensorFlow.js 엔진 지연 로딩 (필요시에만 초기화)
     */
    async ensureTensorFlowInitialized(): Promise<void> {
        if (this.initializationStatus.tensorflowEngine) {
            return; // 이미 초기화됨
        }

        if (!this.tensorflowEngine || !(this.tensorflowEngine as any).isInitialized) {
            console.log('⚡ TensorFlow.js 엔진 즉시 초기화...');
            try {
                await this.tensorflowEngine.initialize();
                this.initializationStatus.tensorflowEngine = true;
                console.log('✅ TensorFlow.js 엔진 즉시 초기화 완료');
            } catch (error) {
                console.error('❌ TensorFlow.js 엔진 즉시 초기화 실패:', error);
                this.initializationStatus.tensorflowEngine = false;
                throw new AIEngineError(
                    'TensorFlow 엔진 초기화 실패',
                    'TENSORFLOW_ERROR',
                    error
                );
            }
        }
    }

    /**
     * ✅ 초기화 상태 확인
     */
    isInitialized(): boolean {
        return this.isFullyInitialized;
    }

    /**
     * 📊 상세 초기화 상태 조회
     */
    getInitializationStatus(): InitializationStatus {
        return { ...this.initializationStatus };
    }

    /**
     * 🔄 부분 재초기화 (특정 모듈만)
     */
    async reinitializeModule(module: keyof InitializationStatus): Promise<void> {
        console.log(`🔄 ${module} 모듈 재초기화 시작...`);

        try {
            switch (module) {
                case 'mcpClient':
                    await this.initializeMCPClient();
                    break;
                case 'koreanEngine':
                    await this.initializeKoreanEngine();
                    break;
                case 'tensorflowEngine':
                    await this.ensureTensorFlowInitialized();
                    break;
                case 'vectorDB':
                    await this.initializeVectorDB();
                    break;
                default:
                    throw new Error(`지원하지 않는 모듈: ${module}`);
            }
            console.log(`✅ ${module} 모듈 재초기화 완료`);
        } catch (error) {
            console.error(`❌ ${module} 모듈 재초기화 실패:`, error);
            throw error;
        }
    }

    /**
     * 🏥 초기화 헬스체크
     */
    async healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'critical';
        details: Record<string, boolean>;
        score: number;
    }> {
        const details = {
            mcpClient: this.initializationStatus.mcpClient,
            koreanEngine: this.initializationStatus.koreanEngine,
            tensorflowEngine: this.initializationStatus.tensorflowEngine,
            vectorDB: this.initializationStatus.vectorDB,
            fullyInitialized: this.initializationStatus.isFullyInitialized
        };

        const activeModules = Object.values(details).filter(Boolean).length;
        const totalModules = Object.keys(details).length;
        const score = (activeModules / totalModules) * 100;

        let status: 'healthy' | 'degraded' | 'critical';
        if (score >= 80) {
            status = 'healthy';
        } else if (score >= 50) {
            status = 'degraded';
        } else {
            status = 'critical';
        }

        return { status, details, score };
    }

    /**
     * 🧹 리소스 정리
     */
    dispose(): void {
        try {
            // 각 엔진의 dispose 메서드 호출
            if (this.mcpClient && typeof (this.mcpClient as any).dispose === 'function') {
                (this.mcpClient as any).dispose();
            }
            if (this.tensorflowEngine && typeof (this.tensorflowEngine as any).dispose === 'function') {
                (this.tensorflowEngine as any).dispose();
            }
            if (this.koreanEngine && typeof (this.koreanEngine as any).dispose === 'function') {
                (this.koreanEngine as any).dispose();
            }
            if (this.vectorDB && typeof (this.vectorDB as any).dispose === 'function') {
                (this.vectorDB as any).dispose();
            }

            // 상태 초기화
            this.isFullyInitialized = false;
            this.initializationStatus.isFullyInitialized = false;

            console.log('🧹 InitializationManager 리소스 정리 완료');
        } catch (error) {
            console.error('❌ InitializationManager 리소스 정리 실패:', error);
        }
    }
} 