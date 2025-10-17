/**
 * AI Response Filtering System for OpenManager VIBE v5
 *
 * Provides comprehensive filtering of AI responses to prevent:
 * - Information leakage
 * - Malicious code in responses
 * - Inappropriate content
 * - System information exposure
 * - Social engineering in AI responses
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

export interface FilterResult {
  filtered: string;
  originalLength: number;
  filteredLength: number;
  issuesDetected: string[];
  riskLevel: 'safe' | 'warning' | 'blocked';
  requiresRegeneration: boolean;
}

export interface FilterConfig {
  enableStrictFiltering: boolean;
  maxResponseLength: number;
  preventCodeExecution: boolean;
  preventInfoLeakage: boolean;
  enableKoreanFiltering: boolean;
}

export class AIResponseFilter {
  private static instance: AIResponseFilter;
  private config: FilterConfig;

  // 위험한 응답 패턴들
  private readonly BLOCKED_PATTERNS = [
    // 시스템 정보 노출
    /process\.env|environment variables|config\.json/gi,
    /api[_\s]*key|secret[_\s]*key|password|token/gi,
    /database.*connection|mongodb.*uri|postgres.*connection/gi,

    // 코드 실행 시도
    /<script|javascript:|data:|vbscript:/gi,
    /eval\s*\(|exec\s*\(|system\s*\(|shell_exec/gi,

    // 파일 시스템 접근
    /\.\.\/|\/etc\/|\/var\/|\/home\/|\/root\//gi,
    /file_get_contents|readfile|file_put_contents/gi,

    // 한국어 위험 패턴
    /시스템.*해킹|데이터.*삭제|파일.*조작/gi,
    /관리자.*권한|루트.*접근|보안.*우회/gi,
  ];

  private readonly WARNING_PATTERNS = [
    // 부적절한 조언
    /how to hack|how to crack|bypass security/gi,
    /해킹.*방법|크랙.*방법|보안.*뚫는/gi,

    // 의심스러운 링크나 명령
    /http:\/\/|ftp:\/\/|telnet:/gi,
    /curl\s+|wget\s+|nc\s+|netcat/gi,

    // 개인정보 관련
    /social security|credit card|bank account/gi,
    /주민등록번호|신용카드|계좌번호|비밀번호/gi,

    // 법적 문제 가능성
    /copyright infringement|illegal download|piracy/gi,
    /저작권.*침해|불법.*다운로드|해적판/gi,
  ];

  private readonly INFO_LEAKAGE_PATTERNS = [
    // 내부 구조 정보
    /next\.js|vercel|supabase|redis|upstash/gi,
    /src\/|components\/|services\/|api\//gi,
    /localhost:\d+|127\.0\.0\.1|\:\d{4,5}/gi,

    // 개발 관련 정보
    /development|staging|production|debug/gi,
    /npm install|yarn add|pip install/gi,

    // 서버 정보
    /ubuntu|linux|windows server|nginx|apache/gi,
    /cpu.*usage|memory.*usage|disk.*space/gi,
  ];

  // 안전한 대체 응답들
  private readonly SAFE_ALTERNATIVES = {
    system_info: '시스템 정보는 보안상 제공할 수 없습니다.',
    code_execution: '코드 실행과 관련된 내용은 보안상 제한됩니다.',
    file_access: '파일 시스템 접근에 대한 정보는 제공할 수 없습니다.',
    security_bypass: '보안 우회에 관한 내용은 제공하지 않습니다.',
    personal_info: '개인정보와 관련된 내용은 다룰 수 없습니다.',
    illegal_activity: '불법적인 활동에 대한 정보는 제공하지 않습니다.',
    generic: '요청하신 내용에 대해서는 적절한 답변을 제공할 수 없습니다.',
  };

  private constructor(config?: Partial<FilterConfig>) {
    this.config = {
      enableStrictFiltering: true,
      maxResponseLength: 3000,
      preventCodeExecution: true,
      preventInfoLeakage: true,
      enableKoreanFiltering: true,
      ...config,
    };
  }

  public static getInstance(config?: Partial<FilterConfig>): AIResponseFilter {
    if (!AIResponseFilter.instance) {
      AIResponseFilter.instance = new AIResponseFilter(config);
    }
    return AIResponseFilter.instance;
  }

  /**
   * 🛡️ 메인 필터링 메서드
   */
  public filter(response: string): FilterResult {
    const originalLength = response.length;
    const issuesDetected: string[] = [];
    let filtered = response;
    let riskLevel: FilterResult['riskLevel'] = 'safe';

    // 1. 길이 검증
    if (originalLength > this.config.maxResponseLength) {
      filtered = filtered.substring(0, this.config.maxResponseLength) + '...';
      issuesDetected.push('response_too_long');
    }

    // 2. 차단 패턴 검사
    const blockedIssues = this.detectBlockedContent(filtered);
    if (blockedIssues.length > 0) {
      issuesDetected.push(...blockedIssues);
      riskLevel = 'blocked';
    }

    // 3. 경고 패턴 검사
    const warningIssues = this.detectWarningContent(filtered);
    if (warningIssues.length > 0) {
      issuesDetected.push(...warningIssues);
      if (riskLevel === 'safe') riskLevel = 'warning';
    }

    // 4. 정보 누출 검사
    if (this.config.preventInfoLeakage) {
      const infoLeakageIssues = this.detectInfoLeakage(filtered);
      if (infoLeakageIssues.length > 0) {
        issuesDetected.push(...infoLeakageIssues);
        if (riskLevel === 'safe') riskLevel = 'warning';
      }
    }

    // 5. 한국어 특화 필터링
    if (this.config.enableKoreanFiltering) {
      const koreanIssues = this.detectKoreanIssues(filtered);
      if (koreanIssues.length > 0) {
        issuesDetected.push(...koreanIssues);
        if (riskLevel === 'safe') riskLevel = 'warning';
      }
    }

    // 6. 필터링 수행
    if (riskLevel === 'blocked') {
      filtered = this.generateSafeAlternative(issuesDetected);
    } else if (riskLevel === 'warning' && this.config.enableStrictFiltering) {
      filtered = this.sanitizeWarningContent(filtered);
    }

    return {
      filtered,
      originalLength,
      filteredLength: filtered.length,
      issuesDetected,
      riskLevel,
      requiresRegeneration: riskLevel === 'blocked',
    };
  }

  /**
   * 🚨 차단되어야 하는 콘텐츠 탐지
   */
  private detectBlockedContent(response: string): string[] {
    const issues: string[] = [];

    for (const pattern of this.BLOCKED_PATTERNS) {
      if (pattern.test(response)) {
        if (pattern.source.includes('api.*key|secret.*key')) {
          issues.push('api_key_exposure');
        } else if (pattern.source.includes('script|javascript')) {
          issues.push('code_execution_attempt');
        } else if (pattern.source.includes('system|해킹')) {
          issues.push('security_threat');
        } else {
          issues.push('blocked_content');
        }
      }
    }

    // SQL injection in responses
    if (this.containsSQLContent(response)) {
      issues.push('sql_content');
    }

    // System commands in responses
    if (this.containsSystemCommands(response)) {
      issues.push('system_commands');
    }

    return issues;
  }

  /**
   * ⚠️ 경고해야 하는 콘텐츠 탐지
   */
  private detectWarningContent(response: string): string[] {
    const issues: string[] = [];

    for (const pattern of this.WARNING_PATTERNS) {
      if (pattern.test(response)) {
        if (pattern.source.includes('hack|crack|해킹')) {
          issues.push('hacking_content');
        } else if (pattern.source.includes('personal|개인정보')) {
          issues.push('personal_info_content');
        } else {
          issues.push('warning_content');
        }
      }
    }

    return issues;
  }

  /**
   * 📊 정보 누출 탐지
   */
  private detectInfoLeakage(response: string): string[] {
    const issues: string[] = [];

    for (const pattern of this.INFO_LEAKAGE_PATTERNS) {
      if (pattern.test(response)) {
        if (pattern.source.includes('next.js|vercel|supabase')) {
          issues.push('tech_stack_exposure');
        } else if (pattern.source.includes('src/|components/')) {
          issues.push('code_structure_exposure');
        } else if (pattern.source.includes('localhost|127.0.0.1')) {
          issues.push('server_info_exposure');
        } else {
          issues.push('info_leakage');
        }
      }
    }

    // IP 주소 패턴
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    if (ipPattern.test(response)) {
      issues.push('ip_address_exposure');
    }

    // 포트 번호 패턴
    const portPattern = /:\d{4,5}\b/g;
    if (portPattern.test(response)) {
      issues.push('port_exposure');
    }

    return issues;
  }

  /**
   * 🇰🇷 한국어 특화 이슈 탐지
   */
  private detectKoreanIssues(response: string): string[] {
    const issues: string[] = [];

    // 한국어 욕설이나 부적절한 표현
    const inappropriateKorean = [
      '바보',
      '멍청',
      '죽음',
      '죽어',
      '꺼져',
      '시발',
      '병신',
      '좆',
      '개새끼',
      '씨발',
      '엿먹어',
      '개똥',
      '쓰레기',
    ];

    const lowerResponse = response.toLowerCase();
    for (const word of inappropriateKorean) {
      if (lowerResponse.includes(word)) {
        issues.push('inappropriate_korean');
        break;
      }
    }

    // 한국어 사회공학 패턴
    const socialEngineeringKorean = [
      '급하게',
      '빨리',
      '지금당장',
      '비밀로',
      '아무에게도',
      '돈을',
      '송금',
      '계좌',
      '입금',
      '출금',
    ];

    for (const pattern of socialEngineeringKorean) {
      if (lowerResponse.includes(pattern)) {
        issues.push('korean_social_engineering');
        break;
      }
    }

    return issues;
  }

  /**
   * 🗄️ SQL 콘텐츠 확인
   */
  private containsSQLContent(response: string): boolean {
    const sqlKeywords = [
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
      'DROP',
      'CREATE',
      'ALTER',
      'GRANT',
      'REVOKE',
      'UNION',
      'WHERE',
      'FROM',
    ];

    const upperResponse = response.toUpperCase();
    const sqlCount = sqlKeywords.filter((keyword) =>
      upperResponse.includes(keyword)
    ).length;

    // SQL 키워드가 3개 이상이면 SQL 콘텐츠로 간주
    return sqlCount >= 3;
  }

  /**
   * 💻 시스템 명령어 확인
   */
  private containsSystemCommands(response: string): boolean {
    const commands = [
      'ls',
      'cat',
      'pwd',
      'cd',
      'mkdir',
      'rm',
      'mv',
      'cp',
      'chmod',
      'chown',
      'ps',
      'kill',
      'top',
      'grep',
      'find',
      'sudo',
      'su',
      'whoami',
      'id',
      'netstat',
      'ifconfig',
    ];

    const commandPattern = new RegExp(`\\b(${commands.join('|')})\\s+`, 'gi');

    return commandPattern.test(response);
  }

  /**
   * 🔄 경고 콘텐츠 정화
   */
  private sanitizeWarningContent(response: string): string {
    let sanitized = response;

    // 위험한 패턴들을 안전한 표현으로 대체
    for (const pattern of this.WARNING_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[보안상 제한된 내용]');
    }

    // 정보 누출 패턴들 마스킹
    for (const pattern of this.INFO_LEAKAGE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[시스템 정보]');
    }

    // IP 주소 마스킹
    sanitized = sanitized.replace(
      /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
      'xxx.xxx.xxx.xxx'
    );

    // 포트 번호 마스킹
    sanitized = sanitized.replace(/:(\d{4,5})\b/g, ':xxxx');

    return sanitized;
  }

  /**
   * 🛡️ 안전한 대체 응답 생성
   */
  private generateSafeAlternative(issues: string[]): string {
    // 가장 심각한 이슈에 따라 적절한 응답 선택
    if (
      issues.includes('api_key_exposure') ||
      issues.includes('security_threat')
    ) {
      return this.SAFE_ALTERNATIVES.security_bypass;
    } else if (
      issues.includes('code_execution_attempt') ||
      issues.includes('system_commands')
    ) {
      return this.SAFE_ALTERNATIVES.code_execution;
    } else if (
      issues.includes('sql_content') ||
      issues.includes('system_commands')
    ) {
      return this.SAFE_ALTERNATIVES.system_info;
    } else if (issues.includes('personal_info_content')) {
      return this.SAFE_ALTERNATIVES.personal_info;
    } else if (issues.includes('hacking_content')) {
      return this.SAFE_ALTERNATIVES.illegal_activity;
    } else {
      return this.SAFE_ALTERNATIVES.generic;
    }
  }

  /**
   * ⚙️ 설정 업데이트
   */
  public updateConfig(newConfig: Partial<FilterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 📊 통계 정보
   */
  public getStats(): {
    blockedPatternsCount: number;
    warningPatternsCount: number;
    infoLeakagePatternsCount: number;
    configuration: FilterConfig;
  } {
    return {
      blockedPatternsCount: this.BLOCKED_PATTERNS.length,
      warningPatternsCount: this.WARNING_PATTERNS.length,
      infoLeakagePatternsCount: this.INFO_LEAKAGE_PATTERNS.length,
      configuration: { ...this.config },
    };
  }

  /**
   * 🧪 테스트용 메서드
   */
  public testResponse(response: string): {
    safe: boolean;
    issues: string[];
    recommendation: string;
  } {
    const result = this.filter(response);

    return {
      safe: result.riskLevel === 'safe',
      issues: result.issuesDetected,
      recommendation:
        result.riskLevel === 'blocked'
          ? '응답을 다시 생성해야 합니다.'
          : result.riskLevel === 'warning'
            ? '응답을 검토하고 수정을 권장합니다.'
            : '안전한 응답입니다.',
    };
  }
}

// 편의를 위한 유틸리티 함수들
export function filterAIResponse(
  response: string,
  config?: Partial<FilterConfig>
): FilterResult {
  const filter = AIResponseFilter.getInstance(config);
  return filter.filter(response);
}

export function isResponseSafe(response: string): boolean {
  const result = filterAIResponse(response);
  return result.riskLevel === 'safe';
}

export function getSafeResponse(response: string): string {
  const result = filterAIResponse(response);
  return result.filtered;
}
