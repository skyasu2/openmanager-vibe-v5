/**
 * Vision Tools (AI SDK Format)
 *
 * Gemini Flash-Lite powered tools for visual and large-context analysis:
 * - analyzeScreenshot: Dashboard image analysis (Grafana, CloudWatch, etc.)
 * - analyzeLargeLog: Large log file analysis (1M context)
 * - searchWithGrounding: Google Search Grounding for real-time docs
 * - analyzeUrlContent: URL content extraction and analysis
 *
 * @version 1.0.0
 * @created 2026-01-27
 */

import { tool } from 'ai';
import { z } from 'zod';

// ============================================================================
// 1. Types
// ============================================================================

export interface ScreenshotAnalysisResult {
  success: boolean;
  dashboardType: string;
  findings: {
    anomalies: string[];
    trends: string[];
    thresholdBreaches: string[];
    recommendations: string[];
  };
  metrics: {
    name: string;
    currentValue: string;
    status: 'normal' | 'warning' | 'critical';
    trend: 'up' | 'down' | 'stable';
  }[];
  timeRange?: string;
  summary: string;
}

export interface LogAnalysisResult {
  success: boolean;
  logType: string;
  totalLines: number;
  analyzedLines: number;
  findings: {
    errorCount: number;
    warnCount: number;
    topErrors: { message: string; count: number; firstSeen: string; lastSeen: string }[];
    patterns: { pattern: string; frequency: number; severity: string }[];
    timeline: { timestamp: string; event: string; severity: string }[];
  };
  rootCauseHypothesis?: string;
  recommendations: string[];
  summary: string;
}

export interface SearchGroundingResult {
  success: boolean;
  query: string;
  results: {
    title: string;
    snippet: string;
    url: string;
    relevanceScore: number;
  }[];
  summary: string;
  recommendations: string[];
}

export interface UrlContentResult {
  success: boolean;
  url: string;
  title: string;
  contentType: string;
  extractedSections: {
    heading: string;
    content: string;
    relevance: 'high' | 'medium' | 'low';
  }[];
  summary: string;
  applicableActions: string[];
}

// ============================================================================
// 2. Input Types
// ============================================================================

type DashboardType = 'grafana' | 'cloudwatch' | 'datadog' | 'prometheus' | 'newrelic' | 'custom' | 'unknown';
type FocusArea = 'cpu' | 'memory' | 'disk' | 'network' | 'latency' | 'errors' | 'all';
type LogType = 'syslog' | 'application' | 'access' | 'error' | 'security' | 'custom';
type SearchType = 'technical' | 'security' | 'documentation' | 'troubleshooting' | 'general';

// ============================================================================
// 3. Screenshot Analysis Tool
// ============================================================================

/**
 * Analyze dashboard screenshots (Grafana, CloudWatch, Datadog, etc.)
 *
 * Detects:
 * - Metric spikes and drops
 * - Threshold breaches (red/yellow zones)
 * - Time-based patterns
 * - Cross-metric correlations
 */
export const analyzeScreenshot = tool({
  description: `대시보드 스크린샷을 분석합니다. Grafana, CloudWatch, Datadog 등의 모니터링 대시보드 이미지를 분석하여 이상 징후, 트렌드, 임계값 초과 등을 감지합니다.

사용 예시:
- "이 Grafana 스크린샷 분석해줘"
- "CloudWatch 대시보드에서 문제점 찾아줘"
- "CPU 차트 이미지 분석"`,

  inputSchema: z.object({
    imageData: z
      .string()
      .describe('Base64 인코딩된 이미지 데이터 또는 이미지 URL'),
    dashboardType: z
      .enum(['grafana', 'cloudwatch', 'datadog', 'prometheus', 'newrelic', 'custom', 'unknown'])
      .optional()
      .default('unknown')
      .describe('대시보드 유형 (자동 감지 시 unknown)'),
    focusArea: z
      .enum(['cpu', 'memory', 'disk', 'network', 'latency', 'errors', 'all'])
      .optional()
      .default('all')
      .describe('분석 집중 영역'),
    timeContext: z
      .string()
      .optional()
      .describe('시간 컨텍스트 (예: "지난 1시간", "오늘 오후")'),
  }),

  execute: async ({
    imageData,
    dashboardType,
    focusArea,
    timeContext,
  }: {
    imageData: string;
    dashboardType?: DashboardType;
    focusArea?: FocusArea;
    timeContext?: string;
  }) => {
    // Note: Actual image analysis will be performed by Gemini model
    // This tool structures the request and provides analysis framework

    const result: ScreenshotAnalysisResult = {
      success: true,
      dashboardType: dashboardType || 'unknown',
      findings: {
        anomalies: [],
        trends: [],
        thresholdBreaches: [],
        recommendations: [],
      },
      metrics: [],
      timeRange: timeContext,
      summary: '',
    };

    // Validate image data
    if (!imageData || imageData.length < 100) {
      return {
        success: false,
        error: '유효한 이미지 데이터가 필요합니다. Base64 인코딩된 이미지 또는 URL을 제공해주세요.',
        dashboardType: dashboardType || 'unknown',
        findings: { anomalies: [], trends: [], thresholdBreaches: [], recommendations: [] },
        metrics: [],
        summary: '이미지 분석 실패: 유효하지 않은 이미지 데이터',
      };
    }

    // Determine if URL or Base64
    const isUrl = imageData.startsWith('http://') || imageData.startsWith('https://');
    const imageType = isUrl ? 'url' : 'base64';

    // Return structured analysis request for Gemini
    const actualDashboardType = dashboardType || 'unknown';
    const actualFocusArea = focusArea || 'all';

    result.summary = `${actualDashboardType} 대시보드 스크린샷 분석 준비 완료. 이미지 유형: ${imageType}, 집중 영역: ${actualFocusArea}`;

    // Add analysis context for Gemini
    const analysisContext = {
      imageType,
      dashboardType: actualDashboardType,
      focusArea: actualFocusArea,
      timeContext,
      analysisInstructions: `
이 ${actualDashboardType} 대시보드 스크린샷을 분석하세요:

1. **이상 징후 탐지**: 스파이크, 드랍, 비정상적 패턴
2. **임계값 확인**: 빨간색/노란색 영역, 경고 표시
3. **트렌드 분석**: 상승/하락 추세, 주기적 패턴
4. **메트릭 상관관계**: 여러 차트 간 연관성
${actualFocusArea !== 'all' ? `5. **집중 분석**: ${actualFocusArea} 관련 메트릭 우선` : ''}

분석 결과를 구조화된 형식으로 제공하세요.
      `.trim(),
    };

    return {
      ...result,
      analysisContext,
      _imageData: imageData, // Pass through for Gemini
    };
  },
});

// ============================================================================
// 4. Large Log Analysis Tool
// ============================================================================

/**
 * Analyze large log files using Gemini's 1M context window
 *
 * Capabilities:
 * - Error clustering and frequency analysis
 * - Timeline reconstruction
 * - Pattern detection
 * - Root cause hypothesis generation
 */
export const analyzeLargeLog = tool({
  description: `대용량 로그 파일을 분석합니다. Gemini의 1M 토큰 컨텍스트를 활용하여 전체 로그를 분석하고 에러 패턴, 타임라인, 근본 원인을 추론합니다.

사용 예시:
- "이 로그 파일 전체 분석해줘"
- "에러 로그에서 패턴 찾아줘"
- "장애 시점 타임라인 재구성"`,

  inputSchema: z.object({
    logContent: z
      .string()
      .describe('분석할 로그 텍스트 (최대 1M 토큰)'),
    logType: z
      .enum(['syslog', 'application', 'access', 'error', 'security', 'custom'])
      .optional()
      .default('application')
      .describe('로그 유형'),
    timeRange: z
      .string()
      .optional()
      .describe('분석 시간 범위 (예: "last1h", "2024-01-01 ~ 2024-01-02")'),
    focusPattern: z
      .string()
      .optional()
      .describe('집중 분석할 패턴 (예: "ERROR", "OOM", "timeout")'),
    maxLines: z
      .number()
      .optional()
      .default(100000)
      .describe('최대 분석 라인 수'),
  }),

  execute: async ({
    logContent,
    logType,
    timeRange,
    focusPattern,
    maxLines,
  }: {
    logContent: string;
    logType?: LogType;
    timeRange?: string;
    focusPattern?: string;
    maxLines?: number;
  }) => {
    const lines = logContent.split('\n');
    const totalLines = lines.length;
    const effectiveMaxLines = maxLines || 100000;
    const analyzedLines = Math.min(totalLines, effectiveMaxLines);

    // Quick pre-analysis for structure
    const errorLines = lines.filter((l: string) =>
      /error|exception|fatal|critical/i.test(l)
    );
    const warnLines = lines.filter((l: string) =>
      /warn|warning/i.test(l)
    );

    const actualLogType = logType || 'application';

    const result: LogAnalysisResult = {
      success: true,
      logType: actualLogType,
      totalLines,
      analyzedLines,
      findings: {
        errorCount: errorLines.length,
        warnCount: warnLines.length,
        topErrors: [],
        patterns: [],
        timeline: [],
      },
      recommendations: [],
      summary: '',
    };

    // Quick error frequency analysis
    const errorCounts = new Map<string, number>();
    for (const line of errorLines.slice(0, 1000)) {
      // Normalize error messages
      const normalized = line
        .replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/g, '[TIMESTAMP]')
        .replace(/\d+\.\d+\.\d+\.\d+/g, '[IP]')
        .replace(/[a-f0-9]{8,}/gi, '[HEX]')
        .substring(0, 200);

      errorCounts.set(normalized, (errorCounts.get(normalized) || 0) + 1);
    }

    // Get top errors
    const sortedErrors = [...errorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    result.findings.topErrors = sortedErrors.map(([message, count]) => ({
      message,
      count,
      firstSeen: 'N/A',
      lastSeen: 'N/A',
    }));

    result.summary = `${actualLogType} 로그 분석: ${totalLines}줄 중 ${analyzedLines}줄 분석. ERROR: ${errorLines.length}건, WARN: ${warnLines.length}건`;

    // Add analysis context for Gemini
    const analysisContext = {
      logType: actualLogType,
      timeRange,
      focusPattern,
      preAnalysis: {
        totalLines,
        errorCount: errorLines.length,
        warnCount: warnLines.length,
        topErrorPatterns: sortedErrors.slice(0, 5),
      },
      analysisInstructions: `
이 ${actualLogType} 로그를 심층 분석하세요:

1. **에러 클러스터링**: 유사한 에러 그룹화, 빈도 분석
2. **타임라인 재구성**: 주요 이벤트 시간순 정렬
3. **패턴 탐지**: 반복 패턴, 주기적 발생, 연쇄 에러
4. **근본 원인 추론**: 첫 번째 에러, 연관 시스템, 가능한 원인
${focusPattern ? `5. **집중 분석**: "${focusPattern}" 관련 로그 우선` : ''}

분석 결과를 구조화된 형식으로 제공하세요.
      `.trim(),
    };

    return {
      ...result,
      analysisContext,
      _logSample: logContent.substring(0, 50000), // First 50K chars for context
    };
  },
});

// ============================================================================
// 5. Google Search Grounding Tool
// ============================================================================

/**
 * Search with Google Grounding for real-time technical documentation
 *
 * Best for:
 * - Error message solutions
 * - Latest security advisories (CVEs)
 * - Official documentation references
 * - Best practices and guides
 */
export const searchWithGrounding = tool({
  description: `Google Search Grounding을 사용하여 실시간 기술 문서와 해결책을 검색합니다. 에러 메시지 해결, 최신 보안 정보, 공식 문서 참조에 적합합니다.

사용 예시:
- "OOM killed 에러 해결 방법"
- "Redis 7 메모리 최적화 가이드"
- "CVE-2024-xxxxx 보안 패치"`,

  inputSchema: z.object({
    query: z
      .string()
      .describe('검색 쿼리'),
    searchType: z
      .enum(['technical', 'security', 'documentation', 'troubleshooting', 'general'])
      .optional()
      .default('technical')
      .describe('검색 유형'),
    preferredSources: z
      .array(z.string())
      .optional()
      .describe('선호 소스 도메인 (예: ["docs.aws.amazon.com", "kubernetes.io"])'),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe('최대 결과 수'),
  }),

  execute: async ({
    query,
    searchType,
    preferredSources,
    maxResults,
  }: {
    query: string;
    searchType?: SearchType;
    preferredSources?: string[];
    maxResults?: number;
  }) => {
    // Note: Actual search will be performed by Gemini with Search Grounding
    // This tool structures the request

    const actualSearchType = searchType || 'technical';
    const actualMaxResults = maxResults || 5;

    const result: SearchGroundingResult = {
      success: true,
      query,
      results: [],
      summary: '',
      recommendations: [],
    };

    // Build search context based on type
    let searchContext = '';
    switch (actualSearchType) {
      case 'security':
        searchContext = 'CVE, 보안 취약점, 패치, security advisory';
        break;
      case 'documentation':
        searchContext = '공식 문서, API 레퍼런스, 가이드';
        break;
      case 'troubleshooting':
        searchContext = '에러 해결, 트러블슈팅, 디버깅';
        break;
      case 'technical':
      default:
        searchContext = '기술 문서, 베스트 프랙티스, 구현 가이드';
    }

    result.summary = `"${query}" 검색 준비 완료. 유형: ${actualSearchType}, 최대 결과: ${actualMaxResults}`;

    // Add search context for Gemini
    const analysisContext = {
      searchType: actualSearchType,
      preferredSources,
      maxResults: actualMaxResults,
      searchInstructions: `
Google Search Grounding을 사용하여 다음을 검색하세요:

**쿼리**: ${query}
**검색 유형**: ${actualSearchType} (${searchContext})
${preferredSources?.length ? `**선호 소스**: ${preferredSources.join(', ')}` : ''}

검색 결과에서:
1. 가장 관련성 높은 ${actualMaxResults}개 결과 선택
2. 각 결과의 핵심 내용 요약
3. 현재 문제에 적용 가능한 해결책 추출
4. 출처 URL 명시

결과를 구조화된 형식으로 제공하세요.
      `.trim(),
    };

    return {
      ...result,
      analysisContext,
    };
  },
});

// ============================================================================
// 6. URL Content Analysis Tool
// ============================================================================

/**
 * Analyze content from external URLs
 *
 * Capabilities:
 * - Extract relevant sections from documentation
 * - Summarize technical articles
 * - Parse GitHub issues and Stack Overflow answers
 */
export const analyzeUrlContent = tool({
  description: `URL의 콘텐츠를 가져와 분석합니다. 기술 문서, GitHub 이슈, Stack Overflow 답변 등에서 관련 정보를 추출합니다.

사용 예시:
- "이 문서에서 설정 방법 찾아줘: [URL]"
- "이 GitHub 이슈 분석해줘"
- "Stack Overflow 답변 요약해줘"`,

  inputSchema: z.object({
    url: z
      .string()
      .url()
      .describe('분석할 URL'),
    extractSections: z
      .array(z.string())
      .optional()
      .describe('추출할 섹션 키워드 (예: ["installation", "configuration"])'),
    analysisGoal: z
      .string()
      .optional()
      .describe('분석 목표 (예: "Redis 설정 방법 찾기")'),
  }),

  execute: async ({
    url,
    extractSections,
    analysisGoal,
  }: {
    url: string;
    extractSections?: string[];
    analysisGoal?: string;
  }) => {
    const result: UrlContentResult = {
      success: true,
      url,
      title: '',
      contentType: 'unknown',
      extractedSections: [],
      summary: '',
      applicableActions: [],
    };

    // Detect content type from URL
    if (url.includes('github.com')) {
      result.contentType = url.includes('/issues/') ? 'github-issue' :
                          url.includes('/pull/') ? 'github-pr' :
                          url.includes('/blob/') ? 'github-code' : 'github';
    } else if (url.includes('stackoverflow.com')) {
      result.contentType = 'stackoverflow';
    } else if (url.includes('docs.')) {
      result.contentType = 'documentation';
    } else {
      result.contentType = 'article';
    }

    result.summary = `${result.contentType} 콘텐츠 분석 준비 완료`;

    // Add analysis context for Gemini
    const analysisContext = {
      url,
      contentType: result.contentType,
      extractSections,
      analysisGoal,
      analysisInstructions: `
이 URL의 콘텐츠를 분석하세요: ${url}

**콘텐츠 유형**: ${result.contentType}
${analysisGoal ? `**분석 목표**: ${analysisGoal}` : ''}
${extractSections?.length ? `**추출 섹션**: ${extractSections.join(', ')}` : ''}

분석 내용:
1. 문서 제목과 주요 내용 요약
2. ${extractSections?.length ? '요청된 섹션 추출' : '관련 섹션 식별 및 추출'}
3. 현재 문제에 적용 가능한 정보 하이라이트
4. 구체적인 적용 방법이나 명령어 추출

결과를 구조화된 형식으로 제공하세요.
      `.trim(),
    };

    return {
      ...result,
      analysisContext,
    };
  },
});

// ============================================================================
// 7. Vision Tools Collection
// ============================================================================

/**
 * All vision tools for Vision Agent
 */
export const visionTools = {
  analyzeScreenshot,
  analyzeLargeLog,
  searchWithGrounding,
  analyzeUrlContent,
};

/**
 * Vision tool descriptions for routing
 */
export const visionToolDescriptions = {
  analyzeScreenshot: '대시보드 스크린샷 분석 (Grafana, CloudWatch, Datadog)',
  analyzeLargeLog: '대용량 로그 파일 분석 (1M 컨텍스트)',
  searchWithGrounding: 'Google Search Grounding 실시간 검색',
  analyzeUrlContent: 'URL 콘텐츠 추출 및 분석',
};
