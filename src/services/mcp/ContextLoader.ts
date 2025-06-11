import fs from 'fs';
import path from 'path';

export interface ContextBundle {
  metadata: {
    type: string;
    version: string;
    lastUpdated: string;
    readonly?: boolean;
    clientId?: string;
  };
  documents: {
    markdown: Record<string, string>;
    patterns: any;
  };
}

export interface MergedContext {
  knowledgeBase: string;
  patterns: any;
  templates: Record<string, string>;
  intentMappings: Record<string, string>;
  metadata: {
    sources: string[];
    mergedAt: Date;
    version: string;
  };
}

export class ContextLoader {
  private static instance: ContextLoader;
  private documentsPath: string;
  private cachedContext: MergedContext | null = null;
  private lastLoadTime: Date | null = null;
  private cacheTimeout = 5 * 60 * 1000; // 5분 캐시

  private constructor() {
    this.documentsPath = path.join(process.cwd(), 'src', 'mcp', 'documents');
  }

  public static getInstance(): ContextLoader {
    if (!ContextLoader.instance) {
      ContextLoader.instance = new ContextLoader();
    }
    return ContextLoader.instance;
  }

  /**
   * 컨텍스트 로드 및 병합 (base → advanced → custom 순서)
   */
  async loadMergedContext(clientId?: string): Promise<MergedContext> {
    // 캐시 확인
    if (
      this.cachedContext &&
      this.lastLoadTime &&
      Date.now() - this.lastLoadTime.getTime() < this.cacheTimeout
    ) {
      return this.cachedContext;
    }

    try {
      console.log('🔄 [ContextLoader] 컨텍스트 로드 시작...');

      const sources: string[] = [];
      let mergedKnowledge = '';
      const mergedPatterns: any = {
        intentPatterns: {},
        responseTemplates: {},
        keywordExtraction: {},
        validationRules: {},
      };
      const mergedTemplates: Record<string, string> = {};
      const mergedIntentMappings: Record<string, string> = {};

      // 1. Base 문서 로드 (필수, 변경 금지)
      const baseContext = await this.loadContextBundle('base');
      if (baseContext) {
        mergedKnowledge +=
          baseContext.documents.markdown['core-knowledge'] || '';
        this.mergePatterns(mergedPatterns, baseContext.documents.patterns);
        sources.push('base');
        console.log('✅ [ContextLoader] Base 컨텍스트 로드 완료');
      }

      // 2. Advanced 문서 로드 (개선 제안 반영 대상)
      const advancedContext = await this.loadContextBundle('advanced');
      if (advancedContext) {
        mergedKnowledge +=
          '\n\n' + (advancedContext.documents.markdown['improvements'] || '');
        this.mergePatterns(mergedPatterns, advancedContext.documents.patterns);
        sources.push('advanced');
        console.log('✅ [ContextLoader] Advanced 컨텍스트 로드 완료');
      }

      // 3. Custom 문서 로드 (고객 맞춤)
      if (clientId) {
        const customContext = await this.loadContextBundle('custom', clientId);
        if (customContext) {
          mergedKnowledge +=
            '\n\n' +
            (customContext.documents.markdown['custom-knowledge'] || '');
          this.mergePatterns(mergedPatterns, customContext.documents.patterns);
          sources.push(`custom-${clientId}`);
          console.log(
            `✅ [ContextLoader] Custom 컨텍스트 로드 완료 (${clientId})`
          );
        }
      }

      // 템플릿 및 인텐트 매핑 추출
      this.extractTemplatesAndIntents(
        mergedPatterns,
        mergedTemplates,
        mergedIntentMappings
      );

      const mergedContext: MergedContext = {
        knowledgeBase: mergedKnowledge.trim(),
        patterns: mergedPatterns,
        templates: mergedTemplates,
        intentMappings: mergedIntentMappings,
        metadata: {
          sources,
          mergedAt: new Date(),
          version: this.generateContextVersion(sources),
        },
      };

      // 캐시 업데이트
      this.cachedContext = mergedContext;
      this.lastLoadTime = new Date();

      console.log(
        `✅ [ContextLoader] 컨텍스트 병합 완료: ${sources.join(' → ')}`
      );
      return mergedContext;
    } catch (error) {
      console.error('❌ [ContextLoader] 컨텍스트 로드 실패:', error);
      throw error;
    }
  }

  /**
   * 특정 번들 로드
   */
  private async loadContextBundle(
    bundleType: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<ContextBundle | null> {
    try {
      const bundlePath =
        clientId && bundleType === 'custom'
          ? path.join(this.documentsPath, bundleType, clientId)
          : path.join(this.documentsPath, bundleType);

      if (!fs.existsSync(bundlePath)) {
        console.log(
          `📁 [ContextLoader] 번들 경로가 존재하지 않음: ${bundlePath}`
        );
        return null;
      }

      const bundle: ContextBundle = {
        metadata: {
          type: bundleType,
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          readonly: bundleType === 'base',
          clientId,
        },
        documents: {
          markdown: {},
          patterns: {},
        },
      };

      // Markdown 파일 로드
      const markdownFiles = fs
        .readdirSync(bundlePath)
        .filter(file => file.endsWith('.md'));
      for (const file of markdownFiles) {
        const filePath = path.join(bundlePath, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileName = path.basename(file, '.md');
        bundle.documents.markdown[fileName] = content;
      }

      // JSON 패턴 파일 로드
      const jsonFiles = fs
        .readdirSync(bundlePath)
        .filter(file => file.endsWith('.json'));
      for (const file of jsonFiles) {
        const filePath = path.join(bundlePath, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const fileName = path.basename(file, '.json');
        bundle.documents.patterns[fileName] = content;
      }

      return bundle;
    } catch (error) {
      console.error(
        `❌ [ContextLoader] 번들 로드 실패 (${bundleType}):`,
        error
      );
      return null;
    }
  }

  /**
   * 패턴 병합 (우선순위: custom > advanced > base)
   */
  private mergePatterns(target: any, source: any): void {
    if (!source) return;

    // intentPatterns 병합
    if (source.intentPatterns) {
      Object.assign(target.intentPatterns, source.intentPatterns);
    }

    // responseTemplates 병합
    if (source.responseTemplates) {
      Object.assign(target.responseTemplates, source.responseTemplates);
    }

    // keywordExtraction 병합
    if (source.keywordExtraction) {
      for (const [key, value] of Object.entries(source.keywordExtraction)) {
        if (Array.isArray(value)) {
          target.keywordExtraction[key] = [
            ...(target.keywordExtraction[key] || []),
            ...value,
          ];
        } else {
          target.keywordExtraction[key] = value;
        }
      }
    }

    // validationRules 병합
    if (source.validationRules) {
      Object.assign(target.validationRules, source.validationRules);
    }
  }

  /**
   * 템플릿 및 인텐트 매핑 추출
   */
  private extractTemplatesAndIntents(
    patterns: any,
    templates: Record<string, string>,
    intents: Record<string, string>
  ): void {
    // 응답 템플릿 추출
    if (patterns.responseTemplates) {
      for (const [key, template] of Object.entries(
        patterns.responseTemplates
      )) {
        templates[key] = (template as any).template;
      }
    }

    // 인텐트 매핑 추출
    if (patterns.intentPatterns) {
      for (const [intent, config] of Object.entries(patterns.intentPatterns)) {
        const patterns_list = (config as any).patterns || [];
        for (const pattern of patterns_list) {
          intents[pattern] = intent;
        }
      }
    }
  }

  /**
   * 컨텍스트 버전 생성
   */
  private generateContextVersion(sources: string[]): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `ctx-${sources.join('-')}-${timestamp}`;
  }

  /**
   * 캐시 무효화
   */
  public invalidateCache(): void {
    this.cachedContext = null;
    this.lastLoadTime = null;
    console.log('🗑️ [ContextLoader] 캐시 무효화 완료');
  }

  /**
   * 컨텍스트 번들 업로드 (관리자 전용)
   */
  async uploadContextBundle(
    bundleType: 'base' | 'advanced' | 'custom',
    bundleData: any,
    clientId?: string
  ): Promise<boolean> {
    try {
      const targetPath =
        clientId && bundleType === 'custom'
          ? path.join(this.documentsPath, bundleType, clientId)
          : path.join(this.documentsPath, bundleType);

      // 디렉토리 생성
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      // 기존 파일 백업 (base 제외)
      if (bundleType !== 'base') {
        await this.createBackup(targetPath);
      }

      // 새 번들 파일 저장
      for (const [fileName, content] of Object.entries(
        bundleData.documents.markdown
      )) {
        const filePath = path.join(targetPath, `${fileName}.md`);
        fs.writeFileSync(filePath, content as string, 'utf-8');
      }

      for (const [fileName, content] of Object.entries(
        bundleData.documents.patterns
      )) {
        const filePath = path.join(targetPath, `${fileName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
      }

      // 캐시 무효화
      this.invalidateCache();

      console.log(
        `✅ [ContextLoader] 컨텍스트 번들 업로드 완료: ${bundleType}${clientId ? `-${clientId}` : ''}`
      );
      return true;
    } catch (error) {
      console.error(`❌ [ContextLoader] 컨텍스트 번들 업로드 실패:`, error);
      return false;
    }
  }

  /**
   * 백업 생성
   */
  private async createBackup(sourcePath: string): Promise<void> {
    const backupPath = `${sourcePath}.backup.${Date.now()}`;
    if (fs.existsSync(sourcePath)) {
      fs.cpSync(sourcePath, backupPath, { recursive: true });
      console.log(`📦 [ContextLoader] 백업 생성: ${backupPath}`);
    }
  }

  /**
   * 사용 가능한 번들 목록 조회
   */
  async getAvailableBundles(): Promise<{
    base: string[];
    advanced: string[];
    custom: Record<string, string[]>;
  }> {
    const result = {
      base: [] as string[],
      advanced: [] as string[],
      custom: {} as Record<string, string[]>,
    };

    try {
      // Base 번들
      const basePath = path.join(this.documentsPath, 'base');
      if (fs.existsSync(basePath)) {
        result.base = fs
          .readdirSync(basePath)
          .filter(file => file.endsWith('.md') || file.endsWith('.json'));
      }

      // Advanced 번들
      const advancedPath = path.join(this.documentsPath, 'advanced');
      if (fs.existsSync(advancedPath)) {
        result.advanced = fs
          .readdirSync(advancedPath)
          .filter(file => file.endsWith('.md') || file.endsWith('.json'));
      }

      // Custom 번들
      const customPath = path.join(this.documentsPath, 'custom');
      if (fs.existsSync(customPath)) {
        const clientDirs = fs
          .readdirSync(customPath)
          .filter(item =>
            fs.statSync(path.join(customPath, item)).isDirectory()
          );

        for (const clientId of clientDirs) {
          const clientPath = path.join(customPath, clientId);
          result.custom[clientId] = fs
            .readdirSync(clientPath)
            .filter(file => file.endsWith('.md') || file.endsWith('.json'));
        }
      }

      return result;
    } catch (error) {
      console.error('❌ [ContextLoader] 번들 목록 조회 실패:', error);
      return result;
    }
  }
}
