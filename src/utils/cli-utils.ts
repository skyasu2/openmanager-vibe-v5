/**
 * 🎨 CLI 유틸리티 - 개발자 친화적 콘솔 인터페이스
 *
 * encrypt-google-ai.js에서 추출된 CLI UX 기능들을
 * 재사용 가능한 유틸리티로 통합
 */

import * as readline from 'readline';

// 🎨 콘솔 색상 정의
export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * 🔒 비밀번호 입력 (마스킹 처리)
 * encrypt-google-ai.js에서 추출된 기능
 */
export function hiddenQuestion(query: string): Promise<string> {
  return new Promise(resolve => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    stdout.write(query);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';

    stdin.on('data', function (ch: string) {
      ch = ch + '';

      switch (ch) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          stdout.write('\n');
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write('\b \b');
          }
          break;
        default:
          password += ch;
          stdout.write('*');
          break;
      }
    });
  });
}

/**
 * 📝 일반 질문
 */
export function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * 🔍 API 키 유효성 검사
 * encrypt-google-ai.js에서 추출된 검증 로직
 */
export function validateAPIKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  const trimmed = apiKey.trim();

  // Google AI Studio API 키 형식 검사
  if (!trimmed.startsWith('AIza')) {
    return false;
  }

  if (trimmed.length < 20 || trimmed.length > 50) {
    return false;
  }

  return true;
}

/**
 * 🔒 비밀번호 유효성 검사
 * encrypt-google-ai.js에서 추출된 검증 로직
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  const trimmed = password.trim();

  if (trimmed.length < 4) {
    return false;
  }

  return true;
}

/**
 * 🎨 색상이 적용된 콘솔 출력
 */
export function colorLog(message: string, color: keyof typeof colors): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * ✅ 성공 메시지
 */
export function successLog(message: string): void {
  colorLog(`✅ ${message}`, 'green');
}

/**
 * ❌ 에러 메시지
 */
export function errorLog(message: string): void {
  colorLog(`❌ ${message}`, 'red');
}

/**
 * ⚠️ 경고 메시지
 */
export function warningLog(message: string): void {
  colorLog(`⚠️ ${message}`, 'yellow');
}

/**
 * 💡 정보 메시지
 */
export function infoLog(message: string): void {
  colorLog(`💡 ${message}`, 'cyan');
}

/**
 * 🎯 진행 상황 표시
 */
export function progressLog(
  step: number,
  total: number,
  message: string
): void {
  colorLog(`🎯 [${step}/${total}] ${message}`, 'blue');
}

/**
 * 📋 제목 출력
 */
export function titleLog(title: string): void {
  console.log(`${colors.bright}${colors.blue}🔐 ${title}${colors.reset}\n`);
}

/**
 * 🎉 완료 메시지
 */
export function completionLog(message: string): void {
  console.log(
    `\n${colors.bright}${colors.green}🎉 ${message}${colors.reset}\n`
  );
}

/**
 * 📊 결과 요약 출력
 */
export interface ResultSummary {
  success: number;
  failed: number;
  total: number;
  details?: string[];
}

export function resultSummaryLog(summary: ResultSummary): void {
  console.log('\n📊 결과 요약:');
  successLog(`성공: ${summary.success}개`);
  if (summary.failed > 0) {
    errorLog(`실패: ${summary.failed}개`);
  }
  infoLog(`전체: ${summary.total}개`);

  if (summary.details && summary.details.length > 0) {
    console.log('\n📋 상세 내역:');
    summary.details.forEach(detail => console.log(`   ${detail}`));
  }
}
