/**
 * Prompt Sanitization System for OpenManager VIBE v5
 *
 * Provides comprehensive protection against:
 * - Prompt injection attacks
 * - Code injection attempts
 * - System command injection
 * - Korean language specific attacks
 * - Social engineering attempts
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

export interface SanitizationResult {
  sanitized: string;
  originalLength: number;
  sanitizedLength: number;
  threatsDetected: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
}

export interface SanitizationConfig {
  enableStrictMode: boolean;
  maxInputLength: number;
  allowedLanguages: string[];
  blockSystemCommands: boolean;
  enableKoreanProtection: boolean;
}

export class PromptSanitizer {
  private static instance: PromptSanitizer;
  private config: SanitizationConfig;

  // 위험한 패턴들
  private readonly CRITICAL_PATTERNS = [
    // System command injection
    /system\s*\(|exec\s*\(|eval\s*\(|`([^`]*)`/gi,

    // Prompt injection attempts
    /ignore\s+previous\s+instructions/gi,
    /forget\s+everything\s+above/gi,
    /you\s+are\s+now\s+a\s+different\s+ai/gi,
    /새로운\s+지시사항|이전\s+명령\s+무시|시스템\s+명령/gi,

    // Code execution attempts
    /<script|javascript:|data:|vbscript:/gi,
    /\$\{[^}]*\}|#{[^}]*}/g, // Template injection

    // Korean specific attacks
    /관리자\s+권한|루트\s+접근|시스템\s+해킹/gi,
    /비밀번호\s+변경|계정\s+탈취|데이터\s+삭제/gi,
  ];

  private readonly HIGH_RISK_PATTERNS = [
    // Social engineering
    /give\s+me\s+access|grant\s+permission|bypass\s+security/gi,
    /접근\s+권한\s+부여|보안\s+우회|관리자\s+모드/gi,

    // Sensitive data extraction
    /show\s+me\s+the\s+code|reveal\s+the\s+system|display\s+configuration/gi,
    /코드\s+보여줘|시스템\s+정보|설정\s+파일/gi,

    // Database queries
    /select\s+\*\s+from|drop\s+table|delete\s+from/gi,
    /union\s+select|or\s+1\s*=\s*1/gi,
  ];

  private readonly MEDIUM_RISK_PATTERNS = [
    // Excessive repetition (DoS attempt)
    /(.{1,10})\1{20,}/g,

    // Suspicious Unicode patterns
    /[\u200B-\u200D\uFEFF]/g, // Zero-width characters
    /[\u2028\u2029]/g, // Line/paragraph separators

    // Suspicious HTML/XML
    /<[^>]*>/g,
    /&[a-z]+;/gi,
  ];

  // 허용된 특수 문자 (서버 모니터링 컨텍스트)
  private readonly ALLOWED_SPECIAL_CHARS = new Set([
    '.',
    ',',
    '?',
    '!',
    ':',
    ';',
    '-',
    '_',
    '(',
    ')',
    '[',
    ']',
    '{',
    '}',
    '/',
    '\\',
    '@',
    '#',
    '%',
    '&',
    '*',
    '+',
    '=',
    '|',
    '~',
    '^',
    '`',
    "'",
    '"',
    '\n',
    '\r',
    '\t',
    ' ',
  ]);

  private constructor(config?: Partial<SanitizationConfig>) {
    this.config = {
      enableStrictMode: true, // 엔터프라이즈급 보안 적용
      maxInputLength: 2000,
      allowedLanguages: ['ko', 'en'],
      blockSystemCommands: true,
      enableKoreanProtection: true,
      ...config,
    };
  }

  public static getInstance(
    config?: Partial<SanitizationConfig>
  ): PromptSanitizer {
    if (!PromptSanitizer.instance) {
      PromptSanitizer.instance = new PromptSanitizer(config);
    }
    return PromptSanitizer.instance;
  }

  /**
   * 🛡️ 메인 sanitization 메서드
   */
  public sanitize(input: string): SanitizationResult {
    const originalLength = input.length;
    const threatsDetected: string[] = [];
    let riskLevel: SanitizationResult['riskLevel'] = 'low';
    let sanitized = input;

    // 1. 길이 검증
    if (originalLength > this.config.maxInputLength) {
      threatsDetected.push('input_too_long');
      sanitized = sanitized.substring(0, this.config.maxInputLength);
      riskLevel = 'medium';
    }

    // 2. Critical 패턴 검사
    const criticalThreats = this.detectCriticalThreats(sanitized);
    if (criticalThreats.length > 0) {
      threatsDetected.push(...criticalThreats);
      riskLevel = 'critical';
    }

    // 3. High risk 패턴 검사
    const highRiskThreats = this.detectHighRiskThreats(sanitized);
    if (highRiskThreats.length > 0) {
      threatsDetected.push(...highRiskThreats);
      if (riskLevel !== 'critical') riskLevel = 'high';
    }

    // 4. Medium risk 패턴 검사
    const mediumRiskThreats = this.detectMediumRiskThreats(sanitized);
    if (mediumRiskThreats.length > 0) {
      threatsDetected.push(...mediumRiskThreats);
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // 5. 한국어 특화 보안 검사
    if (this.config.enableKoreanProtection) {
      const koreanThreats = this.detectKoreanThreats(sanitized);
      if (koreanThreats.length > 0) {
        threatsDetected.push(...koreanThreats);
        if (riskLevel === 'low') riskLevel = 'medium';
      }
    }

    // 6. Sanitization 수행
    if (this.config.enableStrictMode) {
      sanitized = this.performStrictSanitization(sanitized);
    } else {
      sanitized = this.performBasicSanitization(sanitized);
    }

    // 7. 차단 여부 결정
    const blocked =
      riskLevel === 'critical' ||
      (riskLevel === 'high' && this.config.enableStrictMode);

    return {
      sanitized: blocked ? '' : sanitized,
      originalLength,
      sanitizedLength: sanitized.length,
      threatsDetected,
      riskLevel,
      blocked,
    };
  }

  /**
   * 🚨 Critical threat detection
   */
  private detectCriticalThreats(input: string): string[] {
    const threats: string[] = [];

    for (const pattern of this.CRITICAL_PATTERNS) {
      if (pattern.test(input)) {
        threats.push(`critical_pattern_${pattern.source.substring(0, 20)}`);
      }
    }

    // SQL injection patterns
    if (this.containsSQLInjection(input)) {
      threats.push('sql_injection');
    }

    // Command injection patterns
    if (this.containsCommandInjection(input)) {
      threats.push('command_injection');
    }

    return threats;
  }

  /**
   * ⚠️ High risk threat detection
   */
  private detectHighRiskThreats(input: string): string[] {
    const threats: string[] = [];

    for (const pattern of this.HIGH_RISK_PATTERNS) {
      if (pattern.test(input)) {
        threats.push(`high_risk_pattern`);
      }
    }

    // Social engineering detection
    if (this.containsSocialEngineering(input)) {
      threats.push('social_engineering');
    }

    return threats;
  }

  /**
   * 📊 Medium risk threat detection
   */
  private detectMediumRiskThreats(input: string): string[] {
    const threats: string[] = [];

    for (const pattern of this.MEDIUM_RISK_PATTERNS) {
      if (pattern.test(input)) {
        threats.push('medium_risk_pattern');
      }
    }

    // Excessive repetition
    if (this.hasExcessiveRepetition(input)) {
      threats.push('excessive_repetition');
    }

    // Suspicious encoding
    if (this.hasSuspiciousEncoding(input)) {
      threats.push('suspicious_encoding');
    }

    return threats;
  }

  /**
   * 🇰🇷 한국어 특화 위협 탐지
   */
  private detectKoreanThreats(input: string): string[] {
    const threats: string[] = [];

    // 한글 유니코드 조작 패턴
    const koreanUnicodePattern =
      /[\uAC00-\uD7AF][\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF]+/g;
    if (koreanUnicodePattern.test(input)) {
      threats.push('korean_unicode_manipulation');
    }

    // 한영 혼용 우회 패턴
    const mixedLanguagePattern = /[ㄱ-ㅎㅏ-ㅣ가-힣][a-zA-Z][ㄱ-ㅎㅏ-ㅣ가-힣]/g;
    const mixedMatches = input.match(mixedLanguagePattern);
    if (
      mixedLanguagePattern.test(input) &&
      mixedMatches &&
      mixedMatches.length > 3
    ) {
      threats.push('korean_english_bypass');
    }

    // 한국어 특화 공격 키워드
    const koreanAttackKeywords = [
      '해킹',
      '크랙',
      '바이러스',
      '트로이',
      '멀웨어',
      '디도스',
      '피싱',
      '스팸',
      '봇넷',
      '키로거',
      '랜섬웨어',
      '루트킷',
      '백도어',
      '취약점',
      '익스플로잇',
    ];

    const lowerInput = input.toLowerCase();
    for (const keyword of koreanAttackKeywords) {
      if (lowerInput.includes(keyword)) {
        threats.push('korean_attack_keyword');
        break;
      }
    }

    return threats;
  }

  /**
   * 🔒 Strict sanitization
   */
  private performStrictSanitization(input: string): string {
    let sanitized = input;

    // 1. 위험한 패턴 제거
    for (const pattern of [
      ...this.CRITICAL_PATTERNS,
      ...this.HIGH_RISK_PATTERNS,
    ]) {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }

    // 2. 허용되지 않은 특수문자 제거
    sanitized = sanitized
      .split('')
      .filter((char) => {
        // 한글, 영문, 숫자는 허용
        if (/[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-9]/.test(char)) return true;
        // 허용된 특수문자 확인
        return this.ALLOWED_SPECIAL_CHARS.has(char);
      })
      .join('');

    // 3. 연속된 특수문자 제한
    sanitized = sanitized.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]{3,}/g, '');

    // 4. 과도한 공백 정리
    sanitized = sanitized.replace(/\s{3,}/g, ' ').trim();

    return sanitized;
  }

  /**
   * 🔓 Basic sanitization
   */
  private performBasicSanitization(input: string): string {
    let sanitized = input;

    // 1. Critical 패턴만 제거
    for (const pattern of this.CRITICAL_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[FILTERED]');
    }

    // 2. 기본적인 HTML 이스케이프
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    // 3. 과도한 공백 정리
    sanitized = sanitized.replace(/\s{5,}/g, ' ').trim();

    return sanitized;
  }

  /**
   * 🔍 SQL injection detection
   */
  private containsSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /(or\s+1\s*=\s*1|and\s+1\s*=\s*1)/gi,
      /(\|\||&&|\band\b|\bor\b)\s*\d+\s*[=<>]/gi,
      /('|\").*(\1.*){2,}/gi, // Quote manipulation
    ];

    return sqlPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * 💻 Command injection detection
   */
  private containsCommandInjection(input: string): boolean {
    const commandPatterns = [
      /[|;&$`]/g,
      /\b(cat|ls|pwd|whoami|id|ps|top|kill|rm|mv|cp|chmod|sudo)\b/gi,
      /\\x[0-9a-f]{2}/gi, // Hex encoded
      /%[0-9a-f]{2}/gi, // URL encoded
    ];

    return commandPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * 🎭 Social engineering detection
   */
  private containsSocialEngineering(input: string): boolean {
    const socialPatterns = [
      /urgent|emergency|immediately|asap|critical/gi,
      /please\s+(help|assist|do|give|provide)/gi,
      /긴급|응급|즉시|빨리|도와|부탁/gi,
      /trust\s+me|believe\s+me|i\s+promise|나를\s+믿어|약속해/gi,
    ];

    return socialPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * 🔄 Excessive repetition detection
   */
  private hasExcessiveRepetition(input: string): boolean {
    // 같은 문자나 패턴이 20번 이상 반복되는지 확인
    const repetitionPattern = /(.{1,5})\1{19,}/g;
    return repetitionPattern.test(input);
  }

  /**
   * 🔤 Suspicious encoding detection
   */
  private hasSuspiciousEncoding(input: string): boolean {
    // Base64 패턴 (긴 것만 의심)
    const base64Pattern = /[A-Za-z0-9+\/]{50,}={0,2}/g;

    // URL 인코딩 패턴 (과도한 것)
    const urlEncodedPattern = /(%[0-9A-Fa-f]{2}){10,}/g;

    // Unicode 이스케이프 (과도한 것)
    const unicodePattern = /(\\u[0-9A-Fa-f]{4}){5,}/g;

    return (
      base64Pattern.test(input) ||
      urlEncodedPattern.test(input) ||
      unicodePattern.test(input)
    );
  }

  /**
   * ⚙️ Configuration update
   */
  public updateConfig(newConfig: Partial<SanitizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 📊 Get statistics
   */
  public getStats(): {
    criticalPatternsCount: number;
    highRiskPatternsCount: number;
    mediumRiskPatternsCount: number;
    configuration: SanitizationConfig;
  } {
    return {
      criticalPatternsCount: this.CRITICAL_PATTERNS.length,
      highRiskPatternsCount: this.HIGH_RISK_PATTERNS.length,
      mediumRiskPatternsCount: this.MEDIUM_RISK_PATTERNS.length,
      configuration: { ...this.config },
    };
  }
}

// 편의를 위한 유틸리티 함수들
export function sanitizePrompt(
  input: string,
  config?: Partial<SanitizationConfig>
): SanitizationResult {
  const sanitizer = PromptSanitizer.getInstance(config);
  return sanitizer.sanitize(input);
}

export function isPromptSafe(input: string): boolean {
  const result = sanitizePrompt(input);
  return result.riskLevel === 'low' && !result.blocked;
}

export function getSafePrompt(input: string): string {
  const result = sanitizePrompt(input);
  return result.blocked ? '' : result.sanitized;
}
