/**
 * 서버 명령어 설정 통합 모듈
 * 모든 서버 타입별 명령어를 통합 관리
 */

// 타입 export
export type { OSCommand, ServerCommands } from './types';

// 공통 명령어 export
export {
  ubuntuCommonCommands,
  rhelCommonCommands,
  windowsCommonCommands,
} from './common-commands';

// 서버별 명령어 import
import { webServerCommands } from './web-server-commands';
import { appServerCommands } from './app-server-commands';
import { databaseCommands } from './database-commands';
import { storageCommands } from './storage-commands';

// 위험 패턴 export
export {
  dangerousCommandPatterns,
  dangerousKeywords,
  moderateKeywords,
  checkCommandRisk,
  validateCommand,
} from './dangerous-patterns';

// 유틸리티 함수 export
export {
  recommendCommands,
  translateCommand,
  searchCommands,
  detectOSType,
  parseCommandOutput,
  createTimeoutCommand,
  createCommandChain,
  createCommandPipeline,
  summarizeCommandResult,
} from './command-utils';

/**
 * 통합 서버 명령어 맵
 * 기존 serverCommandsMap과 호환성 유지
 */
export const serverCommandsMap = {
  ...webServerCommands,
  ...appServerCommands,
  ...databaseCommands,
  ...storageCommands,
};

/**
 * 서버 ID로 명령어 가져오기
 */
export function getServerCommands(serverId: string) {
  return serverCommandsMap[serverId] || null;
}

/**
 * 서버 타입별로 명령어 가져오기
 */
export function getCommandsByServerType(
  serverType: 'web' | 'app' | 'database' | 'storage'
) {
  switch (serverType) {
    case 'web':
      return webServerCommands;
    case 'app':
      return appServerCommands;
    case 'database':
      return databaseCommands;
    case 'storage':
      return storageCommands;
    default:
      return {};
  }
}

/**
 * 모든 서버 ID 목록
 */
export function getAllServerIds(): string[] {
  return Object.keys(serverCommandsMap);
}

/**
 * 서버 타입 감지
 */
export function detectServerType(
  serverId: string
): 'web' | 'app' | 'database' | 'storage' | 'unknown' {
  if (serverId.startsWith('web-')) return 'web';
  if (serverId.startsWith('app-')) return 'app';
  if (serverId.startsWith('db-')) return 'database';
  if (serverId.startsWith('file-') || serverId.startsWith('backup-'))
    return 'storage';
  return 'unknown';
}

/**
 * 서버 정보 가져오기
 */
export function getServerInfo(serverId: string) {
  const commands = getServerCommands(serverId);
  if (!commands) return null;

  return {
    id: serverId,
    type: detectServerType(serverId),
    os: commands.os,
    service: commands.service,
    commandCount: {
      basic: commands.commands.basic.length,
      advanced: commands.commands.advanced.length,
      troubleshooting: commands.commands.troubleshooting.length,
      total:
        commands.commands.basic.length +
        commands.commands.advanced.length +
        commands.commands.troubleshooting.length,
    },
  };
}

/**
 * 서버 통계 정보
 */
export function getServerStatistics() {
  const serverIds = getAllServerIds();
  const stats = {
    totalServers: serverIds.length,
    byType: {
      web: 0,
      app: 0,
      database: 0,
      storage: 0,
      unknown: 0,
    },
    byOS: {} as Record<string, number>,
    totalCommands: 0,
  };

  serverIds.forEach((serverId) => {
    const info = getServerInfo(serverId);
    if (info) {
      // 타입별 통계
      stats.byType[info.type]++;

      // OS별 통계
      const osType = info.os?.split(' ')[0]; // 첫 단어만 추출
      if (osType) {
        stats.byOS[osType] = (stats.byOS[osType] || 0) + 1;
      }

      // 전체 명령어 수
      stats.totalCommands += info.commandCount.total;
    }
  });

  return stats;
}

// 기존 코드와의 호환성을 위한 default export
export default serverCommandsMap;
