/**
 * 🎯 PowerShell 전용 컨텍스트 감지기
 * WSL 의존성 제거 및 PowerShell 환경 최적화
 */

export class ContextDetector {
  constructor() {
    this.context = this._detectContext();
  }

  /**
   * 환경 컨텍스트 감지
   */
  _detectContext() {
    const env = process.env;

    // 기본 환경 정보
    const context = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      isPowerShell: true, // PowerShell 전용
      caller: this._detectCaller(),
      runtime: this._detectRuntime(),
      recommendations: []
    };

    // PowerShell 환경 확인
    if (process.platform === 'win32') {
      context.isPowerShell = true;
      context.recommendations.push('Windows 네이티브 PowerShell 환경 감지됨');
    } else {
      // WSL 환경이지만 PowerShell 브릿지 사용
      context.isPowerShell = true;
      context.recommendations.push('WSL 환경에서 PowerShell 브릿지 사용');
    }

    return context;
  }

  /**
   * 호출자 감지
   */
  _detectCaller() {
    const env = process.env;

    // Claude Code 환경 변수 확인
    if (env.CLAUDE_WORKSPACE || env.ANTHROPIC_API_KEY) {
      return 'claude-code';
    }

    // Gemini CLI 환경 변수 확인
    if (env.GEMINI_API_KEY || env.GOOGLE_API_KEY) {
      return 'gemini-cli';
    }

    // 프로세스 이름 확인
    if (process.argv[0]?.includes('claude')) {
      return 'claude-code';
    }

    if (process.argv[0]?.includes('gemini')) {
      return 'gemini-cli';
    }

    return 'unknown';
  }

  /**
   * 런타임 환경 감지
   */
  _detectRuntime() {
    const env = process.env;

    // TTY vs stdio 모드 확인
    const isTTY = process.stdin.isTTY && process.stdout.isTTY;

    return {
      isTTY,
      mode: isTTY ? 'interactive' : 'stdio',
      hasColor: env.COLORTERM || env.TERM === 'xterm-256color',
      shell: 'powershell'
    };
  }

  /**
   * 실행 전략 결정
   */
  determineExecutionStrategy() {
    const caller = this.context.caller;
    const isPowerShell = this.context.isPowerShell;

    let executionStrategy = this._determineExecutionStrategy(caller, isPowerShell);

    return {
      strategy: executionStrategy,
      context: this.context,
      recommendations: this._generateRecommendations(caller, isPowerShell)
    };
  }

  /**
   * 실행 전략 결정 로직 (PowerShell 최적화)
   */
  _determineExecutionStrategy(caller, isPowerShell) {
    // PowerShell 환경에서는 PowerShell 전략 사용
    if (isPowerShell) {
      return 'powershell';
    }

    // 기본적으로 PowerShell 사용
    return 'powershell';
  }

  /**
   * 권장사항 생성
   */
  _generateRecommendations(caller, isPowerShell) {
    const recommendations = [];

    if (caller === 'claude-code' && isPowerShell) {
      recommendations.push('Claude Code에서 PowerShell 환경 감지됨 - 최적화된 PowerShell 브릿지 사용');
    }

    if (caller === 'gemini-cli') {
      recommendations.push('Gemini CLI에서 호출됨 - 역방향 호환 모드 사용');
    }

    if (isPowerShell) {
      recommendations.push('PowerShell 환경 최적화됨');
    }

    return recommendations;
  }

  /**
   * 환경 점수 계산
   */
  calculateEnvironmentScore() {
    let score = 0;
    const env = process.env;

    // PowerShell 환경 점수
    if (this.context.isPowerShell) score += 5;

    // Claude Code 환경 점수
    if (env.CLAUDE_WORKSPACE) score += 3;
    if (env.ANTHROPIC_API_KEY) score += 2;

    // Gemini CLI 환경 점수
    if (env.GEMINI_API_KEY) score += 3;
    if (env.GOOGLE_API_KEY) score += 2;

    // 런타임 점수
    if (this.context.runtime.isTTY) score += 1;
    if (this.context.runtime.hasColor) score += 1;

    return score;
  }

  /**
   * 컨텍스트 정보 출력
   */
  logContext() {
    console.error(`=== PowerShell 환경 컨텍스트 ===`);
    console.error(`플랫폼: ${this.context.platform}`);
    console.error(`아키텍처: ${this.context.arch}`);
    console.error(`Node.js 버전: ${this.context.nodeVersion}`);
    console.error(`PowerShell 환경: ${this.context.isPowerShell}`);
    console.error(`호출자: ${this.context.caller}`);
    console.error(`런타임 모드: ${this.context.runtime.mode}`);
    console.error(`환경 점수: ${this.calculateEnvironmentScore()}`);
    console.error(`권장사항: ${this.context.recommendations.join(', ')}`);
    console.error(`=====================================`);
  }
}