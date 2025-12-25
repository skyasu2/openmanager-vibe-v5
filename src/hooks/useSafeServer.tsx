import {
  AlertCircle,
  Archive,
  CheckCircle2,
  Database,
  Globe,
  HardDrive,
  Server,
} from 'lucide-react';
import { useMemo } from 'react';
import { getServerStatusTheme } from '../styles/design-constants';
import type { Server as ServerType } from '../types/server';

/**
 * 🛠️ View Model Hook for Server Objects
 *
 * 서버 객체를 UI 렌더링에 적합한 형태로 변환합니다.
 * 복잡한 방어 로직 대신 표준적인 Optional Chaining과 기본값을 사용합니다.
 */
export const useSafeServer = (server: ServerType | undefined | null) => {
  // 기본 데이터 매핑
  const safeServer = useMemo(
    () => ({
      id: server?.id || 'unknown',
      name: server?.name || 'Unknown Server',
      status: server?.status || 'unknown',
      type: (server?.type || server?.role || 'worker') as ServerType['role'],
      location: server?.location || 'Unknown Location',
      os: server?.os || 'Linux',
      ip: server?.ip || '-',
      uptime: server?.uptime || 0,
      cpu: server?.cpu ?? 0,
      memory: server?.memory ?? 0,
      disk: server?.disk ?? 0,
      network: server?.network ?? 0,
      alerts: server?.alerts || 0,
      services: Array.isArray(server?.services) ? server.services : [],
      lastUpdate: server?.lastUpdate || new Date(),
    }),
    [server]
  );

  // 상태별 테마 생성
  const statusTheme = useMemo(() => {
    const theme = getServerStatusTheme(safeServer.status);
    return {
      cardBg: theme.background,
      cardBorder: theme.border,
      cardStyle: { backgroundColor: 'transparent', color: 'inherit' },
      hoverStyle: {
        boxShadow:
          safeServer.status === 'online'
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.125)'
            : safeServer.status === 'warning'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(245, 158, 11, 0.125)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(239, 68, 68, 0.125)',
      },
      statusColor: theme.statusColor,
      statusIcon:
        safeServer.status === 'online' ? (
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        ) : (
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
        ),
      statusText:
        safeServer.status === 'online'
          ? '정상'
          : safeServer.status === 'warning'
            ? '경고'
            : '심각',
      pulse: { backgroundColor: theme.accentColor },
      accent: { color: theme.accentColor },
    };
  }, [safeServer.status]);

  // 서버 타입 아이콘
  const serverIcon = useMemo(() => {
    switch (safeServer.type) {
      case 'web':
        return <Globe className="h-5 w-5" aria-hidden="true" />;
      case 'database':
        return <Database className="h-5 w-5" aria-hidden="true" />;
      case 'storage':
        return <HardDrive className="h-5 w-5" aria-hidden="true" />;
      case 'backup':
        return <Archive className="h-5 w-5" aria-hidden="true" />;
      default:
        return <Server className="h-5 w-5" aria-hidden="true" />;
    }
  }, [safeServer.type]);

  // 서버 타입 라벨 (한글)
  const serverTypeLabel = useMemo(() => {
    const typeLabels: Record<string, string> = {
      web: '웹서버',
      app: 'API/WAS',
      database: '데이터베이스',
      cache: '캐시',
      storage: '스토리지',
      loadbalancer: '로드밸런서',
      backup: '백업',
      monitoring: '모니터링',
      security: '보안',
      queue: '큐',
      log: '로그',
      api: 'API',
    };
    const serverType = safeServer.type || 'worker';
    return typeLabels[serverType] || '서버';
  }, [safeServer.type]);

  // OS 아이콘
  const osIcon = useMemo(() => {
    const os = (safeServer.os || '').toLowerCase();
    if (os.includes('ubuntu') || os.includes('debian')) {
      return '🐧';
    } else if (
      os.includes('rocky') ||
      os.includes('centos') ||
      os.includes('red hat') ||
      os.includes('rhel')
    ) {
      return '🎩';
    } else if (os.includes('oracle')) {
      return '🔶';
    } else if (os.includes('windows')) {
      return '🪟';
    } else if (os.includes('linux')) {
      return '🐧';
    }
    return '💻';
  }, [safeServer.os]);

  // OS 짧은 이름 (UI 표시용)
  const osShortName = useMemo(() => {
    const os = safeServer.os || '';
    // 버전 번호 제거하고 핵심 이름만 추출
    if (os.toLowerCase().includes('ubuntu')) return 'Ubuntu';
    if (os.toLowerCase().includes('rocky')) return 'Rocky';
    if (os.toLowerCase().includes('oracle')) return 'Oracle';
    if (os.toLowerCase().includes('debian')) return 'Debian';
    if (os.toLowerCase().includes('centos')) return 'CentOS';
    if (os.toLowerCase().includes('red hat')) return 'RHEL';
    if (os.toLowerCase().includes('windows')) return 'Windows';
    return os.split(' ')[0] || 'Linux';
  }, [safeServer.os]);

  return {
    safeServer,
    statusTheme,
    serverIcon,
    serverTypeLabel,
    osIcon,
    osShortName,
  };
};
