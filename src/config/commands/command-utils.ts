/**
 * 명령어 유틸리티 함수
 * 명령어 추천, 변환, 검색 등의 헬퍼 함수
 */

import type { OSCommand, ServerCommands } from './types';
import { checkCommandRisk } from './dangerous-patterns';

/**
 * 시나리오별 명령어 추천
 */
export function recommendCommands(
  serverCommands: ServerCommands,
  scenario: string,
  category?: string
): OSCommand[] {
  if (!serverCommands) return [];

  let commands: OSCommand[] = [];

  // 시나리오별 명령어 선택
  switch (scenario) {
    case 'cpu_high':
      commands = [
        ...serverCommands.commands.basic.filter(
          (cmd) => cmd.category === 'monitoring' || cmd.category === 'process'
        ),
        ...serverCommands.commands.troubleshooting.filter(
          (cmd) => cmd.category === 'process'
        ),
      ];
      break;

    case 'memory_leak':
      commands = serverCommands.commands.basic.filter(
        (cmd) =>
          cmd.command.includes('memory') ||
          cmd.command.includes('free') ||
          cmd.command.includes('ps') ||
          cmd.command.includes('jmap') // Java 메모리
      );
      break;

    case 'disk_full':
      commands = [
        ...serverCommands.commands.basic.filter(
          (cmd) => cmd.category === 'disk'
        ),
        ...serverCommands.commands.troubleshooting.filter(
          (cmd) => cmd.category === 'disk'
        ),
      ];
      break;

    case 'service_down':
      commands = [
        ...serverCommands.commands.basic.filter(
          (cmd) => cmd.category === 'system'
        ),
        ...serverCommands.commands.advanced.filter(
          (cmd) =>
            cmd.command.includes('start') || cmd.command.includes('restart')
        ),
      ];
      break;

    case 'network_issue':
      commands = [
        ...serverCommands.commands.basic.filter(
          (cmd) => cmd.category === 'network'
        ),
        ...serverCommands.commands.troubleshooting.filter(
          (cmd) => cmd.category === 'network'
        ),
      ];
      break;

    case 'security_check':
      commands = serverCommands.commands.basic.filter(
        (cmd) => cmd.category === 'security'
      );
      break;

    default:
      // 기본: 안전한 모니터링 명령어
      commands = serverCommands.commands.basic.filter(
        (cmd) =>
          cmd.riskLevel === 'safe' &&
          (category ? cmd.category === category : true)
      );
  }

  return commands;
}

/**
 * OS별 명령어 변환 (크로스 플랫폼 지원)
 */
export function translateCommand(
  command: string,
  fromOS: string,
  toOS: string
): string | null {
  const translations: Record<string, Record<string, string>> = {
    // Linux -> Windows
    'ps aux': {
      windows: 'Get-Process | Format-Table -AutoSize',
    },
    'df -h': {
      windows: 'Get-PSDrive -PSProvider FileSystem',
    },
    'free -m': {
      windows:
        'Get-WmiObject Win32_OperatingSystem | Select-Object TotalVisibleMemorySize,FreePhysicalMemory',
    },
    'netstat -tuln': {
      windows: 'netstat -an | findstr LISTENING',
    },
    'systemctl status': {
      windows: 'Get-Service | Where-Object {$_.Status -eq "Running"}',
    },
    'tail -f': {
      windows: 'Get-Content -Path [file] -Wait -Tail 10',
    },
    'ls -la': {
      windows: 'Get-ChildItem -Force',
    },
    grep: {
      windows: 'Select-String',
    },
    cat: {
      windows: 'Get-Content',
    },
    which: {
      windows: 'Get-Command',
    },

    // Windows -> Linux
    'Get-Process': {
      linux: 'ps aux',
    },
    'Get-Service': {
      linux: 'systemctl list-units --type=service',
    },
    'Get-EventLog': {
      linux: 'journalctl',
    },
    'Get-Content': {
      linux: 'cat',
    },
  };

  const isWindowsTarget = toOS.toLowerCase().includes('windows');
  const isLinuxTarget =
    toOS.toLowerCase().includes('linux') ||
    toOS.toLowerCase().includes('ubuntu') ||
    toOS.toLowerCase().includes('centos') ||
    toOS.toLowerCase().includes('rhel') ||
    toOS.toLowerCase().includes('debian');

  // Linux -> Windows
  if (isWindowsTarget && translations[command]) {
    return translations[command]['windows'] ?? null;
  }

  // Windows -> Linux
  if (isLinuxTarget) {
    // Windows PowerShell 명령어 검사
    for (const [winCmd, mapping] of Object.entries(translations)) {
      if (command.startsWith(winCmd) && mapping['linux']) {
        return mapping['linux'];
      }
    }
  }

  return null;
}

/**
 * 명령어 검색 및 필터링
 */
export function searchCommands(
  serverCommands: ServerCommands,
  searchTerm: string,
  options?: {
    category?: string;
    riskLevel?: 'safe' | 'moderate' | 'dangerous';
    includeAdvanced?: boolean;
  }
): OSCommand[] {
  const search = searchTerm.toLowerCase();
  let allCommands: OSCommand[] = [
    ...serverCommands.commands.basic,
    ...serverCommands.commands.troubleshooting,
  ];

  if (options?.includeAdvanced) {
    allCommands = [...allCommands, ...serverCommands.commands.advanced];
  }

  return allCommands.filter((cmd) => {
    // 검색어 매칭
    const matchesSearch =
      cmd.command.toLowerCase().includes(search) ||
      cmd.description.toLowerCase().includes(search);

    // 카테고리 필터
    const matchesCategory =
      !options?.category || cmd.category === options.category;

    // 위험도 필터
    const matchesRiskLevel =
      !options?.riskLevel || cmd.riskLevel === options.riskLevel;

    return matchesSearch && matchesCategory && matchesRiskLevel;
  });
}

/**
 * 서버 OS 타입 감지
 */
export function detectOSType(
  osString: string
): 'linux' | 'windows' | 'unknown' {
  const lower = osString.toLowerCase();

  if (
    lower.includes('ubuntu') ||
    lower.includes('centos') ||
    lower.includes('rhel') ||
    lower.includes('red hat') ||
    lower.includes('debian') ||
    lower.includes('linux')
  ) {
    return 'linux';
  }

  if (lower.includes('windows')) {
    return 'windows';
  }

  return 'unknown';
}

/**
 * 명령어 실행 결과 파싱
 */
export function parseCommandOutput(
  output: string,
  format: 'json' | 'table' | 'raw' = 'raw'
): unknown {
  switch (format) {
    case 'json': {
      try {
        return JSON.parse(output);
      } catch {
        return { error: 'Failed to parse JSON', raw: output };
      }
    }

    case 'table': {
      // 테이블 형식 파싱 (간단한 버전)
      const lines = output.split('\n').filter((line) => line.trim());
      if (lines.length < 2) return [];

      const headers = lines[0]?.split(/\s+/) ?? [];
      return lines.slice(1).map((line) => {
        const values = line.split(/\s+/);
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });
    }

    case 'raw':
    default:
      return output;
  }
}

/**
 * 명령어 실행 시간 초과 검사
 */
export function createTimeoutCommand(
  command: string,
  timeoutSeconds: number = 30
): string {
  const osType = detectOSType(process.platform);

  if (osType === 'linux') {
    return `timeout ${timeoutSeconds}s ${command}`;
  } else if (osType === 'windows') {
    // Windows PowerShell
    return `Start-Job -ScriptBlock { ${command} } | Wait-Job -Timeout ${timeoutSeconds}`;
  }

  return command;
}

/**
 * 명령어 체인 생성
 */
export function createCommandChain(
  commands: string[],
  operator: '&&' | '||' | ';' = '&&'
): string {
  return commands.join(` ${operator} `);
}

/**
 * 명령어 파이프라인 생성
 */
export function createCommandPipeline(commands: string[]): string {
  return commands.join(' | ');
}

/**
 * 명령어 실행 결과 요약
 */
export function summarizeCommandResult(
  command: string,
  output: string,
  exitCode: number
): string {
  const risk = checkCommandRisk(command);
  const status = exitCode === 0 ? '✅ 성공' : '❌ 실패';

  let summary = `### 명령어 실행 결과\n\n`;
  summary += `**명령어**: \`${command}\`\n`;
  summary += `**상태**: ${status}\n`;
  summary += `**종료 코드**: ${exitCode}\n`;
  summary += `**위험도**: ${risk.riskLevel}\n\n`;

  if (output) {
    const lines = output.split('\n');
    const preview = lines.slice(0, 10).join('\n');
    summary += `**출력 미리보기**:\n\`\`\`\n${preview}\n\`\`\`\n`;

    if (lines.length > 10) {
      summary += `\n*... 총 ${lines.length}줄 중 10줄 표시*\n`;
    }
  }

  return summary;
}
