/**
 * 🔔 통합 알림 서비스 v1.0
 * 
 * 모든 알림 채널을 중앙에서 관리하는 단일 진입점:
 * - 브라우저 알림
 * - Toast 알림
 * - 시스템 알림
 * - 중복 방지 및 우선순위 관리
 * - 사용자 설정 통합
 */

import { BrowserNotificationService } from './BrowserNotificationService';
import { EnhancedToastSystem } from '@/components/ui/EnhancedToastSystem';
import { useNotificationStore } from '@/stores/useNotificationStore';

// 통합 알림 타입
export interface UnifiedNotification {
    id: string;
    type: 'system' | 'server' | 'ai' | 'performance' | 'security' | 'custom';
    severity: 'info' | 'warning' | 'critical' | 'success';
    title: string;
    message: string;

    // 선택적 속성
    serverId?: string;
    serverName?: string;
    actionRequired?: boolean;
    autoResolve?: boolean;
    data?: Record<string, any>;

    // 채널별 설정
    channels?: {
        browser?: boolean;
        toast?: boolean;
        console?: boolean;
    };

    // 중복 방지
    deduplicationKey?: string;
    cooldownMs?: number;

    timestamp?: Date;
}

// 알림 결과
export interface NotificationResult {
    id: string;
    success: boolean;
    channels: {
        browser: { sent: boolean; error?: string };
        toast: { sent: boolean; error?: string };
        console: { sent: boolean; error?: string };
    };
    timestamp: Date;
    processingTime: number;
}

// 알림 설정
export interface NotificationSettings {
    enabled: boolean;
    channels: {
        browser: {
            enabled: boolean;
            minSeverity: 'info' | 'warning' | 'critical';
            permission: NotificationPermission;
        };
        toast: {
            enabled: boolean;
            minSeverity: 'info' | 'warning' | 'critical';
            autoHide: boolean;
            duration: number;
        };
        console: {
            enabled: boolean;
            minSeverity: 'info' | 'warning' | 'critical';
        };
    };

    // 필터링 설정
    filters: {
        enableDeduplication: boolean;
        defaultCooldown: number;
        maxNotificationsPerMinute: number;
        systemStartupQuietMode: boolean;
    };
}

/**
 * 🔔 통합 알림 서비스
 */
export class UnifiedNotificationService {
    private static instance: UnifiedNotificationService;

    // 서비스 인스턴스
    private browserService: BrowserNotificationService;

    // 상태 관리
    private settings: NotificationSettings;
    private recentNotifications: Map<string, Date> = new Map();
    private notificationHistory: UnifiedNotification[] = [];
    private rateLimitBuffer: Date[] = [];

    // 통계
    private stats = {
        totalSent: 0,
        channelStats: {
            browser: { sent: 0, failed: 0 },
            toast: { sent: 0, failed: 0 },
            console: { sent: 0, failed: 0 },
        },
        severityStats: {
            info: 0,
            warning: 0,
            critical: 0,
            success: 0,
        },
    };

    private constructor() {
        this.browserService = new BrowserNotificationService();
        this.settings = this.loadDefaultSettings();

        // 브라우저 환경에서만 설정 로드
        if (typeof window !== 'undefined') {
            this.loadUserSettings();
        }

        console.log('🔔 통합 알림 서비스 초기화 완료');
    }

    /**
     * 🏭 싱글톤 인스턴스 획득
     */
    static getInstance(): UnifiedNotificationService {
        if (!UnifiedNotificationService.instance) {
            UnifiedNotificationService.instance = new UnifiedNotificationService();
        }
        return UnifiedNotificationService.instance;
    }

    /**
     * 📢 통합 알림 전송 (메인 메서드)
     */
    async sendNotification(notification: UnifiedNotification): Promise<NotificationResult> {
        const startTime = Date.now();

        // ID 생성
        if (!notification.id) {
            notification.id = this.generateNotificationId(notification);
        }

        // 타임스탬프 설정
        if (!notification.timestamp) {
            notification.timestamp = new Date();
        }

        const result: NotificationResult = {
            id: notification.id,
            success: false,
            channels: {
                browser: { sent: false },
                toast: { sent: false },
                console: { sent: false },
            },
            timestamp: notification.timestamp,
            processingTime: 0,
        };

        try {
            // 1. 전처리 및 필터링
            const shouldSend = await this.preprocessNotification(notification);
            if (!shouldSend) {
                console.log(`🔕 알림 필터링됨: ${notification.title}`);
                result.processingTime = Date.now() - startTime;
                return result;
            }

            // 2. 채널별 전송
            const channelPromises = [];

            // 브라우저 알림
            if (this.shouldSendToChannel('browser', notification)) {
                channelPromises.push(this.sendBrowserNotification(notification, result));
            }

            // Toast 알림
            if (this.shouldSendToChannel('toast', notification)) {
                channelPromises.push(this.sendToastNotification(notification, result));
            }

            // 콘솔 알림
            if (this.shouldSendToChannel('console', notification)) {
                channelPromises.push(this.sendConsoleNotification(notification, result));
            }

            // 병렬 전송
            await Promise.allSettled(channelPromises);

            // 3. 후처리
            await this.postProcessNotification(notification, result);

            // 성공 여부 결정
            result.success = Object.values(result.channels).some(channel => channel.sent);

            console.log(`✅ 통합 알림 처리 완료: ${notification.title} (${result.success ? '성공' : '실패'})`);

        } catch (error) {
            console.error('❌ 통합 알림 처리 실패:', error);
            result.success = false;
        }

        result.processingTime = Date.now() - startTime;
        return result;
    }

    /**
     * 🎯 시스템 알림 전용 메서드
     */
    async sendSystemAlert(
        title: string,
        message: string,
        severity: 'info' | 'warning' | 'critical' = 'info',
        options?: Partial<UnifiedNotification>
    ): Promise<NotificationResult> {
        return this.sendNotification({
            id: `system-${Date.now()}`,
            type: 'system',
            severity,
            title,
            message,
            autoResolve: severity !== 'critical',
            ...options,
        });
    }

    /**
     * 🖥️ 서버 알림 전용 메서드
     */
    async sendServerAlert(
        serverId: string,
        serverName: string,
        title: string,
        message: string,
        severity: 'info' | 'warning' | 'critical' = 'warning',
        options?: Partial<UnifiedNotification>
    ): Promise<NotificationResult> {
        return this.sendNotification({
            id: `server-${serverId}-${Date.now()}`,
            type: 'server',
            severity,
            title: `🖥️ ${serverName}: ${title}`,
            message,
            serverId,
            serverName,
            actionRequired: severity === 'critical',
            data: { serverId, serverName },
            deduplicationKey: `server-${serverId}-${severity}`,
            cooldownMs: severity === 'critical' ? 30000 : 60000, // critical: 30초, 나머지: 1분
            ...options,
        });
    }

    /**
     * 🤖 AI 알림 전용 메서드
     */
    async sendAIAlert(
        title: string,
        message: string,
        engineName?: string,
        severity: 'info' | 'warning' | 'critical' = 'info',
        options?: Partial<UnifiedNotification>
    ): Promise<NotificationResult> {
        return this.sendNotification({
            id: `ai-${engineName || 'system'}-${Date.now()}`,
            type: 'ai',
            severity,
            title: `🤖 ${engineName ? `${engineName}: ` : ''}${title}`,
            message,
            data: { engineName },
            deduplicationKey: `ai-${engineName || 'system'}-${severity}`,
            cooldownMs: 30000, // 30초
            ...options,
        });
    }

    /**
     * ⚡ 빠른 알림 메서드들
     */
    async info(title: string, message: string, options?: Partial<UnifiedNotification>) {
        return this.sendNotification({ type: 'custom', severity: 'info', title, message, ...options });
    }

    async success(title: string, message: string, options?: Partial<UnifiedNotification>) {
        return this.sendNotification({ type: 'custom', severity: 'success', title, message, ...options });
    }

    async warning(title: string, message: string, options?: Partial<UnifiedNotification>) {
        return this.sendNotification({ type: 'custom', severity: 'warning', title, message, ...options });
    }

    async critical(title: string, message: string, options?: Partial<UnifiedNotification>) {
        return this.sendNotification({
            type: 'custom',
            severity: 'critical',
            title,
            message,
            actionRequired: true,
            channels: { browser: true, toast: true, console: true },
            ...options
        });
    }

    /**
     * 🔄 전처리 및 필터링
     */
    private async preprocessNotification(notification: UnifiedNotification): Promise<boolean> {
        // 1. 서비스 활성화 확인
        if (!this.settings.enabled) {
            return false;
        }

        // 2. 시스템 시작 조용 모드
        if (this.settings.filters.systemStartupQuietMode &&
            notification.severity === 'info' &&
            (notification.message.includes('초기화') || notification.message.includes('시작'))) {
            return false;
        }

        // 3. 중복 방지
        if (this.settings.filters.enableDeduplication && notification.deduplicationKey) {
            const lastSent = this.recentNotifications.get(notification.deduplicationKey);
            const cooldownMs = notification.cooldownMs || this.settings.filters.defaultCooldown;

            if (lastSent && (Date.now() - lastSent.getTime()) < cooldownMs) {
                console.log(`🔄 중복 알림 차단: ${notification.deduplicationKey}`);
                return false;
            }

            this.recentNotifications.set(notification.deduplicationKey, new Date());
        }

        // 4. 비율 제한
        const now = new Date();
        this.rateLimitBuffer = this.rateLimitBuffer.filter(time =>
            (now.getTime() - time.getTime()) < 60000 // 1분 이내
        );

        if (this.rateLimitBuffer.length >= this.settings.filters.maxNotificationsPerMinute) {
            console.warn('⚠️ 알림 비율 제한 초과');
            return notification.severity === 'critical'; // critical만 허용
        }

        this.rateLimitBuffer.push(now);

        return true;
    }

    /**
     * 🌐 브라우저 알림 전송
     */
    private async sendBrowserNotification(
        notification: UnifiedNotification,
        result: NotificationResult
    ): Promise<void> {
        try {
            const sent = await this.browserService.sendNotification({
                title: notification.title,
                body: notification.message,
                icon: this.getIconForType(notification.type),
                badge: '/icons/badge-icon.png',
                tag: notification.deduplicationKey || notification.id,
                data: {
                    notificationId: notification.id,
                    type: notification.type,
                    severity: notification.severity,
                    ...notification.data,
                },
                requireInteraction: notification.actionRequired || notification.severity === 'critical',
                silent: notification.severity === 'info',
            });

            result.channels.browser.sent = sent;
            if (sent) {
                this.stats.channelStats.browser.sent++;
            } else {
                this.stats.channelStats.browser.failed++;
            }
        } catch (error) {
            result.channels.browser.error = error instanceof Error ? error.message : '알 수 없는 오류';
            this.stats.channelStats.browser.failed++;
            console.error('❌ 브라우저 알림 실패:', error);
        }
    }

    /**
     * 🍞 Toast 알림 전송
     */
    private async sendToastNotification(
        notification: UnifiedNotification,
        result: NotificationResult
    ): Promise<void> {
        try {
            // 서버 알림용 특별 처리
            if (notification.type === 'server' && notification.serverId && notification.serverName) {
                EnhancedToastSystem.showServerAlert({
                    id: notification.id,
                    serverId: notification.serverId,
                    serverName: notification.serverName,
                    type: 'custom',
                    severity: notification.severity,
                    message: notification.message,
                    timestamp: notification.timestamp!,
                    actionRequired: notification.actionRequired,
                });
            } else {
                // 일반 알림
                switch (notification.severity) {
                    case 'critical':
                        EnhancedToastSystem.showError(notification.title, notification.message);
                        break;
                    case 'warning':
                        EnhancedToastSystem.showWarning(notification.title, notification.message);
                        break;
                    case 'success':
                        EnhancedToastSystem.showSuccess(notification.title, notification.message);
                        break;
                    case 'info':
                    default:
                        EnhancedToastSystem.showInfo(notification.title, notification.message);
                        break;
                }
            }

            result.channels.toast.sent = true;
            this.stats.channelStats.toast.sent++;
        } catch (error) {
            result.channels.toast.error = error instanceof Error ? error.message : '알 수 없는 오류';
            this.stats.channelStats.toast.failed++;
            console.error('❌ Toast 알림 실패:', error);
        }
    }

    /**
     * 📝 콘솔 알림 전송
     */
    private async sendConsoleNotification(
        notification: UnifiedNotification,
        result: NotificationResult
    ): Promise<void> {
        try {
            const emoji = this.getEmojiForSeverity(notification.severity);
            const prefix = `${emoji} [${notification.type.toUpperCase()}]`;
            const message = `${prefix} ${notification.title}: ${notification.message}`;

            switch (notification.severity) {
                case 'critical':
                    console.error(message, notification.data || '');
                    break;
                case 'warning':
                    console.warn(message, notification.data || '');
                    break;
                case 'info':
                    console.info(message, notification.data || '');
                    break;
                case 'success':
                    console.log(message, notification.data || '');
                    break;
            }

            result.channels.console.sent = true;
            this.stats.channelStats.console.sent++;
        } catch (error) {
            result.channels.console.error = error instanceof Error ? error.message : '알 수 없는 오류';
            this.stats.channelStats.console.failed++;
        }
    }

    /**
     * 🔧 후처리
     */
    private async postProcessNotification(
        notification: UnifiedNotification,
        result: NotificationResult
    ): Promise<void> {
        // 히스토리에 추가
        this.notificationHistory.push(notification);

        // 히스토리 크기 제한 (최근 1000개)
        if (this.notificationHistory.length > 1000) {
            this.notificationHistory = this.notificationHistory.slice(-1000);
        }

        // 통계 업데이트
        this.stats.totalSent++;
        this.stats.severityStats[notification.severity]++;
    }

    /**
     * 🎯 채널 전송 여부 결정
     */
    private shouldSendToChannel(
        channel: 'browser' | 'toast' | 'console',
        notification: UnifiedNotification
    ): boolean {
        // 알림 레벨 채널 설정 우선
        if (notification.channels && notification.channels[channel] !== undefined) {
            return notification.channels[channel]!;
        }

        // 글로벌 설정 확인
        const channelSettings = this.settings.channels[channel];
        if (!channelSettings.enabled) {
            return false;
        }

        // 최소 심각도 확인
        const severityLevels = { info: 0, warning: 1, critical: 2, success: 0 };
        const notificationLevel = severityLevels[notification.severity];
        const minLevel = severityLevels[channelSettings.minSeverity];

        return notificationLevel >= minLevel;
    }

    /**
     * 🎨 유틸리티 메서드들
     */
    private generateNotificationId(notification: UnifiedNotification): string {
        return `${notification.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private getIconForType(type: string): string {
        const icons = {
            system: '/icons/system-icon.png',
            server: '/icons/server-icon.png',
            ai: '/icons/ai-icon.png',
            performance: '/icons/performance-icon.png',
            security: '/icons/security-icon.png',
            custom: '/icons/custom-icon.png',
        };
        return icons[type as keyof typeof icons] || icons.custom;
    }

    private getEmojiForSeverity(severity: string): string {
        const emojis = {
            info: 'ℹ️',
            warning: '⚠️',
            critical: '🚨',
            success: '✅',
        };
        return emojis[severity as keyof typeof emojis] || 'ℹ️';
    }

    private loadDefaultSettings(): NotificationSettings {
        return {
            enabled: true,
            channels: {
                browser: {
                    enabled: true,
                    minSeverity: 'critical', // 메모리에서 언급한 과도한 알림 방지
                    permission: 'default',
                },
                toast: {
                    enabled: true,
                    minSeverity: 'warning', // warning 이상만 Toast로 표시
                    autoHide: true,
                    duration: 5000,
                },
                console: {
                    enabled: true,
                    minSeverity: 'info',
                },
            },
            filters: {
                enableDeduplication: true,
                defaultCooldown: 30000, // 30초
                maxNotificationsPerMinute: 10,
                systemStartupQuietMode: true, // 메모리에서 언급한 시작 시 조용한 모드
            },
        };
    }

    private loadUserSettings(): void {
        try {
            const saved = localStorage.getItem('unified-notification-settings');
            if (saved) {
                const userSettings = JSON.parse(saved);
                this.settings = { ...this.settings, ...userSettings };
            }
        } catch (error) {
            console.warn('⚠️ 사용자 알림 설정 로드 실패:', error);
        }
    }

    /**
     * 📊 공개 API 메서드들
     */

    /**
     * ⚙️ 설정 업데이트
     */
    updateSettings(newSettings: Partial<NotificationSettings>): void {
        this.settings = { ...this.settings, ...newSettings };

        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('unified-notification-settings', JSON.stringify(this.settings));
            } catch (error) {
                console.warn('⚠️ 설정 저장 실패:', error);
            }
        }

        console.log('⚙️ 알림 설정 업데이트:', newSettings);
    }

    /**
     * 📈 통계 조회
     */
    getStats() {
        return {
            ...this.stats,
            settings: this.settings,
            recentNotificationsCount: this.recentNotifications.size,
            historyCount: this.notificationHistory.length,
            rateLimitBuffer: this.rateLimitBuffer.length,
        };
    }

    /**
     * 📜 알림 이력 조회
     */
    getHistory(limit = 50): UnifiedNotification[] {
        return this.notificationHistory.slice(-limit);
    }

    /**
     * 🧹 정리 메서드들
     */
    clearHistory(): void {
        this.notificationHistory = [];
        console.log('🧹 알림 이력 정리 완료');
    }

    clearRecentNotifications(): void {
        this.recentNotifications.clear();
        console.log('🧹 최근 알림 캐시 정리 완료');
    }

    /**
     * 🔄 서비스 재시작
     */
    async restart(): Promise<void> {
        console.log('🔄 통합 알림 서비스 재시작...');

        // 캐시 정리
        this.clearRecentNotifications();
        this.rateLimitBuffer = [];

        // 브라우저 서비스 재초기화
        this.browserService = new BrowserNotificationService();

        // 설정 재로드
        if (typeof window !== 'undefined') {
            this.loadUserSettings();
        }

        console.log('✅ 통합 알림 서비스 재시작 완료');
    }

    /**
     * 🔍 서비스 상태 조회
     */
    getStatus() {
        return {
            enabled: this.settings.enabled,
            browserService: this.browserService.getStatus(),
            settings: this.settings,
            stats: this.stats,
            health: {
                recentNotifications: this.recentNotifications.size,
                historyCount: this.notificationHistory.length,
                rateLimitBuffer: this.rateLimitBuffer.length,
            },
        };
    }
}

// 싱글톤 인스턴스 export
export const unifiedNotificationService = UnifiedNotificationService.getInstance();

// 기본 export
export default unifiedNotificationService;