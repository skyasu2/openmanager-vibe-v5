/**
 * 🌐 브라우저 알림 서비스 v1.0
 * 
 * Web Notification API 활용:
 * - 권한 요청 및 관리
 * - 리치 알림 표시
 * - 액션 버튼 지원
 * - 알림 그룹화 및 교체
 */

export interface BrowserNotificationOptions {
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
    silent?: boolean;
    timestamp?: number;
    actions?: {
        action: string;
        title: string;
        icon?: string;
    }[];
}

export interface NotificationActionEvent extends Event {
    action: string;
    notification: Notification;
}

export class BrowserNotificationService {
    private permission: NotificationPermission = 'default';
    private activeNotifications: Map<string, Notification> = new Map();
    private notificationsSent: number = 0;

    constructor() {
        this.initialize();
    }

    /**
     * 🚀 서비스 초기화
     */
    private async initialize(): Promise<void> {
        if (!this.isSupported()) {
            console.warn('⚠️ 브라우저가 Web Notification API를 지원하지 않습니다.');
            return;
        }

        this.permission = Notification.permission;

        // 서비스 워커에서 알림 액션 처리
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.ready;
                this.setupServiceWorkerHandlers();
            } catch (error) {
                console.warn('⚠️ 서비스 워커 설정 실패:', error);
            }
        }

        console.log(`🌐 브라우저 알림 서비스 초기화 완료 (권한: ${this.permission})`);
    }

    /**
     * 🔐 알림 권한 요청
     */
    async requestPermission(): Promise<boolean> {
        if (!this.isSupported()) return false;

        if (this.permission === 'granted') {
            return true;
        }

        try {
            this.permission = await Notification.requestPermission();

            if (this.permission === 'granted') {
                console.log('✅ 브라우저 알림 권한 허용됨');

                // 권한 허용 감사 알림
                await this.sendNotification({
                    title: '🔔 알림 설정 완료',
                    body: 'OpenManager의 브라우저 알림이 활성화되었습니다.',
                    icon: '/icons/check-icon.png',
                    tag: 'permission-granted',
                    silent: true
                });

                return true;
            } else {
                console.warn('❌ 브라우저 알림 권한 거부됨');
                return false;
            }
        } catch (error) {
            console.error('❌ 브라우저 알림 권한 요청 실패:', error);
            return false;
        }
    }

    /**
     * 📢 알림 전송
     */
    async sendNotification(options: BrowserNotificationOptions): Promise<boolean> {
        if (!this.isSupported() || this.permission !== 'granted') {
            console.warn('⚠️ 브라우저 알림을 보낼 수 없습니다. (권한 없음)');
            return false;
        }

        try {
            // 기존 같은 태그의 알림 제거 (교체)
            if (options.tag && this.activeNotifications.has(options.tag)) {
                const existingNotification = this.activeNotifications.get(options.tag);
                existingNotification?.close();
                this.activeNotifications.delete(options.tag);
            }

            const notificationOptions: any = {
                body: options.body,
                icon: options.icon,
                badge: options.badge,
                tag: options.tag,
                data: options.data,
                requireInteraction: options.requireInteraction,
                silent: options.silent
            };

            // timestamp 속성은 일부 브라우저에서만 지원
            if ('timestamp' in Notification.prototype) {
                notificationOptions.timestamp = options.timestamp || Date.now();
            }

            // image 속성은 일부 브라우저에서만 지원
            if (options.image && 'image' in Notification.prototype) {
                notificationOptions.image = options.image;
            }

            // actions 속성은 일부 브라우저에서만 지원
            if (options.actions && 'actions' in Notification.prototype) {
                notificationOptions.actions = options.actions;
            }

            const notification = new Notification(options.title, notificationOptions);

            // 알림 이벤트 핸들러
            notification.onclick = () => {
                console.log('🖱️ 브라우저 알림 클릭:', options.title);
                this.handleNotificationClick(notification, options);
            };

            notification.onclose = () => {
                console.log('❌ 브라우저 알림 닫힘:', options.title);
                if (options.tag) {
                    this.activeNotifications.delete(options.tag);
                }
            };

            notification.onerror = (error) => {
                console.error('❌ 브라우저 알림 오류:', error);
                if (options.tag) {
                    this.activeNotifications.delete(options.tag);
                }
            };

            // 활성 알림 추적
            if (options.tag) {
                this.activeNotifications.set(options.tag, notification);
            }

            // 자동 닫기 (critical이 아닌 경우)
            if (!options.requireInteraction) {
                setTimeout(() => {
                    notification.close();
                }, 5000); // 5초 후 자동 닫기
            }

            this.notificationsSent++;
            console.log(`✅ 브라우저 알림 전송: ${options.title}`);
            return true;

        } catch (error) {
            console.error('❌ 브라우저 알림 전송 실패:', error);
            return false;
        }
    }

    /**
     * 🖱️ 알림 클릭 처리
     */
    private handleNotificationClick(notification: Notification, options: BrowserNotificationOptions): void {
        // 창 포커스
        if (window) {
            window.focus();
        }

        // 데이터 기반 액션 처리
        if (options.data) {
            if (options.data.serverId) {
                // 서버 관련 알림 - 서버 상세 페이지로 이동
                window.location.href = `/dashboard/servers/${options.data.serverId}`;
            } else if (options.data.alertId) {
                // 일반 알림 - 대시보드로 이동
                window.location.href = '/dashboard';
            }
        } else {
            // 기본 액션 - 메인 대시보드
            window.location.href = '/dashboard';
        }

        notification.close();
    }

    /**
     * 🧹 특정 태그의 알림 제거
     */
    closeNotification(tag: string): void {
        const notification = this.activeNotifications.get(tag);
        if (notification) {
            notification.close();
            this.activeNotifications.delete(tag);
            console.log(`🧹 브라우저 알림 제거: ${tag}`);
        }
    }

    /**
     * 🧹 모든 알림 제거
     */
    closeAllNotifications(): void {
        for (const [tag, notification] of this.activeNotifications.entries()) {
            notification.close();
            this.activeNotifications.delete(tag);
        }
        console.log('🧹 모든 브라우저 알림 제거');
    }

    /**
     * 📊 서버별 알림 전송 (특화 메서드)
     */
    async sendServerAlert(
        serverId: string,
        serverName: string,
        severity: 'info' | 'warning' | 'critical',
        message: string,
        metrics?: { cpu?: number; memory?: number; disk?: number }
    ): Promise<boolean> {
        const severityIcons = {
            info: '/icons/info-icon.png',
            warning: '/icons/warning-icon.png',
            critical: '/icons/critical-icon.png'
        };

        const severityEmojis = {
            info: 'ℹ️',
            warning: '⚠️',
            critical: '🚨'
        };

        let body = `${severityEmojis[severity]} ${message}`;

        // 메트릭 정보 추가
        if (metrics) {
            const metricStrings = [];
            if (metrics.cpu !== undefined) metricStrings.push(`CPU: ${metrics.cpu}%`);
            if (metrics.memory !== undefined) metricStrings.push(`메모리: ${metrics.memory}%`);
            if (metrics.disk !== undefined) metricStrings.push(`디스크: ${metrics.disk}%`);

            if (metricStrings.length > 0) {
                body += `\n${metricStrings.join(' | ')}`;
            }
        }

        return await this.sendNotification({
            title: `${serverName} - ${severity.toUpperCase()}`,
            body,
            icon: severityIcons[severity],
            badge: '/icons/server-badge.png',
            tag: `server-${serverId}-${severity}`,
            data: {
                serverId,
                serverName,
                severity,
                alertType: 'server',
                timestamp: Date.now()
            },
            requireInteraction: severity === 'critical',
            silent: severity === 'info',
            actions: [
                {
                    action: 'view-server',
                    title: '서버 보기'
                },
                {
                    action: 'view-dashboard',
                    title: '대시보드'
                }
            ]
        });
    }

    /**
     * 🔄 시스템 알림 전송 (특화 메서드)
     */
    async sendSystemAlert(
        title: string,
        message: string,
        severity: 'info' | 'warning' | 'critical' = 'info'
    ): Promise<boolean> {
        const severityIcons = {
            info: '/icons/system-info.png',
            warning: '/icons/system-warning.png',
            critical: '/icons/system-critical.png'
        };

        return await this.sendNotification({
            title: `🖥️ ${title}`,
            body: message,
            icon: severityIcons[severity],
            badge: '/icons/system-badge.png',
            tag: `system-${severity}-${Date.now()}`,
            data: {
                alertType: 'system',
                severity,
                timestamp: Date.now()
            },
            requireInteraction: severity === 'critical',
            silent: severity === 'info'
        });
    }

    /**
     * 🛠️ 서비스 워커 핸들러 설정
     */
    private setupServiceWorkerHandlers(): void {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
                console.log('🖱️ 서비스 워커 알림 클릭:', event.data);

                // 알림 액션에 따른 처리
                switch (event.data.action) {
                    case 'view-server':
                        window.location.href = `/dashboard/servers/${event.data.serverId}`;
                        break;
                    case 'view-dashboard':
                        window.location.href = '/dashboard';
                        break;
                    case 'acknowledge':
                        // 알림 확인 처리
                        console.log('✅ 알림 확인됨');
                        break;
                }
            }
        });
    }

    /**
     * 🔍 브라우저 지원 여부 확인
     */
    private isSupported(): boolean {
        return 'Notification' in window;
    }

    /**
     * 📈 서비스 상태 조회
     */
    getStatus() {
        return {
            supported: this.isSupported(),
            permission: this.permission,
            enabled: this.permission === 'granted',
            activeNotifications: this.activeNotifications.size,
            totalSent: this.notificationsSent,
            features: {
                actions: 'actions' in Notification.prototype,
                badge: 'badge' in Notification.prototype,
                image: 'image' in Notification.prototype,
                renotify: 'renotify' in Notification.prototype,
                requireInteraction: 'requireInteraction' in Notification.prototype,
                silent: 'silent' in Notification.prototype,
                timestamp: 'timestamp' in Notification.prototype
            }
        };
    }

    /**
     * 🧪 테스트 알림 전송
     */
    async sendTestNotification(): Promise<boolean> {
        return await this.sendNotification({
            title: '🧪 알림 테스트',
            body: '브라우저 알림이 정상적으로 작동합니다!',
            icon: '/icons/test-icon.png',
            tag: 'test-notification',
            data: { test: true },
            silent: true
        });
    }
}

// 전역 인스턴스 내보내기
export const browserNotificationService = new BrowserNotificationService(); 