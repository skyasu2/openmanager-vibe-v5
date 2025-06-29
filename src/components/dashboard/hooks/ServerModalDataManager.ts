/**
 * 🎯 Server Modal Data Manager v1.0
 *
 * 실시간 서버 데이터 관리 custom hook
 * SOLID 원칙 적용: 데이터 관리 로직을 별도 모듈로 분리
 */

import { calculateOptimalCollectionInterval } from '@/config/serverConfig';
import { useEffect, useState } from 'react';
import {
  RealtimeDataState,
  ServerData,
  TabId,
  TimeRange,
} from '../types/ServerModalTypes';

export interface UseServerModalDataProps {
  server: ServerData | null;
  isRealtime: boolean;
}

export interface UseServerModalDataReturn {
  // 상태 관리
  selectedTab: TabId;
  setSelectedTab: (tab: TabId) => void;
  isRealtime: boolean;
  setIsRealtime: (enabled: boolean) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;

  // 데이터 상태
  realtimeData: RealtimeDataState;
  safeServer: ServerData | null;
}

export const useServerModalData = ({
  server,
  isRealtime: initialIsRealtime = true,
}: UseServerModalDataProps): UseServerModalDataReturn => {
  // 🎯 상태 관리
  const [selectedTab, setSelectedTab] = useState<TabId>('overview');
  const [isRealtime, setIsRealtime] = useState(initialIsRealtime);
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');

  // 🎯 실시간 데이터 상태
  const [realtimeData, setRealtimeData] = useState<RealtimeDataState>({
    cpu: [],
    memory: [],
    disk: [],
    network: [],
    latency: [],
    processes: [],
    logs: [],
  });

  // 🛡️ 서버 데이터 안전성 검증 및 기본값 설정
  const safeServer = server
    ? {
        id: server.id || 'unknown',
        hostname: server.hostname || 'unknown.local',
        name: server.name || 'Unknown Server',
        type: server.type || 'unknown',
        environment: server.environment || 'unknown',
        location: server.location || 'Unknown Location',
        provider: server.provider || 'Unknown Provider',
        status: server.status || 'offline',
        cpu: typeof server.cpu === 'number' ? server.cpu : 0,
        memory: typeof server.memory === 'number' ? server.memory : 0,
        disk: typeof server.disk === 'number' ? server.disk : 0,
        network: typeof server.network === 'number' ? server.network : 0,
        uptime: server.uptime || '0h 0m',
        lastUpdate: server.lastUpdate || new Date(),
        alerts: typeof server.alerts === 'number' ? server.alerts : 0,
        services: Array.isArray(server.services) ? server.services : [],
        specs: server.specs || { cpu_cores: 4, memory_gb: 8, disk_gb: 100 },
        os: server.os || 'Unknown OS',
        ip: server.ip || '0.0.0.0',
        networkStatus: server.networkStatus || 'offline',
        health: server.health || { score: 0, trend: [] },
        alertsSummary: server.alertsSummary || {
          total: 0,
          critical: 0,
          warning: 0,
        },
      }
    : null;

  // 🎯 실시간 데이터 생성 로직
  useEffect(() => {
    if (!safeServer || !isRealtime) return;

    const generateRealtimeData = () => {
      try {
        const now = new Date();
        setRealtimeData(prev => ({
          cpu: [
            ...prev.cpu.slice(-29),
            // 🎯 메트릭 변화량 안정화: 기존 ±10 → ±3
            safeServer.cpu + (Math.random() - 0.5) * 3,
          ].slice(-30),
          memory: [
            ...prev.memory.slice(-29),
            // 🎯 메트릭 변화량 안정화: 기존 ±8 → ±2
            safeServer.memory + (Math.random() - 0.5) * 2,
          ].slice(-30),
          disk: [
            ...prev.disk.slice(-29),
            // 🎯 메트릭 변화량 안정화: 기존 ±3 → ±1
            safeServer.disk + (Math.random() - 0.5) * 1,
          ].slice(-30),
          network: [
            ...prev.network.slice(-29),
            {
              in: Math.random() * 200 + 400,
              out: Math.random() * 150 + 250,
            },
          ].slice(-30),
          latency: [...prev.latency.slice(-29), Math.random() * 20 + 45].slice(
            -30
          ),
          processes:
            safeServer.services?.map((service, i) => ({
              name: service.name || `service-${i}`,
              cpu: parseFloat((Math.random() * 8).toFixed(2)),
              memory: parseFloat((Math.random() * 6).toFixed(2)),
              pid: 1000 + i,
            })) || [],
          logs: [
            ...prev.logs.slice(-19),
            {
              timestamp: now.toISOString(),
              level: ['info', 'warn', 'error'][
                Math.floor(Math.random() * 3)
              ] as 'info' | 'warn' | 'error',
              message: [
                `${safeServer.name} - HTTP request processed successfully`,
                `${safeServer.name} - Memory usage above threshold`,
                `${safeServer.name} - Database connection established`,
                `${safeServer.name} - Cache invalidated`,
                `${safeServer.name} - Backup completed`,
                `${safeServer.name} - SSL certificate renewed`,
              ][Math.floor(Math.random() * 6)],
              source:
                safeServer.services?.[
                  Math.floor(Math.random() * safeServer.services.length)
                ]?.name || safeServer.name,
            },
          ].slice(-20),
        }));
      } catch (error) {
        console.error(
          '⚠️ [ServerModalDataManager] 실시간 데이터 생성 오류:',
          error
        );
        // 오류 발생 시 기본 데이터로 설정
        setRealtimeData(prev => ({
          ...prev,
          logs: [
            ...prev.logs.slice(-19),
            {
              timestamp: new Date().toISOString(),
              level: 'warn' as 'info' | 'warn' | 'error',
              message: `${safeServer.name} - 데이터 생성 오류 발생`,
              source: safeServer.name,
            },
          ].slice(-20),
        }));
      }
    };

    generateRealtimeData();
    // 🎯 데이터 수집 간격과 완전 동기화
    const interval = setInterval(
      generateRealtimeData,
      calculateOptimalCollectionInterval()
    );

    return () => clearInterval(interval);
  }, [safeServer, isRealtime]);

  return {
    // 상태 관리
    selectedTab,
    setSelectedTab,
    isRealtime,
    setIsRealtime,
    timeRange,
    setTimeRange,

    // 데이터 상태
    realtimeData,
    safeServer,
  };
};
