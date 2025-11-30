/**
 * 🛡️ Vercel Safety Utilities
 *
 * Vercel 환경의 Race Condition 및 타입 안정성 문제를 방어하는 유틸리티
 * - Array length 안전 검증
 * - Server 데이터 타입 변환
 * - 개발 환경 안전 로깅
 */

import type { ServerData } from '@/components/dashboard/EnhancedServerModal.types';
import type { Server } from '@/types/server';

/**
 * 🛡️ Array length 안전 검증
 *
 * Vercel 환경에서 발생하는 "w is not a function" TypeError를 완전 방어
 * - 5중 검증으로 Race Condition 방어
 * - Bundle-safe 인라인 매크로 패턴 사용
 *
 * @param arr - 검증할 배열
 * @returns 안전한 배열 길이 (오류 시 0 반환)
 */
export const getSafeArrayLength = (arr: unknown): number => {
  try {
    // 🛡️ Vercel 환경 Race Condition 완전 방어 - 5중 검증
    if (arr === null || arr === undefined) return 0;
    const arrType = typeof arr;
    if (arrType !== 'object') return 0;
    if (arr === null || arr === undefined) return 0;
    const isArrayResult = Array.isArray(arr);
    if (!isArrayResult) return 0;
    if (!arr || !Array.isArray(arr)) return 0;
    if (!Object.hasOwn(arr, 'length')) return 0;

    const lengthValue = (() => {
      try {
        const tempArr = arr as unknown[];
        if (!tempArr || !Array.isArray(tempArr)) return 0;
        const tempLength = tempArr.length;
        if (typeof tempLength !== 'number') return 0;
        return tempLength;
      } catch {
        return 0;
      }
    })();

    if (Number.isNaN(lengthValue) || lengthValue < 0) return 0;
    return Math.floor(lengthValue);
  } catch (error) {
    console.error('🛡️ getSafeArrayLength error:', error);
    return 0;
  }
};

/**
 * 🛡️ Vercel 환경 안전 로깅
 *
 * Vercel 개발 환경에서만 안전하게 로그 출력
 * - 프로덕션 환경에서는 로그 억제
 *
 * @param message - 로그 메시지
 * @param data - 로그 데이터 (선택)
 */
export const vercelSafeLog = (message: string, data?: unknown): void => {
  if (
    typeof process !== 'undefined' &&
    process.env &&
    (process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined) &&
    process.env.NODE_ENV === 'development'
  ) {
    console.log(`🛡️ [Vercel Safe] ${message}`, data);
  }
};

/**
 * 🎯 Server 타입을 ServerData 타입으로 안전하게 변환
 *
 * - alerts: Array | number → number
 * - services: 안전한 배열 매핑
 * - uptime: number → "Xh Ym" 형식
 * - networkStatus: status 기반 자동 계산
 *
 * @param server - 원본 서버 데이터
 * @returns ServerData 타입으로 변환된 데이터
 */
export function convertServerToModalData(server: Server): ServerData {
  return {
    ...server,
    hostname: server.hostname || server.name,
    type: server.type || 'server',
    environment: server.environment || 'production',
    provider: server.provider || 'Unknown',
    // 🚀 FIX: getSafeArrayLength로 베르셀 안전성 보장
    alerts: (() => {
      try {
        if (Array.isArray(server.alerts)) {
          return getSafeArrayLength(server.alerts);
        }
        if (typeof server.alerts === 'number') {
          return Math.max(0, server.alerts);
        }
        return 0;
      } catch (error) {
        vercelSafeLog('convertServerToModalData alerts 처리 오류:', error);
        return 0;
      }
    })(),
    // 🛡️ services 배열도 베르셀 안전 처리
    services: (() => {
      try {
        const serverServices = server.services || [];
        if (!Array.isArray(serverServices)) {
          return [];
        }
        return serverServices.map((service) => ({
          name: service?.name || 'Unknown Service',
          status: service?.status || 'running',
          port: service?.port || 80,
        }));
      } catch (error) {
        vercelSafeLog('convertServerToModalData services 처리 오류:', error);
        return [];
      }
    })(),
    lastUpdate: server.lastUpdate || new Date(),
    uptime:
      typeof server.uptime === 'number'
        ? `${Math.floor(server.uptime / 3600)}h ${Math.floor((server.uptime % 3600) / 60)}m`
        : server.uptime || '0h 0m',
    status: server.status,
    networkStatus:
      server.status === 'online'
        ? 'excellent'
        : server.status === 'warning'
          ? 'good'
          : server.status === 'critical'
            ? 'poor'
            : 'offline',
  };
}
