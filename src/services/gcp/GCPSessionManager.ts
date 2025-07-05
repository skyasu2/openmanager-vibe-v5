/**
 * 🔄 GCP 세션 매니저 (Cloud Storage 최적화 버전)
 * 
 * 사용자별 20분 세션 관리, 동시 세션 제한, 무료 티어 사용량 제한
 * 세션 종료 시 배치 데이터 Cloud Storage 플러시 포함
 */

import {
    GCPFirestoreClient,
    SessionInfo,
    SessionLimits
} from '@/types/gcp-data-generator';

// 순환 참조 방지를 위한 인터페이스
interface DataGeneratorRef {
    flushBatchToCloudStorage(sessionId: string): Promise<void>;
}

export class GCPSessionManager {
    private firestore: GCPFirestoreClient;
    private dataGenerator: DataGeneratorRef | null = null;
    private activeSessions = new Map<string, SessionInfo>();
    private userSessionCounts = new Map<string, number>();
    private limits: SessionLimits = {
        maxDailySessions: 10,
        maxConcurrentSessions: 5,
        maxSessionDuration: 20 * 60 * 1000, // 20분
        maxMetricsPerSession: 40 // 30초 * 40 = 20분
    };

    constructor(firestore: GCPFirestoreClient) {
        this.firestore = firestore;
        this.initializeCleanupScheduler();
    }

    /**
     * 🔗 데이터 생성기 참조 설정 (배치 플러시용)
     */
    setDataGenerator(dataGenerator: DataGeneratorRef): void {
        this.dataGenerator = dataGenerator;
    }

    /**
     * 🚀 세션 시작
     */
    async startSession(userId: string): Promise<string> {
        // 일일 세션 제한 체크
        await this.checkDailyLimit(userId);

        // 동시 세션 제한 체크
        await this.checkConcurrentLimit();

        // 기존 사용자 세션 정리
        await this.cleanupUserSessions(userId);

        const sessionId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        const endTime = startTime + this.limits.maxSessionDuration;

        const session: SessionInfo = {
            sessionId,
            userId,
            status: 'active',
            startTime: new Date(startTime),
            endTime: undefined,
            lastActivity: new Date(startTime),
            serverCount: 10,
            totalMetrics: 0,
            configuration: undefined
        };

        // 메모리에 세션 등록
        this.activeSessions.set(sessionId, session);

        // Firestore에 세션 저장
        await this.saveSessionToFirestore(session);

        // 사용자별 세션 카운트 증가
        const userCount = this.userSessionCounts.get(userId) || 0;
        this.userSessionCounts.set(userId, userCount + 1);

        // 20분 후 자동 정지 스케줄링
        setTimeout(() => this.stopSession(sessionId), this.limits.maxSessionDuration);

        console.log(`🚀 세션 시작: ${sessionId} (사용자: ${userId}, 만료: ${new Date(endTime).toLocaleString()})`);

        return sessionId;
    }

    /**
     * 🛑 세션 정지 (배치 플러시 포함)
     */
    async stopSession(sessionId: string): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            console.warn(`⚠️ 세션을 찾을 수 없음: ${sessionId}`);
            return;
        }

        try {
            // 💾 배치 데이터 Cloud Storage에 플러시
            if (this.dataGenerator) {
                await this.dataGenerator.flushBatchToCloudStorage(sessionId);
                console.log(`💾 세션 ${sessionId} 배치 데이터 플러시 완료`);
            }
        } catch (error) {
            console.error(`배치 플러시 실패 (세션: ${sessionId}):`, error);
        }

        // 세션 상태 업데이트
        session.status = 'stopped';
        session.endTime = Date.now();

        // Firestore 업데이트
        await this.updateSessionInFirestore(session);

        // 메모리에서 제거
        this.activeSessions.delete(sessionId);

        // 사용자별 카운트 감소
        const userCount = this.userSessionCounts.get(session.userId) || 0;
        if (userCount > 0) {
            this.userSessionCounts.set(session.userId, userCount - 1);
        }

        console.log(`🛑 세션 정지: ${sessionId} (생성된 메트릭: ${session.metricsGenerated}개)`);
    }

    /**
     * 📊 세션 정보 조회
     */
    async getSession(sessionId: string): Promise<SessionInfo | null> {
        // 메모리에서 먼저 확인
        const memorySession = this.activeSessions.get(sessionId);
        if (memorySession) {
            return memorySession;
        }

        // Firestore에서 조회
        try {
            const doc = await this.firestore.collection('sessions').doc(sessionId).get();
            if (doc.exists) {
                return doc.data() as SessionInfo;
            }
        } catch (error) {
            console.error('세션 조회 실패:', error);
        }

        return null;
    }

    /**
     * 📈 세션 활동 업데이트
     */
    async updateSessionActivity(sessionId: string, metricsCount: number = 1): Promise<void> {
        const session = this.activeSessions.get(sessionId);
        if (!session) return;

        session.lastActivity = Date.now();
        session.metricsGenerated += metricsCount;

        // 메트릭 생성 제한 체크
        if (session.metricsGenerated >= this.limits.maxMetricsPerSession) {
            console.log(`⏰ 세션 ${sessionId} 메트릭 생성 제한 도달 (${session.metricsGenerated}개)`);
            await this.stopSession(sessionId);
            return;
        }

        // Firestore 업데이트 (5회마다)
        if (session.metricsGenerated % 5 === 0) {
            await this.updateSessionInFirestore(session);
        }
    }

    /**
     * 📋 활성 세션 목록 조회
     */
    getActiveSessions(): SessionInfo[] {
        return Array.from(this.activeSessions.values());
    }

    /**
     * 📊 사용자별 세션 통계
     */
    async getUserSessionStats(userId: string): Promise<{
        activeSessions: number;
        dailySessions: number;
        totalMetricsGenerated: number;
    }> {
        const activeSessions = Array.from(this.activeSessions.values())
            .filter(s => s.userId === userId && s.status === 'active').length;

        const dailySessions = this.userSessionCounts.get(userId) || 0;

        // 오늘 생성된 총 메트릭 수 조회
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalMetricsGenerated = 0;
        try {
            const sessionsSnapshot = await this.firestore
                .collection('sessions')
                .where('userId', '==', userId)
                .where('startTime', '>=', today.getTime())
                .get();

            sessionsSnapshot.docs.forEach(doc => {
                const session = doc.data() as SessionInfo;
                totalMetricsGenerated += session.metricsGenerated;
            });
        } catch (error) {
            console.error('사용자 세션 통계 조회 실패:', error);
        }

        return {
            activeSessions,
            dailySessions,
            totalMetricsGenerated
        };
    }

    // ===== 제한 체크 메서드들 =====

    private async checkDailyLimit(userId: string): Promise<void> {
        const userCount = this.userSessionCounts.get(userId) || 0;
        if (userCount >= this.limits.maxDailySessions) {
            throw new Error(`일일 세션 생성 제한 초과 (${this.limits.maxDailySessions}개)`);
        }
    }

    private async checkConcurrentLimit(): Promise<void> {
        const activeCount = this.activeSessions.size;
        if (activeCount >= this.limits.maxConcurrentSessions) {
            throw new Error(`동시 세션 제한 초과 (${this.limits.maxConcurrentSessions}개)`);
        }
    }

    // ===== Firestore 연동 메서드들 =====

    private async saveSessionToFirestore(session: SessionInfo): Promise<void> {
        try {
            await this.firestore.collection('sessions').doc(session.sessionId).set(session);
        } catch (error) {
            console.error('세션 저장 실패:', error);
        }
    }

    private async updateSessionInFirestore(session: SessionInfo): Promise<void> {
        try {
            await this.firestore.collection('sessions').doc(session.sessionId).set(session, { merge: true });
        } catch (error) {
            console.error('세션 업데이트 실패:', error);
        }
    }

    // ===== 정리 및 유지보수 =====

    private async cleanupUserSessions(userId: string): Promise<void> {
        const userSessions = Array.from(this.activeSessions.values())
            .filter(s => s.userId === userId);

        for (const session of userSessions) {
            await this.stopSession(session.sessionId);
        }
    }

    private initializeCleanupScheduler(): void {
        // 5분마다 만료된 세션 정리
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 5 * 60 * 1000);

        // 자정에 일일 카운터 리셋
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        setTimeout(() => {
            this.resetDailyCounters();
            // 이후 24시간마다 반복
            setInterval(() => this.resetDailyCounters(), 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }

    private async cleanupExpiredSessions(): Promise<void> {
        const now = Date.now();
        const expiredSessions = Array.from(this.activeSessions.values())
            .filter(s => now > s.endTime);

        for (const session of expiredSessions) {
            await this.stopSession(session.sessionId);
        }

        if (expiredSessions.length > 0) {
            console.log(`🧹 만료된 세션 ${expiredSessions.length}개 정리 완료`);
        }
    }

    private resetDailyCounters(): void {
        this.userSessionCounts.clear();
        console.log('🔄 일일 세션 카운터 리셋');
    }

    // ===== 헬스체크 및 모니터링 =====

    async healthCheck(): Promise<{
        status: 'healthy' | 'warning' | 'error';
        activeSessions: number;
        totalUsers: number;
        memoryUsage: number;
        firestoreConnected: boolean;
    }> {
        const activeSessions = this.activeSessions.size;
        const totalUsers = new Set(Array.from(this.activeSessions.values()).map(s => s.userId)).size;
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

        let firestoreConnected = true;
        try {
            await this.firestore.collection('health').doc('test').get();
        } catch (error) {
            firestoreConnected = false;
        }

        let status: 'healthy' | 'warning' | 'error' = 'healthy';
        if (!firestoreConnected) status = 'error';
        else if (activeSessions > this.limits.maxConcurrentSessions * 0.8) status = 'warning';

        return {
            status,
            activeSessions,
            totalUsers,
            memoryUsage: Math.round(memoryUsage),
            firestoreConnected
        };
    }

    // ===== 설정 관리 =====

    updateLimits(newLimits: Partial<SessionLimits>): void {
        this.limits = { ...this.limits, ...newLimits };
        console.log('🔧 세션 제한 설정 업데이트:', this.limits);
    }

    getLimits(): SessionLimits {
        return { ...this.limits };
    }
} 