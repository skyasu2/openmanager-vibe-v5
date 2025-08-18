/**
 * 스토리지 및 백업 서버 명령어 설정
 * 파일 서버, NAS, 백업 시스템 명령어 정의
 */

import type { ServerCommands } from './types';
import { windowsCommonCommands, ubuntuCommonCommands } from './common-commands';

export const storageCommands: Record<string, ServerCommands> = {
  // 파일/스토리지 서버 - Windows Server
  'file-nas-01': {
    os: 'Windows Server 2019 Standard',
    service: 'SMB/CIFS File Server',
    commands: {
      basic: [
        ...windowsCommonCommands,
        {
          command: 'Get-SmbShare',
          description: 'SMB 공유 목록 확인',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'Get-SmbSession',
          description: 'SMB 세션 목록',
          category: 'network',
          riskLevel: 'safe',
        },
        {
          command: 'Get-SmbOpenFile',
          description: '열린 SMB 파일 목록',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'Get-DedupStatus',
          description: '중복 제거 상태 확인',
          category: 'disk',
          riskLevel: 'safe',
        },
      ],
      advanced: [
        {
          command: 'Start-DedupJob -Type Optimization -Volume D:',
          description: '중복 제거 최적화 시작',
          category: 'disk',
          riskLevel: 'moderate',
        },
        {
          command: 'Set-SmbServerConfiguration -EnableSMB1Protocol $false',
          description: 'SMBv1 프로토콜 비활성화',
          category: 'security',
          riskLevel: 'moderate',
        },
        {
          command: 'Get-StorageReliabilityCounter -Disk (Get-Disk)',
          description: '디스크 신뢰성 카운터',
          category: 'disk',
          riskLevel: 'safe',
        },
      ],
      troubleshooting: [
        {
          command: 'Test-NetConnection -ComputerName client -Port 445',
          description: 'SMB 포트 연결 테스트',
          category: 'network',
          riskLevel: 'safe',
        },
        {
          command: 'Get-SmbMultichannelConnection',
          description: 'SMB 멀티채널 연결 상태',
          category: 'network',
          riskLevel: 'safe',
        },
        {
          command: 'Repair-Volume -DriveLetter D -Scan',
          description: '볼륨 오류 스캔',
          category: 'disk',
          riskLevel: 'moderate',
        },
      ],
    },
  },

  // 백업 서버 - Debian + Bacula
  'backup-01': {
    os: 'Debian 11 (Bullseye)',
    service: 'Bacula 9.6.7',
    commands: {
      basic: [
        ...ubuntuCommonCommands,
        {
          command: 'bconsole -c /etc/bacula/bconsole.conf',
          description: 'Bacula 콘솔 접속',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'echo "status dir" | bconsole',
          description: 'Bacula Director 상태',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'echo "list jobs" | bconsole',
          description: '백업 작업 목록',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'echo "list volumes" | bconsole',
          description: '백업 볼륨 목록',
          category: 'disk',
          riskLevel: 'safe',
        },
      ],
      advanced: [
        {
          command: 'echo "run job=BackupJob yes" | bconsole',
          description: '백업 작업 수동 실행',
          category: 'system',
          riskLevel: 'moderate',
        },
        {
          command: 'echo "restore" | bconsole',
          description: '복원 작업 시작',
          category: 'system',
          riskLevel: 'dangerous',
        },
        {
          command: 'echo "prune volume=Vol001" | bconsole',
          description: '볼륨 정리',
          category: 'disk',
          riskLevel: 'moderate',
        },
      ],
      troubleshooting: [
        {
          command: 'tail -f /var/log/bacula/bacula.log',
          description: 'Bacula 로그 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'systemctl status bacula-dir bacula-sd bacula-fd',
          description: 'Bacula 서비스 상태',
          category: 'system',
          riskLevel: 'safe',
        },
        {
          command: 'echo "status storage" | bconsole',
          description: '스토리지 데몬 상태',
          category: 'monitoring',
          riskLevel: 'safe',
        },
        {
          command: 'df -h /backup',
          description: '백업 디렉토리 용량 확인',
          category: 'disk',
          riskLevel: 'safe',
        },
      ],
    },
  },
};
