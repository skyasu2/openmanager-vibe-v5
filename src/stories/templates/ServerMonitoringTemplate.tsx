/**
 * 🖥️ OpenManager VIBE v5 서버 모니터링 전용 스토리 템플릿
 * 실시간 서버 메트릭, 상태 표시, 알림 시스템에 최적화
 */

import React from 'react';
import type { Decorator } from '@storybook/react';

// 🖥️ 서버 타입 정의
export type ServerType = 'web' | 'db' | 'cache' | 'api' | 'backup';
export type ServerStatus = 'online' | 'warning' | 'critical' | 'offline' | 'maintenance';

// 📊 서버 메트릭 타입
export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  temperature?: number;
  processes?: number;
  connections?: number;
}

// 🏢 서버 정보 타입
export interface ServerInfo {
  id: string;
  name: string;
  type: ServerType;
  status: ServerStatus;
  location: string;
  os: string;
  ip: string;
  uptime: string;
  lastUpdate: Date;
  metrics: ServerMetrics;
  alerts: Alert[];
}

// 🚨 알림 타입
export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

// 🌍 데이터센터별 서버 목업
export const MOCK_SERVERS: Record<string, ServerInfo> = {
  'web-01': {
    id: 'web-01',
    name: '웹 서버 01',
    type: 'web',
    status: 'online',
    location: 'Seoul DC1',
    os: 'Ubuntu 22.04 LTS',
    ip: '192.168.1.100',
    uptime: '15d 4h 23m',
    lastUpdate: new Date(),
    metrics: {
      cpu: 45,
      memory: 67,
      disk: 23,
      network: 89,
      temperature: 42,
      processes: 127,
      connections: 342,
    },
    alerts: [],
  },
  'db-01': {
    id: 'db-01',
    name: 'DB 서버 01',
    type: 'db',
    status: 'warning',
    location: 'Seoul DC1',
    os: 'Ubuntu 22.04 LTS',
    ip: '192.168.1.101',
    uptime: '8d 12h 45m',
    lastUpdate: new Date(),
    metrics: {
      cpu: 78,
      memory: 85,
      disk: 67,
      network: 156,
      temperature: 58,
      processes: 89,
      connections: 1245,
    },
    alerts: [
      {
        id: 'alert-1',
        severity: 'warning',
        title: '높은 메모리 사용률',
        message: '메모리 사용률이 85%를 초과했습니다.',
        timestamp: new Date(),
        acknowledged: false,
      },
    ],
  },
  'cache-01': {
    id: 'cache-01',
    name: '캐시 서버 01',
    type: 'cache',
    status: 'online',
    location: 'Seoul DC2',
    os: 'Redis OS',
    ip: '192.168.2.100',
    uptime: '45d 18h 32m',
    lastUpdate: new Date(),
    metrics: {
      cpu: 12,
      memory: 45,
      disk: 8,
      network: 234,
      temperature: 35,
      processes: 12,
      connections: 5678,
    },
    alerts: [],
  },
};

// 📈 실시간 메트릭 생성기
export class MetricsGenerator {
  private baseMetrics: ServerMetrics;

  constructor(baseMetrics: ServerMetrics) {
    this.baseMetrics = { ...baseMetrics };
  }

  generate(): ServerMetrics {
    return {
      cpu: this.fluctuate(this.baseMetrics.cpu, 10),
      memory: this.fluctuate(this.baseMetrics.memory, 5),
      disk: this.fluctuate(this.baseMetrics.disk, 2),
      network: this.fluctuate(this.baseMetrics.network, 50),
      temperature: this.baseMetrics.temperature 
        ? this.fluctuate(this.baseMetrics.temperature, 5)
        : undefined,
      processes: this.baseMetrics.processes
        ? Math.floor(this.fluctuate(this.baseMetrics.processes, 20))
        : undefined,
      connections: this.baseMetrics.connections
        ? Math.floor(this.fluctuate(this.baseMetrics.connections, 100))
        : undefined,
    };
  }

  private fluctuate(value: number, range: number): number {
    const change = (Math.random() - 0.5) * range;
    return Math.max(0, Math.min(100, value + change));
  }
}

// 🎨 서버 상태별 스타일
export const SERVER_STATUS_STYLES = {
  online: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
    textColor: '#065F46',
    pulseColor: '#10B981',
  },
  warning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    textColor: '#92400E',
    pulseColor: '#F59E0B',
  },
  critical: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
    textColor: '#991B1B',
    pulseColor: '#EF4444',
  },
  offline: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
    textColor: '#4B5563',
    pulseColor: '#9CA3AF',
  },
  maintenance: {
    backgroundColor: '#E0E7FF',
    borderColor: '#6366F1',
    textColor: '#312E81',
    pulseColor: '#6366F1',
  },
};

// 🔄 실시간 서버 상태 훅
export const useServerMonitoring = (serverId: string) => {
  const [server, setServer] = React.useState<ServerInfo>(
    MOCK_SERVERS[serverId] || MOCK_SERVERS['web-01']
  );
  const [isConnected, setIsConnected] = React.useState(true);
  const metricsGenerator = React.useRef(
    new MetricsGenerator(server.metrics)
  );

  React.useEffect(() => {
    const updateInterval = setInterval(() => {
      setServer(prev => ({
        ...prev,
        metrics: metricsGenerator.current.generate(),
        lastUpdate: new Date(),
      }));
    }, 2000);

    // 연결 상태 시뮬레이션
    const connectionInterval = setInterval(() => {
      setIsConnected(Math.random() > 0.1); // 10% 확률로 연결 끊김
    }, 10000);

    return () => {
      clearInterval(updateInterval);
      clearInterval(connectionInterval);
    };
  }, [serverId]);

  return { server, isConnected };
};

// 🎭 서버 모니터링 데코레이터
export const withServerMonitoring: Decorator = (Story, context) => {
  const [selectedServer, setSelectedServer] = React.useState('web-01');
  const [theme, setTheme] = React.useState(context.globals.theme || 'light');

  return (
    <div className={`server-monitoring-wrapper theme-${theme}`}>
      <div className="server-selector mb-4">
        <select
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
          className="px-3 py-1 border rounded"
        >
          {Object.entries(MOCK_SERVERS).map(([id, server]) => (
            <option key={id} value={id}>
              {server.name} ({server.status})
            </option>
          ))}
        </select>
      </div>
      <Story {...context} serverId={selectedServer} />
    </div>
  );
};

// 📊 차트 데이터 생성기
export const generateChartData = (
  metric: keyof ServerMetrics,
  points: number = 20
) => {
  const now = Date.now();
  const data = [];
  const baseValue = MOCK_SERVERS['web-01'].metrics[metric] as number || 50;

  for (let i = points - 1; i >= 0; i--) {
    data.push({
      timestamp: new Date(now - i * 5000), // 5초 간격
      value: Math.max(
        0,
        Math.min(
          100,
          baseValue + (Math.random() - 0.5) * 20
        )
      ),
    });
  }

  return data;
};

// 🚨 알림 생성기
export const generateAlert = (
  serverId: string,
  severity: Alert['severity'] = 'warning'
): Alert => {
  const messages = {
    info: ['정기 백업이 완료되었습니다.', '시스템 업데이트가 가능합니다.'],
    warning: ['CPU 사용률이 높습니다.', '디스크 공간이 부족합니다.'],
    error: ['데이터베이스 연결 실패', '백업 프로세스 오류'],
    critical: ['서버 응답 없음', '메모리 부족으로 인한 서비스 중단'],
  };

  const severityMessages = messages[severity];
  const message = severityMessages[Math.floor(Math.random() * severityMessages.length)];

  return {
    id: `alert-${Date.now()}`,
    severity,
    title: `${MOCK_SERVERS[serverId]?.name || '알 수 없는 서버'} ${severity.toUpperCase()}`,
    message,
    timestamp: new Date(),
    acknowledged: false,
  };
};

// 📍 지역별 서버 분포
export const SERVER_LOCATIONS = {
  'Seoul DC1': { lat: 37.5665, lng: 126.9780, servers: 12 },
  'Seoul DC2': { lat: 37.5326, lng: 126.9889, servers: 8 },
  'Busan DC': { lat: 35.1796, lng: 129.0756, servers: 4 },
  'Singapore DC': { lat: 1.3521, lng: 103.8198, servers: 6 },
};

// 💡 서버 모니터링 헬퍼
export const serverMonitoringHelpers = {
  // 상태별 아이콘 가져오기
  getStatusIcon: (status: ServerStatus) => {
    const icons = {
      online: '🟢',
      warning: '🟡',
      critical: '🔴',
      offline: '⚫',
      maintenance: '🔧',
    };
    return icons[status] || '❓';
  },

  // 메트릭 레벨 평가
  evaluateMetric: (value: number, type: keyof ServerMetrics) => {
    const thresholds = {
      cpu: { good: 50, warning: 75, critical: 90 },
      memory: { good: 60, warning: 80, critical: 90 },
      disk: { good: 70, warning: 85, critical: 95 },
      network: { good: 100, warning: 200, critical: 300 },
      temperature: { good: 45, warning: 60, critical: 75 },
    };

    const threshold = thresholds[type] || thresholds.cpu;

    if (value < threshold.good) return 'good';
    if (value < threshold.warning) return 'warning';
    if (value < threshold.critical) return 'critical';
    return 'danger';
  },

  // 업타임 포맷팅
  formatUptime: (uptime: string) => {
    return uptime.replace(/(\d+)d/, '$1일')
                 .replace(/(\d+)h/, '$1시간')
                 .replace(/(\d+)m/, '$1분');
  },

  // 알림 요약
  summarizeAlerts: (alerts: Alert[]) => {
    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      error: alerts.filter(a => a.severity === 'error').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      unacknowledged: alerts.filter(a => !a.acknowledged).length,
    };
    return summary;
  },
};

export default {
  MOCK_SERVERS,
  MetricsGenerator,
  SERVER_STATUS_STYLES,
  useServerMonitoring,
  withServerMonitoring,
  generateChartData,
  generateAlert,
  SERVER_LOCATIONS,
  serverMonitoringHelpers,
};