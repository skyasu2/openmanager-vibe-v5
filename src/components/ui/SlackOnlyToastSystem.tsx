/**
 * 🔔 Slack Only Toast System
 *
 * 슬랙 경고 알림 전용 토스트 시스템
 * 기존의 모든 UI 피드백은 인라인 시스템으로 대체되고
 * 이 시스템은 오직 슬랙 통합 알림에만 사용됩니다
 *
 * @created 2025-01-03
 * @author AI Assistant
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, MessageSquare } from 'lucide-react';

export interface SlackNotification {
    id: string;
    message: string;
    slackChannel: string;
    timestamp: Date;
    priority: 'critical' | 'high' | 'medium' | 'low';
    duration?: number;
}

class SlackToastManager {
    private static instance: SlackToastManager;
    private notifications: SlackNotification[] = [];
    private listeners: Set<(notifications: SlackNotification[]) => void> = new Set();
    private idCounter = 0;

    static getInstance(): SlackToastManager {
        if (!SlackToastManager.instance) {
            SlackToastManager.instance = new SlackToastManager();
        }
        return SlackToastManager.instance;
    }

    private generateId(): string {
        return `slack-toast-${Date.now()}-${++this.idCounter}`;
    }

    private notify(): void {
        this.listeners.forEach(listener => {
            listener([...this.notifications]);
        });
    }

    subscribe(listener: (notifications: SlackNotification[]) => void): () => void {
        this.listeners.add(listener);
        listener([...this.notifications]);

        return () => {
            this.listeners.delete(listener);
        };
    }

    // 슬랙 알림 표시
    showSlackNotification(
        message: string,
        slackChannel: string,
        priority: SlackNotification['priority'] = 'medium',
        duration?: number
    ): string {
        const notification: SlackNotification = {
            id: this.generateId(),
            message,
            slackChannel,
            priority,
            timestamp: new Date(),
            duration: duration ?? this.getPriorityDuration(priority)
        };

        this.notifications.unshift(notification);

        // 최대 5개까지만 유지
        if (this.notifications.length > 5) {
            this.notifications = this.notifications.slice(0, 5);
        }

        this.notify();

        // 자동 제거
        if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, notification.duration);
        }

        return notification.id;
    }

    private getPriorityDuration(priority: SlackNotification['priority']): number {
        switch (priority) {
            case 'critical': return 0; // 수동으로만 제거
            case 'high': return 15000; // 15초
            case 'medium': return 8000; // 8초
            case 'low': return 5000; // 5초
            default: return 8000;
        }
    }

    removeNotification(id: string): void {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.notify();
    }

    clearAll(): void {
        this.notifications = [];
        this.notify();
    }
}

export const slackToastManager = SlackToastManager.getInstance();

// React Hook
export function useSlackToast() {
    return {
        showSlackAlert: (message: string, channel: string, priority?: SlackNotification['priority']) =>
            slackToastManager.showSlackNotification(message, channel, priority),
        clearAll: slackToastManager.clearAll.bind(slackToastManager)
    };
}

// 개별 슬랙 토스트 컴포넌트
interface SlackToastProps {
    notification: SlackNotification;
    onRemove: (id: string) => void;
}

function SlackToast({ notification, onRemove }: SlackToastProps) {
    const getPriorityStyles = () => {
        switch (notification.priority) {
            case 'critical':
                return {
                    container: 'bg-red-600 border-red-500 text-white',
                    accent: 'bg-red-400',
                    icon: '🚨'
                };
            case 'high':
                return {
                    container: 'bg-orange-600 border-orange-500 text-white',
                    accent: 'bg-orange-400',
                    icon: '⚠️'
                };
            case 'medium':
                return {
                    container: 'bg-blue-600 border-blue-500 text-white',
                    accent: 'bg-blue-400',
                    icon: '📢'
                };
            case 'low':
                return {
                    container: 'bg-gray-600 border-gray-500 text-white',
                    accent: 'bg-gray-400',
                    icon: 'ℹ️'
                };
        }
    };

    const styles = getPriorityStyles();

    return (
        <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.95 }}
            className={`relative p-4 rounded-lg shadow-2xl border-l-4 ${styles.container} min-w-80 max-w-96`}
            layout
        >
            {/* 우선순위 표시 바 */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${styles.accent} rounded-t-lg`} />

            {/* 헤더 */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{styles.icon}</span>
                    <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm font-semibold">#{notification.slackChannel}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs opacity-80">
                        {notification.timestamp.toLocaleTimeString()}
                    </span>
                    <motion.button
                        onClick={() => onRemove(notification.id)}
                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <X className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>

            {/* 메시지 */}
            <div className="text-sm leading-relaxed mb-3">
                {notification.message}
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-between items-center">
                <span className={`text-xs px-2 py-1 rounded-full bg-white/20 font-medium`}>
                    Slack 알림 발송됨
                </span>

                <motion.button
                    className="flex items-center gap-1 text-xs hover:bg-white/20 px-2 py-1 rounded transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ExternalLink className="w-3 h-3" />
                    Slack 열기
                </motion.button>
            </div>
        </motion.div>
    );
}

// 슬랙 토스트 컨테이너
export function SlackToastContainer() {
    const [notifications, setNotifications] = useState<SlackNotification[]>([]);

    useEffect(() => {
        const unsubscribe = slackToastManager.subscribe(setNotifications);
        return unsubscribe;
    }, []);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[99999] space-y-3 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                    <div key={notification.id} className="pointer-events-auto">
                        <SlackToast
                            notification={notification}
                            onRemove={slackToastManager.removeNotification.bind(slackToastManager)}
                        />
                    </div>
                ))}
            </AnimatePresence>

            {/* 전체 삭제 버튼 (알림이 2개 이상일 때만 표시) */}
            {notifications.length > 1 && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={() => slackToastManager.clearAll()}
                    className="w-full p-2 bg-gray-800/90 text-white text-xs rounded-lg hover:bg-gray-700/90 transition-colors pointer-events-auto"
                >
                    모든 Slack 알림 지우기 ({notifications.length}개)
                </motion.button>
            )}
        </div>
    );
} 