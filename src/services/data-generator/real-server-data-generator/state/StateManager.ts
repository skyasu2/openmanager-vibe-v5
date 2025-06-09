/**
 * 📊 State Manager v1.0
 * 
 * 서버 상태 추적 및 패턴 분석 전담 모듈
 * - 실시간 상태 모니터링
 * - 패턴 분석 및 트렌드 추적
 * - 상태 변화 이력 관리
 */

import { getVercelOptimizedConfig } from '@/config/environment';

export interface ServerState {
    serverId: string;
    cpu: number;
    memory: number;
    disk: number;
    network: {
        in: number;
        out: number;
    };
    lastUpdate: number;
    status: 'healthy' | 'warning' | 'critical';
    trends: StateTrend[];
}

export interface StateTrend {
    metric: string;
    direction: 'up' | 'down' | 'stable';
    confidence: number;
    duration: number;
    startTime: number;
}

export interface StatePattern {
    type: 'daily-cycle' | 'weekly-cycle' | 'anomaly' | 'trend' | 'correlation';
    confidence: number;
    startTime: number;
    endTime?: number;
    metadata: Record<string, any>;
}

export interface StateSnapshot {
    timestamp: number;
    serverStates: Record<string, ServerState>;
    globalMetrics: {
        totalServers: number;
        healthyServers: number;
        warningServers: number;
        criticalServers: number;
        avgCPU: number;
        avgMemory: number;
        avgDisk: number;
    };
}

export class StateManager {
    private config = getVercelOptimizedConfig();
    private currentStates = new Map<string, ServerState>();
    private patterns = new Map<string, StatePattern[]>();
    private stateHistory: StateSnapshot[] = [];
    private maxHistorySize = 1000; // 최대 1000개 스냅샷 보관

    /**
     * 🎯 초기 상태 생성
     */
    public generateInitialState(serverIds: string[]): void {
        console.log('🎯 초기 상태 생성 중...');

        // 각 서버의 초기 상태 설정
        serverIds.forEach(serverId => {
            this.currentStates.set(serverId, {
                serverId,
                cpu: Math.random() * 30 + 10, // 10-40%
                memory: Math.random() * 40 + 20, // 20-60%
                disk: Math.random() * 20 + 10, // 10-30%
                network: {
                    in: Math.random() * 100,
                    out: Math.random() * 100,
                },
                lastUpdate: Date.now(),
                status: 'healthy',
                trends: [],
            });
        });

        console.log(`✅ ${serverIds.length}개 서버 초기 상태 생성 완료`);
    }

    /**
     * 🔄 서버 상태 업데이트
     */
    public updateServerState(serverId: string, newMetrics: Partial<ServerState>): void {
        const currentState = this.currentStates.get(serverId);
        if (!currentState) {
            console.warn(`⚠️ 서버 ${serverId} 상태가 존재하지 않음`);
            return;
        }

        // 이전 상태와 비교하여 트렌드 분석
        const trends = this.analyzeTrends(currentState, newMetrics);

        // 상태 업데이트
        const updatedState: ServerState = {
            ...currentState,
            ...newMetrics,
            lastUpdate: Date.now(),
            trends,
        };

        this.currentStates.set(serverId, updatedState);

        // 패턴 분석
        this.analyzePatterns(serverId, updatedState);
    }

    /**
     * 📈 트렌드 분석
     */
    private analyzeTrends(currentState: ServerState, newMetrics: Partial<ServerState>): StateTrend[] {
        const trends: StateTrend[] = [];
        const now = Date.now();

        // CPU 트렌드 분석
        if (newMetrics.cpu !== undefined) {
            const cpuDiff = newMetrics.cpu - currentState.cpu;
            const direction = cpuDiff > 5 ? 'up' : cpuDiff < -5 ? 'down' : 'stable';

            trends.push({
                metric: 'cpu',
                direction,
                confidence: Math.abs(cpuDiff) / 100,
                duration: now - currentState.lastUpdate,
                startTime: now,
            });
        }

        // 메모리 트렌드 분석
        if (newMetrics.memory !== undefined) {
            const memoryDiff = newMetrics.memory - currentState.memory;
            const direction = memoryDiff > 5 ? 'up' : memoryDiff < -5 ? 'down' : 'stable';

            trends.push({
                metric: 'memory',
                direction,
                confidence: Math.abs(memoryDiff) / 100,
                duration: now - currentState.lastUpdate,
                startTime: now,
            });
        }

        return trends;
    }

    /**
     * 🔍 패턴 분석
     */
    private analyzePatterns(serverId: string, state: ServerState): void {
        const patterns = this.patterns.get(serverId) || [];
        const now = Date.now();

        // 일일 사이클 패턴 감지
        const hour = new Date().getHours();
        if (this.isDailyCyclePattern(state, hour)) {
            patterns.push({
                type: 'daily-cycle',
                confidence: 0.8,
                startTime: now,
                metadata: { hour, metrics: { cpu: state.cpu, memory: state.memory } },
            });
        }

        // 이상 상태 패턴 감지
        if (this.isAnomalyPattern(state)) {
            patterns.push({
                type: 'anomaly',
                confidence: 0.9,
                startTime: now,
                metadata: {
                    severity: state.status,
                    metrics: { cpu: state.cpu, memory: state.memory, disk: state.disk }
                },
            });
        }

        // 패턴 저장 (최대 100개까지)
        if (patterns.length > 100) {
            patterns.splice(0, patterns.length - 100);
        }

        this.patterns.set(serverId, patterns);
    }

    /**
     * 📅 일일 사이클 패턴 감지
     */
    private isDailyCyclePattern(state: ServerState, hour: number): boolean {
        // 업무 시간(9-18시)에 높은 부하, 야간에 낮은 부하 패턴
        const isBusinessHour = hour >= 9 && hour <= 18;
        const expectedLoad = isBusinessHour ? 60 : 20;
        const tolerance = 20;

        return Math.abs(state.cpu - expectedLoad) < tolerance;
    }

    /**
     * ⚠️ 이상 상태 패턴 감지
     */
    private isAnomalyPattern(state: ServerState): boolean {
        // CPU, 메모리, 디스크 중 하나라도 90% 이상이면 이상 상태
        return state.cpu > 90 || state.memory > 90 || state.disk > 90;
    }

    /**
     * 📊 현재 상태 조회
     */
    public getCurrentState(): any {
        const states = Array.from(this.currentStates.values());

        return {
            serverCount: this.currentStates.size,
            totalStates: states.length,
            globalMetrics: this.calculateGlobalMetrics(states),
            config: {
                environment: this.config.NODE_ENV,
                isVercel: this.config.IS_VERCEL,
                cacheEnabled: this.config.database?.redis?.enabled || false,
            },
            lastUpdate: new Date().toISOString(),
        };
    }

    /**
     * 📈 서버별 메트릭 조회
     */
    public getServerMetrics(serverId?: string): any {
        if (serverId) {
            return this.currentStates.get(serverId) || null;
        }

        return Array.from(this.currentStates.values());
    }

    /**
     * 🌐 글로벌 메트릭 계산
     */
    private calculateGlobalMetrics(states: ServerState[]) {
        if (states.length === 0) {
            return {
                totalServers: 0,
                healthyServers: 0,
                warningServers: 0,
                criticalServers: 0,
                avgCPU: 0,
                avgMemory: 0,
                avgDisk: 0,
            };
        }

        const totalCPU = states.reduce((sum, s) => sum + s.cpu, 0);
        const totalMemory = states.reduce((sum, s) => sum + s.memory, 0);
        const totalDisk = states.reduce((sum, s) => sum + s.disk, 0);

        return {
            totalServers: states.length,
            healthyServers: states.filter(s => s.status === 'healthy').length,
            warningServers: states.filter(s => s.status === 'warning').length,
            criticalServers: states.filter(s => s.status === 'critical').length,
            avgCPU: totalCPU / states.length,
            avgMemory: totalMemory / states.length,
            avgDisk: totalDisk / states.length,
        };
    }

    /**
     * 📸 상태 스냅샷 생성
     */
    public createSnapshot(): StateSnapshot {
        const states = Array.from(this.currentStates.values());
        const snapshot: StateSnapshot = {
            timestamp: Date.now(),
            serverStates: Object.fromEntries(
                states.map(state => [state.serverId, state])
            ),
            globalMetrics: this.calculateGlobalMetrics(states),
        };

        // 히스토리에 추가 (크기 제한)
        this.stateHistory.push(snapshot);
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }

        return snapshot;
    }

    /**
     * 📚 상태 히스토리 조회
     */
    public getStateHistory(limit: number = 50): StateSnapshot[] {
        return this.stateHistory.slice(-limit);
    }

    /**
     * 🔍 패턴 조회
     */
    public getPatterns(serverId?: string): Record<string, StatePattern[]> {
        if (serverId) {
            return { [serverId]: this.patterns.get(serverId) || [] };
        }

        return Object.fromEntries(this.patterns.entries());
    }

    /**
     * 📊 패턴 통계
     */
    public getPatternStats() {
        const allPatterns = Array.from(this.patterns.values()).flat();

        const stats = {
            totalPatterns: allPatterns.length,
            patternTypes: {} as Record<string, number>,
            avgConfidence: 0,
            recentPatterns: 0,
        };

        // 패턴 타입별 카운트
        allPatterns.forEach(pattern => {
            stats.patternTypes[pattern.type] = (stats.patternTypes[pattern.type] || 0) + 1;
        });

        // 평균 신뢰도
        if (allPatterns.length > 0) {
            stats.avgConfidence = allPatterns.reduce((sum, p) => sum + p.confidence, 0) / allPatterns.length;
        }

        // 최근 1시간 내 패턴
        const oneHourAgo = Date.now() - 3600000;
        stats.recentPatterns = allPatterns.filter(p => p.startTime > oneHourAgo).length;

        return stats;
    }

    /**
     * 🔄 상태 초기화
     */
    public resetStates(): void {
        this.currentStates.clear();
        this.patterns.clear();
        this.stateHistory = [];
        console.log('🔄 모든 상태 데이터 초기화 완료');
    }

    /**
     * 🏥 헬스체크
     */
    public async healthCheck() {
        const states = Array.from(this.currentStates.values());
        const patterns = Array.from(this.patterns.values()).flat();

        return {
            status: 'healthy',
            serverStates: states.length,
            totalPatterns: patterns.length,
            historySize: this.stateHistory.length,
            lastUpdate: states.length > 0 ? Math.max(...states.map(s => s.lastUpdate)) : 0,
        };
    }

    /**
     * 📊 서버 상태 요약
     */
    public getServerStateSummary(serverId: string) {
        const state = this.currentStates.get(serverId);
        if (!state) return null;

        const patterns = this.patterns.get(serverId) || [];
        const recentTrends = state.trends.slice(-5); // 최근 5개 트렌드

        return {
            serverId,
            currentMetrics: {
                cpu: state.cpu,
                memory: state.memory,
                disk: state.disk,
                network: state.network,
            },
            status: state.status,
            recentTrends,
            patternCount: patterns.length,
            lastUpdate: state.lastUpdate,
        };
    }
} 