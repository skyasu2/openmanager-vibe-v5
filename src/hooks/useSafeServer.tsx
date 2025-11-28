import { useMemo } from 'react';
import { Server as ServerType } from '../types/server';
import { getServerStatusTheme } from '../styles/design-constants';
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  Database,
  HardDrive,
  Archive,
  Server,
} from 'lucide-react';

/**
 * 🛡️ 5-Layer Defense System for Server Objects
 *
 * Layer 1: Object Verification (Null/Undefined check)
 * Layer 2: Property Safety (Default values)
 * Layer 3: Visual Safety (Theme fallback)
 * Layer 4: Resource Safety (Icon fallback)
 * Layer 5: Interaction Safety (Safe handlers - handled by consumer or wrapper)
 */
export const useSafeServer = (server: ServerType | undefined | null) => {
  // Layer 1 & 2: Object Verification & Property Safety
  const safeServer = useMemo(
    () => ({
      id: server?.id || 'unknown',
      name: server?.name || '알 수 없는 서버',
      status: server?.status || 'unknown',
      type: (server?.type || server?.role || 'worker') as ServerType['role'],
      location: server?.location || '서울',
      os: server?.os || 'Ubuntu 22.04',
      ip: server?.ip || '192.168.1.1',
      uptime: server?.uptime || 0,
      cpu: typeof server?.cpu === 'number' ? server.cpu : 50,
      memory: typeof server?.memory === 'number' ? server.memory : 50,
      disk: typeof server?.disk === 'number' ? server.disk : 30,
      network: typeof server?.network === 'number' ? server.network : 25,
      alerts: server?.alerts || 0,
      services: Array.isArray(server?.services) ? server.services : [],
      lastUpdate: server?.lastUpdate || new Date(),
    }),
    [server]
  );

  // Layer 3: Visual Safety (Theme Generation)
  const statusTheme = useMemo(() => {
    try {
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
    } catch (error) {
      console.error('⚠️ statusTheme 생성 실패, 기본 테마 사용', error);
      return {
        cardBg: 'bg-gray-50',
        cardBorder: 'border-gray-200',
        cardStyle: { backgroundColor: 'transparent', color: 'inherit' },
        hoverStyle: { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
        statusColor: { backgroundColor: '#f3f4f6', color: '#374151' },
        statusIcon: <AlertCircle className="h-4 w-4" aria-hidden="true" />,
        statusText: '오류',
        pulse: { backgroundColor: '#6b7280' },
        accent: { color: '#6b7280' },
      };
    }
  }, [safeServer.status]);

  // Layer 4: Resource Safety (Icon Generation)
  const serverIcon = useMemo(() => {
    try {
      switch (safeServer.type) {
        case 'web':
          return <Globe className="h-5 w-5" aria-hidden="true" />;
        case 'database':
          return <Database className="h-5 w-5" aria-hidden="true" />;
        case 'storage':
          return <HardDrive className="h-5 w-5" aria-hidden="true" />;
        case 'backup':
          return <Archive className="h-5 w-5" aria-hidden="true" />;
        case 'app':
        default:
          return <Server className="h-5 w-5" aria-hidden="true" />;
      }
    } catch (error) {
      console.error('⚠️ serverIcon 생성 실패, 기본 아이콘 사용', error);
      return <Server className="h-5 w-5" aria-hidden="true" />;
    }
  }, [safeServer.type]);

  const osIcon = useMemo(() => {
    try {
      const os = (safeServer.os || '').toLowerCase();
      if (
        os.includes('ubuntu') ||
        os.includes('debian') ||
        os.includes('linux')
      ) {
        return '🐧';
      } else if (
        os.includes('centos') ||
        os.includes('red hat') ||
        os.includes('rhel')
      ) {
        return '🎩';
      } else if (os.includes('windows')) {
        return '🪟';
      }
      return null;
    } catch (error) {
      console.error('⚠️ osIcon 생성 실패', error);
      return null;
    }
  }, [safeServer.os]);

  return {
    safeServer,
    statusTheme,
    serverIcon,
    osIcon,
  };
};
