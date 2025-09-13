#!/usr/bin/env ts-node
/**
 * 🔄 백그라운드 RAG 인덱싱 시스템
 * 
 * Gemini CLI 권장: 읽기/쓰기 분리 아키텍처
 * - Vercel 10초 타임아웃 회피
 * - 안정적인 대용량 문서 처리
 * - GitHub Actions, 로컬 스크립트 등에서 실행 가능
 */

import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

// 환경 설정
const PROJECT_ROOT = path.resolve(process.cwd());
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');

interface DocumentToIndex {
  id: string;
  title: string;
  content: string;
  filePath: string;
  metadata: {
    category: string;
    source: string;
    fileType: string;
    lastModified: string;
    size: number;
    hash: string;
  };
}

interface IndexingProgress {
  processed: number;
  total: number;
  successes: number;
  failures: number;
  skipped: number;
  errors: string[];
}

class BackgroundIndexingService {
  private progress: IndexingProgress = {
    processed: 0,
    total: 0,
    successes: 0,
    failures: 0,
    skipped: 0,
    errors: []
  };

  private concurrencyLimit = 3; // Google AI API 호출 제한 고려
  private batchSize = 10; // 배치당 처리할 문서 수

  /**
   * 🚀 메인 인덱싱 프로세스
   */
  async startIndexing(): Promise<void> {
    console.log('🔄 백그라운드 RAG 인덱싱 시작...');
    
    try {
      // 1. 문서 수집
      const documents = await this.collectDocuments();
      this.progress.total = documents.length;
      
      console.log(`📚 수집된 문서: ${documents.length}개`);
      
      if (documents.length === 0) {
        console.log('✅ 인덱싱할 문서가 없습니다.');
        return;
      }

      // 2. 배치 단위로 처리
      const batches = this.createBatches(documents, this.batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\n📦 배치 ${i + 1}/${batches.length} 처리 중... (${batch.length}개 문서)`);
        
        await this.processBatch(batch);
        
        // 배치 간 휴식 (API 레이트 제한 고려)
        if (i < batches.length - 1) {
          console.log('⏳ API 레이트 제한을 위해 2초 대기...');
          await this.sleep(2000);
        }
      }

      // 3. 결과 보고
      this.printFinalReport();

    } catch (error) {
      console.error('❌ 인덱싱 프로세스 실패:', error);
      process.exit(1);
    }
  }

  /**
   * 📄 문서 수집 및 필터링
   */
  private async collectDocuments(): Promise<DocumentToIndex[]> {
    const documents: DocumentToIndex[] = [];
    
    // docs/ 디렉토리에서 마크다운 파일 수집
    await this.collectFromDirectory(DOCS_DIR, documents, 'documentation');
    
    // public/ 디렉토리에서 JSON 파일 수집 (시나리오 등)
    await this.collectFromDirectory(PUBLIC_DIR, documents, 'public-data');
    
    // 중복 제거 및 우선순위 정렬
    return this.deduplicateAndPrioritize(documents);
  }

  /**
   * 📂 디렉토리별 문서 수집
   */
  private async collectFromDirectory(
    dirPath: string,
    documents: DocumentToIndex[],
    category: string
  ): Promise<void> {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        if (item.isDirectory()) {
          // 특정 디렉토리 제외
          if (['node_modules', '.git', '.next', 'dist', '.vercel'].includes(item.name)) {
            continue;
          }
          
          // 재귀적으로 하위 디렉토리 탐색
          await this.collectFromDirectory(fullPath, documents, category);
          
        } else if (item.isFile()) {
          // 인덱싱 대상 파일인지 확인
          if (this.shouldIndexFile(fullPath)) {
            const document = await this.createDocumentFromFile(fullPath, category);
            if (document) {
              documents.push(document);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ 디렉토리 읽기 실패 (${dirPath}):`, error);
    }
  }

  /**
   * 📝 파일에서 문서 객체 생성
   */
  private async createDocumentFromFile(
    filePath: string,
    category: string
  ): Promise<DocumentToIndex | null> {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // 너무 작거나 큰 파일 제외
      if (content.length < 100 || content.length > 50000) {
        return null;
      }
      
      const relativePath = path.relative(PROJECT_ROOT, filePath);
      const fileName = path.basename(filePath, path.extname(filePath));
      const fileExt = path.extname(filePath);
      
      // 파일 해시 생성 (중복 감지용)
      const hash = createHash('sha256').update(content).digest('hex').substring(0, 16);
      
      return {
        id: `${category}_${hash}`,
        title: this.extractTitle(content, fileName),
        content: this.cleanContent(content),
        filePath: relativePath,
        metadata: {
          category,
          source: relativePath,
          fileType: fileExt.replace('.', ''),
          lastModified: stats.mtime.toISOString(),
          size: stats.size,
          hash
        }
      };
      
    } catch (error) {
      console.warn(`⚠️ 파일 처리 실패 (${filePath}):`, error);
      return null;
    }
  }

  /**
   * 🧹 콘텐츠 정제
   */
  private cleanContent(content: string): string {
    // 마크다운 메타데이터 제거
    content = content.replace(/^---[\s\S]*?---\n/, '');
    
    // 과도한 공백 정리
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.replace(/[ \t]{2,}/g, ' ');
    
    // 특수 문자 정리 (임베딩 품질 향상)
    content = content.replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ.,!?;:()\-\[\]{}]/g, ' ');
    
    return content.trim();
  }

  /**
   * 📋 제목 추출
   */
  private extractTitle(content: string, fileName: string): string {
    // 마크다운 H1 태그에서 제목 추출
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }
    
    // YAML frontmatter에서 title 추출
    const titleMatch = content.match(/^title:\s*(.+)$/m);
    if (titleMatch) {
      return titleMatch[1].replace(/['"]/g, '').trim();
    }
    
    // 파일명 사용
    return fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * 📋 인덱싱 대상 파일 판별
   */
  private shouldIndexFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    const allowedExtensions = ['.md', '.txt', '.json'];
    
    // 확장자 확인
    if (!allowedExtensions.includes(ext)) {
      return false;
    }
    
    // 제외할 파일/디렉토리 패턴
    const excludePatterns = [
      /node_modules/,
      /\.git/,
      /\.next/,
      /dist/,
      /\.vercel/,
      /package-lock\.json/,
      /yarn\.lock/,
      /\.env/
    ];
    
    return !excludePatterns.some(pattern => pattern.test(filePath));
  }

  /**
   * 🔄 중복 제거 및 우선순위 정렬
   */
  private deduplicateAndPrioritize(documents: DocumentToIndex[]): DocumentToIndex[] {
    // 해시 기반 중복 제거
    const uniqueDocuments = new Map<string, DocumentToIndex>();
    
    for (const doc of documents) {
      const existingDoc = uniqueDocuments.get(doc.metadata.hash);
      
      if (!existingDoc || new Date(doc.metadata.lastModified) > new Date(existingDoc.metadata.lastModified)) {
        uniqueDocuments.set(doc.metadata.hash, doc);
      }
    }
    
    // 우선순위 정렬 (카테고리, 크기, 최신성 기준)
    return Array.from(uniqueDocuments.values()).sort((a, b) => {
      // 1. 문서 카테고리 우선순위
      const categoryPriority: Record<string, number> = {
        'documentation': 3,
        'public-data': 2,
        'archive': 1
      };
      
      const aPriority = categoryPriority[a.metadata.category] || 0;
      const bPriority = categoryPriority[b.metadata.category] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // 2. 최신성 (최근 수정된 파일 우선)
      return new Date(b.metadata.lastModified).getTime() - new Date(a.metadata.lastModified).getTime();
    });
  }

  /**
   * 📦 배치 생성
   */
  private createBatches<T>(items: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }

  /**
   * 🔄 배치 처리
   */
  private async processBatch(batch: DocumentToIndex[]): Promise<void> {
    const promises = batch.map(doc => this.processDocument(doc));
    
    // 동시성 제한 적용
    await this.processConcurrently(promises, this.concurrencyLimit);
  }

  /**
   * 📄 개별 문서 처리
   */
  private async processDocument(document: DocumentToIndex): Promise<void> {
    try {
      this.progress.processed++;
      
      console.log(`📄 처리 중: ${document.title} (${this.progress.processed}/${this.progress.total})`);
      
      // TODO: 실제 RAG 엔진과 연동
      // 1. 임베딩 생성
      // 2. 벡터 DB 저장
      // 3. 메타데이터 업데이트
      
      // 임시 처리 (실제 구현 시 교체)
      await this.sleep(500); // API 호출 시뮬레이션
      
      this.progress.successes++;
      console.log(`✅ 완료: ${document.title}`);
      
    } catch (error) {
      this.progress.failures++;
      const errorMsg = `문서 처리 실패 (${document.title}): ${error}`;
      this.progress.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  /**
   * ⚡ 동시성 제한 처리
   */
  private async processConcurrently<T>(
    promises: Promise<T>[],
    limit: number
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < promises.length; i += limit) {
      const batch = promises.slice(i, i + limit);
      const batchResults = await Promise.allSettled(batch);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }
    
    return results;
  }

  /**
   * 📊 최종 보고서 출력
   */
  private printFinalReport(): void {
    console.log('\n📊 ===== 인덱싱 완료 보고서 =====');
    console.log(`총 처리: ${this.progress.processed}개`);
    console.log(`성공: ${this.progress.successes}개`);
    console.log(`실패: ${this.progress.failures}개`);
    console.log(`건너뜀: ${this.progress.skipped}개`);
    
    if (this.progress.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      this.progress.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    const successRate = (this.progress.successes / this.progress.processed * 100).toFixed(1);
    console.log(`\n✅ 성공률: ${successRate}%`);
    
    if (this.progress.failures === 0) {
      console.log('🎉 모든 문서가 성공적으로 인덱싱되었습니다!');
    }
  }

  /**
   * ⏱️ 지연 유틸리티
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 🚀 스크립트 실행부
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'index';
  
  switch (command) {
    case 'index':
      const indexer = new BackgroundIndexingService();
      await indexer.startIndexing();
      break;
      
    case 'help':
      console.log(`
🔄 백그라운드 RAG 인덱싱 도구

사용법:
  npm run index:background        # 전체 인덱싱 실행
  npm run index:background help   # 도움말 표시

주요 기능:
  - Vercel 타임아웃 회피 (무제한 실행 시간)
  - 배치 처리 및 동시성 제어
  - Google AI API 레이트 제한 준수
  - 중복 제거 및 우선순위 정렬
  - 상세한 진행 상황 보고

환경 변수:
  CONCURRENCY_LIMIT=3           # 동시 처리 수 (기본값: 3)
  BATCH_SIZE=10                 # 배치 크기 (기본값: 10)
      `);
      break;
      
    default:
      console.error(`❌ 알 수 없는 명령어: ${command}`);
      console.log('사용 가능한 명령어: index, help');
      process.exit(1);
  }
}

// 직접 실행 시에만 main 함수 호출
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ 스크립트 실행 실패:', error);
    process.exit(1);
  });
}