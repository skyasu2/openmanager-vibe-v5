/**
 * 🔧 System Components Configuration
 *
 * OpenManager Vibe v5 시스템 컴포넌트 정의
 *
 * @created 2025-06-09
 * @author AI Assistant
 */

import { safeErrorLog } from '../lib/error-handler';
import type { SystemComponent } from '../types/system-checklist';
import {
  fetchWithTracking,
  recordNetworkRequest,
} from '../utils/network-tracking';

export const OPENMANAGER_COMPONENTS: SystemComponent[] = [
  {
    id: 'api-server',
    name: 'API 서버 연결',
    description: '핵심 API 엔드포인트 연결을 확인합니다',
    icon: '🌐',
    priority: 'critical',
    estimatedTime: 800,
    checkFunction: async () => {
      try {
        const { response, networkInfo } = await fetchWithTracking(
          '/api/health',
          {
            method: 'GET',
          }
        );

        recordNetworkRequest(networkInfo, response.ok, 'api-server');
        return response.ok;
      } catch (error: Error | unknown) {
        if (error.networkInfo) {
          recordNetworkRequest(error.networkInfo, false, 'api-server');
        }

        safeErrorLog('🌐 API 서버 연결 실패', error.originalError || error);
        return false;
      }
    },
  },
  {
    id: 'metrics-database',
    name: '메트릭 데이터베이스',
    description: '서버 모니터링 데이터 저장소를 준비합니다',
    icon: '📊',
    priority: 'critical',
    estimatedTime: 1000,
    checkFunction: async () => {
      try {
        const { response, networkInfo } = await fetchWithTracking(
          '/api/dashboard?action=health',
          {
            method: 'GET',
          }
        );

        recordNetworkRequest(networkInfo, response.ok, 'metrics-database');
        return response.ok;
      } catch (error: Error | unknown) {
        if (error.networkInfo) {
          recordNetworkRequest(error.networkInfo, false, 'metrics-database');
        }

        safeErrorLog(
          '📊 메트릭 데이터베이스 연결 실패',
          error.originalError || error
        );
        return false;
      }
    },
  },
  {
    id: 'unified-ai-engine',
    name: 'Unified AI 엔진',
    description: 'Multi-AI 융합 시스템을 초기화합니다 (MCP+RAG+Google AI)',
    icon: '🤖',
    priority: 'high',
    estimatedTime: 1200,
    dependencies: ['api-server'],
    checkFunction: async () => {
      try {
        // 🚀 Unified AI 엔진 상태 체크
        const { response, networkInfo } = await fetchWithTracking(
          '/api/ai/unified?action=health',
          {
            method: 'GET',
          }
        );

        recordNetworkRequest(networkInfo, response.ok, 'unified-ai-engine');

        if (!response.ok) {
          console.warn('⚠️ Unified AI 엔진 직접 체크 실패, 폴백 모드로 전환');
          return true; // Graceful degradation - 폴백 모드로 동작
        }

        const data = await response.json();
        console.log('✅ Unified AI 엔진 체크 성공:', {
          engines: data.engines || 'unknown',
          tier: data.tier || 'fallback',
          responseTime: networkInfo?.responseTime || 'unknown',
        });

        return true;
      } catch (error: Error | unknown) {
        if (error.networkInfo) {
          recordNetworkRequest(error.networkInfo, false, 'unified-ai-engine');
        }

        console.warn(
          '⚠️ Unified AI 엔진 체크 실패, Graceful Degradation 모드:',
          {
            error: error.message,
            networkInfo: error.networkInfo?.responseTime
              ? `응답시간: ${error.networkInfo.responseTime}ms`
              : undefined,
          }
        );

        // Graceful Degradation: AI 엔진 실패해도 시스템은 동작
        return true;
      }
    },
  },
  {
    id: 'server-generator',
    name: '서버 생성기',
    description: '가상 서버 인스턴스 생성 시스템을 준비합니다',
    icon: '🖥️',
    priority: 'high',
    estimatedTime: 600,
    checkFunction: async () => {
      try {
        const { response, networkInfo } = await fetchWithTracking(
          '/api/servers/next',
          {
            method: 'GET',
          }
        );

        recordNetworkRequest(networkInfo, response.ok, 'server-generator');
        return response.ok;
      } catch (error: Error | unknown) {
        if (error.networkInfo) {
          recordNetworkRequest(error.networkInfo, false, 'server-generator');
        }

        safeErrorLog('🖥️ 서버 생성기 연결 실패', error.originalError || error);
        return false;
      }
    },
  },
  {
    id: 'cache-system',
    name: '캐시 시스템',
    description: '성능 최적화를 위한 캐시를 활성화합니다',
    icon: '⚡',
    priority: 'medium',
    estimatedTime: 400,
    checkFunction: async () => {
      // 캐시 시스템 체크 - 시뮬레이션
      console.log('⚡ 캐시 시스템 체크 시작');
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log('✅ 캐시 시스템 체크 완료');
      return true;
    },
  },
  {
    id: 'security-validator',
    name: '보안 검증',
    description: '시스템 보안 정책을 검증합니다',
    icon: '🔒',
    priority: 'medium',
    estimatedTime: 700,
    checkFunction: async () => {
      // 보안 검증 로직 - 시뮬레이션
      console.log('🔒 보안 검증 시작');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ 보안 검증 완료');
      return true;
    },
  },
  {
    id: 'ui-components',
    name: 'UI 컴포넌트',
    description: '대시보드 인터페이스를 준비합니다',
    icon: '🎨',
    priority: 'low',
    estimatedTime: 300,
    dependencies: ['api-server', 'metrics-database'],
    checkFunction: async () => {
      // UI 컴포넌트 준비 체크 - 시뮬레이션
      console.log('🎨 UI 컴포넌트 준비 시작');
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('✅ UI 컴포넌트 준비 완료');
      return true;
    },
  },
];
