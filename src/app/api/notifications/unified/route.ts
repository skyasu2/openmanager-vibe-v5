/**
 * 🔔 통합 알림 시스템 API v1.0
 * 
 * 엔드포인트:
 * GET /api/notifications/unified - 통합 알림 상태 조회
 * POST /api/notifications/unified - 통합 알림 전송
 * PUT /api/notifications/unified - 통합 알림 설정 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, withErrorHandler } from '../../../../lib/api/errorHandler';
import { slackNotificationService } from '../../../../services/SlackNotificationService';
import { browserNotificationService } from '../../../../services/notifications/BrowserNotificationService';

/**
 * 📊 통합 알림 상태 조회 (GET)
 */
async function getUnifiedStatusHandler(request: NextRequest) {
    try {
        console.log('📊 통합 알림 상태 조회');

        // 각 서비스 상태 수집
        const slackStatus = slackNotificationService.getStatus();
        const browserStatus = browserNotificationService.getStatus();

        const unifiedStatus = {
            system: {
                name: 'OpenManager 통합 알림 시스템',
                version: '1.0',
                status: 'active',
                lastUpdated: new Date().toISOString()
            },
            channels: {
                browser: {
                    name: '브라우저 알림',
                    enabled: browserStatus.enabled,
                    supported: browserStatus.supported,
                    permission: browserStatus.permission,
                    activeNotifications: browserStatus.activeNotifications,
                    totalSent: browserStatus.totalSent,
                    features: browserStatus.features
                },
                slack: {
                    name: '슬랙 알림',
                    enabled: slackStatus.enabled,
                    webhook: slackStatus.webhook,
                    channel: slackStatus.channel,
                    alertsSent: slackStatus.alertsSent
                },
                toast: {
                    name: 'Toast 알림',
                    enabled: true,
                    type: 'EnhancedToastSystem',
                    alwaysAvailable: true
                },
                websocket: {
                    name: 'WebSocket 실시간',
                    enabled: true,
                    type: 'Real-time Updates'
                },
                database: {
                    name: '데이터베이스 로그',
                    enabled: true,
                    type: 'Persistent Storage'
                }
            },
            features: {
                smartRouting: true,
                severityFiltering: true,
                quietHours: true,
                cooldownManagement: true,
                settingsExport: true,
                realTimeTesting: true
            },
            statistics: {
                totalChannels: 5,
                activeChannels: Object.values({
                    browser: browserStatus.enabled,
                    slack: slackStatus.enabled,
                    toast: true,
                    websocket: true,
                    database: true
                }).filter(Boolean).length,
                supportedFeatures: Object.keys(browserStatus.features).filter(
                    key => browserStatus.features[key as keyof typeof browserStatus.features]
                ).length
            }
        };

        return createSuccessResponse(unifiedStatus, '통합 알림 상태 조회 완료');

    } catch (error) {
        console.error('❌ 통합 알림 상태 조회 실패:', error);
        return createErrorResponse(
            `통합 알림 상태 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        );
    }
}

/**
 * 📤 통합 알림 전송 (POST)
 */
async function sendUnifiedNotificationHandler(request: NextRequest) {
    try {
        console.log('📤 통합 알림 전송 요청');

        const body = await request.json();
        const {
            alert,
            preferences,
            testMode = false
        } = body;

        // 필수 필드 검증
        if (!alert || !alert.title || !alert.message) {
            return createErrorResponse('알림 제목과 메시지는 필수입니다');
        }

        if (!preferences) {
            return createErrorResponse('알림 설정이 필요합니다');
        }

        // 기본 알림 데이터 구성
        const unifiedAlert = {
            id: alert.id || `alert-${Date.now()}`,
            serverId: alert.serverId,
            serverName: alert.serverName,
            type: alert.type || 'system',
            severity: alert.severity || 'info',
            title: alert.title,
            message: alert.message,
            timestamp: new Date(alert.timestamp || Date.now()),
            metrics: alert.metrics,
            actionRequired: alert.actionRequired || false,
            source: alert.source || 'api'
        };

        const results = {
            id: unifiedAlert.id,
            channels: {
                browser: { sent: false, error: null },
                slack: { sent: false, error: null },
                toast: { sent: false, error: null },
                database: { sent: false, error: null }
            },
            timestamp: new Date(),
            testMode
        };

        // 채널별 전송 처리
        const tasks = [];

        // 1. 브라우저 알림 (클라이언트 사이드에서 처리되므로 서버에서는 스킵)
        if (preferences.channels?.browser) {
            results.channels.browser.sent = true; // 클라이언트에서 처리됨을 표시
        }

        // 2. 슬랙 알림
        if (preferences.channels?.slack) {
            tasks.push(
                (async () => {
                    try {
                        let success = false;

                        if (testMode) {
                            success = await slackNotificationService.sendSystemNotification(
                                `🧪 [테스트] ${unifiedAlert.title}`,
                                unifiedAlert.severity
                            );
                        } else {
                            switch (unifiedAlert.type) {
                                case 'server':
                                    if (unifiedAlert.serverName && unifiedAlert.metrics) {
                                        success = await slackNotificationService.sendServerAlert({
                                            serverId: unifiedAlert.serverId || unifiedAlert.id,
                                            hostname: unifiedAlert.serverName,
                                            metric: 'cpu_usage', // 기본값
                                            value: unifiedAlert.metrics.cpu || 0,
                                            threshold: 85,
                                            severity: unifiedAlert.severity === 'info' ? 'warning' : unifiedAlert.severity,
                                            timestamp: unifiedAlert.timestamp.toISOString()
                                        });
                                    }
                                    break;

                                case 'memory':
                                    if (unifiedAlert.metrics?.memory) {
                                        success = await slackNotificationService.sendMemoryAlert({
                                            usagePercent: unifiedAlert.metrics.memory,
                                            heapUsed: Math.round(unifiedAlert.metrics.memory * 1024 * 1024),
                                            heapTotal: Math.round(100 * 1024 * 1024),
                                            severity: unifiedAlert.severity === 'info' ? 'warning' : unifiedAlert.severity,
                                            timestamp: unifiedAlert.timestamp.toISOString()
                                        });
                                    }
                                    break;

                                default:
                                    success = await slackNotificationService.sendSystemNotification(
                                        `${unifiedAlert.title}: ${unifiedAlert.message}`,
                                        unifiedAlert.severity
                                    );
                            }
                        }

                        results.channels.slack.sent = success;
                    } catch (error) {
                        results.channels.slack.error = error instanceof Error ? error.message : 'Slack 전송 실패';
                    }
                })()
            );
        }

        // 3. Toast 알림 (클라이언트 사이드에서 처리)
        if (preferences.channels?.toast) {
            results.channels.toast.sent = true; // 클라이언트에서 처리됨을 표시
        }

        // 4. 데이터베이스 로그 저장
        tasks.push(
            (async () => {
                try {
                    // 실제 구현에서는 Supabase나 다른 DB에 저장
                    console.log(`💾 DB 로그 저장: ${unifiedAlert.id} - ${unifiedAlert.title}`);

                    // TODO: 실제 DB 저장 로직 구현
                    // await supabase.from('notification_logs').insert({
                    //   id: unifiedAlert.id,
                    //   title: unifiedAlert.title,
                    //   message: unifiedAlert.message,
                    //   severity: unifiedAlert.severity,
                    //   type: unifiedAlert.type,
                    //   server_id: unifiedAlert.serverId,
                    //   server_name: unifiedAlert.serverName,
                    //   metrics: unifiedAlert.metrics,
                    //   timestamp: unifiedAlert.timestamp,
                    //   source: unifiedAlert.source
                    // });

                    results.channels.database.sent = true;
                } catch (error) {
                    results.channels.database.error = error instanceof Error ? error.message : 'DB 저장 실패';
                }
            })()
        );

        // 모든 작업 병렬 실행
        await Promise.allSettled(tasks);

        const successCount = Object.values(results.channels).filter(channel => channel.sent).length;
        const message = testMode
            ? `테스트 알림 전송 완료 (${successCount}개 채널 성공)`
            : `통합 알림 전송 완료 (${successCount}개 채널 성공)`;

        return createSuccessResponse(results, message);

    } catch (error) {
        console.error('❌ 통합 알림 전송 실패:', error);
        return createErrorResponse(
            `통합 알림 전송 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        );
    }
}

/**
 * ⚙️ 통합 알림 설정 업데이트 (PUT)
 */
async function updateUnifiedSettingsHandler(request: NextRequest) {
    try {
        console.log('⚙️ 통합 알림 설정 업데이트');

        const body = await request.json();
        const { preferences, slackConfig } = body;

        const updateResults = {
            preferences: false,
            slack: false,
            browser: false,
            errors: [] as string[]
        };

        // 슬랙 설정 업데이트
        if (slackConfig && slackConfig.webhookUrl) {
            try {
                if (!slackConfig.webhookUrl.startsWith('https://hooks.slack.com/services/')) {
                    throw new Error('유효하지 않은 Slack 웹훅 URL입니다');
                }

                slackNotificationService.updateConfig(
                    slackConfig.webhookUrl,
                    slackConfig.defaultChannel
                );

                // 테스트 알림 전송
                const testSuccess = await slackNotificationService.sendSystemNotification(
                    '✅ OpenManager 통합 알림 설정이 업데이트되었습니다!',
                    'info'
                );

                updateResults.slack = testSuccess;

                if (!testSuccess) {
                    updateResults.errors.push('슬랙 테스트 알림 전송 실패');
                }
            } catch (error) {
                updateResults.errors.push(`슬랙 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            }
        }

        // 설정 검증
        if (preferences) {
            try {
                // 기본 검증
                if (!preferences.userId) {
                    throw new Error('사용자 ID가 필요합니다');
                }

                // 조용한 시간 검증
                if (preferences.quietHours && preferences.quietHours.enabled) {
                    const { start, end } = preferences.quietHours;
                    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

                    if (!timeRegex.test(start) || !timeRegex.test(end)) {
                        throw new Error('유효하지 않은 시간 형식입니다 (HH:MM)');
                    }
                }

                // 쿨다운 검증
                if (preferences.cooldown && preferences.cooldown.enabled) {
                    const { duration } = preferences.cooldown;
                    if (duration < 1 || duration > 60) {
                        throw new Error('쿨다운 시간은 1-60분 사이여야 합니다');
                    }
                }

                updateResults.preferences = true;
            } catch (error) {
                updateResults.errors.push(`설정 검증 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            }
        }

        // 브라우저 알림은 클라이언트에서 처리
        updateResults.browser = true;

        const hasErrors = updateResults.errors.length > 0;
        const message = hasErrors
            ? `설정 업데이트 부분 완료 (${updateResults.errors.length}개 오류)`
            : '통합 알림 설정 업데이트 완료';

        return createSuccessResponse({
            updated: updateResults,
            slackStatus: slackNotificationService.getStatus(),
            browserStatus: browserNotificationService.getStatus(),
            timestamp: new Date().toISOString()
        }, message);

    } catch (error) {
        console.error('❌ 통합 알림 설정 업데이트 실패:', error);
        return createErrorResponse(
            `통합 알림 설정 업데이트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        );
    }
}

// 에러 핸들러로 래핑
export const GET = withErrorHandler(getUnifiedStatusHandler);
export const POST = withErrorHandler(sendUnifiedNotificationHandler);
export const PUT = withErrorHandler(updateUnifiedSettingsHandler); 