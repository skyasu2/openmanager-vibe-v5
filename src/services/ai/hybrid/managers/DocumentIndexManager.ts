/**
 * 📚 문서 인덱스 관리자 v1.0
 * 
 * 책임:
 * - 문서 인덱스 구축 및 관리
 * - 문서 벡터화 및 임베딩 생성
 * - 키워드 추출 및 분석
 * - 문서 컨텍스트 생성
 */

import { RealMCPClient } from '@/services/mcp/real-mcp-client';
import { LocalVectorDB } from '../../local-vector-db';

export interface DocumentContext {
    path: string;
    content: string;
    keywords: string[];
    lastModified: number;
    relevanceScore: number;
    contextLinks: string[];
    embedding?: number[];
}

export class DocumentIndexManager {
    private mcpClient: RealMCPClient;
    private vectorDB: LocalVectorDB;
    private documentIndex: Map<string, DocumentContext> = new Map();
    private lastIndexUpdate: number = 0;

    constructor(mcpClient: RealMCPClient, vectorDB: LocalVectorDB) {
        this.mcpClient = mcpClient;
        this.vectorDB = vectorDB;
    }

    /**
     * 📚 하이브리드 문서 인덱스 구축
     */
    async buildHybridDocumentIndex(): Promise<void> {
        const startTime = Date.now();
        console.log('📚 하이브리드 문서 인덱스 구축 시작...');

        try {
            // MCP를 통한 문서 수집
            const documents = await this.mcpClient.getAllDocuments();

            if (!documents || documents.length === 0) {
                console.warn('⚠️ MCP에서 문서를 찾을 수 없음. 폴백 인덱스 생성 중...');
                await this.createFallbackIndex();
                return;
            }

            console.log(`📖 ${documents.length}개 문서 발견. 분석 시작...`);

            // 병렬 처리로 성능 최적화
            const analysisPromises = documents.map(async (doc, index) => {
                try {
                    const context = await this.analyzeAndVectorizeDocument(doc.path, doc.content);
                    this.documentIndex.set(doc.path, context);

                    // 벡터 DB에 저장
                    if (context.embedding) {
                        await this.vectorDB.addDocument(doc.path, context.embedding, {
                            content: doc.content,
                            keywords: context.keywords,
                            lastModified: context.lastModified,
                        });
                    }

                    if (index % 10 === 0) {
                        console.log(`📊 진행률: ${index + 1}/${documents.length} (${Math.round(((index + 1) / documents.length) * 100)}%)`);
                    }
                } catch (error) {
                    console.warn(`⚠️ 문서 분석 실패 (${doc.path}):`, error);
                    // 오류 발생 시 기본 컨텍스트 생성
                    const fallbackContext = this.createFallbackDocumentContext(doc.path);
                    this.documentIndex.set(doc.path, fallbackContext);
                }
            });

            await Promise.all(analysisPromises);

            this.lastIndexUpdate = Date.now();
            const processingTime = Date.now() - startTime;

            console.log(`✅ 하이브리드 문서 인덱스 구축 완료`);
            console.log(`📊 인덱스 통계:`);
            console.log(`   - 총 문서: ${this.documentIndex.size}개`);
            console.log(`   - 처리 시간: ${processingTime}ms`);
            console.log(`   - 평균 처리 시간: ${Math.round(processingTime / documents.length)}ms/문서`);

        } catch (error) {
            console.error('❌ 문서 인덱스 구축 실패:', error);
            await this.createFallbackIndex();
        }
    }

    /**
     * 🔍 문서 분석 및 벡터화
     */
    private async analyzeAndVectorizeDocument(
        path: string,
        content: string
    ): Promise<DocumentContext> {
        const startTime = Date.now();

        try {
            // 키워드 추출
            const keywords = this.extractKeywords(content);

            // 컨텍스트 링크 찾기
            const contextLinks = this.findContextLinks(content);

            // 관련성 점수 계산
            const relevanceScore = this.calculateRelevanceScore(path, content);

            // 임베딩 생성 (실제 벡터 임베딩은 미래 구현)
            const embedding = await this.generateEmbedding(content);

            const processingTime = Date.now() - startTime;

            console.log(`📄 문서 분석 완료: ${path} (${processingTime}ms)`);

            return {
                path,
                content: content.substring(0, 5000), // 메모리 최적화를 위해 5KB로 제한
                keywords,
                lastModified: Date.now(),
                relevanceScore,
                contextLinks,
                embedding,
            };
        } catch (error) {
            console.warn(`⚠️ 문서 분석 실패 (${path}):`, error);
            return this.createFallbackDocumentContext(path);
        }
    }

    /**
     * 🔤 키워드 추출
     */
    private extractKeywords(text: string): string[] {
        const words = text
            .toLowerCase()
            .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !this.isCommonWord(word));

        // 빈도 계산
        const frequency = new Map<string, number>();
        words.forEach(word => {
            frequency.set(word, (frequency.get(word) || 0) + 1);
        });

        // 빈도순 정렬 후 상위 20개 반환
        return Array.from(frequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([word]) => word);
    }

    /**
     * 🚫 일반적인 단어 체크
     */
    private isCommonWord(word: string): boolean {
        const commonWords = new Set([
            // 한국어 일반 단어
            '있다', '없다', '하다', '되다', '이다', '그렇다', '아니다', '오다', '가다', '보다',
            '알다', '모르다', '좋다', '나쁘다', '크다', '작다', '많다', '적다', '같다', '다르다',
            '새롭다', '오래되다', '쉽다', '어렵다', '빠르다', '느리다', '높다', '낮다', '넓다', '좁다',
            '뜨겁다', '차갑다', '밝다', '어둡다', '깨끗하다', '더럽다', '안전하다', '위험하다',

            // 영어 일반 단어
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',

            // 기술 용어 (너무 일반적인 것들)
            'system', 'data', 'user', 'info', 'config', 'type', 'name', 'value',
            '시스템', '데이터', '사용자', '정보', '설정', '타입', '이름', '값',
        ]);

        return commonWords.has(word);
    }

    /**
     * 🔗 컨텍스트 링크 찾기
     */
    private findContextLinks(content: string): string[] {
        const linkRegex = /(?:import|from|require)\s+['"](.*?)['"]|href\s*=\s*['"](.*?)['"]|src\s*=\s*['"](.*?)['"]/g;
        const links: string[] = [];
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            const link = match[1] || match[2] || match[3];
            if (link && !links.includes(link)) {
                links.push(link);
            }
        }

        return links.slice(0, 10); // 최대 10개로 제한
    }

    /**
     * 📊 관련성 점수 계산
     */
    private calculateRelevanceScore(path: string, content: string): number {
        let score = 50; // 기본 점수

        // 파일 경로 기반 점수
        if (path.includes('README') || path.includes('docs/')) score += 20;
        if (path.includes('test') || path.includes('spec')) score -= 10;
        if (path.includes('config') || path.includes('setup')) score += 10;

        // 내용 길이 기반 점수
        const contentLength = content.length;
        if (contentLength > 10000) score += 15;
        else if (contentLength > 5000) score += 10;
        else if (contentLength > 1000) score += 5;
        else if (contentLength < 100) score -= 20;

        // 키워드 밀도 점수
        const keywords = this.extractKeywords(content);
        score += Math.min(keywords.length * 2, 20);

        return Math.max(0, Math.min(100, score));
    }

    /**
     * 🆘 폴백 문서 컨텍스트 생성
     */
    private createFallbackDocumentContext(path: string): DocumentContext {
        return {
            path,
            content: `폴백 문서: ${path}`,
            keywords: this.getFallbackKeywords(path),
            lastModified: Date.now(),
            relevanceScore: 30,
            contextLinks: [],
        };
    }

    /**
     * 🔤 폴백 키워드 생성
     */
    private getFallbackKeywords(path: string): string[] {
        const pathParts = path.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
        return pathParts.split(/[-_]/).filter(part => part.length > 2);
    }

    /**
     * 🧠 임베딩 생성 (현재는 모의 구현)
     */
    private async generateEmbedding(content: string): Promise<number[]> {
        // 실제 구현에서는 Transformers.js나 다른 임베딩 모델 사용
        // 현재는 간단한 해시 기반 벡터 생성
        const words = content.toLowerCase().split(/\s+/).slice(0, 100);
        const embedding = new Array(384).fill(0); // 384차원 벡터

        words.forEach((word, index) => {
            const hash = this.simpleHash(word);
            embedding[hash % 384] += 1;
        });

        // 정규화
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
    }

    /**
     * 🔢 간단한 해시 함수
     */
    private simpleHash(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit integer
        }
        return Math.abs(hash);
    }

    /**
     * 🆘 폴백 인덱스 생성
     */
    private async createFallbackIndex(): Promise<void> {
        console.log('🆘 폴백 인덱스 생성 중...');

        const fallbackDocs = [
            {
                path: 'README.md',
                content: 'OpenManager는 통합 서버 관리 플랫폼입니다. AI 기반 모니터링과 예측 기능을 제공합니다.',
                keywords: ['openmanager', '서버', '관리', 'ai', '모니터링', '예측'],
            },
            {
                path: 'docs/architecture.md',
                content: '시스템 아키텍처는 마이크로서비스 기반으로 설계되었습니다. React, Next.js, TypeScript를 사용합니다.',
                keywords: ['아키텍처', '마이크로서비스', 'react', 'nextjs', 'typescript'],
            },
            {
                path: 'docs/api.md',
                content: 'REST API를 통해 서버 메트릭, 알림, 설정을 관리할 수 있습니다.',
                keywords: ['api', 'rest', '메트릭', '알림', '설정'],
            },
        ];

        fallbackDocs.forEach(doc => {
            const context: DocumentContext = {
                path: doc.path,
                content: doc.content,
                keywords: doc.keywords,
                lastModified: Date.now(),
                relevanceScore: 70,
                contextLinks: [],
            };
            this.documentIndex.set(doc.path, context);
        });

        console.log(`✅ 폴백 인덱스 생성 완료 (${fallbackDocs.length}개 문서)`);
    }

    /**
     * 📚 문서 인덱스 가져오기
     */
    getDocumentIndex(): Map<string, DocumentContext> {
        return new Map(this.documentIndex);
    }

    /**
     * 🔍 특정 문서 가져오기
     */
    getDocument(path: string): DocumentContext | undefined {
        return this.documentIndex.get(path);
    }

    /**
     * 📊 인덱스 통계
     */
    getIndexStats(): {
        totalDocuments: number;
        lastUpdate: number;
        averageRelevanceScore: number;
        totalKeywords: number;
    } {
        const documents = Array.from(this.documentIndex.values());
        const averageRelevanceScore = documents.length > 0
            ? documents.reduce((sum, doc) => sum + doc.relevanceScore, 0) / documents.length
            : 0;
        const totalKeywords = documents.reduce((sum, doc) => sum + doc.keywords.length, 0);

        return {
            totalDocuments: this.documentIndex.size,
            lastUpdate: this.lastIndexUpdate,
            averageRelevanceScore: Math.round(averageRelevanceScore * 100) / 100,
            totalKeywords,
        };
    }

    /**
     * 🔄 인덱스 새로고침
     */
    async refreshIndex(): Promise<void> {
        console.log('🔄 문서 인덱스 새로고침 중...');
        this.documentIndex.clear();
        await this.buildHybridDocumentIndex();
    }

    /**
     * 🧹 정리
     */
    dispose(): void {
        this.documentIndex.clear();
        console.log('🧹 DocumentIndexManager 정리 완료');
    }
}
