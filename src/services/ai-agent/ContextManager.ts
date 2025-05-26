import fs from 'fs';
import path from 'path';

/**
 * 디렉토리 기반 컨텍스트 관리자
 * - 압축 없이 개별 .md/.json 파일로 관리
 * - Git 친화적 버전 관리
 * - 실시간 수정 가능
 */
export class ContextManager {
  private static instance: ContextManager;
  private documentsPath: string;
  private logsPath: string;

  private constructor() {
    this.documentsPath = path.join(process.cwd(), 'src', 'mcp', 'documents');
    this.logsPath = path.join(process.cwd(), 'logs');
    this.ensureDirectories();
  }

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  /**
   * 필요한 디렉토리 구조 생성
   */
  private ensureDirectories(): void {
    const directories = [
      this.documentsPath,
      path.join(this.documentsPath, 'base'),
      path.join(this.documentsPath, 'advanced'),
      path.join(this.documentsPath, 'custom'),
      this.logsPath,
      path.join(this.logsPath, 'failures'),
      path.join(this.logsPath, 'improvements'),
      path.join(this.logsPath, 'analysis')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 [ContextManager] 디렉토리 생성: ${dir}`);
      }
    });
  }

  /**
   * 컨텍스트 문서 저장 (.md 파일)
   */
  async saveContextDocument(
    type: 'base' | 'advanced' | 'custom',
    filename: string,
    content: string,
    clientId?: string
  ): Promise<boolean> {
    try {
      const targetDir = clientId && type === 'custom'
        ? path.join(this.documentsPath, type, clientId)
        : path.join(this.documentsPath, type);

      // 클라이언트별 디렉토리 생성
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, `${filename}.md`);
      
      // 백업 생성 (기존 파일이 있는 경우)
      if (fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        console.log(`💾 [ContextManager] 백업 생성: ${backupPath}`);
      }

      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ [ContextManager] 문서 저장: ${filePath}`);
      return true;

    } catch (error) {
      console.error('❌ [ContextManager] 문서 저장 실패:', error);
      return false;
    }
  }

  /**
   * 패턴 파일 저장 (.json 파일)
   */
  async savePatternFile(
    type: 'base' | 'advanced' | 'custom',
    filename: string,
    patterns: any,
    clientId?: string
  ): Promise<boolean> {
    try {
      const targetDir = clientId && type === 'custom'
        ? path.join(this.documentsPath, type, clientId)
        : path.join(this.documentsPath, type);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, `${filename}.json`);
      
      // 백업 생성
      if (fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
      }

      fs.writeFileSync(filePath, JSON.stringify(patterns, null, 2), 'utf-8');
      console.log(`✅ [ContextManager] 패턴 저장: ${filePath}`);
      return true;

    } catch (error) {
      console.error('❌ [ContextManager] 패턴 저장 실패:', error);
      return false;
    }
  }

  /**
   * 컨텍스트 문서 로드
   */
  async loadContextDocument(
    type: 'base' | 'advanced' | 'custom',
    filename: string,
    clientId?: string
  ): Promise<string | null> {
    try {
      const targetDir = clientId && type === 'custom'
        ? path.join(this.documentsPath, type, clientId)
        : path.join(this.documentsPath, type);

      const filePath = path.join(targetDir, `${filename}.md`);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ [ContextManager] 파일 없음: ${filePath}`);
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      console.log(`📖 [ContextManager] 문서 로드: ${filePath}`);
      return content;

    } catch (error) {
      console.error('❌ [ContextManager] 문서 로드 실패:', error);
      return null;
    }
  }

  /**
   * 패턴 파일 로드
   */
  async loadPatternFile(
    type: 'base' | 'advanced' | 'custom',
    filename: string,
    clientId?: string
  ): Promise<any | null> {
    try {
      const targetDir = clientId && type === 'custom'
        ? path.join(this.documentsPath, type, clientId)
        : path.join(this.documentsPath, type);

      const filePath = path.join(targetDir, `${filename}.json`);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ [ContextManager] 패턴 파일 없음: ${filePath}`);
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const patterns = JSON.parse(content);
      console.log(`📖 [ContextManager] 패턴 로드: ${filePath}`);
      return patterns;

    } catch (error) {
      console.error('❌ [ContextManager] 패턴 로드 실패:', error);
      return null;
    }
  }

  /**
   * 디렉토리 내 모든 파일 목록 조회
   */
  async listFiles(
    type: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<{
    documents: string[];
    patterns: string[];
  }> {
    try {
      const targetDir = clientId && type === 'custom'
        ? path.join(this.documentsPath, type, clientId)
        : path.join(this.documentsPath, type);

      if (!fs.existsSync(targetDir)) {
        return { documents: [], patterns: [] };
      }

      const files = fs.readdirSync(targetDir);
      
      const documents = files
        .filter(file => file.endsWith('.md') && !file.includes('.backup.'))
        .map(file => file.replace('.md', ''));

      const patterns = files
        .filter(file => file.endsWith('.json') && !file.includes('.backup.'))
        .map(file => file.replace('.json', ''));

      return { documents, patterns };

    } catch (error) {
      console.error('❌ [ContextManager] 파일 목록 조회 실패:', error);
      return { documents: [], patterns: [] };
    }
  }

  /**
   * 전체 컨텍스트 병합 로드
   */
  async loadMergedContext(clientId?: string): Promise<{
    knowledgeBase: string;
    patterns: any;
    metadata: {
      sources: string[];
      loadedAt: Date;
      version: string;
    };
  }> {
    try {
      console.log(`🔄 [ContextManager] 통합 컨텍스트 로드 시작`);

      let knowledgeBase = '';
      let mergedPatterns: any = { intentPatterns: {} };
      const sources: string[] = [];

      // 1. Base 문서들 로드
      const baseFiles = await this.listFiles('base');
      for (const docName of baseFiles.documents) {
        const content = await this.loadContextDocument('base', docName);
        if (content) {
          knowledgeBase += `\n\n# ${docName}\n${content}`;
          sources.push(`base/${docName}.md`);
        }
      }

      for (const patternName of baseFiles.patterns) {
        const patterns = await this.loadPatternFile('base', patternName);
        if (patterns?.intentPatterns) {
          mergedPatterns.intentPatterns = {
            ...mergedPatterns.intentPatterns,
            ...patterns.intentPatterns
          };
          sources.push(`base/${patternName}.json`);
        }
      }

      // 2. Advanced 문서들 로드
      const advancedFiles = await this.listFiles('advanced');
      for (const docName of advancedFiles.documents) {
        const content = await this.loadContextDocument('advanced', docName);
        if (content) {
          knowledgeBase += `\n\n# Advanced: ${docName}\n${content}`;
          sources.push(`advanced/${docName}.md`);
        }
      }

      for (const patternName of advancedFiles.patterns) {
        const patterns = await this.loadPatternFile('advanced', patternName);
        if (patterns?.intentPatterns) {
          mergedPatterns.intentPatterns = {
            ...mergedPatterns.intentPatterns,
            ...patterns.intentPatterns
          };
          sources.push(`advanced/${patternName}.json`);
        }
      }

      // 3. Custom 문서들 로드 (클라이언트별)
      if (clientId) {
        const customFiles = await this.listFiles('custom', clientId);
        for (const docName of customFiles.documents) {
          const content = await this.loadContextDocument('custom', docName, clientId);
          if (content) {
            knowledgeBase += `\n\n# Custom (${clientId}): ${docName}\n${content}`;
            sources.push(`custom/${clientId}/${docName}.md`);
          }
        }

        for (const patternName of customFiles.patterns) {
          const patterns = await this.loadPatternFile('custom', patternName, clientId);
          if (patterns?.intentPatterns) {
            mergedPatterns.intentPatterns = {
              ...mergedPatterns.intentPatterns,
              ...patterns.intentPatterns
            };
            sources.push(`custom/${clientId}/${patternName}.json`);
          }
        }
      }

      console.log(`✅ [ContextManager] 통합 컨텍스트 로드 완료: ${sources.length}개 파일`);

      return {
        knowledgeBase: knowledgeBase.trim(),
        patterns: mergedPatterns,
        metadata: {
          sources,
          loadedAt: new Date(),
          version: '1.0.0'
        }
      };

    } catch (error) {
      console.error('❌ [ContextManager] 통합 컨텍스트 로드 실패:', error);
      throw error;
    }
  }

  /**
   * 버전 디렉토리 생성 (백업용)
   */
  async createVersionBackup(
    type: 'base' | 'advanced' | 'custom',
    version: string,
    clientId?: string
  ): Promise<boolean> {
    try {
      const sourceDir = clientId && type === 'custom'
        ? path.join(this.documentsPath, type, clientId)
        : path.join(this.documentsPath, type);

      const backupDir = clientId && type === 'custom'
        ? path.join(this.documentsPath, type, `${clientId}-v${version}`)
        : path.join(this.documentsPath, `${type}-v${version}`);

      if (!fs.existsSync(sourceDir)) {
        console.warn(`⚠️ [ContextManager] 소스 디렉토리 없음: ${sourceDir}`);
        return false;
      }

      // 백업 디렉토리 생성
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // 파일들 복사
      const files = fs.readdirSync(sourceDir);
      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.json')) {
          const sourcePath = path.join(sourceDir, file);
          const backupPath = path.join(backupDir, file);
          fs.copyFileSync(sourcePath, backupPath);
        }
      }

      console.log(`💾 [ContextManager] 버전 백업 생성: ${backupDir}`);
      return true;

    } catch (error) {
      console.error('❌ [ContextManager] 버전 백업 실패:', error);
      return false;
    }
  }

  /**
   * 사용 가능한 버전 목록 조회
   */
  async getAvailableVersions(
    type: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<string[]> {
    try {
      const parentDir = path.join(this.documentsPath);
      const prefix = clientId && type === 'custom' ? `${clientId}-v` : `${type}-v`;

      if (!fs.existsSync(parentDir)) {
        return [];
      }

      const items = fs.readdirSync(parentDir);
      const versions = items
        .filter(item => {
          const itemPath = path.join(parentDir, item);
          return fs.statSync(itemPath).isDirectory() && item.startsWith(prefix);
        })
        .map(item => item.replace(prefix, ''))
        .sort((a, b) => b.localeCompare(a)); // 최신 버전 먼저

      return versions;

    } catch (error) {
      console.error('❌ [ContextManager] 버전 목록 조회 실패:', error);
      return [];
    }
  }
} 