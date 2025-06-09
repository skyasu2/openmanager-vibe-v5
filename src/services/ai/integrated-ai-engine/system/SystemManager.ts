/**
 * 🔧 System Manager
 * 
 * AI 엔진 시스템 관리
 * - 컴포넌트 초기화
 * - Render 자동 관리
 * - 상태 모니터링
 * - 리소스 정리
 */

import { realMCPClient } from '../../../mcp/real-mcp-client';
import { tensorFlowAIEngine } from '../../tensorflow-engine';
import { autoReportGenerator } from '../../report-generator';
import {
    SystemManager as ISystemManager,
    AIEngineStatus,
    AIEngineConfig,
    AI_ENGINE_CONSTANTS
} from '../types/AIEngineTypes';

export class SystemManager implements ISystemManager {
    private initialized = false;
    private renderPingInterval?: NodeJS.Timeout;
    private renderStatus: 'active' | 'sleeping' | 'error' = 'active';
    private activeSessions: Set<string> = new Set();
    private startTime: Date = new Date();
    private config: AIEngineConfig;

    constructor(config?: Partial<AIEngineConfig>) {
        this.config = {
            enabled_components: {
                nlp_processor: true,
                mcp_client: true,
                tensorflow_engine: true,
                report_generator: true,
                streaming: true,
                ...config?.enabled_components
            },
            performance: {
                max_response_time: AI_ENGINE_CONSTANTS.MAX_RESPONSE_TIME,
                confidence_threshold: AI_ENGINE_CONSTANTS.DEFAULT_CONFIDENCE_THRESHOLD,
                cache_ttl: AI_ENGINE_CONSTANTS.CACHE_TTL,
                render_ping_interval: AI_ENGINE_CONSTANTS.RENDER_PING_INTERVAL,
                ...config?.performance
            },
            features: {
                auto_report_generation: true,
                render_management: true,
                session_tracking: true,
                debug_mode: false,
                ...config?.features
            },
            language: {
                default_language: 'ko',
                supported_languages: [...AI_ENGINE_CONSTANTS.SUPPORTED_LANGUAGES],
                ...config?.language
            }
        };
    }

    /**
     * 시스템 초기화
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        console.log('🤖 통합 AI 엔진 v3.0 초기화 중...');

        try {
            const initPromises: Promise<void>[] = [];

            // 활성화된 컴포넌트만 초기화
            if (this.config.enabled_components.mcp_client) {
                initPromises.push(realMCPClient.initialize());
            }

            if (this.config.enabled_components.tensorflow_engine) {
                initPromises.push(tensorFlowAIEngine.initialize());
            }

            if (this.config.enabled_components.report_generator) {
                initPromises.push(autoReportGenerator.initialize());
            }

            await Promise.all(initPromises);

            this.initialized = true;

            // Render 관리 시작
            if (this.config.features.render_management) {
                this.startRenderManagement();
            }

            console.log('✅ 통합 AI 엔진 초기화 완료');
            console.log('🔧 활성화된 컴포넌트:');
            if (this.config.enabled_components.mcp_client) {
                console.log('  - ✅ 실제 MCP 클라이언트');
            }
            if (this.config.enabled_components.tensorflow_engine) {
                console.log('  - ✅ TensorFlow.js AI 엔진');
            }
            if (this.config.enabled_components.report_generator) {
                console.log('  - ✅ 자동 보고서 생성기');
            }

        } catch (error: any) {
            console.error('❌ 통합 AI 엔진 초기화 실패:', error);
            this.initialized = true; // 폴백 모드로 계속 진행
        }
    }

    /**
     * Render 자동 관리 시작
     */
    startRenderManagement(): void {
        // 환경변수 확인
        const renderUrl = process.env.FASTAPI_URL;
        if (!renderUrl?.includes('onrender.com')) {
            // 개발 환경에서만 로그 출력
            if (process.env.NODE_ENV === 'development' && renderUrl) {
                console.log('ℹ️ Render URL이 아님 - Render 자동 관리 비활성화');
            }
            return;
        }

        console.log('🔄 Render 자동 관리 시작...');

        // 설정된 간격으로 ping 전송
        this.renderPingInterval = setInterval(
            async () => {
                await this.performRenderPing(renderUrl);
            },
            this.config.performance.render_ping_interval
        );

        // 프로세스 종료 시 정리
        process.on('beforeExit', () => {
            this.dispose();
        });
    }

    /**
     * Render ping 수행
     */
    private async performRenderPing(renderUrl: string): Promise<void> {
        try {
            const response = await fetch(renderUrl + '/health', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                this.renderStatus = 'active';
                if (this.config.features.debug_mode) {
                    console.log('✅ Render 서비스 정상 (ping 성공)');
                }
            } else {
                this.renderStatus = 'sleeping';
                console.log('⚠️ Render 서비스 응답 없음');
            }
        } catch (error) {
            this.renderStatus = 'error';
            console.log(
                '❌ Render ping 실패:',
                error instanceof Error ? error.message : '알 수 없는 오류'
            );
        }
    }

    /**
     * Render 상태 조회
     */
    getRenderStatus(): 'active' | 'sleeping' | 'error' {
        return this.renderStatus;
    }

    /**
     * 엔진 상태 조회
     */
    async getEngineStatus(): Promise<AIEngineStatus> {
        const uptime = Date.now() - this.startTime.getTime();

        return {
            initialized: this.initialized,
            render_status: this.renderStatus,
            components_status: {
                mcp_client: this.config.enabled_components.mcp_client && this.initialized,
                tensorflow_engine: this.config.enabled_components.tensorflow_engine && this.initialized,
                report_generator: this.config.enabled_components.report_generator && this.initialized
            },
            active_sessions: this.activeSessions.size,
            cache_size: 0, // 실제 구현에서는 캐시 매니저에서 조회
            last_activity: new Date().toISOString(),
            uptime: Math.floor(uptime / 1000) // 초 단위
        };
    }

    /**
     * 세션 추가
     */
    addSession(sessionId: string): void {
        if (this.config.features.session_tracking) {
            this.activeSessions.add(sessionId);

            // 세션 만료 처리 (1시간 후)
            setTimeout(() => {
                this.removeSession(sessionId);
            }, AI_ENGINE_CONSTANTS.MAX_SESSION_DURATION);
        }
    }

    /**
     * 세션 제거
     */
    removeSession(sessionId: string): void {
        this.activeSessions.delete(sessionId);
    }

    /**
     * 활성 세션 조회
     */
    getActiveSessions(): string[] {
        return Array.from(this.activeSessions);
    }

    /**
     * 시스템 상태 확인
     */
    async healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        details: {
            initialization: boolean;
            components: Record<string, boolean>;
            render_service: string;
            active_sessions: number;
            uptime: string;
        };
        recommendations?: string[];
    }> {
        const status = await this.getEngineStatus();
        const recommendations: string[] = [];

        // 상태 평가
        let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        if (!status.initialized) {
            overallStatus = 'unhealthy';
            recommendations.push('시스템 초기화가 필요합니다.');
        }

        const healthyComponents = Object.values(status.components_status).filter(Boolean).length;
        const totalComponents = Object.keys(status.components_status).length;

        if (healthyComponents < totalComponents) {
            if (healthyComponents === 0) {
                overallStatus = 'unhealthy';
                recommendations.push('모든 핵심 컴포넌트가 비활성화되어 있습니다.');
            } else {
                overallStatus = 'degraded';
                recommendations.push('일부 컴포넌트가 비활성화되어 있습니다.');
            }
        }

        if (status.render_status === 'error') {
            if (overallStatus === 'healthy') overallStatus = 'degraded';
            recommendations.push('Render 서비스 연결에 문제가 있습니다.');
        }

        return {
            status: overallStatus,
            details: {
                initialization: status.initialized,
                components: status.components_status,
                render_service: status.render_status,
                active_sessions: status.active_sessions,
                uptime: this.formatUptime(status.uptime)
            },
            recommendations: recommendations.length > 0 ? recommendations : undefined
        };
    }

    /**
     * 업타임 포맷팅
     */
    private formatUptime(seconds: number): string {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return `${hours}h ${minutes}m ${secs}s`;
    }

    /**
     * 설정 업데이트
     */
    updateConfig(newConfig: Partial<AIEngineConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig,
            enabled_components: {
                ...this.config.enabled_components,
                ...newConfig.enabled_components
            },
            performance: {
                ...this.config.performance,
                ...newConfig.performance
            },
            features: {
                ...this.config.features,
                ...newConfig.features
            },
            language: {
                ...this.config.language,
                ...newConfig.language
            }
        };

        console.log('⚙️ AI 엔진 설정 업데이트 완료');
    }

    /**
     * 현재 설정 조회
     */
    getConfig(): AIEngineConfig {
        return { ...this.config };
    }

    /**
     * 리소스 정리
     */
    dispose(): void {
        if (this.renderPingInterval) {
            clearInterval(this.renderPingInterval);
            this.renderPingInterval = undefined;
            console.log('🔄 Render 자동 관리 중지');
        }

        this.activeSessions.clear();
        this.initialized = false;

        console.log('🧹 AI 엔진 시스템 정리 완료');
    }

    /**
     * 강제 재시작
     */
    async restart(): Promise<void> {
        console.log('🔄 AI 엔진 재시작 중...');

        this.dispose();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        await this.initialize();

        console.log('✅ AI 엔진 재시작 완료');
    }
} 