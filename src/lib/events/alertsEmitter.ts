import { EventEmitter } from 'node:events';

/**
 * 📢 글로벌 알림 이벤트 버스 (SSE / WebSocket 용)
 */
class AlertsEmitter extends EventEmitter {}

// 단일 인스턴스 보장
export const alertsEmitter = new AlertsEmitter();
