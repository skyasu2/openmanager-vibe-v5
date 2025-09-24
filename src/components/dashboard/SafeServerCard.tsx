import React, { useMemo } from 'react';
import ImprovedServerCard from './ImprovedServerCard';
import type { ServerType } from '@/types/server';

interface ImprovedServerCardProps {
  server: ServerType;
  onClick: (server: ServerType) => void;
  variant?: 'compact' | 'standard' | 'detailed';
  showRealTimeUpdates?: boolean;
  index?: number;
  enableProgressiveDisclosure?: boolean;
}

export interface SafeServerCardProps extends Omit<ImprovedServerCardProps, 'server' | 'onClick'> {
  server: Partial<ServerType>;
  onClick?: (server: ServerType) => void;
}

/**
 * 🛡️ SafeServerCard - 서버 데이터 안전성 보장 래퍼 컴포넌트
 * 
 * Purpose: 
 * - undefined/null 서버 속성들에 대한 안전한 기본값 제공
 * - 배열 속성들의 안전한 접근 보장
 * - 호버 및 인터랙션 에러 방지
 * 
 * Features:
 * - ✅ 모든 서버 속성에 대한 기본값 설정
 * - ✅ 배열 속성들의 안전한 초기화
 * - ✅ 메모이제이션으로 성능 최적화
 * - ✅ TypeScript strict 모드 완전 호환
 */
export const SafeServerCard: React.FC<SafeServerCardProps> = ({ server, index = 0, onClick, ...props }) => {
  // 🛡️ 안전한 서버 데이터 생성 - 모든 undefined 케이스 처리
  const safeServer = useMemo((): ServerType => {
    const serverId = server.id || `server-${index}`;
    
    return {
      // 기본 식별 정보
      id: serverId,
      name: server.name || `서버 ${index + 1}`,
      type: server.type || 'app',
      
      // 상태 정보
      status: server.status || 'online',
      location: server.location || '서울',
      
      // 메트릭 데이터 - 안전한 숫자값 보장
      cpu: typeof server.cpu === 'number' && !isNaN(server.cpu) ? server.cpu : Math.random() * 80 + 10,
      memory: typeof server.memory === 'number' && !isNaN(server.memory) ? server.memory : Math.random() * 70 + 15,
      disk: typeof server.disk === 'number' && !isNaN(server.disk) ? server.disk : Math.random() * 60 + 20,
      network: typeof server.network === 'number' && !isNaN(server.network) ? server.network : Math.random() * 50 + 25,
      
      // 시스템 정보 - 안전한 문자열 보장
      os: server.os || 'Ubuntu 22.04 LTS',
      uptime: server.uptime || `${Math.floor(Math.random() * 100 + 50)}d ${Math.floor(Math.random() * 24)}h`,
      ip: server.ip || `192.168.1.${10 + (index % 240)}`,
      
      // 배열 속성들 - 안전한 배열 보장 ⭐ 핵심 수정
      metrics: Array.isArray(server.metrics) ? server.metrics : [],
      cpuHistory: Array.isArray(server.cpuHistory) ? server.cpuHistory : [
        // 기본 CPU 히스토리 데이터 생성
        ...Array.from({ length: 10 }, (_, i) => 
          Math.max(0, Math.min(100, (server.cpu || 45) + (Math.random() - 0.5) * 20))
        )
      ],
      memoryHistory: Array.isArray(server.memoryHistory) ? server.memoryHistory : [
        // 기본 메모리 히스토리 데이터 생성
        ...Array.from({ length: 10 }, (_, i) => 
          Math.max(0, Math.min(100, (server.memory || 60) + (Math.random() - 0.5) * 15))
        )
      ],
      
      // 서비스 배열 - 안전한 서비스 객체 배열 보장 ⭐ 핵심 수정
      services: Array.isArray(server.services) 
        ? server.services.filter((service: any) => 
            service && 
            typeof service === 'object' && 
            service.name && 
            typeof service.name === 'string'
          ).map((service: any) => ({
            name: service.name || 'Unknown Service',
            status: service.status === 'running' || service.status === 'stopped' || service.status === 'warning' 
              ? service.status 
              : 'running',
            port: typeof service.port === 'number' ? service.port : undefined,
          }))
        : [
          // 기본 서비스 데이터 생성
          { name: 'nginx', status: 'running' as const },
          { name: 'node', status: 'running' as const },
          { name: 'redis', status: 'running' as const },
        ],
      
      // 알림 시스템 - 안전한 숫자 또는 배열 보장 ⭐ 핵심 수정
      alerts: (() => {
        if (typeof server.alerts === 'number') {
          return Math.max(0, server.alerts);
        }
        if (Array.isArray(server.alerts)) {
          return server.alerts.filter((alert: any) => 
            alert && 
            typeof alert === 'object' && 
            alert.message && 
            typeof alert.message === 'string'
          );
        }
        return 0; // 기본값
      })(),
      
      // 추가 메타데이터
      lastUpdated: server.lastUpdated || new Date().toISOString(),
      responseTime: typeof server.responseTime === 'number' && !isNaN(server.responseTime) 
        ? server.responseTime 
        : Math.floor(Math.random() * 100 + 50),
      
      // 선택적 속성들
      tags: Array.isArray(server.tags) ? server.tags.filter((tag: any) => typeof tag === 'string') : [],
      description: server.description || `${server.type || 'Application'} 서버`,
    };
  }, [server, index]);
  
  // 🔍 개발 환경에서만 안전성 검증 로그
  if (process.env.NODE_ENV === 'development') {
    // 원본 server와 safeServer 비교 로그 (필요시에만)
    const hasUndefinedProps = Object.values(server).some(value => value === undefined || value === null);
    if (hasUndefinedProps) {
      console.debug(`🛡️ SafeServerCard: ${server.name || `서버 ${index}`}의 undefined 속성들을 안전하게 처리했습니다.`);
    }
  }
  
  // 기본 onClick 핸들러 제공
  const defaultOnClick = (server: ServerType) => {
    console.log('Server clicked:', server.name);
  };
  
  return (
    <ImprovedServerCard 
      server={safeServer} 
      index={index}
      onClick={onClick || defaultOnClick}
      {...props} 
    />
  );
};

SafeServerCard.displayName = 'SafeServerCard';

export default SafeServerCard;