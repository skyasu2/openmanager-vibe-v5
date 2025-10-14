'use client';

/**
 * 🚀 가상 스크롤 서버 리스트 (15개 전체 보기 전용)
 * react-window v2.2.1 Grid 기반 가로 스크롤 구현
 * 브라우저 너비에 맞게 한 줄로 표시, 가로 스크롤로 추가 서버 확인
 */

import { Grid } from 'react-window';
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

// react-window Grid가 자동 제공하는 props (cellProps로 전달하면 안됨)
// ariaAttributes는 forbidden key이므로 포함하지 않음
interface AutoProvidedCellProps {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
}

// 사용자가 cellProps로 전달하는 props (자동 제공 props 제외)
interface CustomCellProps {
  servers: Server[];
  handleServerSelect: (server: Server) => void;
}

// 최종 Cell 컴포넌트가 받는 props (자동 + 사용자)
type CellComponentProps = AutoProvidedCellProps & CustomCellProps;

// Cell 컴포넌트 정의 (react-window v2.2.1 Grid cellComponent 형식)
const CellComponent = ({
  columnIndex,
  rowIndex,
  style,
  servers,
  handleServerSelect,
}: CellComponentProps) => {
  const server = servers[columnIndex];

  if (!server) {
    console.error(`⚠️ VirtualizedServerList: 서버[${columnIndex}]가 null 또는 undefined입니다.`);
    return null;
  }

  const serverId = server.id || `server-${columnIndex}`;
  const serverName = server.name || `서버-${columnIndex + 1}`;

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
    console.error(`⚠️ VirtualizedServerList: 서버[${columnIndex}] 데이터 매핑 오류:`, error);
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
    <div style={{ ...style, padding: '16px 8px' }}>
      <ServerCardErrorBoundary key={`boundary-${serverId}`} serverId={serverId}>
        <SafeServerCard
          key={serverId}
          server={safeServerData}
          variant="compact"
          showRealTimeUpdates={true}
          index={columnIndex}
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
        width: window.innerWidth - 64, // 뷰포트 너비 (좌우 패딩 제외)
        height: window.innerHeight - 300, // 뷰포트 높이 (헤더/푸터 제외)
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // 서버 카드 크기 (고정)
  const CARD_WIDTH = 380; // 카드 가로 폭
  const CARD_HEIGHT = 500; // 카드 세로 높이

  return (
    <div className="w-full">
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-center gap-2">
          <div className="text-blue-600">
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
            <p className="text-sm font-medium text-blue-900">
              ⚡ 가로 스크롤 활성화 (15개 전체 보기)
            </p>
            <p className="text-xs text-blue-700">
              한 줄로 표시, 가로 스크롤로 추가 서버 확인
            </p>
          </div>
        </div>
      </div>

      <Grid<CustomCellProps>
        cellComponent={CellComponent}
        cellProps={{
          servers,
          handleServerSelect,
        }}
        columnCount={servers.length}
        columnWidth={CARD_WIDTH}
        defaultHeight={CARD_HEIGHT + 32}
        defaultWidth={dimensions.width}
        rowCount={1}
        rowHeight={CARD_HEIGHT + 32}
        className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200"
      />
    </div>
  );
}
