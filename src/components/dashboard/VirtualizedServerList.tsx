'use client';

/**
 * 🚀 가상 스크롤 서버 리스트 (15개 전체 보기 전용)
 * react-window v2.2.1 기반 성능 최적화
 */

import { List } from 'react-window';
import SafeServerCard from '@/components/dashboard/SafeServerCard';
import { ServerCardErrorBoundary } from '@/components/debug/ComponentErrorBoundary';
import { formatUptime, getAlertsCount } from './types/server-dashboard.types';
import { serverTypeGuards } from '@/utils/serverUtils';
import type { Server, ServerStatus } from '@/types/server';
import { useEffect, useState, type CSSProperties } from 'react';

interface VirtualizedServerListProps {
  servers: Server[];
  handleServerSelect: (server: Server) => void;
}

// react-window가 자동 제공하는 props
interface AutoProvidedRowProps {
  index: number;
  style: CSSProperties;
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
}

// 사용자가 rowProps로 전달하는 props
interface CustomRowProps {
  servers: Server[];
  handleServerSelect: (server: Server) => void;
}

// 최종 Row 컴포넌트가 받는 props
type RowComponentProps = AutoProvidedRowProps & CustomRowProps;

// Row 컴포넌트 정의 (react-window v2.2.1 rowComponent 형식)
const RowComponent = ({
  index,
  style,
  servers,
  handleServerSelect,
}: RowComponentProps) => {
  const server = servers[index];

  if (!server) {
    console.error(`⚠️ VirtualizedServerList: 서버[${index}]가 null 또는 undefined입니다.`);
    return null;
  }

  const serverId = server.id || `server-${index}`;
  const serverName = server.name || `서버-${index + 1}`;

  let safeServerData;
  try {
    const safeStatus: ServerStatus = (() => {
      const status = server.status;
      if (
        status === 'online' ||
        status === 'offline' ||
        status === 'warning' ||
        status === 'critical' ||
        status === 'maintenance' ||
        status === 'unknown'
      ) {
        return status;
      }
      return 'offline';
    })();

    safeServerData = {
      id: serverId,
      name: serverName,
      status: safeStatus,
      cpu: (() => {
        const cpuData = serverTypeGuards.getCpu(server);
        if (typeof cpuData === 'number') return cpuData;
        if (cpuData && typeof cpuData === 'object' && 'usage' in cpuData)
          return (cpuData as { usage: number }).usage;
        return Math.random() * 80 + 10;
      })(),
      memory: (() => {
        const memData = serverTypeGuards.getMemory(server);
        if (typeof memData === 'number') return memData;
        if (memData && typeof memData === 'object' && 'used' in memData)
          return (memData as { used: number }).used;
        return Math.random() * 70 + 15;
      })(),
      disk: (() => {
        const diskData = serverTypeGuards.getDisk(server);
        if (typeof diskData === 'number') return diskData;
        if (diskData && typeof diskData === 'object' && 'used' in diskData)
          return (diskData as { used: number }).used;
        return Math.random() * 60 + 20;
      })(),
      network: (() => {
        const netData = serverTypeGuards.getNetwork(server);
        if (typeof netData === 'number') return netData;
        if (netData && typeof netData === 'object' && 'in' in netData)
          return (netData as { in: number }).in;
        return Math.random() * 100 + 50;
      })(),
      location: server.location || 'unknown',
      uptime: formatUptime(server.uptime) || '0일',
      ip: server.ip || '192.168.1.100',
      os: server.os || 'Ubuntu 22.04',
      alerts: getAlertsCount(server.alerts) || 0,
      lastUpdate: new Date(),
      services: Array.isArray(server.services) ? server.services : [],
    };
  } catch (error) {
    console.error(`⚠️ VirtualizedServerList: 서버[${index}] 데이터 매핑 오류:`, error);
    safeServerData = {
      id: serverId,
      name: serverName,
      status: 'offline' as const,
      cpu: Math.random() * 80 + 10,
      memory: Math.random() * 70 + 15,
      disk: Math.random() * 60 + 20,
      network: Math.random() * 100 + 50,
      location: server?.location || 'unknown',
      uptime: '0일',
      ip: server?.ip || '192.168.1.100',
      os: server?.os || 'Ubuntu 22.04',
      alerts: 0,
      lastUpdate: new Date(),
      services: Array.isArray(server?.services) ? server.services : [],
    };
  }

  const safeHandleClick = () => {
    try {
      if (typeof handleServerSelect === 'function') {
        handleServerSelect(server);
      } else {
        console.warn('⚠️ handleServerSelect가 함수가 아닙니다.');
      }
    } catch (error) {
      console.error('⚠️ 서버 선택 중 오류 발생:', error);
    }
  };

  return (
    <div style={{ ...style, padding: '0 16px' }}>
      <ServerCardErrorBoundary key={`boundary-${serverId}`} serverId={serverId}>
        <SafeServerCard
          key={serverId}
          server={safeServerData}
          variant="compact"
          showRealTimeUpdates={true}
          index={index}
          onClick={safeHandleClick}
        />
      </ServerCardErrorBoundary>
    </div>
  );
};

export default function VirtualizedServerList({
  servers,
  handleServerSelect,
}: VirtualizedServerListProps) {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth - 64 : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight - 300 : 800,
  });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth - 64, // 좌우 패딩 제외
        height: window.innerHeight - 300, // 헤더/푸터 제외
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 서버 카드 높이 (고정)
  const CARD_HEIGHT = 450;

  return (
    <div className="w-full">
      <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3">
        <div className="flex items-center gap-2">
          <div className="text-green-600">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-900">
              ⚡ 가상 스크롤 활성화 (15개 전체 보기)
            </p>
            <p className="text-xs text-green-700">
              보이는 영역만 렌더링하여 성능 최적화
            </p>
          </div>
        </div>
      </div>

      <List
        rowComponent={RowComponent}
        rowCount={servers.length}
        rowHeight={CARD_HEIGHT}
        rowProps={{
          servers,
          handleServerSelect,
        }}
        style={{
          height: dimensions.height,
          width: dimensions.width,
        }}
        className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
      />
    </div>
  );
}
