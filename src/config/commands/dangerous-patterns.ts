/**
 * 위험한 명령어 패턴 정의
 * 시스템에 심각한 영향을 줄 수 있는 명령어 패턴 관리
 */

/**
 * 위험한 명령어 패턴 (정규표현식)
 * 시스템 손상, 데이터 손실, 서비스 중단을 일으킬 수 있는 패턴
 */
export const dangerousCommandPatterns = [
  // 파일시스템 파괴
  /rm\s+-rf\s+\//, // rm -rf / (루트 삭제)
  /rm\s+-rf\s+\.\*/, // rm -rf .* (현재 디렉토리 전체 삭제)
  /rm\s+-rf\s+~/, // rm -rf ~ (홈 디렉토리 삭제)
  
  // 디바이스 덮어쓰기
  /dd\s+if=.*of=\/dev\/(sda|hda|nvme)/, // dd로 하드 드라이브 덮어쓰기
  /dd\s+.*of=\/dev\/null/, // dd로 /dev/null에 쓰기 (데이터 손실)
  
  // Windows 시스템 파괴
  /format\s+[cC]:/, // Windows C 드라이브 포맷
  /del\s+\/[sS]\s+\/[qQ]\s+[cC]:\\/, // Windows 전체 삭제
  /rd\s+\/s\s+\/q\s+[cC]:\\/, // Windows 디렉토리 재귀 삭제
  
  // 시스템 종료/재시작
  /shutdown\s+-[hr]\s+now/, // 즉시 종료/재시작
  /reboot\s+-f/, // 강제 재시작
  /halt\s+-f/, // 강제 정지
  /init\s+0/, // 시스템 종료
  
  // 프로세스 파괴
  /kill\s+-9\s+1/, // init 프로세스 종료
  /killall\s+-9/, // 모든 프로세스 강제 종료
  /pkill\s+-9\s+\*/, // 패턴 매칭 프로세스 강제 종료
  
  // 권한 변경
  /chmod\s+777\s+\//, // 루트 권한 완전 개방
  /chown\s+-R\s+.*\//, // 루트 소유권 변경
  
  // 파일시스템 포맷
  /mkfs\.\w+\s+\/dev/, // 파일시스템 포맷
  /wipefs\s+-a/, // 파일시스템 서명 제거
  
  // Fork 폭탄
  /:\(\)\{.*\|.*&\};/, // Bash fork bomb
  /%0\|%0/, // Windows fork bomb
  
  // 네트워크 파괴
  /iptables\s+-F/, // 모든 방화벽 규칙 삭제
  /ifconfig\s+\w+\s+down/, // 네트워크 인터페이스 비활성화
  
  // 데이터베이스 파괴
  /drop\s+database/i, // 데이터베이스 삭제
  /truncate\s+table/i, // 테이블 데이터 전체 삭제
  /delete\s+from\s+\w+\s*;/i, // WHERE 절 없는 DELETE
  
  // 숨겨진 작업 (의심스러운 패턴)
  />\s*\/dev\/null\s+2>&1/, // 출력 무시 (숨겨진 작업)
  /nohup.*&$/, // 백그라운드 실행 (추적 어려움)
];

/**
 * 위험한 키워드 목록
 * 명령어에 포함되면 위험으로 분류되는 키워드
 */
export const dangerousKeywords = [
  'format',
  'delete',
  'drop',
  'truncate',
  'rm -rf',
  'wipefs',
  'mkfs',
  'dd if=',
];

/**
 * 주의가 필요한 키워드 목록
 * 명령어에 포함되면 moderate 위험도로 분류
 */
export const moderateKeywords = [
  'restart',
  'reload',
  'stop',
  'kill',
  'terminate',
  'pause',
  'suspend',
];

/**
 * 명령어 위험도 검사
 */
export function checkCommandRisk(command: string): {
  isAllowed: boolean;
  riskLevel: 'safe' | 'moderate' | 'dangerous';
  reason?: string;
} {
  // 위험한 패턴 검사
  for (const pattern of dangerousCommandPatterns) {
    if (pattern.test(command)) {
      return {
        isAllowed: false,
        riskLevel: 'dangerous',
        reason: '이 명령어는 시스템에 심각한 영향을 줄 수 있습니다.',
      };
    }
  }

  const lowerCommand = command.toLowerCase();

  // 위험한 키워드 검사
  for (const keyword of dangerousKeywords) {
    if (lowerCommand.includes(keyword.toLowerCase())) {
      return {
        isAllowed: false,
        riskLevel: 'dangerous',
        reason: `'${keyword}' 명령어는 데이터 손실을 일으킬 수 있습니다.`,
      };
    }
  }

  // 주의 키워드 검사
  for (const keyword of moderateKeywords) {
    if (lowerCommand.includes(keyword)) {
      return {
        isAllowed: true,
        riskLevel: 'moderate',
        reason: `'${keyword}' 명령어는 서비스에 영향을 줄 수 있습니다. 주의해서 사용하세요.`,
      };
    }
  }

  return {
    isAllowed: true,
    riskLevel: 'safe',
  };
}

/**
 * 명령어 안전성 검증
 * 실행 전 최종 확인 단계
 */
export function validateCommand(
  command: string,
  allowDangerous: boolean = false
): { valid: boolean; message?: string } {
  const risk = checkCommandRisk(command);

  if (!risk.isAllowed && !allowDangerous) {
    return {
      valid: false,
      message: risk.reason || '위험한 명령어입니다.',
    };
  }

  if (risk.riskLevel === 'moderate') {
    return {
      valid: true,
      message: risk.reason,
    };
  }

  return { valid: true };
}