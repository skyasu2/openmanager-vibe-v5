/**
 * OS별 공통 명령어 정의
 */

import type { OSCommand } from './types';

// Ubuntu/Debian 계열 공통 명령어
export const ubuntuCommonCommands: OSCommand[] = [
  // 모니터링 명령어
  {
    command: 'top',
    description: '실시간 프로세스 및 시스템 리소스 모니터링',
    category: 'monitoring',
    riskLevel: 'safe',
    usage: 'top [-b] [-n count]',
    example: 'top -b -n 1',
    alternatives: ['htop', 'atop', 'glances'],
  },
  {
    command: 'htop',
    description: '향상된 대화형 프로세스 뷰어',
    category: 'monitoring',
    riskLevel: 'safe',
    usage: 'htop [옵션]',
    alternatives: ['top', 'atop'],
  },
  {
    command: 'df -h',
    description: '디스크 사용량 확인 (사람이 읽기 쉬운 형식)',
    category: 'disk',
    riskLevel: 'safe',
    example: 'df -h | grep -v tmpfs',
  },
  {
    command: 'free -m',
    description: '메모리 사용량 확인 (MB 단위)',
    category: 'monitoring',
    riskLevel: 'safe',
    alternatives: ['free -h', 'vmstat', 'cat /proc/meminfo'],
  },
  {
    command: 'iostat -x 1',
    description: '디스크 I/O 통계 실시간 모니터링',
    category: 'disk',
    riskLevel: 'safe',
    usage: 'iostat -x [interval] [count]',
  },
  {
    command: 'netstat -tuln',
    description: '열린 네트워크 포트 확인',
    category: 'network',
    riskLevel: 'safe',
    alternatives: ['ss -tuln', 'lsof -i'],
  },
  {
    command: 'ps aux | grep',
    description: '특정 프로세스 찾기',
    category: 'process',
    riskLevel: 'safe',
    example: 'ps aux | grep nginx',
  },
  {
    command: 'systemctl status',
    description: '서비스 상태 확인',
    category: 'system',
    riskLevel: 'safe',
    example: 'systemctl status nginx',
  },
  {
    command: 'journalctl -xe',
    description: '시스템 로그 확인 (최근 에러 중심)',
    category: 'system',
    riskLevel: 'safe',
    alternatives: ['journalctl -f', 'tail -f /var/log/syslog'],
  },
  {
    command: 'uptime',
    description: '시스템 가동 시간 및 부하 확인',
    category: 'monitoring',
    riskLevel: 'safe',
  },
  {
    command: 'dmesg | tail',
    description: '커널 링 버퍼 메시지 확인',
    category: 'system',
    riskLevel: 'safe',
  },
  {
    command: 'lsof -i :port',
    description: '특정 포트를 사용하는 프로세스 확인',
    category: 'network',
    riskLevel: 'safe',
    example: 'lsof -i :80',
  },
  {
    command: 'du -sh *',
    description: '현재 디렉토리 파일/폴더 크기 확인',
    category: 'disk',
    riskLevel: 'safe',
  },
  {
    command: 'tail -f',
    description: '로그 파일 실시간 모니터링',
    category: 'monitoring',
    riskLevel: 'safe',
    example: 'tail -f /var/log/nginx/access.log',
  },
  {
    command: 'sar',
    description: '시스템 활동 리포트',
    category: 'monitoring',
    riskLevel: 'safe',
    usage: 'sar -u 1 10',
  },
  {
    command: 'vmstat',
    description: '가상 메모리 통계',
    category: 'monitoring',
    riskLevel: 'safe',
    usage: 'vmstat 1',
  },
  {
    command: 'nmap',
    description: '네트워크 포트 스캔',
    category: 'network',
    riskLevel: 'moderate',
    example: 'nmap -p 80,443 localhost',
  },
  {
    command: 'tcpdump',
    description: '네트워크 패킷 캡처',
    category: 'network',
    riskLevel: 'moderate',
    usage: 'tcpdump -i eth0 port 80',
  },
  {
    command: 'iftop',
    description: '네트워크 대역폭 사용량 모니터링',
    category: 'network',
    riskLevel: 'safe',
    alternatives: ['nethogs', 'bmon'],
  },
  {
    command: 'ss -s',
    description: '소켓 통계 요약',
    category: 'network',
    riskLevel: 'safe',
  },
];

// CentOS/RHEL 계열 공통 명령어
export const rhelCommonCommands: OSCommand[] = [
  ...ubuntuCommonCommands, // 대부분 공통
  {
    command: 'yum check-update',
    description: '업데이트 가능한 패키지 확인',
    category: 'system',
    riskLevel: 'safe',
    alternatives: ['dnf check-update'],
  },
  {
    command: 'systemctl list-units --failed',
    description: '실패한 서비스 목록 확인',
    category: 'system',
    riskLevel: 'safe',
  },
  {
    command: 'firewall-cmd --list-all',
    description: '방화벽 규칙 확인',
    category: 'security',
    riskLevel: 'safe',
  },
  {
    command: 'semanage port -l',
    description: 'SELinux 포트 컨텍스트 확인',
    category: 'security',
    riskLevel: 'safe',
  },
  {
    command: 'getenforce',
    description: 'SELinux 상태 확인',
    category: 'security',
    riskLevel: 'safe',
  },
];

// Windows Server 공통 명령어
export const windowsCommonCommands: OSCommand[] = [
  {
    command: 'Get-Process',
    description: '실행 중인 프로세스 목록',
    category: 'process',
    riskLevel: 'safe',
    usage: 'Get-Process | Sort-Object CPU -Descending',
  },
  {
    command: 'Get-Service',
    description: '서비스 상태 확인',
    category: 'system',
    riskLevel: 'safe',
    example: 'Get-Service | Where-Object {$_.Status -eq "Running"}',
  },
  {
    command: 'Get-EventLog',
    description: '이벤트 로그 확인',
    category: 'system',
    riskLevel: 'safe',
    example: 'Get-EventLog -LogName System -Newest 100',
  },
  {
    command: 'Get-Counter',
    description: '성능 카운터 확인',
    category: 'monitoring',
    riskLevel: 'safe',
    example: 'Get-Counter "\\Processor(_Total)\\% Processor Time"',
  },
  {
    command: 'Get-WmiObject Win32_LogicalDisk',
    description: '디스크 사용량 확인',
    category: 'disk',
    riskLevel: 'safe',
  },
  {
    command: 'netstat -an',
    description: '네트워크 연결 상태',
    category: 'network',
    riskLevel: 'safe',
  },
  {
    command: 'Get-NetAdapter',
    description: '네트워크 어댑터 정보',
    category: 'network',
    riskLevel: 'safe',
  },
  {
    command: 'Get-NetTCPConnection',
    description: 'TCP 연결 상태',
    category: 'network',
    riskLevel: 'safe',
  },
  {
    command: 'Test-NetConnection',
    description: '네트워크 연결 테스트',
    category: 'network',
    riskLevel: 'safe',
    example: 'Test-NetConnection -ComputerName google.com -Port 443',
  },
  {
    command: 'Get-WindowsFeature',
    description: 'Windows 기능 목록',
    category: 'system',
    riskLevel: 'safe',
  },
  {
    command: 'Get-ScheduledTask',
    description: '예약된 작업 목록',
    category: 'system',
    riskLevel: 'safe',
  },
  {
    command: 'Get-HotFix',
    description: '설치된 업데이트 확인',
    category: 'system',
    riskLevel: 'safe',
  },
  {
    command: 'Get-CimInstance Win32_OperatingSystem',
    description: 'OS 정보 확인',
    category: 'system',
    riskLevel: 'safe',
  },
  {
    command: 'Get-PhysicalMemory',
    description: '물리 메모리 정보',
    category: 'monitoring',
    riskLevel: 'safe',
  },
  {
    command: 'Get-VM',
    description: 'Hyper-V VM 목록',
    category: 'system',
    riskLevel: 'safe',
  },
  {
    command: 'Get-NetFirewallRule',
    description: '방화벽 규칙 확인',
    category: 'security',
    riskLevel: 'safe',
  },
  {
    command: 'Get-IISAppPool',
    description: 'IIS 애플리케이션 풀 상태',
    category: 'system',
    riskLevel: 'safe',
  },
  {
    command: 'Get-Website',
    description: 'IIS 웹사이트 상태',
    category: 'system',
    riskLevel: 'safe',
  },
];
