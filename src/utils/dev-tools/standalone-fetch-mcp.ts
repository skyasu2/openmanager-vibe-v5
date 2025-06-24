/**
 * 🌐 독립형 Fetch MCP 개발 도구
 *
 * 의존성 없이 분리 가능한 개발용 웹 콘텐츠 가져오기 도구
 * 베르셀 배포 환경에서도 동작하도록 설계
 */

export interface FetchResult {
  success: boolean;
  data?: any;
  error?: string;
  url: string;
  timestamp: string;
  responseTime: number;
  contentType?: string;
  size?: number;
}

export interface FetchOptions {
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  validateSSL?: boolean;
  followRedirects?: boolean;
}

export class StandaloneFetchMCP {
  private baseOptions: FetchOptions = {
    timeout: 30000,
    retries: 3,
    validateSSL: true,
    followRedirects: true,
  };

  constructor(options?: Partial<FetchOptions>) {
    this.baseOptions = { ...this.baseOptions, ...options };
  }

  /**
   * HTML 페이지 가져오기
   */
  async fetchHTML(url: string, options?: FetchOptions): Promise<FetchResult> {
    return this.performFetch(url, 'html', options);
  }

  /**
   * JSON 데이터 가져오기
   */
  async fetchJSON(url: string, options?: FetchOptions): Promise<FetchResult> {
    return this.performFetch(url, 'json', options);
  }

  /**
   * 텍스트 데이터 가져오기
   */
  async fetchText(url: string, options?: FetchOptions): Promise<FetchResult> {
    return this.performFetch(url, 'text', options);
  }

  /**
   * 마크다운 데이터 가져오기
   */
  async fetchMarkdown(
    url: string,
    options?: FetchOptions
  ): Promise<FetchResult> {
    return this.performFetch(url, 'markdown', options);
  }

  /**
   * 배치 요청 처리
   */
  async fetchBatch(
    requests: Array<{
      name: string;
      url: string;
      type: 'html' | 'json' | 'text' | 'markdown';
      options?: FetchOptions;
    }>
  ): Promise<Record<string, FetchResult>> {
    const results: Record<string, FetchResult> = {};

    // 병렬 처리로 성능 최적화
    const promises = requests.map(async req => {
      const result = await this.performFetch(req.url, req.type, req.options);
      results[req.name] = result;
      return result;
    });

    await Promise.allSettled(promises);
    return results;
  }

  /**
   * 헬스체크
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    version: string;
  }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0-standalone',
    };
  }

  /**
   * 실제 fetch 수행
   */
  private async performFetch(
    url: string,
    type: 'html' | 'json' | 'text' | 'markdown',
    options?: FetchOptions
  ): Promise<FetchResult> {
    const startTime = Date.now();
    const mergedOptions = { ...this.baseOptions, ...options };

    try {
      // URL 유효성 검사
      new URL(url);

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        mergedOptions.timeout
      );

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'OpenManager-Vibe-v5-Fetch-MCP/1.0.0',
          Accept: this.getAcceptHeader(type),
          ...mergedOptions.headers,
        },
        signal: controller.signal,
        redirect: mergedOptions.followRedirects ? 'follow' : 'manual',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');

      let data: any;

      switch (type) {
        case 'json':
          data = await response.json();
          break;
        case 'html':
          const htmlContent = await response.text();
          data = {
            content: htmlContent,
            title: this.extractTitle(htmlContent),
            meta: this.extractMeta(htmlContent),
          };
          break;
        case 'markdown':
          const markdownContent = await response.text();
          data = {
            content: markdownContent,
            wordCount: this.countWords(markdownContent),
          };
          break;
        default:
          data = await response.text();
      }

      return {
        success: true,
        data,
        url,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        contentType,
        size: contentLength ? parseInt(contentLength) : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        url,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Accept 헤더 생성
   */
  private getAcceptHeader(type: string): string {
    switch (type) {
      case 'json':
        return 'application/json, application/ld+json, */*';
      case 'html':
        return 'text/html, application/xhtml+xml, */*';
      case 'markdown':
        return 'text/markdown, text/plain, */*';
      default:
        return 'text/plain, */*';
    }
  }

  /**
   * HTML 제목 추출
   */
  private extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  /**
   * HTML 메타 정보 추출
   */
  private extractMeta(html: string): Record<string, string> {
    const meta: Record<string, string> = {};
    const metaMatches = html.matchAll(/<meta[^>]+>/gi);

    for (const match of metaMatches) {
      const nameMatch = match[0].match(/name=["']([^"']+)["']/i);
      const contentMatch = match[0].match(/content=["']([^"']+)["']/i);

      if (nameMatch && contentMatch) {
        meta[nameMatch[1]] = contentMatch[1];
      }
    }

    return meta;
  }

  /**
   * 단어 수 계산
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }
}

// 싱글톤 인스턴스 생성
export const standaloneFetch = new StandaloneFetchMCP();

// 편의 함수들
export const fetchHTML = (url: string, options?: FetchOptions) =>
  standaloneFetch.fetchHTML(url, options);

export const fetchJSON = (url: string, options?: FetchOptions) =>
  standaloneFetch.fetchJSON(url, options);

export const fetchText = (url: string, options?: FetchOptions) =>
  standaloneFetch.fetchText(url, options);

export const fetchMarkdown = (url: string, options?: FetchOptions) =>
  standaloneFetch.fetchMarkdown(url, options);

export const fetchBatch = (
  requests: Parameters<typeof standaloneFetch.fetchBatch>[0]
) => standaloneFetch.fetchBatch(requests);
